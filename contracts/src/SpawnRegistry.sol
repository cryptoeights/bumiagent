// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC8004} from "./interfaces/IERC8004.sol";
import {IEarthPool} from "./interfaces/IEarthPool.sol";

/// @title SpawnRegistry - CeloSpawn Agent Registry
/// @notice Registers AI agents as ERC-721 NFTs with ERC-8004 identity, manages subscriptions and badges
contract SpawnRegistry is IERC8004, ERC721URIStorage, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ──────────────────────────────────────────────

    uint256 private _nextAgentId = 1; // Start at 1, 0 is sentinel

    IERC20 public immutable paymentToken; // cUSD
    address public earthPool;
    address public treasury;

    uint256 public constant PREMIUM_PRICE = 20e18; // $20/month
    uint256 public constant EARTHPOOL_BPS = 1500;  // 15% basis points
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant PREMIUM_DURATION = 30 days;

    struct AgentData {
        address agentWallet;
        uint8 templateId;
        uint256 pricePerCall;
        bool isVerified;
        bool isPremium;
        uint256 premiumExpiry;
        uint256 totalCalls;
        uint256 totalRevenue;
        uint256 createdAt;
    }

    mapping(uint256 => AgentData) public agents;
    mapping(address => uint256) public walletToAgent;
    // agentId => day (timestamp / 86400) => call count
    mapping(uint256 => mapping(uint256 => uint256)) public dailyCalls;

    // ─── Errors ─────────────────────────────────────────────

    error InvalidTemplate(uint8 templateId);
    error ZeroAddress();
    error WalletAlreadyRegistered(address wallet);
    error AgentNotFound(uint256 agentId);
    error NotAgentOwner(uint256 agentId, address caller);
    error PremiumNotActive(uint256 agentId);

    // ─── Events ─────────────────────────────────────────────

    event PremiumSubscribed(uint256 indexed agentId, uint256 expiry);
    event PremiumRenewed(uint256 indexed agentId, uint256 newExpiry);
    event AgentVerified(uint256 indexed agentId, bool status);
    event CallRecorded(uint256 indexed agentId, uint256 revenue);

    // ─── Constructor ────────────────────────────────────────

    constructor(
        address _paymentToken,
        address _earthPool,
        address _treasury
    ) ERC721("CeloSpawn Agent", "CSPAWN") Ownable(msg.sender) {
        if (_paymentToken == address(0)) revert ZeroAddress();
        if (_earthPool == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        paymentToken = IERC20(_paymentToken);
        earthPool = _earthPool;
        treasury = _treasury;
    }

    // ─── Agent Registration ─────────────────────────────────

    /// @inheritdoc IERC8004
    function registerAgent(
        string calldata name,
        uint8 templateId,
        uint256 pricePerCall,
        address agentWallet,
        string calldata agentURI
    ) external returns (uint256 agentId) {
        if (templateId > 9) revert InvalidTemplate(templateId);
        if (agentWallet == address(0)) revert ZeroAddress();
        if (walletToAgent[agentWallet] != 0) revert WalletAlreadyRegistered(agentWallet);

        agentId = _nextAgentId++;

        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);

        agents[agentId] = AgentData({
            agentWallet: agentWallet,
            templateId: templateId,
            pricePerCall: pricePerCall,
            isVerified: false,
            isPremium: false,
            premiumExpiry: 0,
            totalCalls: 0,
            totalRevenue: 0,
            createdAt: block.timestamp
        });

        walletToAgent[agentWallet] = agentId;

        emit AgentRegistered(agentId, msg.sender, agentWallet, templateId, pricePerCall, agentURI);
    }

    // ─── Subscriptions ──────────────────────────────────────

    /// @notice Subscribe agent to premium ($20 cUSD/month)
    function subscribePremium(uint256 agentId) external nonReentrant {
        _requireAgentExists(agentId);
        _requireAgentOwner(agentId);

        _processPremiumPayment();

        agents[agentId].isPremium = true;
        agents[agentId].premiumExpiry = block.timestamp + PREMIUM_DURATION;

        emit PremiumSubscribed(agentId, agents[agentId].premiumExpiry);
    }

    /// @notice Renew premium subscription — extends from current expiry
    function renewPremium(uint256 agentId) external nonReentrant {
        _requireAgentExists(agentId);
        _requireAgentOwner(agentId);

        AgentData storage agent = agents[agentId];
        if (!agent.isPremium) revert PremiumNotActive(agentId);

        _processPremiumPayment();

        // Extend from current expiry (or from now if already expired)
        uint256 base = agent.premiumExpiry > block.timestamp ? agent.premiumExpiry : block.timestamp;
        agent.premiumExpiry = base + PREMIUM_DURATION;

        emit PremiumRenewed(agentId, agent.premiumExpiry);
    }

    function _processPremiumPayment() internal {
        uint256 earthPoolShare = (PREMIUM_PRICE * EARTHPOOL_BPS) / BPS_DENOMINATOR; // 15% = 3 cUSD
        uint256 treasuryShare = PREMIUM_PRICE - earthPoolShare; // 85% = 17 cUSD

        // Transfer to treasury
        paymentToken.safeTransferFrom(msg.sender, treasury, treasuryShare);

        // Transfer to EarthPool via deposit
        paymentToken.safeTransferFrom(msg.sender, address(this), earthPoolShare);
        paymentToken.approve(earthPool, earthPoolShare);
        IEarthPool(earthPool).deposit(earthPoolShare);
    }

    // ─── Verification ───────────────────────────────────────

    /// @notice Mark agent as Self-verified (platform backend only)
    function setVerified(uint256 agentId, bool status) external onlyOwner {
        _requireAgentExists(agentId);
        agents[agentId].isVerified = status;
        emit AgentVerified(agentId, status);
    }

    // ─── Call Recording & Rate Limiting ─────────────────────

    /// @notice Record a call to an agent (platform backend only)
    function recordCall(uint256 agentId, uint256 revenue) external onlyOwner {
        _requireAgentExists(agentId);

        agents[agentId].totalCalls++;
        agents[agentId].totalRevenue += revenue;

        uint256 today = block.timestamp / 86400;
        dailyCalls[agentId][today]++;

        emit CallRecorded(agentId, revenue);
    }

    /// @notice Check if an agent can accept calls (rate limit check)
    function canAcceptCall(uint256 agentId) external view returns (bool) {
        _requireAgentExists(agentId);

        AgentData storage agent = agents[agentId];

        // Premium agents: 200 calls/month (approx 7/day)
        if (agent.isPremium && agent.premiumExpiry > block.timestamp) {
            return true; // Premium has high limit, skip daily check for simplicity
        }

        uint256 today = block.timestamp / 86400;
        uint256 todayCalls = dailyCalls[agentId][today];
        uint256 limit = getDailyLimit(agentId);

        return todayCalls < limit;
    }

    /// @notice Get agent's daily call limit
    function getDailyLimit(uint256 agentId) public view returns (uint256) {
        AgentData storage agent = agents[agentId];

        if (agent.isPremium && agent.premiumExpiry > block.timestamp) {
            return 200; // Premium: effectively unlimited daily
        }
        if (agent.isVerified) {
            return 30; // Verified free tier
        }
        return 10; // Unverified free tier
    }

    // ─── Badge System ───────────────────────────────────────

    /// @inheritdoc IERC8004
    function getBadge(uint256 agentId) external view returns (uint8) {
        _requireAgentExists(agentId);

        AgentData storage agent = agents[agentId];
        bool premium = agent.isPremium && agent.premiumExpiry > block.timestamp;

        if (premium && agent.isVerified) return 3; // Green: verified + premium
        if (premium) return 2;                      // Gold: premium only
        if (agent.isVerified) return 1;              // Blue: verified only
        return 0;                                    // Grey: default
    }

    // ─── View Functions ─────────────────────────────────────

    /// @notice Get full agent data
    function getAgent(uint256 agentId) external view returns (AgentData memory) {
        _requireAgentExists(agentId);
        return agents[agentId];
    }

    /// @notice Get total number of registered agents
    function totalAgents() external view returns (uint256) {
        return _nextAgentId - 1;
    }

    // ─── Internal ───────────────────────────────────────────

    function _requireAgentExists(uint256 agentId) internal view {
        if (agentId == 0 || agentId >= _nextAgentId) revert AgentNotFound(agentId);
    }

    function _requireAgentOwner(uint256 agentId) internal view {
        if (ownerOf(agentId) != msg.sender) revert NotAgentOwner(agentId, msg.sender);
    }

    /// @notice Required override for ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
