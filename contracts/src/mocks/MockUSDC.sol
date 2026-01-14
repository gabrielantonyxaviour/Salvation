// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing purposes
 * @dev 6 decimals to match real USDC
 */
contract MockUSDC is ERC20, Ownable {
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mint tokens to an address (for testing)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function for testing - anyone can get 10,000 USDC
     */
    function faucet() external {
        _mint(msg.sender, 10_000 * 10**6);
    }

    /**
     * @notice Faucet with custom amount
     * @param amount Amount to mint (in base units, e.g., 1000000 = 1 USDC)
     */
    function faucetAmount(uint256 amount) external {
        require(amount <= 100_000 * 10**6, "Max 100k USDC");
        _mint(msg.sender, amount);
    }
}
