# CeloSpawn Architecture Analysis

## 1. Component Overview

CeloSpawn is structured as a three-tier system: on-chain smart contracts for ownership/payments/escrow, a Node.js backend for agent runtime and API orchestration, and a Next.js frontend for user interaction. Each tier has clear boundaries and responsibilities.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 14+ App Router)                                      │
│  Pages: Landing, Deploy Form, Dashboard, Registry, AgentScan, Chat      │
│  Tech: wagmi + viem, shadcn/ui, Tailwind, Zustand                       │
│  Boundary: All user interaction. Never talks to blockchain directly      │
│  for write ops — always goes through backend API.                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ REST API (JSON)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express/Hono)                                       │
│                                                                         │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌────────────────┐   │
│  │ Agent API   │ │ x402 Gateway │ │ Job Manager │ │ Subscription   │   │
│  │ (CRUD,      │ │ (thirdweb    │ │ (ERC-8183   │ │ Manager        │   │
│  │  register)  │ │  settle)     │ │  lifecycle) │ │ (premium flow) │   │
│  └─────────────┘ └──────────────┘ └─────────────┘ └────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Agent Runtime Layer                                               │   │
│  │  - Per-agent worker processes                                     │   │
│  │  - Template engine (system prompt injection)                      │   │
│  │  - LLM Router → OpenRouter (free models / premium models)        │   │
│  │  - Job executor (reads job, calls LLM, uploads to IPFS)          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────┐ ┌───────┐ ┌───────────────┐ ┌────────┐                   │
│  │ Postgres │ │ Redis │ │ IPFS (Pinata) │ │ ethers │                   │
│  │ (data)   │ │ (rate │ │ (deliverables)│ │ (wallet│                   │
│  │          │ │  limit)│ │               │ │  + tx) │                   │
│  └──────────┘ └───────┘ └───────────────┘ └────────┘                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ On-chain calls (viem/ethers)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CELO BLOCKCHAIN (chainId: 42220, cUSD as payment token)                │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ SpawnRegistry    │  │ AgentCommerce    │  │ EarthPool        │      │
│  │ - ERC-721 mint   │  │ - Job escrow     │  │ - Fund collector │      │
│  │ - Agent identity │  │ - State machine  │  │ - Campaign mgmt  │      │
│  │ - Subscriptions  │  │ - Fee splitting  │  │ - $500 threshold │      │
│  │ - Badge system   │──│ - Reads agent    │  │                  │      │
│  │ - Rate tracking  │  │   wallet from    │  │                  │      │
│  │                  │──│   SpawnRegistry  │  │                  │      │
│  │  calls deposit() │─────────────────────│──│  receives 15%    │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Boundaries

### 2.1 Smart Contracts (On-Chain)

Responsible for: ownership, payments, escrow, and verifiable state.

| Contract | Owns | Reads From | Writes To |
|----------|------|------------|-----------|
| SpawnRegistry | Agent NFTs, subscription state, badges, call counters | cUSD balances | EarthPool (deposit on premium payment) |
| AgentCommerce | Job records, escrowed cUSD | SpawnRegistry (agent wallet lookup) | cUSD transfers to provider/treasury |
| EarthPool | Accumulated ReFi funds, campaign records | cUSD balances | Campaign state |

Key boundary rule: Smart contracts handle money and ownership. They never execute LLM calls, store large text, or manage runtime state.

### 2.2 Backend (Off-Chain Orchestrator)

Responsible for: agent runtime, LLM routing, payment verification, key management, IPFS uploads.

| Module | Responsibility | Depends On |
|--------|---------------|------------|
| Agent API | CRUD for agents, wallet generation, on-chain registration relay | PostgreSQL, ethers.js, SpawnRegistry |
| x402 Gateway | Intercepts chat requests, returns 402 for non-owners, settles payments via thirdweb | thirdweb SDK, SpawnRegistry (price lookup) |
| Agent Runtime | Processes chat messages and jobs via LLM | OpenRouter API, template store, Redis (rate limiting) |
| Job Manager | Monitors open jobs, triggers agent work, uploads deliverables | AgentCommerce contract, IPFS, Agent Runtime |
| Subscription Manager | Handles premium upgrade flow | SpawnRegistry.subscribePremium |
| Self Verification Relay | Validates Self Protocol proofs, calls setVerified on-chain | Self Protocol API, SpawnRegistry |

