// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, Vm} from "forge-std/Test.sol";
import {SpawnRegistry} from "../src/SpawnRegistry.sol";
import {IERC8004} from "../src/interfaces/IERC8004.sol";
import {EarthPool} from "../src/EarthPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCUSD is ERC20 {
    constructor() ERC20("Celo Dollar", "cUSD") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract SpawnRegistryTest is Test {
    SpawnRegistry public registry;
    EarthPool public earthPool;
    MockCUSD public cusd;

    address public owner;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public treasury = makeAddr("treasury");
    address public agentWallet1 = makeAddr("agentWallet1");
    address public agentWallet2 = makeAddr("agentWallet2");

    function setUp() public {
        owner = address(this);
        cusd = new MockCUSD();
        earthPool = new EarthPool(address(cusd));
        registry = new SpawnRegistry(address(cusd), address(earthPool), treasury);

        // Fund users
        cusd.mint(alice, 10_000e18);
        cusd.mint(bob, 10_000e18);
    }

    // ─── Constructor ────────────────────────────────────────

    function test_Constructor() public view {
        assertEq(address(registry.paymentToken()), address(cusd));
        assertEq(registry.earthPool(), address(earthPool));
        assertEq(registry.treasury(), treasury);
        assertEq(registry.totalAgents(), 0);
    }

    function test_Constructor_RevertZeroPaymentToken() public {
        vm.expectRevert(SpawnRegistry.ZeroAddress.selector);
        new SpawnRegistry(address(0), address(earthPool), treasury);
    }

    function test_Constructor_RevertZeroEarthPool() public {
        vm.expectRevert(SpawnRegistry.ZeroAddress.selector);
        new SpawnRegistry(address(cusd), address(0), treasury);
    }

    function test_Constructor_RevertZeroTreasury() public {
        vm.expectRevert(SpawnRegistry.ZeroAddress.selector);
        new SpawnRegistry(address(cusd), address(earthPool), address(0));
    }

    // ─── Register Agent ─────────────────────────────────────

    function test_RegisterAgent() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("TestAgent", 0, 1e18, agentWallet1, "ipfs://metadata");

        assertEq(agentId, 1);
        assertEq(registry.ownerOf(agentId), alice);
        assertEq(registry.totalAgents(), 1);
        assertEq(registry.walletToAgent(agentWallet1), agentId);

        SpawnRegistry.AgentData memory agent = registry.getAgent(agentId);
        assertEq(agent.agentWallet, agentWallet1);
        assertEq(agent.templateId, 0);
        assertEq(agent.pricePerCall, 1e18);
        assertFalse(agent.isVerified);
        assertFalse(agent.isPremium);
        assertEq(agent.totalCalls, 0);
        assertEq(agent.totalRevenue, 0);
        assertEq(agent.createdAt, block.timestamp);
    }

    function test_RegisterAgent_EmitsEvent() public {
        vm.prank(alice);

        vm.expectEmit(true, true, false, true);
        emit IERC8004.AgentRegistered(1, alice, agentWallet1, 0, 1e18, "ipfs://metadata");
        registry.registerAgent("TestAgent", 0, 1e18, agentWallet1, "ipfs://metadata");
    }

    function test_RegisterAgent_MultipleAgents() public {
        vm.prank(alice);
        uint256 id1 = registry.registerAgent("Agent1", 0, 1e18, agentWallet1, "ipfs://1");

        vm.prank(bob);
        uint256 id2 = registry.registerAgent("Agent2", 5, 2e18, agentWallet2, "ipfs://2");

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(registry.totalAgents(), 2);
    }

    function test_RegisterAgent_RevertInvalidTemplate() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SpawnRegistry.InvalidTemplate.selector, 10));
        registry.registerAgent("Test", 10, 1e18, agentWallet1, "ipfs://test");
    }

    function test_RegisterAgent_RevertZeroWallet() public {
        vm.prank(alice);
        vm.expectRevert(SpawnRegistry.ZeroAddress.selector);
        registry.registerAgent("Test", 0, 1e18, address(0), "ipfs://test");
    }

    function test_RegisterAgent_RevertDuplicateWallet() public {
        vm.prank(alice);
        registry.registerAgent("Agent1", 0, 1e18, agentWallet1, "ipfs://1");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(SpawnRegistry.WalletAlreadyRegistered.selector, agentWallet1));
        registry.registerAgent("Agent2", 0, 1e18, agentWallet1, "ipfs://2");
    }

    // ─── Subscribe Premium ──────────────────────────────────

    function test_SubscribePremium() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        vm.startPrank(alice);
        cusd.approve(address(registry), 20e18);
        registry.subscribePremium(agentId);
        vm.stopPrank();

        SpawnRegistry.AgentData memory agent = registry.getAgent(agentId);
        assertTrue(agent.isPremium);
        assertEq(agent.premiumExpiry, block.timestamp + 30 days);
    }

    function test_SubscribePremium_PaymentSplit() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        uint256 treasuryBefore = cusd.balanceOf(treasury);
        uint256 earthPoolBefore = earthPool.currentBalance();

        vm.startPrank(alice);
        cusd.approve(address(registry), 20e18);
        registry.subscribePremium(agentId);
        vm.stopPrank();

        // 85% = 17 cUSD to treasury, 15% = 3 cUSD to EarthPool
        assertEq(cusd.balanceOf(treasury) - treasuryBefore, 17e18);
        assertEq(earthPool.currentBalance() - earthPoolBefore, 3e18);
    }

    function test_SubscribePremium_RevertNotOwner() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        vm.startPrank(bob);
        cusd.approve(address(registry), 20e18);
        vm.expectRevert(abi.encodeWithSelector(SpawnRegistry.NotAgentOwner.selector, agentId, bob));
        registry.subscribePremium(agentId);
        vm.stopPrank();
    }

    function test_SubscribePremium_RevertAgentNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(SpawnRegistry.AgentNotFound.selector, 999));
        registry.subscribePremium(999);
    }

    // ─── Renew Premium ──────────────────────────────────────

    function test_RenewPremium() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        _subscribePremium(alice, agentId);

        uint256 firstExpiry = registry.getAgent(agentId).premiumExpiry;

        vm.startPrank(alice);
        cusd.approve(address(registry), 20e18);
        registry.renewPremium(agentId);
        vm.stopPrank();

        // Should extend from current expiry, not from now
        assertEq(registry.getAgent(agentId).premiumExpiry, firstExpiry + 30 days);
    }

    function test_RenewPremium_AfterExpiry() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        _subscribePremium(alice, agentId);

        // Fast forward past expiry
        vm.warp(block.timestamp + 31 days);

        vm.startPrank(alice);
        cusd.approve(address(registry), 20e18);
        registry.renewPremium(agentId);
        vm.stopPrank();

        // Should extend from now since expired
        assertEq(registry.getAgent(agentId).premiumExpiry, block.timestamp + 30 days);
    }

    function test_RenewPremium_RevertNotPremium() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SpawnRegistry.PremiumNotActive.selector, agentId));
        registry.renewPremium(agentId);
    }

    // ─── Verification ───────────────────────────────────────

    function test_SetVerified() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        registry.setVerified(agentId, true);
        assertTrue(registry.getAgent(agentId).isVerified);

        registry.setVerified(agentId, false);
        assertFalse(registry.getAgent(agentId).isVerified);
    }

    function test_SetVerified_EmitsEvent() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        vm.expectEmit(true, false, false, true);
        emit SpawnRegistry.AgentVerified(agentId, true);
        registry.setVerified(agentId, true);
    }

    function test_SetVerified_RevertNotOwner() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        vm.prank(alice);
        vm.expectRevert();
        registry.setVerified(agentId, true);
    }

    // ─── Call Recording & Rate Limiting ─────────────────────

    function test_RecordCall() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        registry.recordCall(agentId, 1e18);
        registry.recordCall(agentId, 2e18);

        SpawnRegistry.AgentData memory agent = registry.getAgent(agentId);
        assertEq(agent.totalCalls, 2);
        assertEq(agent.totalRevenue, 3e18);
    }

    function test_RecordCall_RevertNotOwner() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        vm.prank(alice);
        vm.expectRevert();
        registry.recordCall(agentId, 1e18);
    }

    function test_CanAcceptCall_FreeUnverified() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        // Should accept up to 10 calls
        for (uint256 i = 0; i < 10; i++) {
            assertTrue(registry.canAcceptCall(agentId));
            registry.recordCall(agentId, 0);
        }
        // 11th call should be rejected
        assertFalse(registry.canAcceptCall(agentId));
    }

    function test_CanAcceptCall_FreeVerified() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        registry.setVerified(agentId, true);

        // Should accept up to 30 calls
        for (uint256 i = 0; i < 30; i++) {
            assertTrue(registry.canAcceptCall(agentId));
            registry.recordCall(agentId, 0);
        }
        assertFalse(registry.canAcceptCall(agentId));
    }

    function test_CanAcceptCall_Premium() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        _subscribePremium(alice, agentId);

        // Premium should always return true
        for (uint256 i = 0; i < 50; i++) {
            assertTrue(registry.canAcceptCall(agentId));
            registry.recordCall(agentId, 0);
        }
    }

    function test_GetDailyLimit() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);

        assertEq(registry.getDailyLimit(agentId), 10); // Unverified free

        registry.setVerified(agentId, true);
        assertEq(registry.getDailyLimit(agentId), 30); // Verified free

        _subscribePremium(alice, agentId);
        assertEq(registry.getDailyLimit(agentId), 200); // Premium
    }

    // ─── Badge System ───────────────────────────────────────

    function test_GetBadge_Grey() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        assertEq(registry.getBadge(agentId), 0); // Grey
    }

    function test_GetBadge_Blue() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        registry.setVerified(agentId, true);
        assertEq(registry.getBadge(agentId), 1); // Blue
    }

    function test_GetBadge_Gold() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        _subscribePremium(alice, agentId);
        assertEq(registry.getBadge(agentId), 2); // Gold
    }

    function test_GetBadge_Green() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        registry.setVerified(agentId, true);
        _subscribePremium(alice, agentId);
        assertEq(registry.getBadge(agentId), 3); // Green
    }

    function test_GetBadge_GoldExpiresToGrey() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        _subscribePremium(alice, agentId);
        assertEq(registry.getBadge(agentId), 2); // Gold

        vm.warp(block.timestamp + 31 days);
        assertEq(registry.getBadge(agentId), 0); // Grey after expiry
    }

    function test_GetBadge_GreenExpiresToBlue() public {
        uint256 agentId = _registerAgent(alice, agentWallet1);
        registry.setVerified(agentId, true);
        _subscribePremium(alice, agentId);
        assertEq(registry.getBadge(agentId), 3); // Green

        vm.warp(block.timestamp + 31 days);
        assertEq(registry.getBadge(agentId), 1); // Blue after premium expiry
    }

    // ─── Token URI ──────────────────────────────────────────

    function test_TokenURI() public {
        vm.prank(alice);
        uint256 agentId = registry.registerAgent("Test", 0, 1e18, agentWallet1, "ipfs://metadata123");

        assertEq(registry.tokenURI(agentId), "ipfs://metadata123");
    }

    // ─── Helpers ────────────────────────────────────────────

    function _registerAgent(address user, address wallet) internal returns (uint256) {
        vm.prank(user);
        return registry.registerAgent("TestAgent", 0, 1e18, wallet, "ipfs://test");
    }

    function _subscribePremium(address user, uint256 agentId) internal {
        vm.startPrank(user);
        cusd.approve(address(registry), 20e18);
        registry.subscribePremium(agentId);
        vm.stopPrank();
    }
}
