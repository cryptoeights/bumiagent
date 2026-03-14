// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC8004 - Trustless Agent Identity (simplified for CeloSpawn)
/// @notice Defines the interface for on-chain agent identity registration
interface IERC8004 {
    /// @notice Emitted when a new agent is registered
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        address agentWallet,
        uint8 templateId,
        uint256 pricePerCall,
        string agentURI
    );

    /// @notice Register a new agent with on-chain identity
    /// @param name Agent display name
    /// @param templateId Template index (0-9)
    /// @param pricePerCall Price per x402 call in cUSD wei
    /// @param agentWallet Pre-generated wallet address for the agent
    /// @param agentURI URI pointing to agent metadata JSON
    /// @return agentId The minted NFT tokenId
    function registerAgent(
        string calldata name,
        uint8 templateId,
        uint256 pricePerCall,
        address agentWallet,
        string calldata agentURI
    ) external returns (uint256 agentId);

    /// @notice Get badge type for an agent
    /// @return badge 0=grey, 1=blue, 2=gold, 3=green
    function getBadge(uint256 agentId) external view returns (uint8 badge);
}
