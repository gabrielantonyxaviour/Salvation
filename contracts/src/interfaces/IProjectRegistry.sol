// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProjectRegistry {
    enum ProjectStatus {
        Pending,
        Funding,
        Active,
        Completed,
        Failed
    }

    struct Project {
        bytes32 id;
        string metadataURI;
        address sponsor;
        uint256 fundingGoal;
        uint256 fundingRaised;
        uint256 bondPrice;
        ProjectStatus status;
        uint256 createdAt;
    }

    event ProjectRegistered(
        bytes32 indexed projectId,
        address indexed sponsor,
        string metadataURI,
        uint256 fundingGoal,
        uint256 bondPrice
    );

    event ProjectStatusUpdated(bytes32 indexed projectId, ProjectStatus status);

    event ProjectFunded(bytes32 indexed projectId, uint256 amount, uint256 totalRaised);

    function registerProject(
        string calldata name,
        string calldata metadataURI,
        uint256 fundingGoal,
        uint256 bondPrice
    ) external returns (bytes32 projectId);

    function getProject(bytes32 projectId) external view returns (Project memory);

    function updateStatus(bytes32 projectId, ProjectStatus status) external;

    function getActiveProjects() external view returns (Project[] memory);

    function fundProject(bytes32 projectId, uint256 amount) external;
}