Key boundary rule: The backend is the only component that holds agent private keys (encrypted). It is the sole signer for agent wallet transactions (submitJob, etc.). The frontend never has access to agent private keys.

### 2.3 Frontend (User Interface)

Responsible for: rendering UI, connecting user wallets, calling backend API.

| Page/Feature | Backend Calls | Direct Chain Reads |
|-------------|---------------|-------------------|
| Deploy Form | POST /agents | None (backend handles on-chain) |
| Dashboard | GET /agents, GET /agents/:id/stats | SpawnRegistry.getAgent (badge, on-chain stats) |
| Registry | GET /agents (paginated) | SpawnRegistry (badge data for display) |
| AgentScan | GET /agents/:id, GET /agents/:id/jobs | SpawnRegistry.getAgent, AgentCommerce.getAgentJobs |
| Chat | POST /agents/:id/chat | None (backend handles x402) |
| Job Creation | POST /jobs, POST /jobs/:id/fund | User signs cUSD approve + fundJob tx directly |
| Job Review | POST /jobs/:id/complete or /reject | User signs completeJob/rejectJob tx directly |
| Premium Subscribe | POST /agents/:id/subscribe | User signs cUSD approve + subscribePremium tx |

Key boundary rule: The frontend handles user wallet signing for transactions that require the user's funds (subscribe, fund job, complete/reject job). It delegates agent-side operations to the backend.

### 2.4 External Services

| Service | Role | Called By |
|---------|------|----------|
| OpenRouter | LLM inference (free + premium models) | Backend Agent Runtime |
| thirdweb x402 SDK | Payment settlement for pay-per-call | Backend x402 Gateway |
| IPFS (Pinata/web3.storage) | Deliverable storage, agent metadata | Backend Job Manager, Backend Agent API |
| Self Protocol | Proof-of-human verification | Frontend (redirect) + Backend (proof validation) |
| Celo RPC (forno.celo.org) | Blockchain reads/writes | Backend (ethers/viem), Frontend (wagmi for reads) |

---

## 3. Data Flow Diagrams

### 3.1 Agent Deployment Flow

```
User (browser)
  │
  ├─1─► Frontend: Fill form (name, template, price)
  │
  ├─2─► Frontend: Connect wallet, sign nonce message (auth)
  │
  ├─3─► Backend POST /agents
  │       │
  │       ├─3a─► ethers.Wallet.createRandom() → agent keypair
  │       ├─3b─► AES-256-GCM encrypt private key (derived from user sig)
  │       ├─3c─► Build ERC-8004 registration JSON
  │       ├─3d─► Upload JSON to IPFS → get CID (agentURI)
  │       ├─3e─► SpawnRegistry.registerAgent(name, templateId, price, agentWallet, agentURI)
  │       │       └── Mints ERC-721 to user address, emits AgentRegistered
  │       ├─3f─► Store agent record in PostgreSQL (encrypted key, metadata)
  │       └─3g─► Initialize agent runtime worker
  │
  └─4─► Frontend: Redirect to dashboard, show new agent
```

### 3.2 Chat with x402 Payment Flow

```
External caller
  │
  ├─1─► POST /agents/:id/chat { message: "..." }
  │
  ├─2─► Backend checks: is caller the agent owner?
  │       ├── YES → check rate limit (Redis) → process via LLM → respond
  │       └── NO  → return HTTP 402 { price, token, payTo, chainId }
  │
  ├─3─► Caller signs ERC-2612 permit for cUSD
  │
  ├─4─► POST /agents/:id/chat + X-PAYMENT header
  │       │
  │       ├─4a─► thirdweb settlePayment() → on-chain cUSD transfer verified
  │       ├─4b─► Select LLM model (free/premium based on agent tier)
  │       ├─4c─► OpenRouter API call with template system prompt + user message
  │       ├─4d─► SpawnRegistry.recordCall(agentId, revenue)
  │       ├─4e─► Log to PostgreSQL call_logs
  │       └─4f─► Return LLM response to caller
```

