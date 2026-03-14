// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EarthPool} from "../src/EarthPool.sol";
import {SpawnRegistry} from "../src/SpawnRegistry.sol";
import {AgentCommerce} from "../src/AgentCommerce.sol";
import {IERC8183} from "../src/interfaces/IERC8183.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCUSD is ERC20 {
    constructor() ERC20("Celo Dollar", "cUSD") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/// @notice End-to-end integration test: register → subscribe → create job → fund → submit → complete
contract IntegrationTest is Test {
    EarthPool public earthPool;
    SpawnRegistry public registry;
    AgentCommerce public commerce;
    MockCUSD public cusd;

    address public platformOwner;
    address public agentCreator = makeAddr("agentCreator");
    address public jobClient = makeAddr("jobClient");
    address public treasury = makeAddr("treasury");
    address public agentWallet = makeAddr("agentWallet");

    function setUp() public {
        platformOwner = address(this);
        cusd = new MockCUSD();

        // Deploy in order: EarthPool → SpawnRegistry → AgentCommerce
        earthPool = new EarthPool(address(cusd));
        registry = new SpawnRegistry(address(cusd), address(earthPool), treasury);
        commerce = new AgentCommerce(address(cusd), address(registry), treasury);

        // Fund users
        cusd.mint(agentCreator, 10_000e18);
        cusd.mint(jobClient, 10_000e18);
    }

    function test_FullLifecycle() public {
        // ── Step 1: Register Agent ──────────────────────────
        vm.prank(agentCreator);
        uint256 agentId = registry.registerAgent(
            "CeloHelper",
            1, // template: Payment Agent
            1e18, // 1 cUSD per call
            agentWallet,
            "ipfs://QmAgentMetadata"
        );

        assertEq(agentId, 1);
        assertEq(registry.ownerOf(agentId), agentCreator);
        assertEq(registry.getBadge(agentId), 0); // Grey badge

        // ── Step 2: Subscribe Premium ───────────────────────
        uint256 treasuryBefore = cusd.balanceOf(treasury);

        vm.startPrank(agentCreator);
        cusd.approve(address(registry), 20e18);
        registry.subscribePremium(agentId);
        vm.stopPrank();

        assertEq(registry.getBadge(agentId), 2); // Gold badge
        assertEq(cusd.balanceOf(treasury) - treasuryBefore, 17e18); // 85%
        assertEq(earthPool.currentBalance(), 3e18); // 15%

        // ── Step 3: Verify Agent ────────────────────────────
        registry.setVerified(agentId, true);
        assertEq(registry.getBadge(agentId), 3); // Green badge (premium + verified)

        // ── Step 4: Record Calls ────────────────────────────
        registry.recordCall(agentId, 1e18);
        registry.recordCall(agentId, 1e18);
        assertEq(registry.getAgent(agentId).totalCalls, 2);
        assertEq(registry.getAgent(agentId).totalRevenue, 2e18);
        assertTrue(registry.canAcceptCall(agentId));

        // ── Step 5: Create Job ──────────────────────────────
        vm.prank(jobClient);
        uint256 jobId = commerce.createJob(
            agentId,
            address(0), // client is evaluator
            block.timestamp + 7 days,
            "Analyze DeFi yield opportunities on Celo"
        );

        assertEq(jobId, 1);
        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Open));

        // ── Step 6: Fund Job ────────────────────────────────
        vm.startPrank(jobClient);
        cusd.approve(address(commerce), 50e18);
        commerce.fundJob(jobId, 50e18);
        vm.stopPrank();

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Funded));
        assertEq(cusd.balanceOf(address(commerce)), 50e18);

        // ── Step 7: Submit Deliverable ──────────────────────
        bytes32 deliverable = keccak256("ipfs://QmDeFiAnalysisReport");

        vm.prank(agentWallet);
        commerce.submitJob(jobId, deliverable);

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Submitted));

        // ── Step 8: Complete Job ────────────────────────────
        uint256 agentWalletBefore = cusd.balanceOf(agentWallet);
        treasuryBefore = cusd.balanceOf(treasury);

        vm.prank(jobClient); // Client is evaluator
        commerce.completeJob(jobId, bytes32(0));

        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Completed));

        // 5% fee = 2.5 cUSD, payout = 47.5 cUSD
        assertEq(cusd.balanceOf(agentWallet) - agentWalletBefore, 47.5e18);
        assertEq(cusd.balanceOf(treasury) - treasuryBefore, 2.5e18);

        // ── Step 9: Verify Agent Jobs Tracking ──────────────
        uint256[] memory agentJobIds = commerce.getAgentJobs(agentId);
        assertEq(agentJobIds.length, 1);
        assertEq(agentJobIds[0], jobId);
    }

    function test_JobRejectionAndRefund() public {
        // Register agent
        vm.prank(agentCreator);
        uint256 agentId = registry.registerAgent("Agent", 0, 1e18, agentWallet, "ipfs://test");

        // Create and fund job
        vm.prank(jobClient);
        uint256 jobId = commerce.createJob(agentId, address(0), block.timestamp + 1 days, "Task");

        vm.startPrank(jobClient);
        cusd.approve(address(commerce), 100e18);
        commerce.fundJob(jobId, 100e18);
        vm.stopPrank();

        uint256 clientBefore = cusd.balanceOf(jobClient);

        // Reject → full refund
        vm.prank(jobClient);
        commerce.rejectJob(jobId, keccak256("changed mind"));

        assertEq(cusd.balanceOf(jobClient) - clientBefore, 100e18);
        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Rejected));
    }

    function test_JobExpiryRefund() public {
        vm.prank(agentCreator);
        uint256 agentId = registry.registerAgent("Agent", 0, 1e18, agentWallet, "ipfs://test");

        vm.prank(jobClient);
        uint256 jobId = commerce.createJob(agentId, address(0), block.timestamp + 1 days, "Task");

        vm.startPrank(jobClient);
        cusd.approve(address(commerce), 100e18);
        commerce.fundJob(jobId, 100e18);
        vm.stopPrank();

        // Fast forward past expiry
        vm.warp(block.timestamp + 2 days);

        uint256 clientBefore = cusd.balanceOf(jobClient);
        commerce.claimRefund(jobId);

        assertEq(cusd.balanceOf(jobClient) - clientBefore, 100e18);
        assertEq(uint8(commerce.getJob(jobId).status), uint8(IERC8183.JobStatus.Expired));
    }

    function test_EarthPoolCampaignThreshold() public {
        // Subscribe 167 agents to reach ~$500 in EarthPool (167 × $3 = $501)
        // Simplified: deposit directly
        cusd.mint(address(this), 600e18);
        cusd.approve(address(earthPool), 500e18);
        earthPool.deposit(500e18);

        assertEq(earthPool.currentBalance(), 500e18);

        // Execute campaign
        earthPool.executeCampaign(400e18, "Plant 100 trees in Sumatra");
        assertEq(earthPool.totalCampaigns(), 1);
        assertEq(earthPool.currentBalance(), 100e18);

        // Add proof
        earthPool.addCampaignProof(0, "ipfs://QmTreePlantingProof");

        EarthPool.Campaign memory campaign = earthPool.getCampaign(0);
        assertEq(campaign.amount, 400e18);
    }
}
