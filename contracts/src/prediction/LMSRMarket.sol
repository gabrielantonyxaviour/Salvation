// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./OutcomeToken.sol";
import "../libraries/LMSR.sol";

/**
 * @title LMSRMarket
 * @notice Logarithmic Market Scoring Rule prediction market implementation
 * @dev Each project gets a completion market. Uses LMSR for automated market making.
 *
 * LMSR ensures:
 * - Always available liquidity (no order book needed)
 * - Prices sum to ~$1.00 (YES + NO = 1)
 * - Price impact scales with liquidity parameter 'b'
 *
 * IMPORTANT: LMSR math uses WAD (1e18) internally. Collateral amounts are scaled
 * between WAD and actual token decimals (e.g., 6 for USDC) for transfers.
 */
contract LMSRMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Project identifier this market is for
    bytes32 public immutable projectId;

    /// @notice Market question (e.g., "Will project be operational by Q2 2026?")
    string public question;

    /// @notice Timestamp when market can be resolved
    uint256 public immutable resolutionTime;

    /// @notice Whether the market has been resolved
    bool public resolved;

    /// @notice Final outcome (true = YES wins, false = NO wins)
    bool public outcome;

    /// @notice YES outcome token
    OutcomeToken public immutable yesToken;

    /// @notice NO outcome token
    OutcomeToken public immutable noToken;

    /// @notice Collateral token (e.g., USDC)
    IERC20 public immutable collateral;

    /// @notice Collateral token decimals (e.g., 6 for USDC, 18 for DAI)
    uint8 public immutable collateralDecimals;

    /// @notice WAD constant for 18-decimal precision
    uint256 private constant WAD = 1e18;

    /// @notice Liquidity parameter - higher means lower price impact
    uint256 public immutable b;

    /// @notice Total YES shares outstanding (in WAD)
    uint256 public yesShares;

    /// @notice Total NO shares outstanding (in WAD)
    uint256 public noShares;

    /// @notice Oracle address authorized to resolve the market
    address public immutable oracle;

    /// @notice Factory that created this market
    address public immutable factory;

    // Events
    event SharesPurchased(
        address indexed buyer,
        bool indexed isYes,
        uint256 shares,
        uint256 cost
    );
    event SharesSold(
        address indexed seller,
        bool indexed isYes,
        uint256 shares,
        uint256 payout
    );
    event MarketResolved(bool outcome, uint256 timestamp);
    event WinningsClaimed(address indexed claimer, uint256 amount);

    // Errors
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error ResolutionTimeNotReached();
    error OnlyOracle();
    error InsufficientShares();
    error ZeroShares();
    error TransferFailed();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert OnlyOracle();
        _;
    }

    modifier notResolved() {
        if (resolved) revert MarketAlreadyResolved();
        _;
    }

    modifier isResolved() {
        if (!resolved) revert MarketNotResolved();
        _;
    }

    /**
     * @notice Create a new LMSR prediction market
     * @param _projectId Project identifier
     * @param _question Market question
     * @param _resolutionTime When the market can be resolved
     * @param _collateral Collateral token address
     * @param _b Liquidity parameter (in WAD)
     * @param _oracle Oracle address for resolution
     */
    constructor(
        bytes32 _projectId,
        string memory _question,
        uint256 _resolutionTime,
        address _collateral,
        uint256 _b,
        address _oracle
    ) {
        require(_collateral != address(0), "LMSRMarket: zero collateral");
        require(_oracle != address(0), "LMSRMarket: zero oracle");
        require(_b > 0, "LMSRMarket: b must be positive");
        require(_resolutionTime > block.timestamp, "LMSRMarket: resolution time in past");

        projectId = _projectId;
        question = _question;
        resolutionTime = _resolutionTime;
        collateral = IERC20(_collateral);
        collateralDecimals = IERC20Metadata(_collateral).decimals();
        b = _b;
        oracle = _oracle;
        factory = msg.sender;

        // Create outcome tokens
        string memory projectIdStr = bytes32ToString(_projectId);
        yesToken = new OutcomeToken(
            string.concat("YES-", projectIdStr),
            string.concat("YES-", projectIdStr),
            address(this),
            true
        );
        noToken = new OutcomeToken(
            string.concat("NO-", projectIdStr),
            string.concat("NO-", projectIdStr),
            address(this),
            false
        );
    }

    // ============ View Functions ============

    /**
     * @notice Get current YES token price (0 to 1e18)
     * @return price YES price in WAD (0.75e18 = $0.75)
     */
    function getYesPrice() public view returns (uint256) {
        return LMSR.price(yesShares, noShares, b);
    }

    /**
     * @notice Get current NO token price (0 to 1e18)
     * @return price NO price in WAD
     */
    function getNoPrice() public view returns (uint256) {
        return 1e18 - getYesPrice();
    }

    /**
     * @notice Calculate cost to buy shares (in WAD scale for internal use)
     * @param isYes True for YES shares, false for NO
     * @param shares Number of shares to buy (in WAD)
     * @return cost Cost in WAD scale (1e18)
     */
    function getCostToBuyWad(bool isYes, uint256 shares) public view returns (uint256) {
        return LMSR.costToBuy(isYes, shares, yesShares, noShares, b);
    }

    /**
     * @notice Calculate cost to buy shares (in collateral token decimals)
     * @param isYes True for YES shares, false for NO
     * @param shares Number of shares to buy (in WAD)
     * @return cost Cost in collateral token decimals (e.g., 6 for USDC)
     */
    function getCostToBuy(bool isYes, uint256 shares) public view returns (uint256) {
        uint256 wadCost = LMSR.costToBuy(isYes, shares, yesShares, noShares, b);
        return _wadToCollateral(wadCost);
    }

    /**
     * @notice Calculate payout from selling shares (in WAD scale for internal use)
     * @param isYes True for YES shares, false for NO
     * @param shares Number of shares to sell (in WAD)
     * @return payout Payout in WAD scale (1e18)
     */
    function getPayoutToSellWad(bool isYes, uint256 shares) public view returns (uint256) {
        return LMSR.costToSell(isYes, shares, yesShares, noShares, b);
    }

    /**
     * @notice Calculate payout from selling shares (in collateral token decimals)
     * @param isYes True for YES shares, false for NO
     * @param shares Number of shares to sell (in WAD)
     * @return payout Payout in collateral token decimals
     */
    function getPayoutToSell(bool isYes, uint256 shares) public view returns (uint256) {
        uint256 wadPayout = LMSR.costToSell(isYes, shares, yesShares, noShares, b);
        return _wadToCollateral(wadPayout);
    }

    /**
     * @notice Get the current LMSR cost (total funds in the market maker)
     * @return cost Current cost in WAD
     */
    function getCurrentCost() public view returns (uint256) {
        return LMSR.cost(yesShares, noShares, b);
    }

    // ============ Trading Functions ============

    /**
     * @notice Buy YES shares
     * @param shares Number of shares to buy (in WAD)
     * @return cost Amount of collateral spent
     */
    function buyYes(uint256 shares) external nonReentrant notResolved returns (uint256 cost) {
        if (shares == 0) revert ZeroShares();

        cost = getCostToBuy(true, shares);

        // Transfer collateral from buyer
        collateral.safeTransferFrom(msg.sender, address(this), cost);

        // Update state and mint tokens
        yesShares += shares;
        yesToken.mint(msg.sender, shares);

        emit SharesPurchased(msg.sender, true, shares, cost);
    }

    /**
     * @notice Buy NO shares
     * @param shares Number of shares to buy (in WAD)
     * @return cost Amount of collateral spent
     */
    function buyNo(uint256 shares) external nonReentrant notResolved returns (uint256 cost) {
        if (shares == 0) revert ZeroShares();

        cost = getCostToBuy(false, shares);

        // Transfer collateral from buyer
        collateral.safeTransferFrom(msg.sender, address(this), cost);

        // Update state and mint tokens
        noShares += shares;
        noToken.mint(msg.sender, shares);

        emit SharesPurchased(msg.sender, false, shares, cost);
    }

    /**
     * @notice Sell YES shares back to the market
     * @param shares Number of shares to sell (in WAD)
     * @return payout Amount of collateral received
     */
    function sellYes(uint256 shares) external nonReentrant notResolved returns (uint256 payout) {
        if (shares == 0) revert ZeroShares();
        if (yesToken.balanceOf(msg.sender) < shares) revert InsufficientShares();
        if (shares > yesShares) revert InsufficientShares();

        payout = getPayoutToSell(true, shares);

        // Burn tokens and update state
        yesToken.burn(msg.sender, shares);
        yesShares -= shares;

        // Transfer collateral to seller
        collateral.safeTransfer(msg.sender, payout);

        emit SharesSold(msg.sender, true, shares, payout);
    }

    /**
     * @notice Sell NO shares back to the market
     * @param shares Number of shares to sell (in WAD)
     * @return payout Amount of collateral received
     */
    function sellNo(uint256 shares) external nonReentrant notResolved returns (uint256 payout) {
        if (shares == 0) revert ZeroShares();
        if (noToken.balanceOf(msg.sender) < shares) revert InsufficientShares();
        if (shares > noShares) revert InsufficientShares();

        payout = getPayoutToSell(false, shares);

        // Burn tokens and update state
        noToken.burn(msg.sender, shares);
        noShares -= shares;

        // Transfer collateral to seller
        collateral.safeTransfer(msg.sender, payout);

        emit SharesSold(msg.sender, false, shares, payout);
    }

    // ============ Resolution Functions ============

    /**
     * @notice Resolve the market with an outcome
     * @param _outcome True if YES wins, false if NO wins
     */
    function resolve(bool _outcome) external onlyOracle {
        if (resolved) revert MarketAlreadyResolved();
        if (block.timestamp < resolutionTime) revert ResolutionTimeNotReached();

        resolved = true;
        outcome = _outcome;

        emit MarketResolved(_outcome, block.timestamp);
    }

    /**
     * @notice Claim winnings after market resolution
     * @dev Winners receive $1 per winning share (1 collateral unit per share in WAD)
     * @return winnings Amount claimed in collateral token decimals
     */
    function claimWinnings() external nonReentrant isResolved returns (uint256 winnings) {
        uint256 sharesWad;
        if (outcome) {
            // YES won - burn YES tokens and pay out
            sharesWad = yesToken.balanceOf(msg.sender);
            if (sharesWad > 0) {
                yesToken.burn(msg.sender, sharesWad);
            }
        } else {
            // NO won - burn NO tokens and pay out
            sharesWad = noToken.balanceOf(msg.sender);
            if (sharesWad > 0) {
                noToken.burn(msg.sender, sharesWad);
            }
        }

        if (sharesWad > 0) {
            // Each winning share is worth $1 - convert from WAD to collateral decimals
            winnings = _wadToCollateral(sharesWad);
            collateral.safeTransfer(msg.sender, winnings);
            emit WinningsClaimed(msg.sender, winnings);
        }
    }

    /**
     * @notice Check claimable winnings for an address (in collateral token decimals)
     * @param account Address to check
     * @return amount Claimable amount in collateral token decimals
     */
    function claimableWinnings(address account) external view returns (uint256) {
        if (!resolved) return 0;
        uint256 sharesWad = outcome ? yesToken.balanceOf(account) : noToken.balanceOf(account);
        return _wadToCollateral(sharesWad);
    }

    /**
     * @notice Check claimable winnings in WAD scale (for internal/UI calculations)
     * @param account Address to check
     * @return amount Claimable amount in WAD (1e18)
     */
    function claimableWinningsWad(address account) external view returns (uint256) {
        if (!resolved) return 0;
        return outcome ? yesToken.balanceOf(account) : noToken.balanceOf(account);
    }

    // ============ Internal Functions ============

    /**
     * @notice Convert WAD (1e18) amount to collateral token decimals
     * @param wadAmount Amount in WAD scale (1e18)
     * @return Amount in collateral token decimals
     */
    function _wadToCollateral(uint256 wadAmount) internal view returns (uint256) {
        if (collateralDecimals == 18) {
            return wadAmount;
        }
        // Scale down: divide by 10^(18 - collateralDecimals)
        // e.g., for USDC (6 decimals): divide by 10^12
        return wadAmount / (10 ** (18 - collateralDecimals));
    }

    /**
     * @notice Convert collateral token decimals to WAD (1e18)
     * @param collateralAmount Amount in collateral token decimals
     * @return Amount in WAD scale (1e18)
     */
    function _collateralToWad(uint256 collateralAmount) internal view returns (uint256) {
        if (collateralDecimals == 18) {
            return collateralAmount;
        }
        // Scale up: multiply by 10^(18 - collateralDecimals)
        // e.g., for USDC (6 decimals): multiply by 10^12
        return collateralAmount * (10 ** (18 - collateralDecimals));
    }

    /**
     * @notice Convert bytes32 to string (first 8 chars or until null byte)
     */
    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(8);
        for (uint256 i = 0; i < 8; i++) {
            bytes1 char = _bytes32[i];
            if (char == 0) break;
            bytesArray[i] = char;
        }
        return string(bytesArray);
    }
}
