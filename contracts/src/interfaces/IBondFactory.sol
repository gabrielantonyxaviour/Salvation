// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBondFactory {
    event BondCreated(bytes32 indexed projectId, address bondToken);

    event BondsPurchased(
        bytes32 indexed projectId,
        address indexed buyer,
        uint256 usdcAmount,
        uint256 bondAmount
    );

    function createBond(bytes32 projectId) external returns (address bondToken);

    function purchaseBonds(bytes32 projectId, uint256 usdcAmount) external;

    function getBondToken(bytes32 projectId) external view returns (address);

    function projectBonds(bytes32 projectId) external view returns (address);
}
