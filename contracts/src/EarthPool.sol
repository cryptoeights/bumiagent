// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IEarthPool} from "./interfaces/IEarthPool.sol";

/// @title EarthPool - ReFi Revenue Pool for CeloSpawn
/// @notice Collects 15% of premium subscription payments. At $500 threshold, emits CampaignReady.
contract EarthPool is IEarthPool, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken; // cUSD
    uint256 public constant CAMPAIGN_THRESHOLD = 500e18; // $500 in cUSD

    uint256 public totalReceived;
    uint256 public totalCampaigns;
    uint256 public currentBalance;

    mapping(uint256 => Campaign) public campaigns;

    error ZeroAmount();
    error InsufficientBalance(uint256 requested, uint256 available);
    error CampaignNotFound(uint256 campaignId);
    error ZeroAddress();

    constructor(address _paymentToken) Ownable(msg.sender) {
        if (_paymentToken == address(0)) revert ZeroAddress();
        paymentToken = IERC20(_paymentToken);
    }

    /// @inheritdoc IEarthPool
    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        totalReceived += amount;
        currentBalance += amount;

        emit FundsReceived(amount, currentBalance);

        if (currentBalance >= CAMPAIGN_THRESHOLD) {
            emit CampaignReady(currentBalance);
        }
    }

    /// @inheritdoc IEarthPool
    function executeCampaign(uint256 amount, string calldata description) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (amount > currentBalance) revert InsufficientBalance(amount, currentBalance);

        currentBalance -= amount;

        uint256 campaignId = totalCampaigns;
        totalCampaigns++;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            amount: amount,
            description: description,
            proofURI: "",
            executedAt: block.timestamp
        });

        emit CampaignExecuted(campaignId, amount, description);
    }

    /// @inheritdoc IEarthPool
    function addCampaignProof(uint256 campaignId, string calldata proofURI) external onlyOwner {
        if (campaignId >= totalCampaigns) revert CampaignNotFound(campaignId);

        campaigns[campaignId].proofURI = proofURI;

        emit CampaignProofAdded(campaignId, proofURI);
    }

    /// @inheritdoc IEarthPool
    function withdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > currentBalance) revert InsufficientBalance(amount, currentBalance);

        currentBalance -= amount;
        paymentToken.safeTransfer(to, amount);
    }

    /// @notice Get campaign details
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        if (campaignId >= totalCampaigns) revert CampaignNotFound(campaignId);
        return campaigns[campaignId];
    }
}
