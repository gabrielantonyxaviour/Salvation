// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IProjectRegistry.sol";

contract ProjectRegistry is IProjectRegistry, Ownable, ReentrancyGuard {
    mapping(bytes32 => Project) private projects;
    bytes32[] private projectIds;

    address public oracle;
    address public bondFactory;

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }

    modifier onlyBondFactory() {
        require(msg.sender == bondFactory, "Only BondFactory");
        _;
    }

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;
    }

    function setBondFactory(address _bondFactory) external onlyOwner {
        bondFactory = _bondFactory;
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function registerProject(
        string calldata name,
        string calldata metadataURI,
        uint256 fundingGoal,
        uint256 bondPrice
    ) external returns (bytes32 projectId) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(metadataURI).length > 0, "MetadataURI required");
        require(fundingGoal > 0, "Funding goal must be > 0");
        require(bondPrice > 0, "Bond price must be > 0");

        projectId = keccak256(abi.encodePacked(name, msg.sender, block.timestamp));

        require(projects[projectId].createdAt == 0, "Project exists");

        projects[projectId] = Project({
            id: projectId,
            metadataURI: metadataURI,
            sponsor: msg.sender,
            fundingGoal: fundingGoal,
            fundingRaised: 0,
            bondPrice: bondPrice,
            status: ProjectStatus.Pending,
            createdAt: block.timestamp
        });

        projectIds.push(projectId);

        emit ProjectRegistered(projectId, msg.sender, metadataURI, fundingGoal, bondPrice);
    }

    function getProject(bytes32 projectId) external view returns (Project memory) {
        require(projects[projectId].createdAt > 0, "Project not found");
        return projects[projectId];
    }

    function updateStatus(bytes32 projectId, ProjectStatus status) external onlyOracle {
        require(projects[projectId].createdAt > 0, "Project not found");
        projects[projectId].status = status;
        emit ProjectStatusUpdated(projectId, status);
    }

    function getActiveProjects() external view returns (Project[] memory) {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].status == ProjectStatus.Funding ||
                projects[projectIds[i]].status == ProjectStatus.Active) {
                activeCount++;
            }
        }

        Project[] memory activeProjects = new Project[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].status == ProjectStatus.Funding ||
                projects[projectIds[i]].status == ProjectStatus.Active) {
                activeProjects[index] = projects[projectIds[i]];
                index++;
            }
        }

        return activeProjects;
    }

    function fundProject(bytes32 projectId, uint256 amount) external onlyBondFactory nonReentrant {
        require(projects[projectId].createdAt > 0, "Project not found");
        require(
            projects[projectId].status == ProjectStatus.Funding,
            "Project not in funding status"
        );

        projects[projectId].fundingRaised += amount;

        if (projects[projectId].fundingRaised >= projects[projectId].fundingGoal) {
            projects[projectId].status = ProjectStatus.Active;
            emit ProjectStatusUpdated(projectId, ProjectStatus.Active);
        }

        emit ProjectFunded(projectId, amount, projects[projectId].fundingRaised);
    }

    function getAllProjects() external view returns (Project[] memory) {
        Project[] memory allProjects = new Project[](projectIds.length);
        for (uint256 i = 0; i < projectIds.length; i++) {
            allProjects[i] = projects[projectIds[i]];
        }
        return allProjects;
    }

    function getProjectCount() external view returns (uint256) {
        return projectIds.length;
    }
}
