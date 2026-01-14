// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBondToken is IERC20 {
    event BondsMinted(address indexed to, uint256 amount);

    function projectId() external view returns (bytes32);

    function yieldVault() external view returns (address);

    function mint(address to, uint256 amount) external;

    function bondBalance(address holder) external view returns (uint256);

    function yieldClaimed(address holder) external view returns (uint256);

    function setYieldClaimed(address holder, uint256 amount) external;
}
