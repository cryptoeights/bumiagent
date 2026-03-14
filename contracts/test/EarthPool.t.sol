// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2, Vm} from "forge-std/Test.sol";
import {EarthPool} from "../src/EarthPool.sol";
import {IEarthPool} from "../src/interfaces/IEarthPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Mock cUSD token for testing
contract MockCUSD is ERC20 {
    constructor() ERC20("Celo Dollar", "cUSD") {
        _mint(msg.sender, 1_000_000e18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract EarthPoolTest is Test {
    EarthPool public pool;
    MockCUSD public cusd;

    address public owner = address(this);
    address public depositor = makeAddr("depositor");
    address public recipient = makeAddr("recipient");

    function setUp() public {
        cusd = new MockCUSD();
        pool = new EarthPool(address(cusd));

        // Fund depositor
        cusd.mint(depositor, 10_000e18);
    }

    // ─── Constructor ────────────────────────────────────────

    function test_Constructor() public view {
        assertEq(address(pool.paymentToken()), address(cusd));
        assertEq(pool.totalReceived(), 0);
        assertEq(pool.totalCampaigns(), 0);
        assertEq(pool.currentBalance(), 0);
        assertEq(pool.CAMPAIGN_THRESHOLD(), 500e18);
    }

    function test_Constructor_RevertZeroAddress() public {
        vm.expectRevert(EarthPool.ZeroAddress.selector);
        new EarthPool(address(0));
    }

    // ─── Deposit ────────────────────────────────────────────

    function test_Deposit() public {
        uint256 amount = 100e18;

        vm.startPrank(depositor);
        cusd.approve(address(pool), amount);
        pool.deposit(amount);
        vm.stopPrank();

        assertEq(pool.totalReceived(), amount);
        assertEq(pool.currentBalance(), amount);
        assertEq(cusd.balanceOf(address(pool)), amount);
    }

    function test_Deposit_EmitsFundsReceived() public {
        uint256 amount = 100e18;

        vm.startPrank(depositor);
        cusd.approve(address(pool), amount);

        vm.expectEmit(false, false, false, true);
        emit IEarthPool.FundsReceived(amount, amount);
        pool.deposit(amount);
        vm.stopPrank();
    }

    function test_Deposit_EmitsCampaignReadyAtThreshold() public {
        uint256 amount = 500e18;

        vm.startPrank(depositor);
        cusd.approve(address(pool), amount);

        vm.expectEmit(false, false, false, true);
        emit IEarthPool.CampaignReady(amount);
        pool.deposit(amount);
        vm.stopPrank();
    }

    function test_Deposit_NoCampaignReadyBelowThreshold() public {
        uint256 amount = 499e18;

        vm.startPrank(depositor);
        cusd.approve(address(pool), amount);

        // Record logs — CampaignReady should NOT be emitted
        vm.recordLogs();
        pool.deposit(amount);
        vm.stopPrank();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        // Should only have FundsReceived, not CampaignReady
        for (uint256 i = 0; i < logs.length; i++) {
            assertTrue(
                logs[i].topics[0] != keccak256("CampaignReady(uint256)"),
                "CampaignReady should not be emitted below threshold"
            );
        }
    }

    function test_Deposit_CumulativeReachesThreshold() public {
        vm.startPrank(depositor);

        // First deposit: 300
        cusd.approve(address(pool), 600e18);
        pool.deposit(300e18);

        // Second deposit: 200 → total 500 → should emit CampaignReady
        vm.expectEmit(false, false, false, true);
        emit IEarthPool.CampaignReady(500e18);
        pool.deposit(200e18);

        vm.stopPrank();

        assertEq(pool.currentBalance(), 500e18);
        assertEq(pool.totalReceived(), 500e18);
    }

    function test_Deposit_RevertZeroAmount() public {
        vm.expectRevert(EarthPool.ZeroAmount.selector);
        pool.deposit(0);
    }

    // ─── Execute Campaign ───────────────────────────────────

    function test_ExecuteCampaign() public {
        // Deposit first
        _depositAs(depositor, 500e18);

        pool.executeCampaign(400e18, "Plant 100 trees in Borneo");

        assertEq(pool.totalCampaigns(), 1);
        assertEq(pool.currentBalance(), 100e18);

        EarthPool.Campaign memory c = pool.getCampaign(0);
        assertEq(c.id, 0);
        assertEq(c.amount, 400e18);
        assertEq(keccak256(bytes(c.description)), keccak256("Plant 100 trees in Borneo"));
        assertEq(c.executedAt, block.timestamp);
        assertEq(bytes(c.proofURI).length, 0);
    }

    function test_ExecuteCampaign_RevertNotOwner() public {
        _depositAs(depositor, 500e18);

        vm.prank(depositor);
        vm.expectRevert();
        pool.executeCampaign(400e18, "Trees");
    }

    function test_ExecuteCampaign_RevertInsufficientBalance() public {
        _depositAs(depositor, 100e18);

        vm.expectRevert(abi.encodeWithSelector(EarthPool.InsufficientBalance.selector, 200e18, 100e18));
        pool.executeCampaign(200e18, "Trees");
    }

    function test_ExecuteCampaign_RevertZeroAmount() public {
        vm.expectRevert(EarthPool.ZeroAmount.selector);
        pool.executeCampaign(0, "Trees");
    }

    // ─── Campaign Proof ─────────────────────────────────────

    function test_AddCampaignProof() public {
        _depositAs(depositor, 500e18);
        pool.executeCampaign(400e18, "Trees");

        string memory proofURI = "ipfs://QmProofHash123";
        pool.addCampaignProof(0, proofURI);

        EarthPool.Campaign memory c = pool.getCampaign(0);
        assertEq(keccak256(bytes(c.proofURI)), keccak256(bytes(proofURI)));
    }

    function test_AddCampaignProof_RevertNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(EarthPool.CampaignNotFound.selector, 0));
        pool.addCampaignProof(0, "ipfs://test");
    }

    function test_AddCampaignProof_RevertNotOwner() public {
        _depositAs(depositor, 500e18);
        pool.executeCampaign(400e18, "Trees");

        vm.prank(depositor);
        vm.expectRevert();
        pool.addCampaignProof(0, "ipfs://test");
    }

    // ─── Withdraw ───────────────────────────────────────────

    function test_Withdraw() public {
        _depositAs(depositor, 500e18);

        uint256 balBefore = cusd.balanceOf(recipient);
        pool.withdraw(recipient, 200e18);

        assertEq(cusd.balanceOf(recipient), balBefore + 200e18);
        assertEq(pool.currentBalance(), 300e18);
    }

    function test_Withdraw_RevertZeroAddress() public {
        _depositAs(depositor, 100e18);

        vm.expectRevert(EarthPool.ZeroAddress.selector);
        pool.withdraw(address(0), 50e18);
    }

    function test_Withdraw_RevertZeroAmount() public {
        vm.expectRevert(EarthPool.ZeroAmount.selector);
        pool.withdraw(recipient, 0);
    }

    function test_Withdraw_RevertInsufficientBalance() public {
        _depositAs(depositor, 100e18);

        vm.expectRevert(abi.encodeWithSelector(EarthPool.InsufficientBalance.selector, 200e18, 100e18));
        pool.withdraw(recipient, 200e18);
    }

    // ─── Helpers ────────────────────────────────────────────

    function _depositAs(address user, uint256 amount) internal {
        vm.startPrank(user);
        cusd.approve(address(pool), amount);
        pool.deposit(amount);
        vm.stopPrank();
    }
}
