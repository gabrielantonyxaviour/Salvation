// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IYieldVault.sol";
import "../interfaces/IBondToken.sol";
import "../interfaces/IBondFactory.sol";

contract YieldVault is IYieldVault, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(bytes32 => uint256) public override projectRevenue;
    mapping(bytes32 => uint256) public override distributedRevenue;
    mapping(address => mapping(bytes32 => uint256)) private _lastClaimTime;
    mapping(bytes32 => uint256) public projectStartTime;

    IERC20 public usdc;
    IBondFactory public bondFactory;

    uint256 public constant YEAR_IN_SECONDS = 365 days;

    constructor(address _usdc, address _bondFactory) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        bondFactory = IBondFactory(_bondFactory);
    }

    function depositRevenue(bytes32 projectId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        address bondToken = bondFactory.getBondToken(projectId);
        require(bondToken != address(0), "Bond not found");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        projectRevenue[projectId] += amount;

        if (projectStartTime[projectId] == 0) {
            projectStartTime[projectId] = block.timestamp;
        }

        emit RevenueDeposited(projectId, amount, projectRevenue[projectId]);
    }

    function claimYield(bytes32 projectId) external nonReentrant {
        uint256 claimable = claimableYield(projectId, msg.sender);
        require(claimable > 0, "No yield to claim");

        address bondToken = bondFactory.getBondToken(projectId);
        require(bondToken != address(0), "Bond not found");

        _lastClaimTime[msg.sender][projectId] = block.timestamp;

        distributedRevenue[projectId] += claimable;

        // Update yield claimed in bond token
        IBondToken(bondToken).setYieldClaimed(
            msg.sender,
            IBondToken(bondToken).yieldClaimed(msg.sender) + claimable
        );

        usdc.safeTransfer(msg.sender, claimable);

        emit YieldClaimed(projectId, msg.sender, claimable);
    }

    function claimableYield(bytes32 projectId, address holder) public view override returns (uint256) {
        address bondToken = bondFactory.getBondToken(projectId);
        if (bondToken == address(0)) return 0;

        uint256 holderBalance = IBondToken(bondToken).balanceOf(holder);
        if (holderBalance == 0) return 0;

        uint256 totalSupply = IBondToken(bondToken).totalSupply();
        if (totalSupply == 0) return 0;

        uint256 totalUndistributed = projectRevenue[projectId] - distributedRevenue[projectId];
        if (totalUndistributed == 0) return 0;

        // Calculate holder's share of undistributed revenue
        uint256 holderShare = (totalUndistributed * holderBalance) / totalSupply;

        return holderShare;
    }

    function getProjectYieldInfo(bytes32 projectId)
        external
        view
        override
        returns (uint256 totalRevenue, uint256 distributed, uint256 apy)
    {
        totalRevenue = projectRevenue[projectId];
        distributed = distributedRevenue[projectId];

        address bondToken = bondFactory.getBondToken(projectId);
        if (bondToken == address(0) || projectStartTime[projectId] == 0) {
            apy = 0;
            return (totalRevenue, distributed, apy);
        }

        uint256 totalSupply = IBondToken(bondToken).totalSupply();
        if (totalSupply == 0) {
            apy = 0;
            return (totalRevenue, distributed, apy);
        }

        uint256 timeElapsed = block.timestamp - projectStartTime[projectId];
        if (timeElapsed == 0) {
            apy = 0;
            return (totalRevenue, distributed, apy);
        }

        // APY = (totalRevenue / totalSupply) * (365 days / timeElapsed) * 100
        // Using 1e18 for precision
        apy = (totalRevenue * YEAR_IN_SECONDS * 100 * 1e18) / (totalSupply * timeElapsed);
    }

    function lastClaimTime(address holder, bytes32 projectId) external view override returns (uint256) {
        return _lastClaimTime[holder][projectId];
    }
}
