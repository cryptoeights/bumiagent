// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IEarthPool - ReFi Revenue Pool
/// @notice Interface for the environmental impact fund collector
interface IEarthPool {
    struct Campaign {
        uint256 id;
        uint256 amount;
        string description;
        string proofURI;
        uint256 executedAt;
    }

    event FundsReceived(uint256 amount, uint256 newBalance);
    event CampaignReady(uint256 balance);
    event CampaignExecuted(uint256 indexed campaignId, uint256 amount, string description);
    event CampaignProofAdded(uint256 indexed campaignId, string proofURI);

    function deposit(uint256 amount) external;
    function executeCampaign(uint256 amount, string calldata description) external;
    function addCampaignProof(uint256 campaignId, string calldata proofURI) external;
    function withdraw(address to, uint256 amount) external;
}