### 3.3 ERC-8183 Job Lifecycle

```
Client (browser)                    Backend                         Blockchain
  │                                   │                               │
  ├─1─► POST /jobs (description,      │                               │
  │     agentId, deadline, budget)     │                               │
  │                                   ├─2─► AgentCommerce.createJob() │
  │                                   │                               │
  ├─3─► Sign cUSD.approve(commerce,   │                               │
  │     budget) + fundJob(jobId, amt) ─│──────────────────────────────►│
  │                                   │     cUSD escrowed in contract  │
  │                                   │                               │
  │                                   ├─4─► Job Manager detects Funded │
  │                                   │     job via event listener     │
  │                                   │                               │
  │                                   ├─5─► Agent Runtime processes:   │
  │                                   │     - Read job description     │
  │                                   │     - Multiple LLM calls       │
  │                                   │     - Produce deliverable      │
  │                                   │     - Upload to IPFS → CID    │
  │                                   │                               │
  │                                   ├─6─► AgentCommerce.submitJob(  │
  │                                   │     jobId, ipfsCidHash)       │
  │                                   │     (signed with agent wallet) │
  │                                   │                               │
  ├─7─► Review deliverable (from IPFS)│                               │
  │                                   │                               │
  ├─8─► Sign completeJob(jobId) ──────│──────────────────────────────►│
  │     OR rejectJob(jobId)           │     95% → agent, 5% → treasury│
```

### 3.4 Premium Subscription Flow

```
User (browser)                                    Blockchain
  │                                                  │
  ├─1─► Sign cUSD.approve(SpawnRegistry, 20e18)  ──►│
  │                                                  │
  ├─2─► Sign subscribePremium(agentId)           ──►│
  │                                                  │
  │     SpawnRegistry:                               │
  │       ├── 17 cUSD → treasury                     │
  │       ├── 3 cUSD → EarthPool.deposit()           │
  │       │             └── if balance >= 500 cUSD   │
  │       │                 emit CampaignReady        │
  │       ├── isPremium = true                        │
  │       └── premiumExpiry = now + 30 days           │
  │                                                  │
  ├─3─► Backend detects PremiumSubscribed event       │
  │     Updates LLM routing: free → premium models    │
```

---

## 4. Data Storage Strategy

### What Lives Where

| Data | Location | Rationale |
|------|----------|-----------|
| Agent ownership (NFT) | SpawnRegistry on-chain | Verifiable, transferable, immutable |
| Agent wallet address | SpawnRegistry on-chain | Public, linked to identity |
| Subscription status | SpawnRegistry on-chain | Payment verification needs trustless state |
| Job escrow + state | AgentCommerce on-chain | Funds must be trustlessly held |
| EarthPool balance | EarthPool on-chain | Auditable ReFi transparency |
| Encrypted agent private key | PostgreSQL | Too sensitive for on-chain, needs server access |
| Agent metadata (name, prompts) | PostgreSQL + IPFS | Mutable off-chain, IPFS for ERC-8004 URI |
| Call logs | PostgreSQL | High volume, not economical on-chain |
| Rate limit counters | Redis | Ephemeral, high-frequency reads/writes |
| Job deliverables | IPFS | Permanent, content-addressable, decentralized |
| LLM conversation context | Redis (TTL) | Temporary, per-session |

### Database Tables (PostgreSQL)

Three core tables mirror the on-chain contracts with off-chain operational data:

- **agents** -- encrypted keys, custom prompts, activation status
- **call_logs** -- per-call audit trail (model used, tokens, revenue)
- **jobs** -- cached job state, deliverable CIDs, timestamps

---

## 5. Security Boundaries

