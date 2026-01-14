// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title OutcomeToken
 * @notice Simple ERC-20 token for YES/NO prediction market positions
 * @dev Mintable/burnable only by the market contract. Freely transferable for trading.
 */
contract OutcomeToken is ERC20 {
    /// @notice The market contract that controls this token
    address public immutable market;

    /// @notice True if this is the YES token, false for NO token
    bool public immutable isYesToken;

    error OnlyMarket();

    modifier onlyMarket() {
        if (msg.sender != market) revert OnlyMarket();
        _;
    }

    /**
     * @notice Create a new outcome token
     * @param _name Token name (e.g., "Project-123 YES")
     * @param _symbol Token symbol (e.g., "P123-YES")
     * @param _market The market contract address
     * @param _isYesToken True for YES token, false for NO token
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _market,
        bool _isYesToken
    ) ERC20(_name, _symbol) {
        require(_market != address(0), "OutcomeToken: zero market address");
        market = _market;
        isYesToken = _isYesToken;
    }

    /**
     * @notice Mint tokens when shares are purchased
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMarket {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens when shares are sold or redeemed
     * @param from Token holder address
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyMarket {
        _burn(from, amount);
    }

    /**
     * @notice Returns the number of decimals (matches collateral, typically 18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
