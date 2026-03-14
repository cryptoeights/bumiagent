// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8183 - Agentic Commerce (Job Escrow)
/// @notice Defines the interface for trustless job escrow between users and AI agents
interface IERC8183 {
    enum JobStatus {
        Open,
        Funded,
        Submitted,
        Completed,
        Rejected,
        Expired
    }

    struct Job {
        address client;
        address provider;
        address evaluator;
        string description;
        uint256 budget;
        uint256 expiredAt;
        JobStatus status;
        bytes32 deliverable;
        uint256 agentId;
    }

    event JobCreated(uint256 indexed jobId, address indexed client, uint256 indexed agentId, address evaluator);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event JobSubmitted(uint256 indexed jobId, bytes32 deliverable);
    event JobCompleted(uint256 indexed jobId, bytes32 reason, uint256 payout, uint256 fee);
    event JobRejected(uint256 indexed jobId, address indexed rejector, bytes32 reason);
    event JobExpired(uint256 indexed jobId);

    function createJob(
        uint256 agentId,
        address evaluator,
        uint256 expiredAt,
        string calldata description
    ) external returns (uint256 jobId);

    function fundJob(uint256 jobId, uint256 amount) external;
    function submitJob(uint256 jobId, bytes32 deliverable) external;
    function completeJob(uint256 jobId, bytes32 reason) external;
    function rejectJob(uint256 jobId, bytes32 reason) external;
    function claimRefund(uint256 jobId) external;
    function getJob(uint256 jobId) external view returns (Job memory);
    function getAgentJobs(uint256 agentId) external view returns (uint256[] memory);
}