```
┌─ TRUST ZONE 1: User's Browser ──────────────────────────────────┐
│  - User's wallet private key (MetaMask/WalletConnect)           │
│  - Signs: subscribe, fund job, complete/reject job              │
│  - NEVER receives agent private keys                            │
└─────────────────────────────────────────────────────────────────┘

┌─ TRUST ZONE 2: Backend Server ──────────────────────────────────┐
│  - Agent private keys (encrypted at rest, decrypted in memory)  │
│  - Platform owner wallet (for recordCall, setVerified)          │
│  - OpenRouter API key                                           │
│  - IPFS upload credentials                                      │
│  - Database credentials                                         │
│  CRITICAL: This is the highest-value target. Must be hardened.  │
└─────────────────────────────────────────────────────────────────┘

┌─ TRUST ZONE 3: Smart Contracts ─────────────────────────────────┐
│  - Ownable admin key (for setVerified, recordCall)              │
│  - Escrowed cUSD (in AgentCommerce)                             │
│  - ReentrancyGuard + SafeERC20 protections                      │
└─────────────────────────────────────────────────────────────────┘
```

Key attack surfaces:
- Backend compromise exposes all agent private keys (mitigated by AES-256-GCM encryption with user-signature-derived keys -- attacker also needs user signatures)
- Platform owner key compromise allows fake verifications and call recording (mitigate with multisig in production)
- x402 payment replay (mitigated by thirdweb facilitator nonce tracking)

---

## 6. Suggested Build Order

The build order follows dependency chains. Each phase produces a working, testable artifact.

### Phase 1: Smart Contracts (Foundation)

Everything depends on deployed contracts. Build and test these first.

```
Step 1.1: EarthPool.sol
  - No dependencies on other contracts
  - Simple: deposit, withdraw, campaign tracking
  - Testable in isolation with mock cUSD

Step 1.2: SpawnRegistry.sol
  - Depends on: EarthPool address (for deposit calls)
  - Core of the system: agent identity, subscriptions, badges
  - Test with mock EarthPool first, then integration test

Step 1.3: AgentCommerce.sol
  - Depends on: SpawnRegistry address (reads agent wallet)
  - Job escrow lifecycle
  - Test full lifecycle: create → fund → submit → complete

Step 1.4: Deploy.s.sol
  - Deploy order: EarthPool → SpawnRegistry → AgentCommerce
  - Test on Celo mainnet fork (anvil --fork-url)
```

**Deliverable:** Three deployed, verified contracts on Celo mainnet.

### Phase 2: Backend Core (Agent Runtime)

The backend is the operational brain. Build API and runtime before frontend.

```
Step 2.1: Database + project scaffolding
  - PostgreSQL schema (agents, call_logs, jobs)
  - Redis setup
  - Express/Hono boilerplate with env config

Step 2.2: Agent registration API
  - POST /agents: wallet generation, encryption, IPFS upload, on-chain register
  - GET /agents, GET /agents/:id
  - Depends on: SpawnRegistry deployed (Phase 1)

Step 2.3: Agent chat endpoint + OpenRouter integration
  - POST /agents/:id/chat
  - Template engine (inject system prompt by templateId)
  - OpenRouter API integration (free models first)
  - Rate limiting via Redis

Step 2.4: x402 payment gateway
  - thirdweb x402 SDK integration
  - HTTP 402 response generation
  - Payment settlement verification
  - Depends on: chat endpoint working (Step 2.3)

Step 2.5: Job manager (ERC-8183)
  - Event listener for Funded jobs
  - Agent job execution pipeline
  - IPFS upload for deliverables
  - On-chain submitJob via agent wallet
  - Depends on: AgentCommerce deployed (Phase 1), Agent Runtime (Step 2.3)

Step 2.6: Subscription + verification endpoints
  - POST /agents/:id/subscribe (relay to SpawnRegistry)
  - POST /agents/:id/verify (Self Protocol callback)
  - Premium model routing switch
```

**Deliverable:** Fully functional API that can register agents, handle chat, process payments, and manage jobs.

### Phase 3: Frontend (User Experience)

Build UI on top of stable backend APIs.

