// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentCommerce} from "../src/AgentCommerce.sol";
import {SpawnRegistry} from "../src/SpawnRegistry.sol";
import {EarthPool} from "../src/EarthPool.sol";
import {IERC8183} from "../src/interfaces/IERC8183.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCUSD is ERC20 {
    constructor() ERC20("Celo Dollar", "cUSD") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract AgentCommerceTest is Test {
    AgentCommerce public commerce;
    SpawnRegistry public registry;
    EarthPool public earthPool;
    MockCUSD public cusd;

    address public platformOwner;
    address public alice = makeAddr("alice"); // agent owner
    address public bob = makeAddr("bob");     // job client
    address public charlie = makeAddr("charlie"); // evaluator
    address public treasury = makeAddr("treasury");
    address public agentWallet = makeAddr("agentWallet");

    uint256 public agentId;

    function setUp() public {
        platformOwner = address(this);
        cusd = new MockCUSD();
        earthPool = new EarthPool(address(cusd));
        registry = new SpawnRegistry(address(cusd), address(earthPool), treasury);
        commerce = new AgentCommerce(address(cusd), address(registry), treasury);

        // Register an agent
        vm.prank(alice);
        agentId = registry.registerAgent("TestAgent", 0, 1e18, agentWallet, "ipfs://test");

        // Fund users
        cusd.mint(bob, 10_000e18);
        cusd.mint(charlie, 10_000e18);
    }

    // ─── Constructor ────────────────────────────────────────

    function test_Constructor() public view {
        assertEq(address(commerce.paymentToken()), address(cusd));
        assertEq(address(commerce.spawnRegistry()), address(registry));
        assertEq(commerce.treasury(), treasury);
        assertEq(commerce.totalJobs(), 0);
    }

    function test_Constructor_RevertZeroAddress() public {
        vm.expectRevert(AgentCommerce.ZeroAddress.selector);
        new AgentCommerce(address(0), address(registry), treasury);

        vm.expectRevert(AgentCommerce.ZeroAddress.selector);
        new AgentCommerce(address(cusd), address(0), treasury);

        vm.expectRevert(AgentCommerce.ZeroAddress.selector);
        new AgentCommerce(address(cusd), address(registry), address(0));
    }

    // ─── Create Job ─────────────────────────────────────────

    function test_CreateJob() public {
        uint256 expiry = block.timestamp + 1 days;

        vm.prank(bob);
        uint256 jobId = commerce.createJob(agentId, address(0), expiry, "Build a dashboard");

        assertEq(jobId, 1);
        assertEq(commerce.totalJobs(), 1);

        IERC8183.Job memory job = commerce.getJob(jobId);
        assertEq(job.client, bob);
        assertEq(job.provider, agentWallet);
        assertEq(job.evaluator, bob); // default to client
        assertEq(keccak256(bytes(job.description)), keccak256("Build a dashboard"));
        assertEq(job.budget, 0);
        assertEq(job.expiredAt, expiry);
        assertEq(uint8(job.status), uint8(IERC8183.JobStatus.Open));
        assertEq(job.agentId, agentId);
    }

    function test_CreateJob_WithEvaluator() public {
        vm.prank(bob);
        uint256 jobId = commerce.createJob(agentId, charlie, block.timestamp + 1 days, "Test");

        assertEq(commerce.getJob(jobId).evaluator, charlie);
    }

    function test_CreateJob_TracksAgentJobs() public {
        vm.startPrank(bob);
        commerce.createJob(agentId, address(0), block.timestamp + 1 days, "Job 1");
        commerce.createJob(agentId, address(0), block.timestamp + 1 days, "Job 2");
        vm.stopPrank();

        uint256[] memory jobs = commerce.getAgentJobs(agentId);
        assertEq(jobs.length, 2);
        assertEq(jobs[0], 1);
        assertEq(jobs[1], 2);
    }

    function test_CreateJob_RevertInvalidExpiry() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(AgentCommerce.InvalidExpiry.selector, block.timestamp));
        commerce.createJob(agentId, address(0), block.timestamp, "Test");
    }

    function test_CreateJob_RevertAgentNotFound() public {
        vm.prank(bob);
        vm.expectRevert(); // SpawnRegistry.AgentNotFound
        commerce.createJob(999, address(0), block.timestamp + 1 days, "Test");
    }

    // ─── Fund Job ───────────────────────────────────────────

    function test_FundJob() public {
        uint256 jobId = _createJob(bob);
        uint256 amount = 100e18;

        vm.startPrank(bob);
        cusd.approve(address(commerce), amount);
        commerce.fundJob(jobId, amount);
        vm.stopPrank();

        IERC8183.Job memory job = commerce.getJob(jobId);
        assertEq(job.budget, amount);
        assertEq(uint8(job.status), uint8(IERC8183.JobStatus.Funded));
        assertEq(cusd.balanceOf(address(commerce)), amount);
    }

    function test_FundJob_RevertNotClient() public {
        uint256 jobId = _createJob(bob);

        vm.startPrank(charlie);
        cusd.approve(address(commerce), 100e18);
        vm.expectRevert(abi.encodeWithSelector(AgentCommerce.NotJobClient.selector, jobId));
        commerce.fundJob(jobId, 100e18);
        vm.stopPrank();
    }

    function test_FundJob_RevertZeroBudget() public {
        uint256 jobId = _createJob(bob);

        vm.prank(bob);
        vm.expectRevert(AgentCommerce.ZeroBudget.selector);
        commerce.fundJob(jobId, 0);
    }

    function test_FundJob_RevertWrongStatus() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        vm.startPrank(bob);
        cusd.approve(address(commerce), 100e18);
        vm.expectRevert(
            abi.encodeWithSelector(
                AgentCommerce.InvalidJobStatus.selector,
                jobId,
                IERC8183.JobStatus.Funded,
                IERC8183.JobStatus.Open
            )
        );
        commerce.fundJob(jobId, 100e18);
        vm.stopPrank();
    }

    // ─── Submit Job ─────────────────────────────────────────

    function test_SubmitJob_ByProvider() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        bytes32 deliverable = keccak256("ipfs://QmDeliverable");

        vm.prank(agentWallet);
        commerce.submitJob(jobId, deliverable);

        IERC8183.Job memory job = commerce.getJob(jobId);
        assertEq(uint8(job.status), uint8(IERC8183.JobStatus.Submitted));
        assertEq(job.deliverable, deliverable);
    }

    function test_SubmitJob_ByPlatformOwner() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        bytes32 deliverable = keccak256("ipfs://QmDeliverable");

        // Platform owner can relay submissions
        commerce.submitJob(jobId, deliverable);

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Submitted));
    }

    function test_SubmitJob_RevertNotProvider() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(AgentCommerce.NotJobProvider.selector, jobId));
        commerce.submitJob(jobId, keccak256("test"));
    }

    function test_SubmitJob_RevertWrongStatus() public {
        uint256 jobId = _createJob(bob); // Still Open, not Funded

        vm.prank(agentWallet);
        vm.expectRevert(
            abi.encodeWithSelector(
                AgentCommerce.InvalidJobStatus.selector,
                jobId,
                IERC8183.JobStatus.Open,
                IERC8183.JobStatus.Funded
            )
        );
        commerce.submitJob(jobId, keccak256("test"));
    }

    // ─── Complete Job ───────────────────────────────────────

    function test_CompleteJob() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);
        _submitJob(jobId);

        uint256 providerBefore = cusd.balanceOf(agentWallet);
        uint256 treasuryBefore = cusd.balanceOf(treasury);

        vm.prank(bob); // bob is evaluator (default)
        commerce.completeJob(jobId, bytes32(0));

        IERC8183.Job memory job = commerce.getJob(jobId);
        assertEq(uint8(job.status), uint8(IERC8183.JobStatus.Completed));

        // 5% fee = 5 cUSD, payout = 95 cUSD
        assertEq(cusd.balanceOf(agentWallet) - providerBefore, 95e18);
        assertEq(cusd.balanceOf(treasury) - treasuryBefore, 5e18);
    }

    function test_CompleteJob_WithThirdPartyEvaluator() public {
        vm.prank(bob);
        uint256 jobId = commerce.createJob(agentId, charlie, block.timestamp + 1 days, "Test");
        _fundJob(bob, jobId, 100e18);
        _submitJob(jobId);

        vm.prank(charlie);
        commerce.completeJob(jobId, bytes32(0));

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Completed));
    }

    function test_CompleteJob_RevertNotEvaluator() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);
        _submitJob(jobId);

        vm.prank(charlie); // Not the evaluator
        vm.expectRevert(abi.encodeWithSelector(AgentCommerce.NotJobEvaluator.selector, jobId));
        commerce.completeJob(jobId, bytes32(0));
    }

    function test_CompleteJob_RevertWrongStatus() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);
        // Not submitted yet

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                AgentCommerce.InvalidJobStatus.selector,
                jobId,
                IERC8183.JobStatus.Funded,
                IERC8183.JobStatus.Submitted
            )
        );
        commerce.completeJob(jobId, bytes32(0));
    }

    // ─── Reject Job ─────────────────────────────────────────

    function test_RejectJob_OpenByClient() public {
        uint256 jobId = _createJob(bob);

        vm.prank(bob);
        commerce.rejectJob(jobId, bytes32(0));

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Rejected));
    }

    function test_RejectJob_FundedByEvaluator_RefundsClient() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        uint256 bobBefore = cusd.balanceOf(bob);

        vm.prank(bob); // bob is evaluator
        commerce.rejectJob(jobId, keccak256("bad quality"));

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Rejected));
        assertEq(cusd.balanceOf(bob) - bobBefore, 100e18); // Full refund
    }

    function test_RejectJob_SubmittedByEvaluator_RefundsClient() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);
        _submitJob(jobId);

        uint256 bobBefore = cusd.balanceOf(bob);

        vm.prank(bob);
        commerce.rejectJob(jobId, keccak256("rejected"));

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Rejected));
        assertEq(cusd.balanceOf(bob) - bobBefore, 100e18);
    }

    function test_RejectJob_Open_RevertNotClient() public {
        uint256 jobId = _createJob(bob);

        vm.prank(charlie);
        vm.expectRevert(abi.encodeWithSelector(AgentCommerce.NotJobClient.selector, jobId));
        commerce.rejectJob(jobId, bytes32(0));
    }

    function test_RejectJob_Funded_RevertNotEvaluator() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        vm.prank(charlie); // Not evaluator
        vm.expectRevert(abi.encodeWithSelector(AgentCommerce.NotJobEvaluator.selector, jobId));
        commerce.rejectJob(jobId, bytes32(0));
    }

    function test_RejectJob_RevertTerminalStatus() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);
        _submitJob(jobId);

        // Complete it first
        vm.prank(bob);
        commerce.completeJob(jobId, bytes32(0));

        // Try to reject a completed job
        vm.prank(bob);
        vm.expectRevert();
        commerce.rejectJob(jobId, bytes32(0));
    }

    // ─── Claim Refund (Expired) ─────────────────────────────

    function test_ClaimRefund_Funded() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        uint256 bobBefore = cusd.balanceOf(bob);

        // Fast forward past expiry
        vm.warp(block.timestamp + 2 days);

        commerce.claimRefund(jobId);

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Expired));
        assertEq(cusd.balanceOf(bob) - bobBefore, 100e18);
    }

    function test_ClaimRefund_Submitted() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);
        _submitJob(jobId);

        uint256 bobBefore = cusd.balanceOf(bob);

        vm.warp(block.timestamp + 2 days);
        commerce.claimRefund(jobId);

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Expired));
        assertEq(cusd.balanceOf(bob) - bobBefore, 100e18);
    }

    function test_ClaimRefund_RevertNotExpired() public {
        uint256 jobId = _createJob(bob);
        _fundJob(bob, jobId, 100e18);

        vm.expectRevert(abi.encodeWithSelector(AgentCommerce.JobNotExpired.selector, jobId));
        commerce.claimRefund(jobId);
    }

    function test_ClaimRefund_RevertWrongStatus() public {
        uint256 jobId = _createJob(bob); // Open, not funded

        vm.warp(block.timestamp + 2 days);

        vm.expectRevert(
            abi.encodeWithSelector(
                AgentCommerce.InvalidJobStatus.selector,
                jobId,
                IERC8183.JobStatus.Open,
                IERC8183.JobStatus.Funded
            )
        );
        commerce.claimRefund(jobId);
    }

    // ─── Helpers ────────────────────────────────────────────

    function _createJob(address client) internal returns (uint256) {
        vm.prank(client);
        return commerce.createJob(agentId, address(0), block.timestamp + 1 days, "Test job");
    }

    function _fundJob(address client, uint256 jobId, uint256 amount) internal {
        vm.startPrank(client);
        cusd.approve(address(commerce), amount);
        commerce.fundJob(jobId, amount);
        vm.stopPrank();
    }

    function _submitJob(uint256 jobId) internal {
        vm.prank(agentWallet);
        commerce.submitJob(jobId, keccak256("ipfs://deliverable"));
    }
}
