// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IBondFactory.sol";
import "../interfaces/IProjectRegistry.sol";
import "./BondToken.sol";

contract BondFactory is IBondFactory, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(bytes32 => address) public override projectBonds;

    IProjectRegistry public projectRegistry;
    IERC20 public usdc;
    address public yieldVault;

    constructor(
        address _projectRegistry,
        address _usdc
    ) Ownable(msg.sender) {
        projectRegistry = IProjectRegistry(_projectRegistry);
        usdc = IERC20(_usdc);
    }

    function setYieldVault(address _yieldVault) external onlyOwner {
        yieldVault = _yieldVault;
    }

    function createBond(bytes32 projectId) external returns (address bondToken) {
        require(projectBonds[projectId] == address(0), "Bond already exists");

        IProjectRegistry.Project memory project = projectRegistry.getProject(projectId);
        require(project.createdAt > 0, "Project not found");

        string memory name = string(abi.encodePacked("Salvation Bond - ", _bytes32ToString(projectId)));
        string memory symbol = string(abi.encodePacked("sBOND-", _truncateBytes32(projectId)));

        BondToken newBond = new BondToken(name, symbol, projectId, address(this));

        if (yieldVault != address(0)) {
            newBond.setYieldVault(yieldVault);
        }

        bondToken = address(newBond);
        projectBonds[projectId] = bondToken;

        emit BondCreated(projectId, bondToken);
    }

    function purchaseBonds(bytes32 projectId, uint256 usdcAmount) external nonReentrant {
        require(usdcAmount > 0, "Amount must be > 0");

        address bondTokenAddr = projectBonds[projectId];
        require(bondTokenAddr != address(0), "Bond not created");

        IProjectRegistry.Project memory project = projectRegistry.getProject(projectId);
        require(
            project.status == IProjectRegistry.ProjectStatus.Funding,
            "Project not in funding status"
        );

        // Calculate bond tokens to mint
        uint256 bondAmount = (usdcAmount * 1e18) / project.bondPrice;
        require(bondAmount > 0, "Bond amount too small");

        // Transfer USDC from buyer
        usdc.safeTransferFrom(msg.sender, address(projectRegistry), usdcAmount);

        // Update project funding
        projectRegistry.fundProject(projectId, usdcAmount);

        // Mint bonds to buyer
        BondToken(bondTokenAddr).mint(msg.sender, bondAmount);

        emit BondsPurchased(projectId, msg.sender, usdcAmount, bondAmount);
    }

    function getBondToken(bytes32 projectId) external view override returns (address) {
        return projectBonds[projectId];
    }

    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(8);
        for (uint256 i = 0; i < 8; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    function _truncateBytes32(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(4);
        for (uint256 i = 0; i < 4; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}
