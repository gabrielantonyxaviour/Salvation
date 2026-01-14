// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOracleAggregator {
    struct Verification {
        bytes32 projectId;
        uint256 milestoneIndex;
        bool verified;
        string evidenceURI;
        string[] dataSources;
        uint256 confidence;
        uint256 timestamp;
    }

    struct Milestone {
        string description;
        uint256 targetDate;
        bool completed;
        uint256 completedAt;
    }

    event MilestonesSetup(bytes32 indexed projectId, uint256 milestoneCount);

    event MilestoneVerified(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        bool verified,
        string evidenceURI,
        uint256 confidence
    );

    event ProjectMarkedFailed(bytes32 indexed projectId, string reason);

    function setupMilestones(
        bytes32 projectId,
        string[] calldata descriptions,
        uint256[] calldata targetDates
    ) external;

    function verifyMilestone(
        bytes32 projectId,
        uint256 milestoneIndex,
        bool verified,
        string calldata evidenceURI,
        string[] calldata dataSources,
        uint256 confidence
    ) external;

    function markProjectFailed(
        bytes32 projectId,
        string calldata reason
    ) external;

    function getMilestones(bytes32 projectId) external view returns (Milestone[] memory);

    function getVerifications(bytes32 projectId) external view returns (Verification[] memory);

    function getProjectProgress(bytes32 projectId) external view returns (uint256 completed, uint256 total);
}
