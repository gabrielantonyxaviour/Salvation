// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IBondToken.sol";

/**
 * @title BondToken
 * @notice Non-transferable (soulbound) bond token for project investment
 * @dev Extends ERC20 but disables all transfer functionality
 */
contract BondToken is ERC20, Ownable, IBondToken {
    bytes32 public override projectId;
    address public override yieldVault;
    address public bondFactory;

    mapping(address => uint256) private _bondBalances;
    mapping(address => uint256) private _yieldClaimed;

    modifier onlyBondFactory() {
        require(msg.sender == bondFactory, "Only BondFactory");
        _;
    }

    modifier onlyYieldVault() {
        require(msg.sender == yieldVault, "Only YieldVault");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        bytes32 _projectId,
        address _bondFactory
    ) ERC20(name, symbol) Ownable(msg.sender) {
        projectId = _projectId;
        bondFactory = _bondFactory;
    }

    function setYieldVault(address _yieldVault) external onlyOwner {
        yieldVault = _yieldVault;
    }

    function mint(address to, uint256 amount) external override onlyBondFactory {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be > 0");

        _bondBalances[to] += amount;
        _mint(to, amount);

        emit BondsMinted(to, amount);
    }

    function bondBalance(address holder) external view override returns (uint256) {
        return _bondBalances[holder];
    }

    function yieldClaimed(address holder) external view override returns (uint256) {
        return _yieldClaimed[holder];
    }

    function setYieldClaimed(address holder, uint256 amount) external override onlyYieldVault {
        _yieldClaimed[holder] = amount;
    }

    // Override ERC20 functions to satisfy both ERC20 and IBondToken (which extends IERC20)
    function balanceOf(address account) public view override(ERC20, IERC20) returns (uint256) {
        return super.balanceOf(account);
    }

    function totalSupply() public view override(ERC20, IERC20) returns (uint256) {
        return super.totalSupply();
    }

    function allowance(address owner, address spender) public view override(ERC20, IERC20) returns (uint256) {
        return super.allowance(owner, spender);
    }

    // Override transfer functions to make token non-transferable (soulbound)
    function transfer(address, uint256) public pure override(ERC20, IERC20) returns (bool) {
        revert("Non-transferable");
    }

    function transferFrom(address, address, uint256) public pure override(ERC20, IERC20) returns (bool) {
        revert("Non-transferable");
    }

    function approve(address, uint256) public pure override(ERC20, IERC20) returns (bool) {
        revert("Non-transferable");
    }
}
