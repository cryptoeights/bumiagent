# CeloSpawn — Product Requirements Document (PRD)

## AI Agent No-Code Launchpad on Celo

**Version:** 1.0
**Date:** March 13, 2026
**Hackathon:** Synthesis Hackathon (Ethereum ecosystem, Celo track)
**Author:** Pebri

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem & Solution](#2-problem--solution)
3. [Architecture](#3-architecture)
4. [Smart Contracts Specification](#4-smart-contracts-specification)
5. [Agent Templates](#5-agent-templates)
6. [Business Model & Tokenomics](#6-business-model--tokenomics)
7. [Verification & Badge System](#7-verification--badge-system)
8. [Agent Registry & AgentScan](#8-agent-registry--agentscan)
9. [x402 Integration](#9-x402-integration)
10. [ERC-8183 Agentic Commerce](#10-erc-8183-agentic-commerce)
11. [EarthPool (ReFi)](#11-earthpool-refi)
12. [Tech Stack](#12-tech-stack)
13. [User Flows](#13-user-flows)
14. [API Specification](#14-api-specification)
15. [Database Schema](#15-database-schema)
16. [Security Requirements](#16-security-requirements)
17. [Deployment Plan](#17-deployment-plan)
18. [Hackathon Scope (MVP)](#18-hackathon-scope-mvp)

---

## 1. Overview

### One-Liner

CeloSpawn is a no-code platform where anyone can launch, monetize, and manage AI agents on Celo blockchain in 10 seconds — with automatic on-chain identity (ERC-8004), pay-per-call monetization (x402), and job escrow (ERC-8183).

### Tagline

> "10 detik bikin AI Agent di Celo. No code. No hassle."

### Why This Exists

Every "agent builder" platform today is too complex. They target developers. CeloSpawn targets **everyone** — the merchant who wants a customer support bot, the creator who wants a content assistant, the DAO member who wants a governance helper. Pick a template, give it a name, set your price, deploy. Done.

### Hackathon Context

- **Hackathon:** Synthesis (synthesis.md) — online, building starts March 13, 2026
- **Sponsors:** EF, Celo, Self Protocol, Uniswap, Metamask, Virtuals, and others
- **Judging:** AI agent judges + human judges
- **Tracks:** Agent Infrastructure, Open Track
- **Target Track:** Celo track + Agent Infrastructure track

### Key Differentiators

1. **10-second deploy** — Only 3 fields: name, template, price
2. **ERC-8004 native** — Every agent gets on-chain NFT identity automatically
3. **x402 default** — Every agent is monetizable from day 1
4. **ERC-8183 jobs** — Agents can accept multi-step paid tasks via escrow
5. **Self verification** — Proof-of-human for agent owners (sybil resistance)
6. **EarthPool** — 15% of premium revenue funds tree planting campaigns (Celo ReFi alignment)
7. **Freemium LLM** — Free agents use free models via OpenRouter, no API key needed from user

---

## 2. Problem & Solution

### Problem

To deploy an AI agent that can receive payments on blockchain today, a developer needs to:
- Write agent logic (days)
- Set up wallet infrastructure (hours)
- Integrate payment rails (days)
- Register on-chain identity (hours)
- Build monitoring dashboard (days)

**Total: 2-4 weeks of engineering work, requires Solidity + backend + frontend skills.**

Even for developers this is tedious. For non-developers, it's impossible.

### Solution

CeloSpawn reduces this to 3 form fields and 1 button click:

```
[Agent Name] + [Template Selection] + [Price per Call] → [Deploy]
```

Everything else is automated:
- Wallet auto-generated and encrypted
- ERC-8004 identity registered on-chain
- x402 payment endpoint configured
- Agent runtime deployed and hosted
- Monitoring dashboard available immediately

---

## 3. Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  Landing Page | Deploy Form | Dashboard | Registry | AgentScan  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API (Node.js)                      │
│                                                                 │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  Agent    │ │  x402     │ │  Job     │ │  Subscription    │  │
│  │  Manager  │ │  Gateway  │ │  Manager │ │  Manager         │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Agent Runtime (per-agent workers)            │   │
│  │  Template Engine → LLM Router (OpenRouter: free/premium models) │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CELO BLOCKCHAIN                              │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ SpawnRegistry   │  │ AgentCommerce    │  │ EarthPool     │  │
│  │ (ERC-8004 +     │  │ (ERC-8183        │  │ (ReFi fund    │  │
│  │  Subscription)  │  │  Job Escrow)     │  │  collector)   │  │
│  └─────────────────┘  └──────────────────┘  └───────────────┘  │
│                                                                 │
│  Payment Token: cUSD (Celo stablecoin)                          │
└─────────────────────────────────────────────────────────────────┘
```

### Contract Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Smart Contract Map                          │
│                                                                  │
│  SpawnRegistry.sol (main contract)                               │
│  ├── Extends: ERC-721 (OpenZeppelin)                             │
│  ├── Implements: IERC8004 (agent identity)                       │
│  ├── Feature: Agent registration + metadata                      │
│  ├── Feature: Agent wallet binding (auto-generated)              │
│  ├── Feature: Subscription management (free/premium)             │
│  ├── Feature: Self verification status tracking                  │
│  ├── Feature: Badge system (grey/blue/gold/green)                │
│  └── Calls: EarthPool.sol for premium revenue split              │
│                                                                  │
│  AgentCommerce.sol                                               │
│  ├── Implements: IERC8183 (agentic commerce)                     │
│  ├── Feature: Job creation with escrow                           │
│  ├── Feature: State machine (Open→Funded→Submitted→Terminal)     │
│  ├── Feature: Evaluator attestation                              │
│  ├── Feature: Platform fee on completed jobs                     │
│  └── Token: cUSD (ERC-20)                                        │
│                                                                  │
│  EarthPool.sol                                                   │
│  ├── Feature: Receive 15% of premium subscription payments       │
│  ├── Feature: Track accumulated funds                            │
│  ├── Feature: Emit CampaignReady when balance >= $500            │
│  └── Feature: Campaign execution record (what/where/proof)       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Smart Contracts Specification

### Build System: Foundry

```
celospawn-contracts/
├── foundry.toml
├── remappings.txt
├── .env.example
├── src/
│   ├── interfaces/
│   │   ├── IERC8004.sol          # ERC-8004 interface
│   │   ├── IERC8183.sol          # ERC-8183 interface  
│   │   └── IEarthPool.sol        # EarthPool interface
│   ├── SpawnRegistry.sol         # Main agent registry
│   ├── AgentCommerce.sol         # Job escrow (ERC-8183)
│   └── EarthPool.sol             # ReFi fund collector
├── script/
│   └── Deploy.s.sol              # Deployment script
├── test/
│   ├── SpawnRegistry.t.sol
│   ├── AgentCommerce.t.sol
│   └── EarthPool.t.sol
└── lib/
    └── openzeppelin-contracts/   # via forge install
```

### 4.1 SpawnRegistry.sol

**Purpose:** Main contract. Registers AI agents as ERC-721 NFTs with ERC-8004 compliant identity, manages subscriptions, and tracks verification status.

**Inheritance:**
- OpenZeppelin ERC721URIStorage
- OpenZeppelin Ownable
- OpenZeppelin ReentrancyGuard

**State Variables:**

```solidity
// Agent counter (also serves as next agentId)
uint256 private _nextAgentId;

// Payment token (cUSD on Celo)
IERC20 public paymentToken;

// EarthPool contract address
address public earthPool;

// Platform treasury for operational costs
address public treasury;

// Premium subscription price: $20/month in cUSD (20 * 1e18)
uint256 public constant PREMIUM_PRICE = 20e18;

// EarthPool share: 15%
uint256 public constant EARTHPOOL_BPS = 1500; // basis points

// Per-agent data
struct AgentData {
    address agentWallet;           // Auto-generated wallet address
    bytes32 encryptedPrivateKey;   // Encrypted private key hash (stored off-chain, hash on-chain)
    uint8 templateId;              // Template index (0-9)
    uint256 pricePerCall;          // Price in cUSD wei for x402
    bool isVerified;               // Self protocol verification
    bool isPremium;                // Active premium subscription
    uint256 premiumExpiry;         // Timestamp when premium expires
    uint256 totalCalls;            // Lifetime call counter
    uint256 totalRevenue;          // Lifetime revenue in cUSD wei
    uint256 createdAt;             // Registration timestamp
}

mapping(uint256 => AgentData) public agents;

// Reverse lookup: wallet address → agentId
mapping(address => uint256) public walletToAgent;

// Rate limiting for free tier
mapping(uint256 => mapping(uint256 => uint256)) public dailyCalls;
// agentId → day (block.timestamp / 86400) → call count
```

**Functions:**

```solidity
/// @notice Register a new agent (main entry point — the "10 second deploy")
/// @param name Agent display name (stored in URI metadata)
/// @param templateId Template index (0-9)
/// @param pricePerCall Price per x402 call in cUSD wei
/// @param agentWallet Pre-generated wallet address for the agent
/// @param agentURI URI pointing to the agent's registration JSON (ERC-8004 format)
/// @return agentId The minted NFT tokenId
function registerAgent(
    string calldata name,
    uint8 templateId,
    uint256 pricePerCall,
    address agentWallet,
    string calldata agentURI
) external returns (uint256 agentId);
// Requirements:
// - templateId must be 0-9
// - agentWallet must not be address(0)
// - agentWallet must not be already registered
// - Mints ERC-721 to msg.sender
// - Stores AgentData
// - Emits AgentRegistered event

/// @notice Subscribe agent to premium ($20/month)
/// @param agentId The agent to upgrade
function subscribePremium(uint256 agentId) external;
// Requirements:
// - msg.sender must be owner of agentId
// - Transfers 20 cUSD from msg.sender
// - 85% (17 cUSD) → treasury
// - 15% (3 cUSD) → EarthPool contract
// - Sets isPremium = true, premiumExpiry = block.timestamp + 30 days
// - Emits PremiumSubscribed event

/// @notice Renew premium subscription
function renewPremium(uint256 agentId) external;
// Same as subscribePremium but extends premiumExpiry by 30 days from current expiry

/// @notice Mark agent as Self-verified (called by platform backend after Self verification)
/// @param agentId The agent to verify
function setVerified(uint256 agentId, bool status) external onlyOwner;
// Requirements:
// - Only platform owner can call (backend relays Self Protocol verification)
// - Sets isVerified = true
// - Emits AgentVerified event

/// @notice Record a call to an agent (called by platform backend)
/// @param agentId The agent that was called
/// @param revenue Revenue from this call in cUSD wei
function recordCall(uint256 agentId, uint256 revenue) external onlyOwner;
// - Increments totalCalls
// - Adds to totalRevenue
// - Increments dailyCalls for rate limiting

/// @notice Check if an agent can accept calls (rate limit check)
/// @param agentId The agent to check
/// @return canCall Whether the agent is within rate limits
function canAcceptCall(uint256 agentId) external view returns (bool canCall);
// Free unverified: 10 calls/day for owner
// Free verified: 30 calls/day for owner
// Premium: 200 calls/month (check against monthly counter)
// Public calls (from others via x402): unlimited, they pay per call

/// @notice Get agent's daily call limit
function getDailyLimit(uint256 agentId) external view returns (uint256);
// Returns 10 (unverified free), 30 (verified free), or 200/30≈7 (premium daily equiv)

/// @notice Get full agent data
function getAgent(uint256 agentId) external view returns (AgentData memory);

/// @notice Get badge type for an agent
/// @return badge 0=grey, 1=blue, 2=gold, 3=green
function getBadge(uint256 agentId) external view returns (uint8 badge);
// grey (0): default — not verified
// blue (1): isVerified == true via Self
// gold (2): isPremium == true
// green (3): isPremium == true AND isVerified == true (EarthPool contributor)
```

**Events:**

```solidity
event AgentRegistered(
    uint256 indexed agentId,
    address indexed owner,
    address agentWallet,
    uint8 templateId,
    uint256 pricePerCall,
    string agentURI
);
event PremiumSubscribed(uint256 indexed agentId, uint256 expiry);
event PremiumRenewed(uint256 indexed agentId, uint256 newExpiry);
event AgentVerified(uint256 indexed agentId, bool status);
event CallRecorded(uint256 indexed agentId, uint256 revenue);
```

---

### 4.2 AgentCommerce.sol

**Purpose:** Implements ERC-8183 Agentic Commerce — job escrow system where users can hire agents for multi-step tasks with guaranteed payment via escrow.

**Inheritance:**
- OpenZeppelin ReentrancyGuard
- OpenZeppelin Ownable

**State Variables:**

```solidity
uint256 private _nextJobId;
IERC20 public paymentToken;          // cUSD
address public spawnRegistry;         // Reference to SpawnRegistry
address public treasury;              // Platform fee recipient

// Platform fee on completed jobs: 5%
uint256 public constant PLATFORM_FEE_BPS = 500;

struct Job {
    address client;          // Who created/funded the job
    address provider;        // Agent wallet that does the work
    address evaluator;       // Who approves/rejects (default: client)
    string description;      // Job brief
    uint256 budget;          // Escrowed amount in cUSD
    uint256 expiredAt;       // Deadline timestamp
    JobStatus status;        // Current state
    bytes32 deliverable;     // Reference to submitted work (IPFS CID hash)
    uint256 agentId;         // SpawnRegistry agentId of the provider
}

enum JobStatus {
    Open,
    Funded,
    Submitted,
    Completed,
    Rejected,
    Expired
}

mapping(uint256 => Job) public jobs;

// Track jobs per agent for AgentScan
mapping(uint256 => uint256[]) public agentJobs; // agentId → jobId[]
```

**Functions:**

```solidity
/// @notice Create a new job to hire an agent
/// @param agentId The agent to hire (from SpawnRegistry)
/// @param evaluator Who evaluates completion (address(0) means client is evaluator)
/// @param expiredAt Deadline timestamp
/// @param description Job description
/// @return jobId The created job ID
function createJob(
    uint256 agentId,
    address evaluator,
    uint256 expiredAt,
    string calldata description
) external returns (uint256 jobId);
// Requirements:
// - agentId must exist in SpawnRegistry
// - expiredAt must be in the future
// - If evaluator == address(0), set evaluator = msg.sender
// - provider = agents[agentId].agentWallet (from SpawnRegistry)
// - status = Open
// - Emits JobCreated

/// @notice Set budget and fund the job in one step (Open → Funded)
/// @param jobId The job to fund
/// @param amount Budget in cUSD wei
function fundJob(uint256 jobId, uint256 amount) external;
// Requirements:
// - msg.sender must be job.client
// - status must be Open
// - amount must be > 0
// - Transfers cUSD from client to this contract
// - Sets budget = amount, status = Funded
// - Emits JobFunded

/// @notice Submit work (called by platform on behalf of agent)
/// @param jobId The job
/// @param deliverable Hash reference to the work (e.g., IPFS CID)
function submitJob(uint256 jobId, bytes32 deliverable) external;
// Requirements:
// - msg.sender must be job.provider OR contract owner (platform relays)
// - status must be Funded
// - Sets deliverable, status = Submitted
// - Emits JobSubmitted

/// @notice Complete a job and release escrow (evaluator only)
/// @param jobId The job
/// @param reason Optional attestation hash
function completeJob(uint256 jobId, bytes32 reason) external nonReentrant;
// Requirements:
// - msg.sender must be job.evaluator
// - status must be Submitted
// - Calculate platform fee: budget * 500 / 10000 = 5%
// - Transfer (budget - fee) to job.provider
// - Transfer fee to treasury
// - status = Completed
// - Emits JobCompleted

/// @notice Reject a job
/// @param jobId The job
/// @param reason Optional reason hash
function rejectJob(uint256 jobId, bytes32 reason) external nonReentrant;
// Requirements:
// - If status == Open: msg.sender must be client
// - If status == Funded or Submitted: msg.sender must be evaluator
// - If Funded or Submitted: refund budget to client
// - status = Rejected
// - Emits JobRejected

/// @notice Claim refund for expired job
/// @param jobId The job
function claimRefund(uint256 jobId) external nonReentrant;
// Requirements:
// - status must be Funded or Submitted
// - block.timestamp >= job.expiredAt
// - Refund budget to client
// - status = Expired
// - Emits JobExpired

/// @notice Get all jobs for an agent (for AgentScan)
function getAgentJobs(uint256 agentId) external view returns (uint256[] memory);

/// @notice Get job details
function getJob(uint256 jobId) external view returns (Job memory);
```

**Events:**

```solidity
event JobCreated(uint256 indexed jobId, address indexed client, uint256 indexed agentId, address evaluator);
event JobFunded(uint256 indexed jobId, uint256 amount);
event JobSubmitted(uint256 indexed jobId, bytes32 deliverable);
event JobCompleted(uint256 indexed jobId, bytes32 reason, uint256 payout, uint256 fee);
event JobRejected(uint256 indexed jobId, address indexed rejector, bytes32 reason);
event JobExpired(uint256 indexed jobId);
```

---

### 4.3 EarthPool.sol

**Purpose:** Collects 15% of premium subscription payments. When accumulated balance reaches $500 cUSD, emits a CampaignReady event that triggers a tree planting campaign.

**Inheritance:**
- OpenZeppelin Ownable

**State Variables:**

```solidity
IERC20 public paymentToken;          // cUSD
uint256 public constant CAMPAIGN_THRESHOLD = 500e18; // $500 in cUSD
uint256 public totalReceived;         // Lifetime total received
uint256 public totalCampaigns;        // Number of campaigns executed
uint256 public currentBalance;        // Current uncommitted balance

struct Campaign {
    uint256 id;
    uint256 amount;          // cUSD amount used
    string description;      // What was planted/where
    string proofURI;         // IPFS URI to proof (photos, receipts)
    uint256 executedAt;      // Timestamp
}

mapping(uint256 => Campaign) public campaigns;
```

**Functions:**

```solidity
/// @notice Receive funds (called by SpawnRegistry during premium subscription)
function deposit(uint256 amount) external;
// Requirements:
// - Transfers cUSD from msg.sender to this contract
// - Increments totalReceived and currentBalance
// - If currentBalance >= CAMPAIGN_THRESHOLD, emit CampaignReady
// - Emits FundsReceived

/// @notice Execute a planting campaign (owner/DAO only)
/// @param amount Amount to spend on this campaign
/// @param description What will be planted/where
function executeCampaign(uint256 amount, string calldata description) external onlyOwner;
// Requirements:
// - amount <= currentBalance
// - Decrements currentBalance
// - Creates Campaign record
// - Increments totalCampaigns
// - Emits CampaignExecuted

/// @notice Add proof to a campaign after execution
/// @param campaignId The campaign
/// @param proofURI IPFS URI to proof materials
function addCampaignProof(uint256 campaignId, string calldata proofURI) external onlyOwner;
// - Updates campaign.proofURI
// - Emits CampaignProofAdded

/// @notice Withdraw funds for campaign execution (to execute off-chain planting)
function withdraw(address to, uint256 amount) external onlyOwner;
// - Transfers cUSD to destination
// - Decrements currentBalance
```

**Events:**

```solidity
event FundsReceived(uint256 amount, uint256 newBalance);
event CampaignReady(uint256 balance); // Emitted when balance >= threshold
event CampaignExecuted(uint256 indexed campaignId, uint256 amount, string description);
event CampaignProofAdded(uint256 indexed campaignId, string proofURI);
```

---

### 4.4 Deployment Script (Deploy.s.sol)

```solidity
// Deploy order:
// 1. Deploy EarthPool(cUSD_address)
// 2. Deploy SpawnRegistry(cUSD_address, earthPool_address, treasury_address)
// 3. Deploy AgentCommerce(cUSD_address, spawnRegistry_address, treasury_address)
// 4. Set SpawnRegistry address in AgentCommerce (if needed for cross-references)

// Celo Mainnet cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
// Celo Mainnet chainId: 42220
// Celo Mainnet RPC: https://forno.celo.org
```

### 4.5 Test Requirements

Each contract must have comprehensive Foundry tests:

**SpawnRegistry.t.sol:**
- `test_RegisterAgent` — happy path registration
- `test_RegisterAgent_RevertInvalidTemplate` — templateId > 9
- `test_RegisterAgent_RevertDuplicateWallet` — same wallet twice
- `test_SubscribePremium` — payment split (85/15) to treasury/earthpool
- `test_SubscribePremium_RevertNotOwner` — non-owner tries to subscribe
- `test_RenewPremium` — extends expiry correctly
- `test_SetVerified` — only owner can set
- `test_RecordCall` — increments counters
- `test_CanAcceptCall_FreeTier` — 10 calls/day limit
- `test_CanAcceptCall_VerifiedFreeTier` — 30 calls/day limit
- `test_CanAcceptCall_Premium` — 200 calls/month limit
- `test_GetBadge` — correct badge for each state
- `test_TokenURI` — returns correct ERC-8004 compliant URI

**AgentCommerce.t.sol:**
- `test_CreateJob` — happy path
- `test_FundJob` — escrow holds funds
- `test_SubmitJob` — provider submits deliverable
- `test_CompleteJob` — evaluator completes, funds released (95% provider, 5% platform)
- `test_RejectJob_ByClient_WhenOpen` — client rejects unfunded job
- `test_RejectJob_ByEvaluator_WhenFunded` — evaluator rejects, refund
- `test_RejectJob_ByEvaluator_WhenSubmitted` — evaluator rejects after submission
- `test_ClaimRefund_Expired` — refund after expiry
- `test_ClaimRefund_RevertNotExpired` — cannot refund before expiry
- `test_FullJobLifecycle` — create → fund → submit → complete
- `test_RevertUnauthorized` — wrong roles for each function

**EarthPool.t.sol:**
- `test_Deposit` — balance tracking
- `test_Deposit_EmitsCampaignReady` — threshold trigger
- `test_ExecuteCampaign` — creates record, decrements balance
- `test_AddCampaignProof` — updates proof URI
- `test_Withdraw` — only owner, decrements balance

---

## 5. Agent Templates

Platform ships with 10 pre-built agent templates. Each template consists of a system prompt, suggested pricing, and applicable Celo skills.

| ID | Name | Description | System Prompt Focus | Suggested Price |
|----|------|-------------|--------------------:|----------------:|
| 0 | DeFi Assistant | Check token prices, suggest swaps, track portfolio on Celo | DeFi knowledge, Celo token addresses, swap routing | 0.05 cUSD |
| 1 | Payment Agent | Send/receive cUSD, split bills, recurring payments | cUSD transfers, payment formatting, receipts | 0.03 cUSD |
| 2 | Content Creator | Generate captions, threads, articles (ID/EN) | Creative writing, social media formats, bilingual | 0.08 cUSD |
| 3 | Research Agent | Research topics, summarize articles, compare data | Web search synthesis, citation, structured output | 0.10 cUSD |
| 4 | Customer Support | Answer FAQ, handle complaints, escalate to human | Business context, empathy, escalation triggers | 0.02 cUSD |
| 5 | Data Analyzer | Analyze CSV/data, generate insights and reports | Data interpretation, statistics, visualization desc | 0.10 cUSD |
| 6 | ReFi/Climate | Track carbon credits, regenerative actions, Celo ReFi data | Celo ReFi ecosystem, carbon markets, sustainability | 0.05 cUSD |
| 7 | DAO Assistant | Summarize proposals, track voting, governance updates | Governance frameworks, proposal analysis, voting | 0.05 cUSD |
| 8 | Tutor/Education | Explain concepts, quiz, personalized learning | Pedagogy, adaptive difficulty, encouragement | 0.03 cUSD |
| 9 | Custom (Blank) | User writes own system prompt — blank canvas | Minimal base prompt, user-defined | User-defined |

**Template data structure (stored off-chain, referenced by templateId):**

```json
{
  "id": 0,
  "name": "DeFi Assistant",
  "description": "Your personal DeFi helper on Celo",
  "systemPrompt": "You are a DeFi assistant specialized in the Celo ecosystem...",
  "suggestedPrice": "50000000000000000",
  "icon": "💰",
  "category": "finance",
  "celoSkills": ["celo-rpc", "fee-abstraction"],
  "guardrails": {
    "maxResponseLength": 2000,
    "blockedTopics": ["financial advice disclaimer required"],
    "requireDisclaimer": true
  }
}
```

**Where to find/build templates:**
- Celo Agent Skills: `npx openskills install celo-org/agent-skills -g` (reference for DeFi, payment, RPC skills)
- skills.sh directory: https://skills.sh/ (trending agent skills for inspiration)
- LangChain/CrewAI templates: adapt popular patterns to Celo context
- Custom curation: write system prompts tailored to Celo ecosystem

---

## 6. Business Model & Tokenomics

### Revenue Streams

| Stream | Mechanism | Amount |
|--------|-----------|--------|
| Premium Subscriptions | $20/month per agent, paid in cUSD to smart contract | Primary |
| x402 Public Calls | Platform takes 0% (all goes to agent owner) — attracts adoption | $0 |
| ERC-8183 Job Fees | 5% platform fee on completed job escrows | Secondary |

### Cost Structure

| Cost | Estimate/month |
|------|---------------:|
| OpenRouter API (free tier models) | ~$0.001/call × 10 calls × agents |
| OpenRouter API (premium models) | ~$0.01/call × 200 calls × premium_agents |
| Server hosting | ~$50-200 |
| RPC provider | ~$0-50 (Celo is cheap) |

### Premium Payment Flow

```
User pays $20 cUSD
    ├── 85% ($17) → Platform Treasury (operational costs + OpenRouter API)
    └── 15% ($3)  → EarthPool Contract
                        └── At $500 accumulated → Planting Campaign
```

### Unit Economics at Scale

```
100 premium agents: $2,000/mo revenue, $300/mo to EarthPool
500 premium agents: $10,000/mo revenue, $1,500/mo to EarthPool
1000 premium agents: $20,000/mo revenue, $3,000/mo to EarthPool

EarthPool campaigns triggered:
- 100 agents: every ~1.7 months
- 500 agents: every ~10 days  
- 1000 agents: every ~5 days
```

---

## 7. Verification & Badge System

### Self Protocol Integration

**Flow:**

```
1. User clicks "Verify with Self" in dashboard
2. Frontend redirects to Self Protocol verification
   URL: https://app.ai.self.xyz/integration
3. User scans passport/ID via Self app (ZK proof generated)
4. Self returns proof + nullifier to callback URL
5. Backend validates proof via Self's API
6. Backend calls SpawnRegistry.setVerified(agentId, true)
7. Agent badge updates to Blue (🔵)
8. Daily call limit increases from 10 → 30
```

**On-chain representation:**
- `isVerified` boolean in AgentData struct
- `setVerified()` callable only by platform owner (backend relay)
- Future: direct on-chain Self verification via IERC8004ProofOfHuman extension

### Badge System

| Badge | Code | Condition | Visual | Benefit |
|-------|------|-----------|--------|---------|
| Grey | 0 | Default (new agent) | ⚫ | 10 owner calls/day |
| Blue | 1 | Self verified (isVerified=true) | 🔵 | 30 owner calls/day |
| Gold | 2 | Premium subscriber (isPremium=true) | 🟡 | 200 calls/month + premium models |
| Green | 3 | Verified + Premium | 🟢 | All benefits + EarthPool contributor badge |

Badge logic in contract:
```
if (isPremium && isVerified) return 3; // green
if (isPremium) return 2;               // gold
if (isVerified) return 1;              // blue
return 0;                              // grey
```

---

## 8. Agent Registry & AgentScan

### Agent Registry (Public Discovery Page)

A public-facing page listing all agents deployed via CeloSpawn.

**URL:** `/registry`

**Features:**
- Search by name, template type, price range
- Sort by: newest, most calls, highest rated, cheapest
- Filter by: badge type, template category, price range
- Card view showing: name, template, price, total calls, badge, rating

**Data source:** Read from SpawnRegistry contract + backend database for off-chain metadata.

### AgentScan (Per-Agent Detail Page)

Transparency page for each individual agent.

**URL:** `/agent/{agentId}`

**Displays:**
- Agent name, description, template used
- On-chain identity (ERC-8004 NFT ID, wallet address, registration TX)
- Badge status with explanation
- x402 endpoint URL for developers
- Activity stats: total calls, today's calls, total revenue
- ERC-8183 job history: completed jobs, success rate
- Reputation score (future: from ERC-8004 Reputation Registry)
- Owner address (linked to block explorer)
- Created date
- "Use This Agent" button → opens chat interface
- "Hire for a Job" button → opens ERC-8183 job creation form

---

## 9. x402 Integration

Every agent deployed via CeloSpawn automatically gets an x402-compatible payment endpoint.

### How It Works

```
External User/Agent sends request:
  GET https://api.celospawn.xyz/v1/agent/{agentId}/chat
  Body: { "message": "What's CELO price today?" }
        ↓
Server checks: is this the agent owner? (free tier with rate limit)
  - Yes → process request, check rate limit, respond
  - No → return HTTP 402 Payment Required
        ↓
HTTP 402 Response includes:
  {
    "price": "50000000000000000",     // 0.05 cUSD in wei
    "token": "0x765DE816845861e75A25fCA122bb6898B8B1282a",  // cUSD
    "network": "celo",
    "payTo": "0xAgentWalletAddress",
    "chainId": 42220
  }
        ↓
Client signs ERC-2612 permit or ERC-3009 authorization
Sends payment header: X-PAYMENT: {signed_payment_data}
        ↓
Server verifies payment via thirdweb x402 facilitator
  → settlePayment() confirms on-chain
        ↓
Agent processes request via LLM (OpenRouter: free or premium model based on tier)
Returns response to user
Records call in SpawnRegistry (recordCall)
```

### x402 Configuration per Agent

Stored in backend database, derived from on-chain data:

```json
{
  "agentId": 127,
  "endpoint": "https://api.celospawn.xyz/v1/agent/127/chat",
  "x402Config": {
    "enabled": true,
    "price": "50000000000000000",
    "token": "cUSD",
    "tokenAddress": "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    "network": "celo",
    "chainId": 42220,
    "payTo": "0xAgentWalletAddress"
  }
}
```

### thirdweb Integration

Use thirdweb's x402 SDK for server-side payment settlement:

```typescript
import { facilitator, settlePayment } from "thirdweb/x402";
import { celo } from "thirdweb/chains";

const thirdwebFacilitator = facilitator({
  client,
  serverWalletAddress: PLATFORM_WALLET,
});

// In API handler:
const result = await settlePayment({
  resourceUrl: `https://api.celospawn.xyz/v1/agent/${agentId}/chat`,
  method: "POST",
  paymentData: req.headers["x-payment"],
  payTo: agent.walletAddress,
  network: celo,
  price: agent.pricePerCall,
  facilitator: thirdwebFacilitator,
});
```

---

## 10. ERC-8183 Agentic Commerce

### What It Enables

Beyond simple per-call x402 payments, ERC-8183 allows users to hire agents for **complex, multi-step tasks** with payment guarantee via escrow.

### Use Cases

| Scenario | Client | Agent | Budget | Deliverable |
|----------|--------|-------|--------|-------------|
| Portfolio analysis | Trader | DeFi Assistant | 2 cUSD | PDF report (IPFS hash) |
| Blog post creation | Startup | Content Creator | 1 cUSD | Article text (IPFS hash) |
| Data cleanup | Analyst | Data Analyzer | 5 cUSD | Clean CSV (IPFS hash) |
| Translation | Business | Custom Agent | 3 cUSD | Translated doc (IPFS hash) |

### Job Lifecycle in CeloSpawn

```
User browses Agent Registry → finds "ContentWriter-v2" agent
    ↓
Clicks "Hire for a Job"
    ↓
Fill form:
  - Description: "Write a 1000-word blog post about Celo ReFi ecosystem"
  - Budget: 1.5 cUSD
  - Deadline: 24 hours from now
    ↓
Backend: 
  1. AgentCommerce.createJob(agentId=42, evaluator=user, expiredAt=+24h, description=...)
  2. AgentCommerce.fundJob(jobId, 1.5 cUSD)  // escrow locked
    ↓
Agent Runtime picks up the job:
  1. Reads job description
  2. Calls LLM (multiple calls if needed — uses agent's allocation)
  3. Produces deliverable
  4. Uploads to IPFS → gets CID hash
  5. AgentCommerce.submitJob(jobId, ipfsCidHash)
    ↓
User reviews deliverable (downloads from IPFS)
  - Happy → AgentCommerce.completeJob(jobId, attestationHash)
    → 95% (1.425 cUSD) released to agent wallet
    → 5% (0.075 cUSD) to platform treasury
  - Unhappy → AgentCommerce.rejectJob(jobId, reasonHash)
    → Full 1.5 cUSD refunded to user
  - No response → after 24h, anyone calls claimRefund(jobId)
    → Full 1.5 cUSD refunded to user
```

---

## 11. EarthPool (ReFi)

### Why This Matters

Celo's core mission is regenerative finance. EarthPool directly aligns CeloSpawn with Celo's values by channeling premium revenue into real-world environmental impact.

### Mechanism

```
Every $20 premium subscription payment:
├── $17 (85%) → Platform Treasury
└── $3 (15%) → EarthPool Smart Contract
                    │
                    ├── Accumulates until >= $500
                    │
                    └── CampaignReady event → Platform executes planting campaign
                            │
                            ├── Partner with local planting org
                            ├── Fund planting activity
                            ├── Document with photos/receipts
                            ├── Upload proof to IPFS
                            └── Record on-chain: executeCampaign() + addCampaignProof()
```

### On-Chain Transparency

Every campaign has:
- Amount spent (on-chain)
- Description of what was planted and where (on-chain)
- Proof URI pointing to IPFS with photos/receipts (on-chain reference)
- Execution timestamp (on-chain)

This means anyone can audit the full history of environmental contributions.

---

## 12. Tech Stack

### Smart Contracts

| Component | Technology |
|-----------|-----------|
| Language | Solidity 0.8.24 |
| Framework | Foundry (forge, cast, anvil) |
| Libraries | OpenZeppelin Contracts v5 |
| Testing | Foundry test (Solidity tests) |
| Deployment | forge script + forge create |
| Network | Celo Mainnet (chainId: 42220) |

### Backend

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20+ |
| Framework | Express.js or Hono |
| Database | PostgreSQL (agent metadata, call logs) |
| Cache | Redis (rate limiting, session) |
| LLM Provider | OpenRouter API (unified gateway for all models) |
| LLM (Free) | OpenRouter free-tier models (e.g., google/gemma-3-1b-it:free, meta-llama/llama-3.1-8b-instruct:free) |
| LLM (Premium) | OpenRouter premium models (e.g., anthropic/claude-sonnet, openai/gpt-4o, google/gemini-2.5-pro) |
| Payments | thirdweb x402 SDK |
| Storage | IPFS (Pinata/web3.storage for deliverables) |
| Wallet Gen | ethers.js Wallet.createRandom() |
| Encryption | AES-256-GCM (encrypt agent private keys with owner's signature-derived key) |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS |
| Wallet | MetaMask + WalletConnect v2 (via wagmi connectors) |
| State | Zustand or React Context |
| Web3 | wagmi + viem (Celo chain config) |
| UI Components | shadcn/ui |

---

## 13. User Flows

### Flow 1: Deploy Agent (10 seconds)

```
1. User visits celospawn.xyz
2. Clicks "Launch Agent" 
3. Connect wallet (MetaMask or WalletConnect)
4. Fill form:
   - Agent Name: [text input]
   - Template: [dropdown with 10 options]
   - Price per Call: [number input] cUSD
5. Click "Deploy Agent ✨"
6. Backend:
   a. Generate wallet (ethers.Wallet.createRandom())
   b. Encrypt private key with user's signature
   c. Build agent registration JSON (ERC-8004 format)
   d. Upload registration JSON to IPFS
   e. Call SpawnRegistry.registerAgent(...) 
   f. Setup agent runtime worker
   g. Configure x402 endpoint
7. Redirect to Dashboard showing new agent
```

### Flow 2: Use Someone's Agent (x402)

```
1. User browses /registry
2. Finds interesting agent, clicks "Use Agent"
3. Chat interface opens
4. Types message, clicks Send
5. Backend returns HTTP 402 with price
6. Frontend shows payment modal: "This costs 0.05 cUSD per message"
7. User approves payment (signs ERC-2612 permit)
8. Payment settled on-chain
9. Agent processes message via LLM
10. Response displayed in chat
```

### Flow 3: Hire Agent for Job (ERC-8183)

```
1. User on AgentScan page, clicks "Hire for Job"
2. Fill form:
   - Description: [textarea]
   - Budget: [number] cUSD
   - Deadline: [datetime picker]
3. Click "Create & Fund Job"
4. Wallet prompts for cUSD approval + transaction
5. AgentCommerce.createJob() + fundJob() called
6. Agent runtime picks up job
7. Agent works on task (multiple LLM calls)
8. Agent submits deliverable
9. User gets notification → reviews deliverable
10. User approves (completeJob) or rejects (rejectJob)
```

### Flow 4: Upgrade to Premium

```
1. User in Dashboard, clicks "Upgrade to Premium" on their agent
2. Modal shows: "$20/month • Premium AI Models (Sonnet, GPT-4o, Gemini Pro) • 200 calls/month • 15% to EarthPool 🌱"
3. Click "Subscribe"
4. Wallet prompts cUSD approval (20 cUSD to SpawnRegistry)
5. SpawnRegistry.subscribePremium(agentId) called
6. Payment split: 17 cUSD → treasury, 3 cUSD → EarthPool
7. Agent badge changes to Gold 🟡
8. LLM routing changes from OpenRouter free models to premium models
```

### Flow 5: Verify with Self

```
1. User in Dashboard, clicks "Verify with Self 🔵"
2. Redirect to Self Protocol verification page
3. User scans passport/ID via Self mobile app
4. ZK proof generated (no personal data exposed)
5. Self sends proof to CeloSpawn callback
6. Backend validates proof
7. Backend calls SpawnRegistry.setVerified(agentId, true)
8. Agent badge changes to Blue 🔵
9. Daily call limit: 10 → 30
```

---

## 14. API Specification

### Base URL: `https://api.celospawn.xyz/v1`

### Endpoints

```
POST   /agents                    # Register new agent
GET    /agents                    # List all agents (registry)
GET    /agents/:agentId           # Get agent details (agentscan)
PATCH  /agents/:agentId           # Update agent settings
DELETE /agents/:agentId           # Deactivate agent

POST   /agents/:agentId/chat      # Chat with agent (x402 gated for non-owners)
GET    /agents/:agentId/stats      # Get agent statistics

POST   /agents/:agentId/verify     # Initiate Self verification
POST   /agents/:agentId/subscribe  # Subscribe to premium

POST   /jobs                       # Create job (ERC-8183)
GET    /jobs/:jobId                # Get job details
POST   /jobs/:jobId/fund           # Fund job
POST   /jobs/:jobId/submit         # Submit deliverable
POST   /jobs/:jobId/complete       # Complete job (evaluator)
POST   /jobs/:jobId/reject         # Reject job
GET    /agents/:agentId/jobs       # List jobs for agent

GET    /templates                  # List all 10 templates
GET    /templates/:templateId      # Get template details

GET    /earthpool/stats            # EarthPool balance and campaign history
GET    /earthpool/campaigns        # List all campaigns
```

---

## 15. Database Schema

### agents (off-chain metadata complement to on-chain data)

```sql
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER UNIQUE NOT NULL,           -- on-chain tokenId
    owner_address VARCHAR(42) NOT NULL,          -- wallet that deployed
    agent_wallet VARCHAR(42) UNIQUE NOT NULL,    -- generated wallet
    encrypted_private_key TEXT NOT NULL,          -- AES-256-GCM encrypted
    name VARCHAR(100) NOT NULL,
    template_id SMALLINT NOT NULL,
    custom_system_prompt TEXT,                    -- for template 9 (custom)
    price_per_call NUMERIC(78, 0) NOT NULL,     -- wei
    agent_uri TEXT NOT NULL,                      -- IPFS URI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### call_logs

```sql
CREATE TABLE call_logs (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES agents(agent_id),
    caller_address VARCHAR(42),                   -- NULL if owner
    message_hash VARCHAR(66),                     -- hash of input
    response_hash VARCHAR(66),                    -- hash of output
    revenue NUMERIC(78, 0) DEFAULT 0,            -- cUSD wei earned
    llm_model VARCHAR(100),                       -- OpenRouter model ID e.g. "meta-llama/llama-3.1-8b-instruct:free" or "anthropic/claude-sonnet-4"
    llm_tokens_used INTEGER,
    is_owner_call BOOLEAN DEFAULT false,
    payment_tx_hash VARCHAR(66),                  -- x402 payment TX
    created_at TIMESTAMP DEFAULT NOW()
);
```

### jobs (off-chain complement to AgentCommerce)

```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER UNIQUE NOT NULL,              -- on-chain jobId
    agent_id INTEGER NOT NULL,
    client_address VARCHAR(42) NOT NULL,
    description TEXT NOT NULL,
    budget NUMERIC(78, 0) NOT NULL,
    status VARCHAR(20) NOT NULL,
    deliverable_ipfs_cid VARCHAR(100),
    result_text TEXT,                              -- cached result
    created_at TIMESTAMP DEFAULT NOW(),
    funded_at TIMESTAMP,
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

---

## 16. Security Requirements

### Smart Contract Security

- Use OpenZeppelin's battle-tested contracts (ERC721, ReentrancyGuard, Ownable, SafeERC20)
- All token transfers via SafeERC20
- ReentrancyGuard on all functions that transfer tokens
- Input validation on all public functions
- Access control: Ownable for admin functions, role checks for job operations
- Front-running protection: `expectedBudget` parameter in `fundJob`
- Run Slither static analysis before deployment
- All tests must pass with 100% coverage on critical paths

### Private Key Security

- Agent wallets generated server-side via `ethers.Wallet.createRandom()`
- Private key encrypted immediately with AES-256-GCM
- Encryption key derived from owner's wallet signature (sign a deterministic message)
- Encrypted key stored in database; raw key NEVER persisted
- Private key only decrypted in memory when agent needs to sign transactions
- Key rotation: if owner transfers NFT, old key is invalidated

### API Security

- Rate limiting on all endpoints (Redis-based)
- x402 payment verification before processing paid requests
- Wallet signature verification for authenticated endpoints
- CORS configuration for frontend-only access
- Input sanitization for all user-provided strings (agent names, descriptions)

---

## 17. Deployment Plan

### Deployment (Celo Mainnet)

```bash
# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts

# Compile
forge build

# Test (local anvil fork of Celo Mainnet)
forge test -vvv --fork-url https://forno.celo.org

# Deploy to Celo Mainnet
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url https://forno.celo.org \
    --broadcast \
    --verify

# Celo Mainnet cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
# Celo Mainnet chainId: 42220
```

### Contract Verification

```bash
forge verify-contract <address> SpawnRegistry \
    --chain-id 42220 \
    --etherscan-api-key $CELOSCAN_API_KEY
```

---

## 18. Hackathon Scope (MVP)

### Must-Have (Week 1)

| # | Item | Priority |
|---|------|----------|
| 1 | SpawnRegistry.sol — full contract with tests | P0 |
| 2 | AgentCommerce.sol — full contract with tests | P0 |
| 3 | EarthPool.sol — full contract with tests | P0 |
| 4 | Deploy script for Celo Mainnet | P0 |
| 5 | Backend API — agent registration + chat endpoint | P0 |
| 6 | OpenRouter integration for free + premium LLM routing | P0 |
| 7 | Frontend — landing page + deploy form (3 fields) | P0 |
| 8 | Frontend — basic dashboard (list agents, stats) | P0 |
| 9 | Auto wallet generation per agent | P0 |
| 10 | x402 basic payment flow | P0 |

### Should-Have (Week 2)

| # | Item | Priority |
|---|------|----------|
| 11 | Self Protocol verification flow | P1 |
| 12 | Agent Registry public page | P1 |
| 13 | AgentScan detail page | P1 |
| 14 | ERC-8183 job creation + completion UI | P1 |
| 15 | Premium subscription UI + payment | P1 |
| 16 | Badge display across UI | P1 |
| 17 | 10 template system prompts finalized | P1 |

### Nice-to-Have (If Time)

| # | Item | Priority |
|---|------|----------|
| 18 | MiniPay wallet support (additional to MetaMask/WalletConnect) | P2 |
| 19 | Model selection UI for premium (choose from OpenRouter models) | P2 |
| 20 | EarthPool dashboard with campaign tracker | P2 |
| 21 | Agent-to-agent job creation | P2 |
| 22 | Reputation scoring display | P2 |
| 23 | Mainnet deployment | P2 |

### Demo Script (30 seconds for judges)

```
"Every agent builder out there takes 5 minutes minimum and requires you to be a developer.
Watch this."

[Screen: CeloSpawn landing page]
[Connect MiniPay wallet — 2 seconds]
[Type agent name: "IndonesiaTrader"]
[Select template: "DeFi Assistant"]
[Set price: 0.05 cUSD]
[Click "Deploy Agent ✨"]

"That's it. 10 seconds. This agent now has:
 ✅ Its own wallet on Celo
 ✅ An on-chain identity via ERC-8004
 ✅ A pay-per-call endpoint via x402
 ✅ Anyone in the world can hire it via ERC-8183 job escrow"

[Show AgentScan page — badge, stats, x402 endpoint]
[Show someone calling the agent and paying via x402]
[Show EarthPool: "15% of every premium subscription plants trees"]

"CeloSpawn. The Shopify of AI Agents on Celo."
```

---

## Appendix A: Reference Standards

| Standard | URL | Role in CeloSpawn |
|----------|-----|-------------------|
| ERC-8004 | https://eips.ethereum.org/EIPS/eip-8004 | Agent identity (NFT-based registry) |
| ERC-8183 | https://eips.ethereum.org/EIPS/eip-8183 | Job escrow for agent commerce |
| x402 | https://portal.thirdweb.com/x402 | Pay-per-call HTTP payments |
| Self Protocol | https://app.ai.self.xyz/erc8004 | Proof-of-human verification |
| Celo Agent Skills | https://docs.celo.org/build-on-celo/build-with-ai/agent-skills | Agent capability modules |
| OpenSkills | https://skills.sh/ | Agent skills directory |

## Appendix B: Celo Network Reference

| Network | Chain ID | RPC | cUSD Address |
|---------|----------|-----|-------------|
| Mainnet | 42220 | https://forno.celo.org | 0x765DE816845861e75A25fCA122bb6898B8B1282a |
| Alfajores | 44787 | https://alfajores-forno.celo-testnet.org | 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 |

## Appendix C: Official ERC-8004 Deployed Contracts

Reference contracts from the ERC-8004 team (Hardhat-based, for reference):
- ETH Sepolia Identity: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- ETH Sepolia Reputation: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- GitHub: https://github.com/erc-8004/erc-8004-contracts

---

*DYOR — This document is for a hackathon project and is not financial advice. All prices, models, and projections are estimates subject to change.*
