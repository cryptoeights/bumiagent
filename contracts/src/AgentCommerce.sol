// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC8183} from "./interfaces/IERC8183.sol";
import {SpawnRegistry} from "./SpawnRegistry.sol";

/// @title AgentCommerce - ERC-8183 Job Escrow for CeloSpawn
/// @notice Trustless job escrow where users hire AI agents for tasks with guaranteed payment
contract AgentCommerce is IERC8183, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── State ──────────────────────────────────────────────

    uint256 private _nextJobId = 1; // Start at 1, 0 is sentinel

    IERC20 public immutable paymentToken; // cUSD
    SpawnRegistry public immutable spawnRegistry;
    address public treasury;

    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%
    uint256 public constant BPS_DENOMINATOR = 10000;

    mapping(uint256 => Job) internal _jobs;
    mapping(uint256 => uint256[]) public agentJobs; // agentId → jobId[]

    // ─── Errors ─────────────────────────────────────────────

    error JobNotFound(uint256 jobId);
    error InvalidExpiry(uint256 expiredAt);
    error ZeroBudget();
    error NotJobClient(uint256 jobId);
    error NotJobProvider(uint256 jobId);
    error NotJobEvaluator(uint256 jobId);
    error InvalidJobStatus(uint256 jobId, JobStatus current, JobStatus expected);
    error JobNotExpired(uint256 jobId);
    error ZeroAddress();

    // ─── Constructor ────────────────────────────────────────

    constructor(
        address _paymentToken,
        address _spawnRegistry,
        address _treasury
    ) Ownable(msg.sender) {
        if (_paymentToken == address(0)) revert ZeroAddress();
        if (_spawnRegistry == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        paymentToken = IERC20(_paymentToken);
        spawnRegistry = SpawnRegistry(_spawnRegistry);
        treasury = _treasury;
    }

    // ─── Job Lifecycle ──────────────────────────────────────

    /// @inheritdoc IERC8183
    function createJob(
        uint256 agentId,
        address evaluator,
        uint256 expiredAt,
        string calldata description
    ) external returns (uint256 jobId) {
        // Validate agent exists by reading its data (reverts if not found)
        SpawnRegistry.AgentData memory agent = spawnRegistry.getAgent(agentId);

        if (expiredAt <= block.timestamp) revert InvalidExpiry(expiredAt);

        address eval = evaluator == address(0) ? msg.sender : evaluator;

        jobId = _nextJobId++;

        _jobs[jobId] = Job({
            client: msg.sender,
            provider: agent.agentWallet,
            evaluator: eval,
            description: description,
            budget: 0,
            expiredAt: expiredAt,
            status: JobStatus.Open,
            deliverable: bytes32(0),
            agentId: agentId
        });

        agentJobs[agentId].push(jobId);

        emit JobCreated(jobId, msg.sender, agentId, eval);
    }

    /// @inheritdoc IERC8183
    function fundJob(uint256 jobId, uint256 amount) external nonReentrant {
        Job storage job = _getJob(jobId);

        if (msg.sender != job.client) revert NotJobClient(jobId);
        if (job.status != JobStatus.Open) {
            revert InvalidJobStatus(jobId, job.status, JobStatus.Open);
        }
        if (amount == 0) revert ZeroBudget();

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        job.budget = amount;
        job.status = JobStatus.Funded;

        emit JobFunded(jobId, amount);
    }

    /// @inheritdoc IERC8183
    function submitJob(uint256 jobId, bytes32 deliverable) external {
        Job storage job = _getJob(jobId);

        if (msg.sender != job.provider && msg.sender != owner()) {
            revert NotJobProvider(jobId);
        }
        if (job.status != JobStatus.Funded) {
            revert InvalidJobStatus(jobId, job.status, JobStatus.Funded);
        }

        job.deliverable = deliverable;
        job.status = JobStatus.Submitted;

        emit JobSubmitted(jobId, deliverable);
    }

    /// @inheritdoc IERC8183
    function completeJob(uint256 jobId, bytes32 reason) external nonReentrant {
        Job storage job = _getJob(jobId);

        if (msg.sender != job.evaluator) revert NotJobEvaluator(jobId);
        if (job.status != JobStatus.Submitted) {
            revert InvalidJobStatus(jobId, job.status, JobStatus.Submitted);
        }

        uint256 fee = (job.budget * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 payout = job.budget - fee;

        job.status = JobStatus.Completed;

        // Transfer payout to provider, fee to treasury
        paymentToken.safeTransfer(job.provider, payout);
        if (fee > 0) {
            paymentToken.safeTransfer(treasury, fee);
        }

        emit JobCompleted(jobId, reason, payout, fee);
    }

    /// @inheritdoc IERC8183
    function rejectJob(uint256 jobId, bytes32 reason) external nonReentrant {
        Job storage job = _getJob(jobId);

        if (job.status == JobStatus.Open) {
            // Only client can reject an Open job
            if (msg.sender != job.client) revert NotJobClient(jobId);
        } else if (job.status == JobStatus.Funded || job.status == JobStatus.Submitted) {
            // Evaluator can reject funded/submitted jobs
            if (msg.sender != job.evaluator) revert NotJobEvaluator(jobId);

            // Refund budget to client
            paymentToken.safeTransfer(job.client, job.budget);
        } else {
            revert InvalidJobStatus(jobId, job.status, JobStatus.Open);
        }

        job.status = JobStatus.Rejected;

        emit JobRejected(jobId, msg.sender, reason);
    }

    /// @inheritdoc IERC8183
    function claimRefund(uint256 jobId) external nonReentrant {
        Job storage job = _getJob(jobId);

        if (job.status != JobStatus.Funded && job.status != JobStatus.Submitted) {
            revert InvalidJobStatus(jobId, job.status, JobStatus.Funded);
        }
        if (block.timestamp < job.expiredAt) revert JobNotExpired(jobId);

        uint256 refundAmount = job.budget;
        job.status = JobStatus.Expired;

        paymentToken.safeTransfer(job.client, refundAmount);

        emit JobExpired(jobId);
    }

    // ─── View Functions ─────────────────────────────────────

    /// @inheritdoc IERC8183
    function getJob(uint256 jobId) external view returns (Job memory) {
        return _getJob(jobId);
    }

    /// @inheritdoc IERC8183
    function getAgentJobs(uint256 agentId) external view returns (uint256[] memory) {
        return agentJobs[agentId];
    }

    /// @notice Get total number of jobs created
    function totalJobs() external view returns (uint256) {
        return _nextJobId - 1;
    }

    // ─── Internal ───────────────────────────────────────────

    function _getJob(uint256 jobId) internal view returns (Job storage) {
        if (jobId == 0 || jobId >= _nextJobId) revert JobNotFound(jobId);
        return _jobs[jobId];
    }
}
