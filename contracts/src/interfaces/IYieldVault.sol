// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IYieldVault {
    event RevenueDeposited(bytes32 indexed projectId, uint256 amount, uint256 totalRevenue);

    event YieldClaimed(bytes32 indexed projectId, address indexed holder, uint256 amount);

    function depositRevenue(bytes32 projectId, uint256 amount) external;

    function claimYield(bytes32 projectId) external;

    function claimableYield(bytes32 projectId, address holder) external view returns (uint256);

    function getProjectYieldInfo(bytes32 projectId)
        external
        view
        returns (uint256 totalRevenue, uint256 distributed, uint256 apy);

    function projectRevenue(bytes32 projectId) external view returns (uint256);

    function distributedRevenue(bytes32 projectId) external view returns (uint256);

    function lastClaimTime(address holder, bytes32 projectId) external view returns (uint256);
}
