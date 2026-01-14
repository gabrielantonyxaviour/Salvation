// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LMSRMarket.sol";

/**
 * @title MarketFactory
 * @notice Factory contract for creating LMSR prediction markets
 * @dev Deploys LMSRMarket instances for each project
 */
contract MarketFactory is Ownable {
    /// @notice Oracle address for resolving markets
    address public oracle;

    /// @notice Collateral token (e.g., USDC)
    address public collateral;

    /// @notice Default liquidity parameter for new markets (in WAD)
    uint256 public defaultLiquidity;

    /// @notice Mapping from project ID to market address
    mapping(bytes32 => address) public projectMarkets;

    /// @notice Array of all created markets
    address[] public allMarkets;

    // Events
    event MarketCreated(
        bytes32 indexed projectId,
        address indexed market,
        string question,
        uint256 resolutionTime,
        uint256 liquidity
    );
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event CollateralUpdated(address indexed oldCollateral, address indexed newCollateral);
    event DefaultLiquidityUpdated(uint256 oldLiquidity, uint256 newLiquidity);

    // Errors
    error MarketAlreadyExists(bytes32 projectId);
    error InvalidOracle();
    error InvalidCollateral();
    error InvalidLiquidity();
    error ResolutionTimeInPast();

    /**
     * @notice Create the market factory
     * @param _oracle Oracle address for market resolution
     * @param _collateral Collateral token address (e.g., USDC)
     * @param _defaultLiquidity Default 'b' parameter for LMSR (in WAD)
     */
    constructor(
        address _oracle,
        address _collateral,
        uint256 _defaultLiquidity
    ) Ownable(msg.sender) {
        if (_oracle == address(0)) revert InvalidOracle();
        if (_collateral == address(0)) revert InvalidCollateral();
        if (_defaultLiquidity == 0) revert InvalidLiquidity();

        oracle = _oracle;
        collateral = _collateral;
        defaultLiquidity = _defaultLiquidity;
    }

    /**
     * @notice Create a new prediction market for a project
     * @param projectId Project identifier
     * @param question Market question (e.g., "Will project be operational by [date]?")
     * @param resolutionTime When the market can be resolved
     * @param initialLiquidity Custom 'b' parameter (use 0 for default)
     * @return market Address of the created market
     */
    function createMarket(
        bytes32 projectId,
        string calldata question,
        uint256 resolutionTime,
        uint256 initialLiquidity
    ) external returns (address market) {
        // Check if market already exists for this project
        if (projectMarkets[projectId] != address(0)) {
            revert MarketAlreadyExists(projectId);
        }

        if (resolutionTime <= block.timestamp) {
            revert ResolutionTimeInPast();
        }

        // Use default liquidity if none specified
        uint256 liquidity = initialLiquidity > 0 ? initialLiquidity : defaultLiquidity;

        // Deploy new market
        LMSRMarket newMarket = new LMSRMarket(
            projectId,
            question,
            resolutionTime,
            collateral,
            liquidity,
            oracle
        );

        market = address(newMarket);
        projectMarkets[projectId] = market;
        allMarkets.push(market);

        emit MarketCreated(projectId, market, question, resolutionTime, liquidity);
    }

    /**
     * @notice Get market address for a project
     * @param projectId Project identifier
     * @return market Market address (address(0) if not exists)
     */
    function getMarket(bytes32 projectId) external view returns (address) {
        return projectMarkets[projectId];
    }

    /**
     * @notice Get total number of markets created
     * @return count Number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }

    /**
     * @notice Get all market addresses
     * @return markets Array of all market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    /**
     * @notice Get markets with pagination
     * @param offset Starting index
     * @param limit Maximum number to return
     * @return markets Array of market addresses
     */
    function getMarkets(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = allMarkets.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 count = offset + limit > total ? total - offset : limit;
        address[] memory markets = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            markets[i] = allMarkets[offset + i];
        }

        return markets;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the oracle address
     * @param newOracle New oracle address
     */
    function setOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert InvalidOracle();
        address oldOracle = oracle;
        oracle = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }

    /**
     * @notice Update the collateral token
     * @param newCollateral New collateral token address
     */
    function setCollateral(address newCollateral) external onlyOwner {
        if (newCollateral == address(0)) revert InvalidCollateral();
        address oldCollateral = collateral;
        collateral = newCollateral;
        emit CollateralUpdated(oldCollateral, newCollateral);
    }

    /**
     * @notice Update the default liquidity parameter
     * @param newLiquidity New default 'b' parameter (in WAD)
     */
    function setDefaultLiquidity(uint256 newLiquidity) external onlyOwner {
        if (newLiquidity == 0) revert InvalidLiquidity();
        uint256 oldLiquidity = defaultLiquidity;
        defaultLiquidity = newLiquidity;
        emit DefaultLiquidityUpdated(oldLiquidity, newLiquidity);
    }
}
