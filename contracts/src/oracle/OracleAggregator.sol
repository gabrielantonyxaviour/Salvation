// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IOracleAggregator.sol";
import "../interfaces/IProjectRegistry.sol";

/**
 * @title OracleAggregator
 * @notice Handles milestone verification and market resolution for infrastructure projects
 * @dev Called by AI agent with ORACLE_ROLE to verify milestones and resolve prediction markets
 */
contract OracleAggregator is IOracleAggregator, AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    /// @notice Project registry contract
    address public projectRegistry;

    /// @notice Market factory contract
    address public marketFactory;

    /// @notice Yield vault contract
    address public yieldVault;

    /// @notice Mapping from project ID to milestones
    mapping(bytes32 => Milestone[]) public projectMilestones;

    /// @notice Mapping from project ID to verifications
    mapping(bytes32 => Verification[]) private _verifications;

    // Errors
    error InvalidArrayLengths();
    error MilestonesAlreadySetup();
    error MilestonesNotSetup();
    error InvalidMilestoneIndex();
    error MilestoneAlreadyCompleted();
    error InvalidConfidence();
    error ProjectNotActive();

    /**
     * @notice Create the oracle aggregator
     * @param _projectRegistry Project registry address
     * @param _marketFactory Market factory address
     * @param _yieldVault Yield vault address
     * @param _admin Admin address for role management
     */
    constructor(
        address _projectRegistry,
        address _marketFactory,
        address _yieldVault,
        address _admin
    ) {
        require(_projectRegistry != address(0), "Invalid registry");
        require(_marketFactory != address(0), "Invalid market factory");
        require(_yieldVault != address(0), "Invalid yield vault");
        require(_admin != address(0), "Invalid admin");

        projectRegistry = _projectRegistry;
        marketFactory = _marketFactory;
        yieldVault = _yieldVault;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ORACLE_ROLE, _admin);
    }

    /**
     * @notice Setup milestones for a project
     * @param projectId Project identifier
     * @param descriptions Array of milestone descriptions
     * @param targetDates Array of target dates for each milestone
     */
    function setupMilestones(
        bytes32 projectId,
        string[] calldata descriptions,
        uint256[] calldata targetDates
    ) external onlyRole(ORACLE_ROLE) {
        if (descriptions.length != targetDates.length) revert InvalidArrayLengths();
        if (descriptions.length == 0) revert InvalidArrayLengths();
        if (projectMilestones[projectId].length > 0) revert MilestonesAlreadySetup();

        for (uint256 i = 0; i < descriptions.length; i++) {
            projectMilestones[projectId].push(Milestone({
                description: descriptions[i],
                targetDate: targetDates[i],
                completed: false,
                completedAt: 0
            }));
        }

        emit MilestonesSetup(projectId, descriptions.length);
    }

    /**
     * @notice Verify a milestone (called by AI agent)
     * @param projectId Project identifier
     * @param milestoneIndex Index of the milestone to verify
     * @param verified Whether the milestone is verified as complete
     * @param evidenceURI IPFS hash of evidence
     * @param dataSources Array of data sources used for verification
     * @param confidence Confidence level 0-100
     */
    function verifyMilestone(
        bytes32 projectId,
        uint256 milestoneIndex,
        bool verified,
        string calldata evidenceURI,
        string[] calldata dataSources,
        uint256 confidence
    ) external onlyRole(ORACLE_ROLE) {
        if (projectMilestones[projectId].length == 0) revert MilestonesNotSetup();
        if (milestoneIndex >= projectMilestones[projectId].length) revert InvalidMilestoneIndex();
        if (projectMilestones[projectId][milestoneIndex].completed) revert MilestoneAlreadyCompleted();
        if (confidence > 100) revert InvalidConfidence();

        // Store verification record
        _verifications[projectId].push(Verification({
            projectId: projectId,
            milestoneIndex: milestoneIndex,
            verified: verified,
            evidenceURI: evidenceURI,
            dataSources: dataSources,
            confidence: confidence,
            timestamp: block.timestamp
        }));

        if (verified) {
            // Mark milestone as complete
            projectMilestones[projectId][milestoneIndex].completed = true;
            projectMilestones[projectId][milestoneIndex].completedAt = block.timestamp;

            // Check if this is the final milestone
            if (milestoneIndex == projectMilestones[projectId].length - 1) {
                // Update project status to completed
                IProjectRegistry(projectRegistry).updateStatus(
                    projectId,
                    IProjectRegistry.ProjectStatus.Completed
                );

                // Resolve prediction market as YES wins
                _resolveMarket(projectId, true);
            }
        }

        emit MilestoneVerified(projectId, milestoneIndex, verified, evidenceURI, confidence);
    }

    /**
     * @notice Mark a project as failed (called by AI agent)
     * @param projectId Project identifier
     * @param reason Reason for failure
     */
    function markProjectFailed(
        bytes32 projectId,
        string calldata reason
    ) external onlyRole(ORACLE_ROLE) {
        // Update project status to failed
        IProjectRegistry(projectRegistry).updateStatus(
            projectId,
            IProjectRegistry.ProjectStatus.Failed
        );

        // Resolve prediction market as NO wins
        _resolveMarket(projectId, false);

        emit ProjectMarkedFailed(projectId, reason);
    }

    /**
     * @notice Get all milestones for a project
     * @param projectId Project identifier
     * @return Array of milestones
     */
    function getMilestones(bytes32 projectId) external view returns (Milestone[] memory) {
        return projectMilestones[projectId];
    }

    /**
     * @notice Get milestone count for a project
     * @param projectId Project identifier
     * @return Number of milestones
     */
    function getMilestoneCount(bytes32 projectId) external view returns (uint256) {
        return projectMilestones[projectId].length;
    }

    /**
     * @notice Get a specific milestone
     * @param projectId Project identifier
     * @param index Milestone index
     * @return Milestone data
     */
    function getMilestone(bytes32 projectId, uint256 index) external view returns (Milestone memory) {
        require(index < projectMilestones[projectId].length, "Invalid index");
        return projectMilestones[projectId][index];
    }

    /**
     * @notice Get all verifications for a project
     * @param projectId Project identifier
     * @return Array of verifications
     */
    function getVerifications(bytes32 projectId) external view returns (Verification[] memory) {
        return _verifications[projectId];
    }

    /**
     * @notice Get verification count for a project
     * @param projectId Project identifier
     * @return Number of verifications
     */
    function getVerificationCount(bytes32 projectId) external view returns (uint256) {
        return _verifications[projectId].length;
    }

    /**
     * @notice Get project progress (completed milestones / total milestones)
     * @param projectId Project identifier
     * @return completed Number of completed milestones
     * @return total Total number of milestones
     */
    function getProjectProgress(bytes32 projectId) external view returns (uint256 completed, uint256 total) {
        Milestone[] storage milestones = projectMilestones[projectId];
        total = milestones.length;

        for (uint256 i = 0; i < total; i++) {
            if (milestones[i].completed) {
                completed++;
            }
        }
    }

    /**
     * @notice Internal function to resolve prediction market
     * @param projectId Project identifier
     * @param outcome True for YES wins, false for NO wins
     */
    function _resolveMarket(bytes32 projectId, bool outcome) internal {
        // Get market address from factory
        address market = IMarketFactory(marketFactory).getMarket(projectId);

        if (market != address(0)) {
            ILMSRMarket(market).resolve(outcome);
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Update project registry address
     * @param _projectRegistry New registry address
     */
    function setProjectRegistry(address _projectRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_projectRegistry != address(0), "Invalid address");
        projectRegistry = _projectRegistry;
    }

    /**
     * @notice Update market factory address
     * @param _marketFactory New factory address
     */
    function setMarketFactory(address _marketFactory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_marketFactory != address(0), "Invalid address");
        marketFactory = _marketFactory;
    }

    /**
     * @notice Update yield vault address
     * @param _yieldVault New vault address
     */
    function setYieldVault(address _yieldVault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_yieldVault != address(0), "Invalid address");
        yieldVault = _yieldVault;
    }
}

// Interface for MarketFactory (minimal)
interface IMarketFactory {
    function getMarket(bytes32 projectId) external view returns (address);
}

// Interface for LMSRMarket (minimal)
interface ILMSRMarket {
    function resolve(bool outcome) external;
}