```
Step 3.1: Project scaffolding + wallet connection
  - Next.js 14 App Router setup
  - wagmi + viem config for Celo
  - WalletConnect / MetaMask integration
  - shadcn/ui component library setup

Step 3.2: Landing page + Deploy form
  - 3-field form (name, template dropdown, price)
  - Calls POST /agents after wallet auth
  - Critical path for "10-second deploy" demo

Step 3.3: Dashboard
  - List user's agents with stats
  - Badge display
  - Links to manage each agent

Step 3.4: Agent Registry + AgentScan
  - Public discovery page with search/filter
  - Per-agent detail page with on-chain data
  - "Use Agent" and "Hire for Job" CTAs

Step 3.5: Chat interface
  - Message input/output
  - x402 payment modal (when 402 returned)
  - Owner free-tier usage

Step 3.6: Job creation + review UI
  - Job form (description, budget, deadline)
  - cUSD approve + fundJob transaction signing
  - Deliverable review + complete/reject

Step 3.7: Premium + Verification flows
  - Subscribe modal with cUSD payment
  - Self Protocol redirect + callback
  - Badge updates in real-time
```

**Deliverable:** Complete user-facing application.

### Phase 4: Integration + Polish (Hackathon Demo)

```
Step 4.1: End-to-end testing of all flows
Step 4.2: Template content (10 system prompts, suggested pricing)
Step 4.3: EarthPool dashboard (public stats page)
Step 4.4: Error handling, loading states, edge cases
Step 4.5: Deploy frontend (Vercel), backend (Railway/Render)
```

---

## 7. Build Order Dependency Graph

```
Phase 1 (Contracts)          Phase 2 (Backend)           Phase 3 (Frontend)
─────────────────           ─────────────────           ──────────────────

1.1 EarthPool ──────┐
                    │
1.2 SpawnRegistry ──┼──► 2.1 DB + scaffold
                    │         │
1.3 AgentCommerce ──┘    2.2 Agent API ──────────────► 3.1 Scaffolding
                              │                              │
                         2.3 Chat + OpenRouter ──────► 3.2 Landing + Deploy
                              │                              │
                         2.4 x402 Gateway ───────────► 3.3 Dashboard
                              │                              │
                         2.5 Job Manager ────────────► 3.4 Registry + Scan
                              │                              │
                         2.6 Subscriptions ──────────► 3.5 Chat UI
                                                             │
                                                        3.6 Job UI
                                                             │
                                                        3.7 Premium + Verify
                                                             │
                                                        ─────┘
                                                        Phase 4: Integration
```

Critical path: Contracts (1.1-1.3) → Backend Agent API (2.2) → Backend Chat (2.3) → Frontend Deploy + Chat (3.2, 3.5). This is the minimum viable demo path.

---

## 8. Key Architectural Decisions

| Decision | Implication |
|----------|-------------|
| Backend signs agent transactions | Backend is custodial for agent wallets. Simplifies UX but concentrates risk. |
| User signs their own fund/complete/reject txs | User retains control of their funds. Frontend needs wagmi transaction signing. |
| On-chain rate limiting counters (dailyCalls mapping) | Gas cost per call for recordCall. Consider moving rate limiting fully to Redis for MVP and syncing periodically. |
| Single OpenRouter API key for all agents | Platform pays LLM costs. Revenue model depends on premium subscriptions covering API costs. |
| PostgreSQL + Redis (not pure on-chain) | Pragmatic for hackathon. On-chain for trust-critical data, off-chain for performance-critical data. |
| IPFS for deliverables and agent metadata | Content-addressable, decentralized. CID stored on-chain as bytes32 hash in AgentCommerce. |

---

## 9. Scalability Considerations (Post-Hackathon)

These are out of scope for MVP but inform architecture decisions now:

- **Agent workers**: Currently in-process. Could extract to a queue-based system (BullMQ + Redis) for horizontal scaling.
- **Event indexing**: Currently polling/listening. Could introduce a subgraph or indexer for efficient on-chain data queries.
- **Rate limiting**: Hybrid on-chain (SpawnRegistry.dailyCalls) + off-chain (Redis). For MVP, Redis is sufficient; on-chain counters serve as audit trail.
- **Multi-chain**: Architecture is Celo-only. Abstracting chain config behind an interface would enable future chains.
