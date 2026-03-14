# CeloSpawn Research Summary

**Date:** 2026-03-13
**Purpose:** Reference document for roadmap and planning. Synthesized from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md.

---

## 1. Recommended Stack

| Layer | Technology | Version | Confidence |
|-------|-----------|---------|------------|
| Contracts | Solidity + Foundry + OpenZeppelin | 0.8.28 / latest / 5.2.0 | HIGH |
| Frontend | Next.js (App Router) + React | 16.1.x / 19.2 | HIGH |
| Web3 | wagmi + viem | 3.5.x / 2.x | HIGH |
| UI | shadcn/ui (CLI v4) + Tailwind CSS 4 | latest | HIGH |
| State | Zustand 5.x (client) + TanStack Query 5.x (server) | latest | HIGH |
| Backend | Node.js LTS + Hono | 22.22.x / 4.x | HIGH / MED-HIGH |
| Database | PostgreSQL 16 + Drizzle ORM | latest | MED-HIGH |
| Cache | Redis 7.x | latest | HIGH |
| LLM | OpenRouter API (OpenAI-compatible SDK) | v1 | HIGH |
| Payments | thirdweb x402 SDK v2 | latest | MED-HIGH |
| Storage | Pinata (IPFS) | pinata-web3 | HIGH |
| Identity | Self Protocol SDK (ZK verification) | latest | MEDIUM |
| Monorepo | pnpm 9.x + Turborepo | latest | HIGH |
| Blockchain | Celo L2 (chainId 42220), cUSD as payment token | -- | HIGH |

Key standards: **ERC-8004** (agent identity NFT, live on mainnet) and **ERC-8183** (job escrow, draft).

---

## 2. Table Stakes Features

These are baseline requirements -- without them, users leave.

1. **No-code agent creation** -- 3-field form (name, template, price), 10-second deploy
2. **Pre-built templates** -- 10 templates covering DeFi, payments, content, research, support, data, ReFi, DAO, tutor, custom
3. **Chat interface** -- web-based chat at `/agent/{agentId}`
4. **Owner dashboard** -- agent list, call counts, revenue, badge status
5. **LLM routing** -- OpenRouter gateway for free (Gemma, Llama) and premium (Claude, GPT-4o, Gemini Pro) models
6. **Rate limiting** -- free unverified: 10/day, free verified: 30/day, premium: 200/month
7. **Wallet connection** -- MetaMask + WalletConnect v2 via wagmi
8. **Agent registry** -- public discovery page with search, sort, filter
9. **Guardrails** -- per-template content safety, max response length, blocked topics
10. **Freemium tier** -- zero-cost entry using OpenRouter free models

---

## 3. Key Differentiators

What makes CeloSpawn unique vs Virtuals, AgentKit, AutoGPT, CrewAI, MindStudio:

| # | Differentiator | Why It Matters |
|---|---------------|----------------|
| D-1 | **ERC-8004 on-chain agent identity** (auto-provisioned NFT) | Portable, censorship-resistant identity. First implementation on Celo. |
| D-2 | **x402 pay-per-call** (default on every agent) | Instant monetization with zero payment code. Agent IS the revenue API. |
| D-3 | **ERC-8183 job escrow** | Trustless "hire an agent" economy. Unlocks agent-as-freelancer use case. |
| D-4 | **EarthPool ReFi** (15% of premium to reforestation) | Revenue-funded environmental impact. Unique in Celo ecosystem. |
| D-5 | **Self Protocol verification** (ZK proof-of-human) | Sybil-resistant agent ownership. Sponsor alignment for hackathon. |
| D-6 | **Badge system** (Grey/Blue/Gold/Green) | Gamified trust + revenue driver (premium upgrades for badge). |
| D-7 | **10-second deploy** | Lowest barrier to entry of any agent platform. |
| D-8 | **AgentScan** (per-agent transparency page) | Etherscan for AI agents. On-chain verifiable history. |

**Strategic position:** No-code simplicity (like MindStudio) + blockchain-native monetization (like Virtuals) + utility-first economics (unlike Virtuals' speculation) + ReFi alignment (unique to Celo).

**Anti-features (deliberately NOT building):** token bonding curves, agent-to-agent autonomy, custom model fine-tuning, visual drag-and-drop builder, native mobile app, multi-chain, MCP server, full reputation scoring.

---

## 4. Architecture Overview

**Three-tier system:**

```
Frontend (Next.js)  -->  Backend (Hono)  -->  Celo Blockchain
   wagmi/viem              Agent Runtime        SpawnRegistry (ERC-721)
   shadcn/ui               x402 Gateway         AgentCommerce (escrow)
   Zustand                 Job Manager          EarthPool (ReFi)
                           PostgreSQL/Redis
                           OpenRouter/IPFS
```

**Component boundaries:**
- **Smart contracts** own money and ownership (NFTs, escrow, subscriptions, badges). Never execute LLM calls.
- **Backend** is the sole custodian of agent private keys (AES-256-GCM encrypted). Handles LLM routing, x402 settlement, IPFS uploads, job execution.
- **Frontend** handles user wallet signing for fund/subscribe/complete/reject transactions. Delegates agent-side operations to backend.

**Data storage split:**
- On-chain: agent ownership, wallet address, subscription status, job escrow, EarthPool balance
- PostgreSQL: encrypted agent keys, metadata, call logs, cached job state
- Redis: rate limits, session cache, LLM conversation context (TTL)
- IPFS: ERC-8004 agent metadata JSON, job deliverables

---

## 5. Critical Pitfalls

Top 7 risks that could kill the project, ordered by severity x likelihood:

| # | Pitfall | Impact | Mitigation |
|---|---------|--------|------------|
| 1 | **OpenRouter 50 req/day limit** (shared API key, free tier) | All agents stop responding within minutes | Buy $10 credits immediately (unlocks 1000/day). Per-agent rate limiting. Cache common queries. |
| 2 | **Agent wallet has no gas** for on-chain ops (submitJob) | Agents cannot complete jobs | Fund 0.01 CELO per wallet on creation, or use meta-transactions (ERC-2771). |
| 3 | **Demo day live service failure** (OpenRouter, IPFS, RPC) | Demo crashes in front of judges | Pre-deploy agents, cache golden-path responses, use dedicated RPC, record backup video. |
| 4 | **x402 v1/v2 header mismatch** (PRD uses v1 headers, SDK may default to v2) | Payment flow silently breaks | Use SDK header extraction (auto-detects version). Pin SDK version. Integration tests for both formats. |
| 5 | **On-chain/off-chain state desync** (contract succeeds, DB write fails) | Agents invisible in UI, stale subscription status | Write DB first (pending), transact on-chain, update DB (confirmed). Event listener for reconciliation. |
| 6 | **Celo precompile incompatibility** in Foundry tests | Tests pass locally, fail on fork | Use celo-foundry library with `vm.etch`. Always test against Celo fork in CI. |
| 7 | **Template prompt injection** (custom template allows unsafe system prompts) | Platform liability for harmful content | Immutable safety preamble prepended to every prompt. Blocklist validation. Content moderation. Admin kill switch. |

**Additional risks to monitor:** signature-based encryption varies by wallet (use server-managed master key for MVP), ERC-8004 draft interface changes (isolate behind adapter), gas estimation undercount on Celo L2 (1.5-2x buffer), cross-contract reentrancy (test all three contracts together).

---

## 6. Build Strategy

Four phases, ordered by dependency chain. Each phase produces a testable artifact.

### Phase 1: Smart Contracts (Foundation)

Build order driven by dependency: EarthPool (no deps) -> SpawnRegistry (needs EarthPool) -> AgentCommerce (needs SpawnRegistry).

1. EarthPool.sol -- deposit, withdraw, campaign tracking
2. SpawnRegistry.sol -- ERC-721 agent identity, subscriptions, badges, rate tracking
3. AgentCommerce.sol -- ERC-8183 job escrow state machine
4. Deploy script -- deploy to Celo mainnet fork, verify on Celoscan

### Phase 2: Backend Core (Agent Runtime)

Build API and runtime before frontend. Backend is testable via curl/httpie.

1. DB schema + project scaffold (PostgreSQL, Redis, Hono)
2. Agent registration API (wallet gen, encryption, IPFS, on-chain register)
3. Chat endpoint + OpenRouter integration (template engine, rate limiting)
4. x402 payment gateway (thirdweb SDK, HTTP 402 flow)
5. Job manager (event listener, agent execution, IPFS deliverables)
6. Subscription + Self verification endpoints

### Phase 3: Frontend (User Experience)

Build on stable backend APIs. Each page maps to a backend endpoint.

1. Scaffold + wallet connection (wagmi, viem, shadcn/ui)
2. Landing page + deploy form (critical path for "10-second deploy" demo)
3. Dashboard (agent list, stats, badges)
4. Registry + AgentScan (public discovery, per-agent detail)
5. Chat interface (message UI, x402 payment modal)
6. Job creation + review UI
7. Premium + verification flows

### Phase 4: Integration and Demo Prep

1. End-to-end testing of all flows
2. Template content (10 system prompts, pricing suggestions)
3. EarthPool public stats page
4. Error handling, loading states, edge cases
5. Deploy: frontend (Vercel), backend (Railway/Render), contracts (Celo mainnet)

**Critical path (minimum viable demo):**
Contracts (1-3) -> Backend agent API (2.2) -> Backend chat (2.3) -> Frontend deploy + chat (3.2, 3.5)

**Deployment targets:** Frontend on Vercel, backend on Railway/Render, contracts on Celo mainnet, IPFS via Pinata.

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

# CeloSpawn Stack Research

**Date:** 2026-03-13
**Context:** Greenfield no-code AI agent launchpad on Celo blockchain (hackathon MVP)
**Downstream:** Feeds into roadmap creation — prescriptive recommendations with rationale

---

## 1. Smart Contracts Layer

### Solidity Compiler: `0.8.28`

| Attribute | Value |
|-----------|-------|
| Version | **0.8.28** (not latest 0.8.34) |
| Confidence | **HIGH** |

**Why 0.8.28 and not 0.8.34:**
- 0.8.28 introduced transient storage support (EIP-1153), useful for reentrancy guards
- 0.8.34 (Feb 2026) is a bugfix for IR pipeline transient storage clearing — we are not using the IR pipeline for production
- 0.8.28 is the last version with broad tooling/audit compatibility across OpenZeppelin v5.x
- Hackathon context: stability over bleeding edge

**What NOT to use:**
- Solidity 0.8.34+ — too recent, risk of tooling incompatibility with Foundry/OZ
- Solidity < 0.8.20 — missing custom errors, explicit imports, `abi.encodeCall`

### Framework: Foundry (forge, cast, anvil)

| Attribute | Value |
|-----------|-------|
| Install | `curl -L https://foundry.paradigm.xyz | bash && foundryup` |
| Confidence | **HIGH** |

**Why Foundry over Hardhat:**
- Native Solidity tests — no context-switching to JavaScript
- Faster compilation (Rust-based) — critical for hackathon iteration speed
- Built-in fuzzing (`forge test --fuzz-runs 256`) for catching edge cases
- `cast` CLI for rapid Celo mainnet interaction during development
- `anvil` for local fork testing against Celo state
- First-class `forge script` for deterministic deployments

**What NOT to use:**
- Hardhat — slower compilation, JS test overhead, larger dependency tree
- Truffle — deprecated ecosystem, no active development
- Brownie — Python-based, team is JS/TS

### Libraries: OpenZeppelin Contracts `5.2.0`

| Attribute | Value |
|-----------|-------|
| Package | `openzeppelin/openzeppelin-contracts@v5.2.0` |
| Install | `forge install OpenZeppelin/openzeppelin-contracts@v5.2.0` |
| Confidence | **HIGH** |

**Why 5.2.0 (not 5.4.0):**
- 5.2.0 is the latest feature release with ERC-4337 utilities and cross-chain support
- 5.4.0 (Aug 2025) is a patch release — safe to upgrade if needed, but 5.2.0 has more documentation coverage
- Provides: ERC721URIStorage, Ownable, ReentrancyGuard, SafeERC20, IERC20Permit
- All contracts specified in PRD (SpawnRegistry, AgentCommerce, EarthPool) map directly to OZ v5 patterns

**What NOT to use:**
- OpenZeppelin v4.x — deprecated patterns, missing custom errors, larger bytecode
- Solmate — smaller community, less audit coverage, missing some needed extensions
- Solady — gas-optimized but less readable, risky for hackathon timeline

### Celo-Specific Contract Config

```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"
optimizer = true
optimizer_runs = 200
evm_version = "paris"

[rpc_endpoints]
celo = "${CELO_RPC_URL}"

[etherscan]
celo = { key = "${CELOSCAN_API_KEY}", url = "https://api.celoscan.io/api" }
```

**Key constants:**
- Celo Mainnet chainId: `42220`
- cUSD token: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- Celo is now an Ethereum L2 (since March 2025, block 31,056,500)

---

## 2. Frontend Layer

### Framework: Next.js `16.1.x` (App Router)

| Attribute | Value |
|-----------|-------|
| Version | **16.1.6** (latest stable, Feb 2026) |
| React | **19.2** (ships with Next.js 16) |
| Bundler | **Turbopack** (stable, default in Next.js 16) |
| Confidence | **HIGH** |

**Why Next.js 16 over 15 or 14:**
- Turbopack is now stable and default — significantly faster dev/build cycles
- React 19.2 with View Transitions, `useEffectEvent`, Activity component
- Layout deduplication and incremental prefetching — better UX for multi-page agent dashboards
- Server Components for agent registry pages (SEO + performance)
- Server Actions for form submissions (3-field deploy form)

**What NOT to use:**
- Next.js 14 — specified in PRD but outdated; 16 is stable and backwards-compatible
- Remix/React Router — smaller ecosystem for Web3, less wagmi integration examples
- Vite SPA — no SSR/SSG, poor SEO for public agent registry pages
- Astro — not suited for highly interactive dashboard UIs

### Web3 Integration: wagmi `3.5.x` + viem `2.x`

| Attribute | Value |
|-----------|-------|
| wagmi | **3.5.0** (latest, Mar 2026) |
| viem | **2.x** (bundled with wagmi 3.x) |
| Confidence | **HIGH** |

**Why wagmi + viem:**
- Official Celo documentation recommends viem as primary library
- viem has first-class Celo chain support (`celo`, `celoAlfajores` from `viem/chains`)
- Celo-specific: `feeCurrency` parameter support in wallet client for gas payment in cUSD
- wagmi provides 20+ React hooks: `useAccount`, `useWriteContract`, `useReadContract`, `useWaitForTransactionReceipt`
- Full TypeScript inference from contract ABIs — critical for SpawnRegistry/AgentCommerce interactions
- WalletConnect v2 + MetaMask connectors built-in

**What NOT to use:**
- ethers.js v6 — heavier, no native React hooks, less type inference from ABIs
- web3.js — legacy, larger bundle, worse TypeScript support
- @celo/contractkit — deprecated in favor of viem migration (per Celo docs)

### UI Components: shadcn/ui (CLI v4)

| Attribute | Value |
|-----------|-------|
| Version | **shadcn/cli v4** (Mar 2026) |
| Primitives | Radix UI (unified `radix-ui` package) |
| Styling | Tailwind CSS v4 |
| Confidence | **HIGH** |

**Why shadcn/ui:**
- Not a dependency — components are copied into your codebase (full ownership)
- CLI v4 includes `shadcn/skills` for AI agent-assisted component generation
- Design System Presets for consistent theming across agent dashboard, registry, chat UI
- Unified `radix-ui` package (Feb 2026) — cleaner dependency tree
- Direct Next.js App Router support with `shadcn init`

**What NOT to use:**
- Material UI — heavier runtime, opinionated styling conflicts with Tailwind
- Chakra UI — runtime CSS-in-JS, slower than Tailwind
- Ant Design — enterprise-focused aesthetic, not suited for Web3 product feel
- Headless UI — fewer pre-built components, more assembly required

### State Management: Zustand `5.x` + TanStack Query `5.x`

| Attribute | Value |
|-----------|-------|
| Zustand | **5.x** (~1KB, client state) |
| TanStack Query | **5.x** (server/async state) |
| Confidence | **HIGH** |

**Architecture:**
- **TanStack Query** — all server state: agent list fetching, on-chain data polling, API calls to backend
- **Zustand** — client state: wallet connection status, UI preferences, form state, chat history buffer
- **React Hook Form** — form state for 3-field deploy form, job creation form

**Why this combo over alternatives:**
- Industry standard pattern for 2026 React apps
- Zustand: no Provider needed, 1KB bundle, simple API
- TanStack Query: automatic caching, refetching, loading/error states for API data
- Clean separation: server state never pollutes client store

**What NOT to use:**
- Redux Toolkit — 15KB overhead, boilerplate overkill for hackathon scope
- Jotai — better for fine-grained reactivity, but Zustand is simpler for this use case
- React Context alone — no caching, no async state management, prop drilling risk

---

## 3. Backend Layer

### Runtime: Node.js `22.22.x` LTS (Jod)

| Attribute | Value |
|-----------|-------|
| Version | **22.22.1** LTS (Mar 2026) |
| Status | Maintenance LTS, supported through Apr 2027 |
| Confidence | **HIGH** |

**Why Node.js 22 LTS:**
- Maintenance LTS — stable, security patches guaranteed
- Native `fetch` API (no node-fetch needed)
- Built-in test runner for quick unit tests
- Shared language with frontend (TypeScript everywhere)

**What NOT to use:**
- Node.js 24.x — too new (Current, not LTS), risk of breaking changes
- Node.js 20.x — entering end-of-life (Apr 2026)
- Deno/Bun — smaller ecosystem for PostgreSQL/Redis libraries, less battle-tested in production

### Framework: Hono `4.x`

| Attribute | Value |
|-----------|-------|
| Package | `hono` |
| Confidence | **MEDIUM-HIGH** |

**Why Hono over Express:**
- 2-4x faster response times in benchmarks
- Built on Web Standards (Fetch API) — future-proof
- First-class TypeScript with type-inferred routes and middleware
- Zod integration for typed request validation (critical for agent registration API)
- Smaller bundle — matters less for server but indicates cleaner architecture
- Native middleware for CORS, rate limiting, error handling

**Why not Express:**
- Express 5 is stable but architecturally legacy (2010 design)
- TypeScript support feels retrofitted, incomplete type definitions
- For a greenfield hackathon project, Hono is the modern choice

**Risk mitigation:** Hono's middleware ecosystem is younger. If a specific middleware is missing, Express adapters can be used via `@hono/node-server`. Fallback to Express is low-cost if needed.

### Database: PostgreSQL `16` + Drizzle ORM

| Attribute | Value |
|-----------|-------|
| PostgreSQL | **16.x** |
| ORM | **Drizzle ORM** (latest) |
| Driver | `postgres` (node-postgres) |
| Confidence | **MEDIUM-HIGH** |

**Why Drizzle over Prisma:**
- Code-first schema definition in TypeScript — no separate schema language
- ~7.4KB bundle, no binary dependencies (Prisma requires native engine binary)
- SQL-like query builder — closer to raw SQL, less magic
- Edge-native (no binary issues) — relevant if we later deploy to edge
- Zero code generation step — faster iteration in hackathon context
- Type-safe queries inferred directly from schema definition

**Why not Prisma:**
- Prisma 7 improved but still requires binary engine or Accelerate proxy
- Schema-first approach adds a generation step (friction during rapid iteration)
- Heavier dependency tree

**Schema tables (from PRD):**
- `agents` — id, owner_address, agent_wallet, name, template_id, price_per_call, token_id, encrypted_private_key, status
- `call_logs` — id, agent_id, caller_address, model_used, tokens_used, revenue, timestamp
- `jobs` — id, agent_id, client_address, description, budget, deadline, status, deliverable_uri

### Cache: Redis (via Upstash or local)

| Attribute | Value |
|-----------|-------|
| Client | `ioredis` or `@upstash/redis` |
| Confidence | **HIGH** |

**Use cases:**
- Rate limiting counters (free: 10/30 calls/day, premium: 200/month)
- Session/nonce caching for wallet authentication
- Agent response caching (optional, for popular agents)

### LLM Gateway: OpenRouter API

| Attribute | Value |
|-----------|-------|
| API | `https://openrouter.ai/api/v1` |
| SDK | OpenAI-compatible SDK (`openai` npm package) |
| Confidence | **HIGH** |

**Why OpenRouter:**
- Single API for 290+ models from all major providers
- No markup on provider pricing — pass-through costs
- Free tier models (24 models, Mar 2026): Gemma, Llama, Mistral, etc.
- Premium models: Claude, GPT-4o, Gemini Pro — all through same API
- OpenAI-compatible API — use standard `openai` npm package, zero vendor lock-in
- Rate limits: 50 req/day (no credits), 1000 req/day (with $10+ credits purchased)

**Free models for CeloSpawn free tier:**
- `google/gemma-3-1b-it:free` — lightweight, fast
- `meta-llama/llama-3.1-8b-instruct:free` — good general purpose
- `openrouter/free` — auto-router across available free models

**Premium models for CeloSpawn premium tier:**
- `anthropic/claude-sonnet-4` — best coding/reasoning
- `openai/gpt-4o` — strong all-around
- `google/gemini-2.5-pro` — large context, multimodal

**What NOT to use:**
- Direct provider APIs (Anthropic, OpenAI, Google) — requires multiple integrations, multiple API keys
- LangChain — unnecessary abstraction for simple chat completion routing
- LlamaIndex — overkill, designed for RAG pipelines we don't need

### Payments: thirdweb x402 SDK (v2)

| Attribute | Value |
|-----------|-------|
| Package | `@thirdweb-dev/x402` (client + server) |
| Protocol | x402 v2 (header-based: `PAYMENT-SIGNATURE` / `PAYMENT-RESPONSE`) |
| Confidence | **MEDIUM-HIGH** |

**Why thirdweb x402:**
- Official x402 protocol implementation — the standard for HTTP 402 payments
- v2 protocol (2026): header-based flow, cleaner than v1's `X-PAYMENT` headers
- Supports 170+ EVM chains including Celo
- Dynamic pricing support — can charge per-token for LLM usage
- Client auto-fulfills payment and retries — minimal UX friction
- Backward-compatible with v1

**How it works for CeloSpawn:**
1. User sends chat request to agent endpoint
2. Server returns HTTP 402 with price in `PAYMENT-SIGNATURE` header
3. x402 client (frontend) prompts wallet approval (ERC-2612 permit on cUSD)
4. Payment settled on-chain
5. Request retried with payment proof — agent processes and responds

**Risk:** x402 is still a relatively new protocol. Fallback: implement manual ERC-20 approve + transfer flow if thirdweb SDK has issues.

---

## 4. Blockchain Standards

### ERC-8004: Trustless Agents (Agent Identity)

| Attribute | Value |
|-----------|-------|
| Status | **Live on Ethereum mainnet** (Jan 29, 2026) |
| Authors | MetaMask, Ethereum Foundation, Google, Coinbase |
| Confidence | **HIGH** |

**Three registries:**
1. **Identity Registry** — ERC-721 + URIStorage, resolves to agent registration JSON
2. **Reputation Registry** — posting/fetching feedback signals
3. **Validation Registry** — hooks for independent validation (zkML, TEE, judges)

**CeloSpawn usage:**
- SpawnRegistry.sol extends ERC-721URIStorage to implement the Identity Registry
- Each agent minted as NFT with URI pointing to IPFS-hosted registration JSON
- Registration JSON follows ERC-8004 agent card format
- Reputation and Validation registries are P2 (post-hackathon)

**Implementation note:** ERC-8004 is deliberately minimal on-chain, with application logic off-chain. This aligns perfectly with CeloSpawn's architecture (on-chain for ownership/identity, off-chain for metadata/runtime).

### ERC-8183: Agentic Commerce (Job Escrow)

| Attribute | Value |
|-----------|-------|
| Status | **Draft/Review** (co-developed by Ethereum Foundation + Virtuals Protocol) |
| Confidence | **MEDIUM-HIGH** |

**Job lifecycle:** `Open -> Funded -> Submitted -> Terminal`

**Three roles per job:**
- **Client** — requests work, funds escrow
- **Provider** — performs work (the AI agent)
- **Evaluator** — confirms completion (can be client, oracle, or third party)

**CeloSpawn usage:**
- AgentCommerce.sol implements ERC-8183 job escrow
- Client creates job with description + budget + deadline
- Budget held in cUSD escrow
- Agent submits deliverable (IPFS URI)
- Client evaluates: approve (funds released) or reject (funds returned)
- 5% platform fee on completed jobs

**Risk:** ERC-8183 is newer than ERC-8004 and still in draft. Our implementation should follow the spec but be prepared for minor interface changes. The core state machine (Open/Funded/Submitted/Terminal) is stable.

---

## 5. Identity & Verification

### Self Protocol

| Attribute | Value |
|-----------|-------|
| Integration | Self SDK (ZK proof verification) |
| Users | 7M+ globally (174 countries) |
| Hackathon | Sponsor of Synthesis Hackathon (Feb 2026) |
| Confidence | **MEDIUM** |

**CeloSpawn usage:**
- Proof-of-human verification for agent owners (sybil resistance)
- NFC passport scanning + ZK proof generation via Self mobile app
- No personal data exposed — only proof-of-uniqueness
- Verified status stored on-chain in SpawnRegistry (`isVerified` flag)
- Drives badge system: Blue badge (verified), Green badge (verified + premium)

**Risk:** Self SDK integration complexity unknown until development starts. Fallback: mock verification for hackathon demo, integrate real Self SDK as fast-follow.

---

## 6. Decentralized Storage

### Pinata (IPFS)

| Attribute | Value |
|-----------|-------|
| Package | `pinata-web3` |
| Usage | Agent registration JSON (ERC-8004), job deliverables (ERC-8183) |
| Confidence | **HIGH** |

**Why Pinata over alternatives:**
- Industry standard — powers 80%+ of NFT media
- Developer-friendly SDK: `pinata.upload.file(file)`
- Edge-cached gateways — millisecond latency for reading agent metadata
- Free tier sufficient for hackathon (1GB storage, 100 uploads/month)

**What NOT to use:**
- web3.storage — original free tier wound down, enterprise-focused now
- Arweave — permanent storage is overkill for mutable agent metadata
- Raw IPFS node — operational overhead, no guaranteed availability

---

## 7. Development & Deployment

### Monorepo Structure

```
celospawnag/
  packages/
    contracts/        # Foundry project (Solidity)
    web/              # Next.js 16 frontend
    api/              # Hono backend
    shared/           # Shared types, ABIs, constants
  package.json        # pnpm workspace root
  pnpm-workspace.yaml
  turbo.json          # Turborepo for build orchestration
```

### Package Manager: pnpm `9.x`

**Why pnpm:** Disk-efficient (symlinked node_modules), strict dependency resolution, native workspace support. Faster than npm/yarn for monorepo installs.

### Build Orchestration: Turborepo

**Why Turborepo:** Caches build outputs across packages, parallel task execution, incremental builds. Pairs naturally with pnpm workspaces and Next.js (both Vercel ecosystem).

### Deployment Targets

| Component | Target | Rationale |
|-----------|--------|-----------|
| Frontend | Vercel | Native Next.js 16 support, edge functions, preview deploys |
| Backend | Railway or Render | Simple Node.js hosting, PostgreSQL add-on, Redis add-on |
| Contracts | Celo Mainnet | `forge script` deployment via RPC |
| IPFS | Pinata | Managed pinning, CDN gateway |

---

## 8. Full Version Matrix

| Technology | Version | Role | Confidence |
|------------|---------|------|------------|
| Solidity | 0.8.28 | Smart contract language | HIGH |
| Foundry | latest (foundryup) | Contract framework | HIGH |
| OpenZeppelin | 5.2.0 | Contract libraries | HIGH |
| Next.js | 16.1.x | Frontend framework | HIGH |
| React | 19.2 | UI library (via Next.js 16) | HIGH |
| Turbopack | stable (via Next.js 16) | Bundler | HIGH |
| wagmi | 3.5.x | React Web3 hooks | HIGH |
| viem | 2.x | TypeScript Ethereum client | HIGH |
| shadcn/ui | CLI v4 | UI component library | HIGH |
| Tailwind CSS | 4.x | Utility-first CSS | HIGH |
| Zustand | 5.x | Client state management | HIGH |
| TanStack Query | 5.x | Server state management | HIGH |
| React Hook Form | 7.x | Form state | HIGH |
| Node.js | 22.22.x LTS | Backend runtime | HIGH |
| Hono | 4.x | Backend framework | MEDIUM-HIGH |
| Drizzle ORM | latest | Database ORM | MEDIUM-HIGH |
| PostgreSQL | 16.x | Primary database | HIGH |
| Redis | 7.x | Cache / rate limiting | HIGH |
| OpenRouter | API v1 | LLM gateway | HIGH |
| thirdweb x402 | v2 | Payment protocol | MEDIUM-HIGH |
| Pinata | pinata-web3 | IPFS storage | HIGH |
| Self Protocol | SDK | Identity verification | MEDIUM |
| pnpm | 9.x | Package manager | HIGH |
| Turborepo | latest | Build orchestration | HIGH |

---

## 9. Key Dependencies (package.json sketch)

### `packages/web/package.json`

```json
{
  "dependencies": {
    "next": "^16.1.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "wagmi": "^3.5.0",
    "viem": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "tailwindcss": "^4.0.0",
    "radix-ui": "^1.0.0",
    "@thirdweb-dev/x402": "latest"
  }
}
```

### `packages/api/package.json`

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "drizzle-orm": "latest",
    "postgres": "^3.0.0",
    "ioredis": "^5.0.0",
    "openai": "^4.0.0",
    "pinata-web3": "latest",
    "viem": "^2.0.0",
    "zod": "^3.0.0"
  }
}
```

---

## 10. Anti-Patterns & Explicit Exclusions

| Do NOT Use | Reason |
|------------|--------|
| Hardhat | Slower, JS test overhead, larger deps |
| ethers.js | No React hooks, worse type inference than viem |
| @celo/contractkit | Deprecated, Celo recommends viem migration |
| LangChain | Unnecessary abstraction for simple chat routing |
| Prisma | Binary dependency, code generation step, heavier |
| Express.js | Legacy architecture, weaker TypeScript |
| Redux | 15KB overhead, boilerplate for hackathon scope |
| web3.storage | Free tier discontinued |
| Solmate/Solady | Smaller community, less audit coverage |
| Material UI / Chakra | Runtime CSS-in-JS, conflicts with Tailwind |

---

## Sources

- [Foundry - Ethereum Development Framework](https://www.getfoundry.sh/)
- [Next.js 16](https://nextjs.org/blog/next-16)
- [wagmi Documentation](https://wagmi.sh/)
- [viem Celo Chain Support](https://viem.sh/docs/chains/celo)
- [Celo viem Documentation](https://docs.celo.org/developer/viem)
- [thirdweb x402 Payments](https://portal.thirdweb.com/x402)
- [thirdweb x402 Protocol v2](https://blog.thirdweb.com/changelog/support-for-x402-protocol-v2/)
- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8183: Agentic Commerce](https://eips.ethereum.org/EIPS/eip-8183)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Free Models (Mar 2026)](https://costgoat.com/pricing/openrouter-free-models)
- [OpenZeppelin Contracts v5.2](https://www.openzeppelin.com/news/introducing-openzeppelin-contracts-5.2-and-openzeppelin-community-contracts)
- [shadcn/ui CLI v4 (Mar 2026)](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [Solidity 0.8.34 Release](https://www.soliditylang.org/blog/2026/02/18/solidity-0.8.34-release-announcement/)
- [Node.js 22.22.1 LTS](https://nodejs.org/en/blog/release/v22.22.1)
- [Drizzle vs Prisma 2026](https://www.bytebase.com/blog/drizzle-vs-prisma/)
- [React State Management 2026](https://www.pkgpulse.com/blog/state-of-react-state-management-2026)
- [Pinata IPFS](https://pinata.cloud/)
- [Self Protocol](https://blockchain.news/flashnews/selfprotocol-joins-celo-hackathon-with-zk-powered-identity-verification)

# CeloSpawn Features Analysis

## Research Context

**Question:** What features do AI agent builder/launchpad platforms have? What is table stakes vs differentiating for a Celo-native agent launchpad?

**Competitors Analyzed:** Virtuals Protocol, AgentKit (Coinbase CDP), AutoGPT, CrewAI, MindStudio, Lindy, Relay.app

**Date:** 2026-03-13

---

## Competitive Landscape Summary

| Platform | Type | Target User | Blockchain-Native | Monetization Model |
|----------|------|-------------|--------------------|--------------------|
| Virtuals Protocol | Agent tokenization launchpad | Crypto-native builders | Yes (Base, Solana) | Agent token bonding curves, VIRTUAL buyback-and-burn |
| AgentKit (Coinbase) | Developer toolkit/SDK | Developers | Yes (EVM + Solana) | No built-in monetization (toolkit only) |
| AutoGPT | Open-source agent framework | Technical users | No | Self-hosted, pay-per-LLM-call |
| CrewAI | Multi-agent orchestration platform | Enterprise/developers | No | SaaS subscriptions |
| MindStudio | No-code AI agent builder | Non-technical users | No | SaaS subscriptions |
| Lindy | No-code AI agent builder | Business users | No | SaaS subscriptions |
| **CeloSpawn** | **No-code agent launchpad** | **Non-technical users** | **Yes (Celo)** | **Subscriptions + x402 pay-per-call + ERC-8183 job escrow** |

**Key gap CeloSpawn fills:** No existing platform combines no-code simplicity with blockchain-native identity, pay-per-call monetization, and job escrow. Virtuals is closest but targets crypto-native token traders, not non-technical agent creators. Web2 no-code builders (MindStudio, Lindy) lack any blockchain integration. AgentKit is developer-only.

---

## Feature Categories

### 1. TABLE STAKES (Must Have or Users Leave)

These features are baseline expectations. Without them, users will not adopt the platform regardless of differentiators.

---

#### TS-1: No-Code Agent Creation (Visual Form / Wizard)

**What:** Users create agents through a simple form or wizard, not code.
**Why table stakes:** Every major no-code builder (MindStudio, Lindy, CrewAI Studio) offers this. Users expect 5-60 minute setup.
**CeloSpawn implementation:** 3-field form (name, template, price) with 10-second deploy.
**Complexity:** Low
**Dependencies:** Template system (TS-3), backend agent runtime

---

#### TS-2: Pre-Built Agent Templates

**What:** Library of ready-to-use agent templates for common use cases.
**Why table stakes:** AutoGPT marketplace, CrewAI pre-built crews, MindStudio template gallery all offer this. Users need starting points.
**CeloSpawn implementation:** 10 templates (DeFi, Payment, Content, Research, Support, Data, ReFi, DAO, Tutor, Custom).
**Complexity:** Low-Medium (system prompt engineering per template)
**Dependencies:** LLM routing (TS-5)

---

#### TS-3: Chat Interface for Agent Interaction

**What:** Web-based chat UI for users to interact with deployed agents.
**Why table stakes:** Every agent platform provides a way to test and use agents. Without this, agents have no interface.
**CeloSpawn implementation:** Chat interface at `/agent/{agentId}` with message history.
**Complexity:** Medium
**Dependencies:** Agent runtime, LLM routing (TS-5)

---

#### TS-4: Agent Dashboard and Management

**What:** Owner dashboard to view agent stats, manage settings, and monitor usage.
**Why table stakes:** AutoGPT, CrewAI, and all SaaS agent builders provide dashboards. 89% of organizations have implemented observability (LangChain State of Agent Engineering 2026).
**CeloSpawn implementation:** Dashboard showing agent list, call counts, revenue, badge status.
**Complexity:** Medium
**Dependencies:** Backend API, database schema

---

#### TS-5: LLM Routing / Multi-Model Support

**What:** Connect agents to LLM providers (OpenAI, Anthropic, Google, etc.) with ability to switch models.
**Why table stakes:** Every agent builder supports multiple LLMs. Model choice is fundamental to agent quality.
**CeloSpawn implementation:** OpenRouter as unified gateway -- free tier (Gemma, Llama) and premium tier (Claude, GPT-4o, Gemini Pro).
**Complexity:** Low (OpenRouter abstracts this)
**Dependencies:** OpenRouter API key

---

#### TS-6: Rate Limiting and Usage Controls

**What:** Enforce usage limits per tier to control costs and prevent abuse.
**Why table stakes:** All SaaS platforms have usage limits. Without this, LLM costs are unbounded.
**CeloSpawn implementation:** Free unverified: 10 calls/day, Free verified: 30 calls/day, Premium: 200 calls/month.
**Complexity:** Low-Medium
**Dependencies:** Redis for rate tracking, on-chain rate limit check

---

#### TS-7: Wallet Connection (Web3 Login)

**What:** Connect crypto wallet to authenticate and manage agents.
**Why table stakes:** For any blockchain-native platform, wallet connection IS authentication. Every Web3 dApp requires this.
**CeloSpawn implementation:** MetaMask + WalletConnect v2 via wagmi connectors.
**Complexity:** Low
**Dependencies:** wagmi, viem, Celo chain config

---

#### TS-8: Agent Discovery / Registry

**What:** Public-facing page where users can browse, search, and find agents.
**Why table stakes:** AutoGPT marketplace, Virtuals agent listing, CrewAI template gallery -- discovery is how users find and use agents.
**CeloSpawn implementation:** `/registry` page with search by name, template, price range. Sort by newest, most calls, cheapest. Filter by badge type.
**Complexity:** Medium
**Dependencies:** Backend API, SpawnRegistry contract read

---

#### TS-9: Error Handling and Guardrails

**What:** Content safety guardrails, error recovery, and graceful failures.
**Why table stakes:** Users expect agents to handle edge cases. MindStudio and Lindy both have built-in guardrails. Without them, agents produce harmful or nonsensical output.
**CeloSpawn implementation:** Per-template guardrails (max response length, blocked topics, required disclaimers).
**Complexity:** Low-Medium
**Dependencies:** Template system (TS-2)

---

#### TS-10: Freemium Tier (Zero-Cost Entry)

**What:** Users can create and use agents for free before paying.
**Why table stakes:** AutoGPT is MIT-licensed and free. MindStudio, Lindy, and CrewAI all offer free tiers. Paywalls at entry kill adoption.
**CeloSpawn implementation:** Free agents use OpenRouter free-tier models (no API key needed from user). 10 calls/day.
**Complexity:** Low
**Dependencies:** OpenRouter free models, rate limiting (TS-6)

---

### 2. DIFFERENTIATORS (Competitive Advantage)

These features set CeloSpawn apart from every competitor. They are CeloSpawn's reason to exist.

---

#### D-1: ERC-8004 On-Chain Agent Identity (AUTO-PROVISIONED)

**What:** Every deployed agent automatically receives an ERC-721 NFT with ERC-8004 compliant identity -- on-chain registration URI, wallet binding, and portable reputation handle. No user action needed beyond clicking "Deploy."
**Why differentiating:**
- Virtuals mints NFTs for agents but uses proprietary tokenization, not ERC-8004.
- AgentKit provides wallets but no on-chain identity standard.
- AutoGPT and CrewAI have zero on-chain identity.
- ERC-8004 went live on Ethereum mainnet January 29, 2026, backed by MetaMask, EF, Google, and Coinbase. CeloSpawn is among the first to implement it on Celo.
**Competitive moat:** Agents get portable, censorship-resistant identity that works across any ERC-8004-aware platform. Reputation follows the agent.
**Complexity:** High (smart contract + IPFS metadata + auto-wallet generation)
**Dependencies:** SpawnRegistry.sol, IPFS (Pinata/web3.storage), ethers.js wallet generation, AES-256-GCM encryption

---

#### D-2: x402 Pay-Per-Call Monetization (DEFAULT ON)

**What:** Every agent automatically gets an x402-compatible payment endpoint. External users/agents pay per call using cUSD via HTTP 402 flow. Agent owners earn revenue from day 1 with zero payment integration work.
**Why differentiating:**
- x402 is the emerging internet-native payment standard (35M+ transactions, $10M+ volume on Solana as of 2026). Supported by Cloudflare, Google, Vercel.
- No other no-code platform auto-configures x402 endpoints.
- Virtuals monetizes via token bonding curves (speculation-first), not service-first payments.
- AutoGPT/CrewAI have no built-in monetization for agent creators.
- AgentKit provides wallet actions but no payment-for-service layer.
**Competitive moat:** Instant monetization without writing payment code. The agent IS the revenue-generating API.
**Complexity:** High (thirdweb x402 SDK integration, ERC-2612 permit verification, on-chain settlement)
**Dependencies:** thirdweb x402 SDK, SpawnRegistry for price lookup, cUSD on Celo

---

#### D-3: ERC-8183 Job Escrow (Agentic Commerce)

**What:** Beyond simple pay-per-call, users can hire agents for complex multi-step tasks with guaranteed payment via on-chain escrow. Job lifecycle: Open -> Funded -> Submitted -> Terminal (Completed/Rejected/Expired).
**Why differentiating:**
- ERC-8183 was co-developed by Virtuals Protocol and the Ethereum Foundation. CeloSpawn implements the actual standard on Celo.
- No other no-code platform offers trustless job escrow for AI agents.
- Enables a fundamentally different use case: "hire an agent for a project" vs "chat with an agent."
- Evaluator role can be client, smart contract, or another agent -- flexible trust model.
**Competitive moat:** Unlocks agent-as-freelancer economy. Jobs create transactional data that feeds ERC-8004 reputation.
**Complexity:** High (AgentCommerce.sol state machine, IPFS deliverable storage, job lifecycle management)
**Dependencies:** AgentCommerce.sol, SpawnRegistry.sol (agent lookup), IPFS for deliverables, cUSD escrow

---

#### D-4: EarthPool ReFi (Revenue-Funded Environmental Impact)

**What:** 15% of every premium subscription payment ($3 of $20) flows to the EarthPool smart contract. At $500 accumulated, a tree planting campaign is triggered. All campaigns are recorded on-chain with IPFS proof (photos, receipts).
**Why differentiating:**
- Directly aligns with Celo's core mission of regenerative finance.
- No other agent platform has a built-in environmental impact mechanism.
- Virtuals uses buyback-and-burn (deflationary tokenomics). CeloSpawn uses revenue-to-reforestation (regenerative impact).
- On-chain transparency: anyone can audit campaign history, amounts, and proof.
- "Green badge" for verified premium agents creates social incentive.
**Competitive moat:** Unique positioning in the Celo ecosystem. Hackathon judges evaluating Celo track will weigh ReFi alignment heavily.
**Complexity:** Medium (EarthPool.sol is relatively simple, campaign execution is off-chain partnership)
**Dependencies:** EarthPool.sol, SpawnRegistry.sol (premium payment split), IPFS for campaign proof

---

#### D-5: Self Protocol Verification (Sybil-Resistant Identity)

**What:** Agent owners verify their humanity via Self Protocol (ZK passport/ID scan). Verified owners get a Blue badge, increased rate limits (10 -> 30 calls/day), and higher trust in the registry.
**Why differentiating:**
- Combines proof-of-human with agent identity -- answers "who is behind this agent?"
- Virtuals has no owner verification. AutoGPT/CrewAI have no identity layer.
- ZK-based: no personal data exposed on-chain, only verification status.
- Sybil resistance prevents one person from spamming thousands of low-quality agents.
**Competitive moat:** Trust layer that no competitor offers. Critical for hackathon (Self Protocol is a sponsor).
**Complexity:** Medium (Self Protocol SDK integration, ZK proof verification, backend relay to on-chain)
**Dependencies:** Self Protocol API, SpawnRegistry.setVerified(), callback URL handling

---

#### D-6: Badge System (Grey/Blue/Gold/Green)

**What:** Visual trust indicators that combine verification and subscription status into a single, scannable signal.
**Why differentiating:**
- Simple gamification that incentivizes verification AND premium subscription.
- Green badge (verified + premium) = EarthPool contributor -- social status + environmental impact.
- No competitor has a tiered badge system combining identity verification with service tier.
**Competitive moat:** Drives both revenue (premium upgrades) and trust (verification). Reinforces EarthPool narrative.
**Complexity:** Low (contract logic is 4 lines, UI is badge rendering)
**Dependencies:** SpawnRegistry.getBadge(), Self verification (D-5), premium subscription

---

#### D-7: 10-Second Deploy (Radical Simplicity)

**What:** Agent deployment in 10 seconds with only 3 form fields. Everything else (wallet, identity, payment endpoint, runtime) is auto-provisioned.
**Why differentiating:**
- AutoGPT requires self-hosting and CLI knowledge.
- CrewAI takes minutes with visual builder, still requires understanding of agent concepts.
- Virtuals requires 100 VIRTUAL tokens and understanding of bonding curves.
- AgentKit requires Node.js development.
- CeloSpawn: name + template + price = deployed, monetizable agent.
**Competitive moat:** Lowest possible barrier to entry. "10 detik" tagline is memorable and testable.
**Complexity:** Medium (complexity is hidden in the backend automation, not in the UX)
**Dependencies:** All backend services (wallet gen, IPFS, contract call, runtime setup, x402 config)

---

#### D-8: AgentScan (On-Chain Transparency Page)

**What:** Per-agent detail page showing on-chain identity, wallet, registration TX, badge status, x402 endpoint, call stats, job history, and revenue -- all verifiable on the blockchain.
**Why differentiating:**
- Etherscan for AI agents. No other platform offers this level of on-chain transparency.
- Developers can see the x402 endpoint URL and integrate directly.
- Job history (ERC-8183) shows agent track record -- feeds trust decisions.
**Competitive moat:** Transparency builds trust. Developers discovering agents via AgentScan can integrate via x402 programmatically.
**Complexity:** Medium (read from contract + database, display in UI)
**Dependencies:** SpawnRegistry contract reads, AgentCommerce contract reads, backend stats API

---

### 3. ANTI-FEATURES (Deliberately NOT Building)

These are features that competitors have but CeloSpawn should intentionally avoid.

---

#### AF-1: Agent Token / Bonding Curve Speculation

**What Virtuals does:** Every agent gets its own token with a bonding curve. Users speculate on agent tokens. Revenue comes from trading fees.
**Why NOT build:** Turns the platform into a speculative casino. Attracts traders, not agent users. Regulatory risk. Distracts from utility-first value proposition. CeloSpawn is about service monetization (x402, ERC-8183), not token speculation.
**Risk of building:** Regulatory scrutiny, attracts wrong user base, misaligned incentives (agents valued by token price, not service quality).

---

#### AF-2: Agent-to-Agent Autonomous Job Creation

**What it is:** Agents autonomously hiring other agents for sub-tasks without human oversight.
**Why NOT build (for MVP):** Extremely complex orchestration. Safety risks (runaway spending). Not needed for core value proposition. Explicitly listed as out-of-scope in PROJECT.md.
**Revisit:** P2 after establishing single-agent job lifecycle.

---

#### AF-3: Custom Model Fine-Tuning / Training

**What CrewAI does:** Agent training with and without human feedback, LLM fine-tuning.
**Why NOT build:** Adds massive complexity. OpenRouter handles model selection. Templates with well-crafted system prompts are sufficient for MVP. Fine-tuning requires compute infrastructure CeloSpawn should not own.
**Revisit:** P3, only if there is demonstrated demand from power users.

---

#### AF-4: Visual Workflow / Drag-and-Drop Builder

**What CrewAI/AutoGPT do:** Visual node-based editors for complex multi-agent workflows.
**Why NOT build:** Contradicts 10-second deploy simplicity. Targets developer/power-user segment that CrewAI already serves well. CeloSpawn's value is radical simplicity, not workflow complexity.
**Revisit:** Never -- this is a different product category.

---

#### AF-5: Native Mobile App

**What it is:** iOS/Android native application.
**Why NOT build:** Web-first is sufficient. Mobile adds two codebases to maintain. Wallet connection is better on desktop. Hackathon scope constraint.
**Revisit:** P2 if mobile usage exceeds 40% of traffic.

---

#### AF-6: Multi-Chain Deployment

**What AgentKit does:** Support for multiple chains (EVM + Solana).
**Why NOT build:** Celo-native is the positioning. Multi-chain dilutes the Celo track hackathon story. cUSD as sole payment token reduces complexity. Celo's low gas fees already make it ideal for agent transactions.
**Revisit:** P3, only if Celo ecosystem requests Base/Ethereum bridge.

---

#### AF-7: MCP (Model Context Protocol) Server

**What it is:** Standardized protocol for LLMs to connect to external tools/data sources. 75+ connectors in Claude alone.
**Why NOT build (for MVP):** Adds complexity to agent runtime. Templates with built-in Celo skills are sufficient. MCP is becoming table stakes for developer platforms but CeloSpawn targets non-developers.
**Revisit:** P2 -- add MCP support for Custom template (templateId=9) to let power users connect external tools.

---

#### AF-8: Reputation Scoring System

**What ERC-8004 supports:** Full Reputation Registry with feedback signals.
**Why NOT build (for MVP):** Basic stats (total calls, total revenue, job completion rate) are sufficient signal. Full reputation requires critical mass of usage data. Explicitly listed as out-of-scope in PROJECT.md.
**Revisit:** P2 after sufficient on-chain activity data exists.

---

## Feature Dependency Map

```
TS-7 (Wallet Connect)
  |
  v
TS-1 (No-Code Creation) ---> TS-2 (Templates) ---> TS-5 (LLM Routing)
  |                                                       |
  v                                                       v
D-1 (ERC-8004 Identity) -----> D-8 (AgentScan)     TS-3 (Chat Interface)
  |                                |
  v                                v
D-2 (x402 Payments) ---------> TS-8 (Agent Registry)
  |
  v
D-3 (ERC-8183 Jobs) ---------> D-8 (AgentScan - job history)
  |
  |
TS-6 (Rate Limiting) <-------- D-5 (Self Verification)
  |                                |
  v                                v
TS-10 (Free Tier)              D-6 (Badge System)
                                   |
                                   v
                               D-4 (EarthPool) <--- Premium Subscription
                                   |
                                   v
                               TS-4 (Dashboard)
```

**Critical path:** Wallet Connect -> No-Code Creation -> ERC-8004 Identity -> x402 Payments -> Chat Interface -> Agent Registry

---

## Complexity Summary

| Feature | Complexity | Category | MVP Critical? |
|---------|-----------|----------|---------------|
| TS-1: No-Code Creation | Low | Table Stakes | Yes |
| TS-2: Templates (10) | Low-Medium | Table Stakes | Yes |
| TS-3: Chat Interface | Medium | Table Stakes | Yes |
| TS-4: Dashboard | Medium | Table Stakes | Yes |
| TS-5: LLM Routing | Low | Table Stakes | Yes |
| TS-6: Rate Limiting | Low-Medium | Table Stakes | Yes |
| TS-7: Wallet Connect | Low | Table Stakes | Yes |
| TS-8: Agent Registry | Medium | Table Stakes | Yes |
| TS-9: Guardrails | Low-Medium | Table Stakes | Yes |
| TS-10: Free Tier | Low | Table Stakes | Yes |
| D-1: ERC-8004 Identity | High | Differentiator | Yes |
| D-2: x402 Payments | High | Differentiator | Yes |
| D-3: ERC-8183 Jobs | High | Differentiator | Yes |
| D-4: EarthPool ReFi | Medium | Differentiator | Yes |
| D-5: Self Verification | Medium | Differentiator | Yes |
| D-6: Badge System | Low | Differentiator | Yes |
| D-7: 10-Second Deploy | Medium | Differentiator | Yes |
| D-8: AgentScan | Medium | Differentiator | Yes |

---

## Strategic Positioning

CeloSpawn occupies a unique intersection that no competitor covers:

```
                    Blockchain-Native
                         |
         Virtuals -------+------- CeloSpawn
        (speculative)    |        (utility-first)
                         |
     AgentKit -----------+
    (dev toolkit)        |
                         |
  No Blockchain ---------+--------- Blockchain
                         |
     AutoGPT ------------+
    (self-hosted)        |
                         |
     CrewAI/MindStudio --+
    (SaaS, no crypto)    |
                         |
                    Non-Blockchain
```

**CeloSpawn's unique position:** No-code simplicity (like MindStudio/Lindy) + blockchain-native monetization (like Virtuals) + utility-first economics (unlike Virtuals' speculation) + ReFi alignment (unique to Celo ecosystem).

---

## Sources

- [Virtuals Protocol Whitepaper - Agent Tokenization Platform](https://whitepaper.virtuals.io/about-virtuals/agent-tokenization-platform-launchpad)
- [Virtuals Protocol - Agent Tokenization](https://whitepaper.virtuals.io/about-virtuals/tokenization/agent-tokenization-platform)
- [ERC-8004: Trustless Agents - Ethereum Improvement Proposals](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8004 Launches on Ethereum Mainnet](https://crypto.news/ethereum-erc-8004-ai-agents-mainnet-launch-2026/)
- [ERC-8183: Agentic Commerce - Ethereum Improvement Proposals](https://eips.ethereum.org/EIPS/eip-8183)
- [Virtuals Protocol Unveils ERC-8183 Standard](https://mpost.io/virtuals-protocol-unveils-new-erc-8183-standard-to-enable-trustless-commerce-between-ai-agents-and-users/)
- [x402 - Internet-Native Payments Standard](https://www.x402.org/)
- [x402 on Solana](https://solana.com/x402/what-is-x402)
- [Coinbase AgentKit Documentation](https://docs.cdp.coinbase.com/agent-kit/welcome)
- [AgentKit Q1 Update - Coinbase](https://www.coinbase.com/developer-platform/discover/launches/agentkit-q1-update)
- [AutoGPT Platform](https://agpt.co/blog/introducing-the-autogpt-platform)
- [CrewAI Platform](https://crewai.com/)
- [LangChain State of Agent Engineering](https://www.langchain.com/state-of-agent-engineering)
- [No-Code AI Agent Builders 2026 - MindStudio](https://www.mindstudio.ai/blog/no-code-ai-agent-builders)
- [No-Code AI Agent Builders 2026 - Budibase](https://budibase.com/blog/ai-agents/no-code-ai-agent-builders/)
- [AI Agent Tools Landscape 2026 - StackOne](https://www.stackone.com/blog/ai-agent-tools-landscape-2026/)

# CeloSpawn Pitfalls Analysis

Research date: 2026-03-13
Scope: Domain-specific pitfalls for a no-code AI agent launchpad on Celo using Foundry, x402, ERC-8004, ERC-8183, OpenRouter, and server-side wallet management.

---

## 1. Smart Contracts on Celo with Foundry

### 1.1 Celo Precompile Incompatibility with Foundry

**Pitfall:** Foundry's Revm only supports Ethereum mainnet precompiles. Celo uses custom precompiles, so `balanceOf()`, `transfer()`, and `deal()` fail silently or revert when forking Celo mainnet for tests. Tests pass locally on vanilla Anvil but fail against a Celo fork.

**Warning signs:**
- `forge test --fork-url https://forno.celo.org` hangs or reverts on native CELO token operations
- `deal()` cheatcode does nothing for cUSD or CELO balances
- Tests pass without fork but fail with fork

**Prevention:**
- Use the [celo-foundry library](https://github.com/bowd/celo-foundry) which uses `vm.etch` to mock precompile addresses
- For cUSD (an ERC-20, not a precompile), use `deal()` with the cUSD contract address directly or use `vm.prank` + `transfer` from a whale address
- Always run the full test suite against a Celo fork in CI before deployment

**Phase:** Week 1, contract development and testing (P0 items 1-4)

### 1.2 Celo L2 Post-Migration Block Structure

**Pitfall:** Celo migrated to an OP Stack L2 on March 26, 2025. Old tutorials, RPC behaviors, and block structures are outdated. Foundry's `cast` previously could not fetch Celo blocks that lacked `sha3Uncles` fields; the migration added these fields for compatibility but some edge cases remain.

**Warning signs:**
- Following pre-2025 Celo deployment guides that reference the old L1 chain
- Using Alfajores testnet configs that do not match mainnet L2 behavior
- Gas estimation errors because L2 gas pricing differs from L1

**Prevention:**
- Use only current Celo L2 documentation at `docs.celo.org/cel2`
- Verify `foundry.toml` targets `evm_version = "shanghai"` or later (matching Celo L2)
- Test gas estimation against the actual Celo mainnet fork, not Alfajores alone
- Use `--legacy` flag if Foundry sends EIP-1559 transactions that Celo L2 does not process correctly

**Phase:** Week 1, deployment script (P0 item 4)

### 1.3 SafeERC20 and cUSD Approval Race Conditions

**Pitfall:** cUSD on Celo is a proxy contract. Using `approve` without first setting allowance to zero can trigger the known ERC-20 approval race condition. In escrow flows (AgentCommerce), a user approving a new budget amount without resetting can be front-run.

**Warning signs:**
- `safeApprove` reverts with "SafeERC20: approve from non-zero to non-zero allowance"
- Inconsistent test behavior depending on prior approval state

**Prevention:**
- Use `safeIncreaseAllowance` / `safeDecreaseAllowance` instead of `safeApprove`
- In `fundJob`, accept the token via `safeTransferFrom` (requires user to approve first) with `expectedBudget` to prevent front-running — already in the PRD
- Consider implementing permit (ERC-2612) if cUSD on Celo supports it, to combine approval and transfer in one transaction

**Phase:** Week 1, AgentCommerce.sol (P0 item 2)

### 1.4 Reentrancy in Multi-Contract Architecture

**Pitfall:** CeloSpawn has three contracts (SpawnRegistry, AgentCommerce, EarthPool) that call each other. Cross-contract reentrancy is not prevented by a single contract's `ReentrancyGuard` — an attacker can re-enter Contract B from Contract A's callback.

**Warning signs:**
- Individual contracts pass reentrancy tests but cross-contract interactions are not tested
- EarthPool receives funds from SpawnRegistry in `subscribePremium` — if EarthPool has an external call, it creates a reentrancy vector back into SpawnRegistry

**Prevention:**
- Apply checks-effects-interactions pattern across all three contracts
- Use `ReentrancyGuard` on every function that transfers tokens, even internal administrative functions
- Write explicit cross-contract reentrancy tests: subscribe premium -> EarthPool receive -> attempt re-enter SpawnRegistry
- Consider a shared reentrancy lock via a central storage contract if cross-contract calls are frequent

**Phase:** Week 1, all contract tests (P0 items 1-3)

### 1.5 Contract Verification on Celoscan

**Pitfall:** `forge verify-contract` can fail on Celoscan due to mismatched compiler settings, optimizer runs, or constructor arguments encoding. Celoscan's API is not identical to Etherscan's — some flags behave differently.

**Warning signs:**
- Verification succeeds locally but fails on Celoscan API
- "Bytecode mismatch" errors despite identical source code

**Prevention:**
- Pin exact Solidity version (`0.8.24`) in `foundry.toml` and pragma
- Record exact optimizer runs and EVM version in deployment logs
- Use `--constructor-args $(cast abi-encode ...)` explicitly
- Verify on Alfajores first before mainnet deployment

**Phase:** Week 1, deployment (P0 item 4)

---

## 2. x402 Payment Integration

### 2.1 Protocol Version Mismatch (v1 vs v2)

**Pitfall:** x402 protocol v2 (launched 2026) uses different headers: `PAYMENT-SIGNATURE` / `PAYMENT-RESPONSE` instead of v1's `X-PAYMENT` / `X-PAYMENT-RESPONSE`. The PRD code samples reference v1 headers (`req.headers["x-payment"]`). If the thirdweb SDK auto-upgrades to v2, the server-side payment extraction breaks silently.

**Warning signs:**
- Payment verification returns `undefined` or empty payment data
- x402 flow works in development but fails with updated SDK version
- PRD code uses `req.headers["x-payment"]` — hardcoded to v1

**Prevention:**
- Use the SDK's built-in header extraction (it checks v2 first, falls back to v1) instead of manually reading headers
- Pin thirdweb SDK version in `package.json` and test before upgrading
- Add integration tests that verify payment header parsing against both v1 and v2 formats
- Set `x402Version: 2` explicitly if targeting v2

**Phase:** Week 1, x402 payment flow (P0 item 10)

### 2.2 Payment Settlement Timing and Double-Spend

**Pitfall:** x402 settles payment on-chain, then the server delivers the response. If the LLM call fails after settlement, the user has paid but received nothing. Conversely, if the server delivers before settlement confirms, the user gets a free response.

**Warning signs:**
- Users report paying but receiving error responses
- Financial reconciliation shows mismatches between payments and call_logs
- Race conditions under load where settlement and response are not atomic

**Prevention:**
- Settle payment first, then call LLM. If LLM fails, record the debt and provide a retry mechanism (idempotency key)
- Log payment TX hash in `call_logs` before calling OpenRouter
- Implement a compensation endpoint: if payment settled but LLM failed, user can retry with same payment proof
- Never stream LLM response before settlement is confirmed

**Phase:** Week 1, backend chat endpoint (P0 item 5)

### 2.3 cUSD Token Address Hardcoding

**Pitfall:** The cUSD contract address differs between Celo Mainnet (`0x765DE816845861e75A25fCA122bb6898B8B1282a`) and Alfajores testnet (`0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`). Hardcoding the mainnet address in x402 config means the entire payment flow is broken on testnet during development.

**Warning signs:**
- x402 payments work on mainnet but fail completely on Alfajores
- Development stalls because you cannot test payments without real cUSD

**Prevention:**
- Use environment variables for all token addresses: `CUSD_ADDRESS`
- Create a chain config map: `{ 42220: mainnetAddresses, 44787: alfajoresAddresses }`
- Validate the configured address matches the connected chain at startup

**Phase:** Week 1, backend configuration (P0 items 5, 10)

### 2.4 Free Tier Bypass via x402

**Pitfall:** The PRD states agent owners get free access (rate-limited). If the ownership check is done client-side or based on a spoofable header, anyone can claim to be the owner and bypass x402 payments entirely.

**Warning signs:**
- Unexpected high free-tier usage on agents
- No wallet signature verification on "owner" requests

**Prevention:**
- Verify ownership server-side by checking the wallet signature against on-chain NFT ownership (`ownerOf(agentId)`)
- Never trust a client-supplied `isOwner` flag
- Cache ownership lookups in Redis with short TTL (ownership rarely changes)

**Phase:** Week 1, backend chat endpoint (P0 item 5)

---

## 3. ERC-8004 / ERC-8183 Implementations

### 3.1 ERC-8004 is Draft Status — Interface Will Change

**Pitfall:** ERC-8004 is in Draft status (as of October 2025). The interface may change before finalization. Building tightly coupled contracts against the current draft risks breaking changes in the standard's Identity, Reputation, or Validation registries.

**Warning signs:**
- Following a tutorial from 6+ months ago with different function signatures
- Reference contracts on Sepolia (`0x8004A818...`) use Hardhat — their ABI may not match your Foundry implementation
- Community discussions on Ethereum Magicians show active interface debates

**Prevention:**
- Implement ERC-8004 behind an internal interface/adapter so the standard-specific code is isolated
- Focus on the Identity Registry only (ERC-721 + URI storage) — this is the most stable part
- Do not implement Reputation or Validation registries for MVP — they are more likely to change
- Document which draft version you implemented (commit hash from `erc-8004/erc-8004-contracts`)

**Phase:** Week 1, SpawnRegistry.sol (P0 item 1)

### 3.2 ERC-8183 Evaluator Trust Problem

**Pitfall:** In ERC-8183, the evaluator has absolute power to complete or reject a job. There is no on-chain dispute resolution. For CeloSpawn, if the client is also the evaluator (as designed in the PRD), a malicious client can reject valid work and reclaim escrowed funds. The agent (server-side wallet) cannot dispute.

**Warning signs:**
- Agent completes work but client never responds (funds locked until expiry)
- Systematic rejection of valid work to get free deliverables (reject after downloading from IPFS)
- No reputation consequence for bad evaluators

**Prevention:**
- Set reasonable expiry times (24-48h) so funds are not locked indefinitely
- Implement an off-chain reputation score for evaluators (track reject/complete ratio) — display on AgentScan
- For MVP: accept the risk, document it clearly. Post-MVP: add optional third-party evaluator or multi-sig evaluation
- Log all deliverable CIDs on-chain via `submitJob` so there is proof the agent delivered

**Phase:** Week 2, ERC-8183 job UI (P1 item 14)

### 3.3 Job State Machine Edge Cases

**Pitfall:** The ERC-8183 state machine (Open -> Funded -> Submitted -> Terminal) has edge cases: What if funding fails mid-transaction? What if the agent submits after expiry? What if `claimRefund` is called while the agent is submitting?

**Warning signs:**
- Jobs stuck in non-terminal states
- Refund and submission transactions racing on-chain
- Missing tests for boundary conditions (exact expiry block, zero-budget jobs)

**Prevention:**
- Use block.timestamp (not block.number) for expiry, and add a grace period buffer
- Test every state transition explicitly: valid transitions AND invalid transitions (e.g., submit after expiry must revert)
- Add a `cancelJob` function for Open (unfunded) jobs to clean up
- Prevent zero-budget jobs at contract level (`require(budget > 0)`)

**Phase:** Week 1, AgentCommerce.sol tests (P0 item 2)

### 3.4 IPFS Deliverable Availability

**Pitfall:** Job deliverables are stored on IPFS. If the IPFS pin expires or the pinning service is down, the evaluator cannot review the deliverable, leading to automatic refund on expiry — the agent did the work but does not get paid.

**Warning signs:**
- IPFS CID resolves during submission but returns 404 hours later
- Using free-tier Pinata/web3.storage with pin expiry
- No fallback storage for deliverables

**Prevention:**
- Pin deliverables on multiple gateways (Pinata + web3.storage)
- Store a content hash on-chain (already in `submitJob`) so proof of delivery exists even if the file becomes temporarily unavailable
- Cache deliverables in the backend PostgreSQL database as a fallback
- Alert the evaluator immediately on submission (push notification / email) to reduce review delay

**Phase:** Week 2, ERC-8183 job system (P1 item 14)

---

## 4. OpenRouter LLM Integration

### 4.1 Free Model Rate Limits Are Brutal

**Pitfall:** OpenRouter free models are limited to 50 requests/day for accounts with <$10 in credits, and 1000 requests/day after purchasing $10+ in credits. For a platform serving multiple agents and users, 50 requests/day is exhausted in minutes. The entire free tier becomes unusable.

**Warning signs:**
- 429 errors within the first hour of demo/testing
- All free-tier agents stop responding simultaneously (shared API key = shared limit)
- During hackathon demo, the judges trigger rate limits by trying multiple agents

**Prevention:**
- Purchase at least $10 in OpenRouter credits immediately — this unlocks 1000 requests/day for free models
- Implement per-agent rate limiting on the CeloSpawn side (10-30 calls/day per agent) to spread the budget
- Cache identical responses for common queries (e.g., "What is Celo?") in Redis with 1-hour TTL
- Have a fallback: if OpenRouter 429s, return a graceful "Agent is resting, try again in X minutes" instead of a raw error
- For the demo: pre-warm common queries so judges see instant responses

**Phase:** Week 1, OpenRouter integration (P0 item 6)

### 4.2 Model Availability and Deprecation

**Pitfall:** OpenRouter model IDs change. Models get deprecated, renamed, or removed. The free model `meta-llama/llama-3.1-8b-instruct:free` in the PRD may not exist by demo day. Hardcoding model IDs causes silent failures.

**Warning signs:**
- API returns "model not found" or routes to a different model than expected
- Premium users get free-tier quality because the premium model ID is stale

**Prevention:**
- Store model IDs in a configuration table (database or environment), not in code
- On startup, validate all configured model IDs against the OpenRouter `/models` endpoint
- Implement a model fallback chain: primary -> secondary -> tertiary
- Log which model actually served each request (OpenRouter returns this in response metadata)

**Phase:** Week 1, OpenRouter integration (P0 item 6)

### 4.3 Streaming Errors Mid-Response

**Pitfall:** When using streaming (SSE), errors that occur after tokens have started flowing are delivered as SSE events, not HTTP error codes. If the frontend only handles HTTP-level errors, mid-stream failures result in truncated responses with no error indication.

**Warning signs:**
- Users see partial responses that cut off mid-sentence
- No error logged because the HTTP status was 200
- Retry logic does not trigger because the initial response succeeded

**Prevention:**
- Parse SSE events for error types: check for `[DONE]` marker and error events
- Implement client-side detection of incomplete responses (no `[DONE]` received)
- Log every OpenRouter response's `finish_reason` — if it is not `stop`, flag it
- For MVP, consider non-streaming mode to simplify error handling; add streaming in Week 2

**Phase:** Week 1, chat endpoint (P0 item 5)

### 4.4 API Key Exposure

**Pitfall:** A single OpenRouter API key serves all agents. If this key leaks (via frontend code, logs, or error messages), an attacker can drain the entire credit balance or abuse rate limits.

**Warning signs:**
- API key appears in frontend bundle, browser network tab, or error responses
- Unexpected credit consumption spikes

**Prevention:**
- API key lives only in backend environment variables, never in frontend code
- Strip API keys from all error messages and logs (use a logging middleware that redacts sensitive headers)
- Set spending limits on the OpenRouter dashboard
- Monitor credit balance via OpenRouter API and alert on unusual consumption

**Phase:** Week 1, backend security (P0 item 5)

---

## 5. Agent Wallet Management with Encrypted Private Keys

### 5.1 Encryption Key Derivation from Wallet Signature is Fragile

**Pitfall:** The PRD specifies deriving the AES encryption key from the owner's wallet signature of a deterministic message. Different wallets (MetaMask, WalletConnect, Rabby) may produce different signature formats (EIP-191 vs EIP-712, v=27/28 vs v=0/1). The same owner with a different wallet app cannot decrypt their agent's key.

**Warning signs:**
- Owner switches from MetaMask to WalletConnect and can no longer manage their agent
- Signature bytes differ across wallet implementations for the same message
- Agent operations fail after wallet app update

**Prevention:**
- Normalize signatures before deriving the encryption key (canonical v value, fixed encoding)
- Use EIP-712 typed data signing (more consistent across wallets) instead of raw `personal_sign`
- Store the signature format/version alongside the encrypted key
- Consider a simpler approach for MVP: derive encryption key from a server-managed master key + owner address, avoiding signature-based derivation entirely. Signature-based derivation can be a post-MVP enhancement

**Phase:** Week 1, wallet generation (P0 item 9)

### 5.2 Nonce Reuse in AES-256-GCM

**Pitfall:** AES-256-GCM is catastrophically broken if the same nonce (IV) is used twice with the same key. If the agent's private key is re-encrypted (e.g., during key rotation or ownership transfer) and the implementation reuses or predictably generates the IV, an attacker can recover the plaintext.

**Warning signs:**
- IV generation uses a counter or timestamp instead of cryptographic randomness
- Re-encryption after ownership transfer uses the same IV
- No IV is stored alongside ciphertext (meaning a fixed IV is hardcoded)

**Prevention:**
- Always generate a 12-byte random IV using `crypto.randomBytes(12)` for each encryption operation
- Store IV alongside the ciphertext (typically prepended): `iv + ciphertext + authTag`
- Never reuse an IV with the same key — if the key changes, generate a new IV anyway
- Add a unit test that encrypts the same plaintext twice and asserts different ciphertexts

**Phase:** Week 1, wallet generation (P0 item 9)

### 5.3 Server-Side Key Custody is a Single Point of Failure

**Pitfall:** The server holds encrypted private keys for all agent wallets. If the server is compromised, the attacker gets all encrypted keys. If the encryption master key or derivation method is also on the server, all agent wallets are drained.

**Warning signs:**
- Encryption key and encrypted data stored in the same database
- No separation between the application server and the key management layer
- Backup/restore procedures expose decrypted keys

**Prevention:**
- Store the master encryption key in a separate secrets manager (AWS Secrets Manager, GCP Secret Manager, or at minimum a separate environment variable not in the database)
- Decrypt private keys only in memory, never write decrypted keys to disk or logs
- Implement key access audit logging: log every decryption event with timestamp and purpose
- For hackathon: accept the risk with clear documentation. For production: use HSM or threshold signatures

**Phase:** Week 1, backend architecture (P0 item 5)

### 5.4 Agent Wallet Funding for Gas

**Pitfall:** Agent wallets need CELO (native token) for gas to sign on-chain transactions (e.g., `submitJob`). Newly generated wallets have zero balance. If the platform does not fund gas, agents cannot execute any on-chain operations.

**Warning signs:**
- `submitJob` reverts with "insufficient funds for gas"
- Agent wallets are created but never transact on-chain
- Users confused why their agent cannot complete jobs

**Prevention:**
- Implement a gas station / relayer that sponsors gas for agent transactions
- Alternatively, fund each new agent wallet with a small CELO amount (0.01 CELO) from the platform treasury during registration
- Use ERC-2771 meta-transactions (via a trusted forwarder) so agent wallets do not need gas
- Display agent wallet balance in the dashboard and alert when low

**Phase:** Week 1, agent registration (P0 items 5, 9)

---

## 6. No-Code Platform Auto-Deploy On-Chain

### 6.1 Transaction Failure with No User Feedback

**Pitfall:** The "deploy in 10 seconds" flow involves multiple sequential operations: wallet generation, IPFS upload, on-chain `registerAgent` transaction. Any step can fail (IPFS timeout, gas estimation error, nonce collision). If the frontend shows a spinner with no granular progress, the user sees "loading..." for 30 seconds then an opaque error.

**Warning signs:**
- Users abandon the deploy flow because it appears stuck
- Backend logs show partial completions (wallet generated but registration failed)
- Orphaned wallets in the database with no on-chain registration

**Prevention:**
- Implement step-by-step progress feedback: "Generating wallet... Uploading metadata... Registering on-chain..."
- Make each step idempotent: if IPFS upload succeeds but on-chain fails, the retry should reuse the IPFS CID
- Store deploy state in the database so incomplete deployments can be resumed or cleaned up
- Set aggressive timeouts (10s per step) with clear error messages per failure mode

**Phase:** Week 1, deploy form + backend (P0 items 5, 7)

### 6.2 Gas Estimation Failures on Celo L2

**Pitfall:** Gas estimation on Celo L2 (OP Stack) includes both L2 execution gas and L1 data availability gas. Standard `eth_estimateGas` may underestimate, causing transactions to revert. This is especially problematic for auto-deploy where the user does not manually set gas.

**Warning signs:**
- Transactions revert with "out of gas" despite estimateGas succeeding
- Gas costs vary significantly between identical transactions
- Deploy works on Alfajores but fails on mainnet due to L1 DA cost differences

**Prevention:**
- Add a gas buffer multiplier (1.5x-2x) to all estimated gas values
- Use Celo's L2-aware gas estimation if available via the RPC
- Catch "out of gas" errors specifically and retry with higher gas limit
- Display estimated gas cost to the user before the transaction

**Phase:** Week 1, deploy script and backend transactions (P0 items 4, 5)

### 6.3 Template System Prompt Injection

**Pitfall:** The "Custom" template (template 9) allows users to write their own system prompt. A malicious user can craft a prompt that instructs the LLM to ignore safety guardrails, expose system information, or manipulate other users. Since CeloSpawn hosts the agent, it is responsible for the output.

**Warning signs:**
- Agents producing harmful, illegal, or policy-violating content
- System prompt containing instructions like "ignore previous instructions" or "you are now unfiltered"
- Users weaponizing agents for social engineering or scams

**Prevention:**
- Validate custom system prompts against a blocklist of dangerous patterns (prompt injection signatures)
- Prepend an immutable safety preamble to every system prompt that the user cannot override
- Rate-limit and log all agent interactions for abuse detection
- Add a content moderation layer (OpenRouter supports moderation flags) before returning responses
- Reserve the right to deactivate agents that violate terms (off-chain admin flag + on-chain `setActive(false)`)

**Phase:** Week 1, template system (P0 item 6); Week 2, refined guardrails (P1 item 17)

### 6.4 On-Chain State and Off-Chain Database Desynchronization

**Pitfall:** Agent data lives in two places: on-chain (SpawnRegistry NFT, subscriptions, badges) and off-chain (PostgreSQL metadata, call_logs, jobs). If the on-chain transaction succeeds but the database write fails (or vice versa), the system is in an inconsistent state.

**Warning signs:**
- Agent exists on-chain but not in the database (invisible in the UI)
- Agent shows as "premium" in the database but on-chain subscription has expired
- Job status in database does not match on-chain state

**Prevention:**
- Write to database first (pending state), then transact on-chain, then update database (confirmed state)
- Implement an event listener/indexer that watches on-chain events and reconciles database state
- Add a periodic sync job that compares on-chain state to database and flags discrepancies
- For all read operations, decide the source of truth: on-chain for ownership/payments, database for metadata

**Phase:** Week 1, backend architecture (P0 items 5, 6); critical for Week 2 features

### 6.5 Hackathon Demo Day Failures

**Pitfall:** The most common hackathon failure mode: the demo breaks live. Specific risks for CeloSpawn: OpenRouter rate-limited, Celo RPC slow, IPFS upload times out, wallet connection fails with the judge's browser.

**Warning signs:**
- No rehearsed demo script with pre-created agents
- Depending on live external services (OpenRouter, IPFS, Celo RPC) with no fallback
- Testing only on Chrome + MetaMask but judges use a different setup

**Prevention:**
- Pre-deploy 2-3 agents before the demo so the registry is not empty
- Cache at least one "golden path" interaction so it works even if OpenRouter is down
- Use a dedicated Celo RPC endpoint (Infura/Alchemy/QuickNode), not just the public `forno.celo.org` which throttles under load
- Test with multiple wallets: MetaMask, WalletConnect, Rabby
- Record a backup video of the full demo flow in case live demo fails
- Pre-fund the demo wallet with enough cUSD and CELO for all demo transactions

**Phase:** Week 2, demo preparation (continuous)

---

## 7. Cross-Cutting Pitfalls

### 7.1 Scope Creep Under Hackathon Pressure

**Pitfall:** The PRD lists 23 items across P0/P1/P2. Teams commonly attempt all P1 items before P0 is solid, resulting in nothing working end-to-end.

**Prevention:**
- Ruthlessly prioritize: a working deploy + chat + x402 flow (P0) beats a half-working version with badges and Self Protocol
- Definition of "done" for each P0 item: it works in a live demo, not just in tests
- Cut P1 items that are not visible in the 30-second demo script

### 7.2 Environment Variable Sprawl

**Pitfall:** CeloSpawn requires many API keys and addresses: OpenRouter key, thirdweb client ID, Celo RPC URL, cUSD address, PostgreSQL connection, Redis URL, IPFS API key, platform wallet private key, AES master key, Celoscan API key. Missing a single one causes cryptic failures.

**Prevention:**
- Create a `.env.example` with every required variable and a description
- Validate all required environment variables at application startup (fail fast with a clear list of missing vars)
- Use a schema validator (zod, joi) for env config
- Never have different variable names for the same thing across services

### 7.3 Testnet vs Mainnet Configuration Drift

**Pitfall:** The PRD targets Celo Mainnet (chainId: 42220) but development happens on Alfajores (44787). Contract addresses, token addresses, RPC URLs, and gas costs all differ. A last-minute switch to mainnet introduces bugs.

**Prevention:**
- Maintain parallel config files: `config.mainnet.ts` and `config.alfajores.ts`
- Deploy to Alfajores weekly throughout development, not just at the end
- Use a chain-aware configuration loader that validates the connected chain matches the expected environment

---

## Summary: Top 10 Most Likely Failures

| # | Pitfall | Severity | Likelihood | Phase |
|---|---------|----------|------------|-------|
| 1 | OpenRouter free model 50/day rate limit | Critical | Very High | Week 1 |
| 2 | x402 v1/v2 header mismatch | High | High | Week 1 |
| 3 | Agent wallet has no gas for on-chain ops | Critical | Very High | Week 1 |
| 4 | Demo day live service failure | Critical | High | Week 2 |
| 5 | Celo precompile incompatibility in Foundry tests | High | High | Week 1 |
| 6 | On-chain/off-chain state desync | High | High | Week 1-2 |
| 7 | Signature-based encryption key varies by wallet | Medium | Medium | Week 1 |
| 8 | ERC-8004 draft interface changes | Medium | Medium | Week 1 |
| 9 | Template prompt injection | High | Medium | Week 1-2 |
| 10 | Gas estimation undercount on Celo L2 | Medium | Medium | Week 1 |

---

## Sources

- [Celo Foundry Deployment Docs](https://docs.celo.org/developer/deploy/foundry)
- [Foundry Celo Incompatibility Issue #11622](https://github.com/foundry-rs/foundry/issues/11622)
- [Celo Foundry Library (precompile workaround)](https://github.com/bowd/celo-foundry)
- [Celo L2 Migration Docs](https://docs.celo.org/cel2)
- [thirdweb x402 Protocol v2](https://blog.thirdweb.com/changelog/support-for-x402-protocol-v2/)
- [x402 Portal Documentation](https://portal.thirdweb.com/x402)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8183 Specification](https://eips.ethereum.org/EIPS/eip-8183)
- [ERC-8004 Contracts Repository](https://github.com/erc-8004/erc-8004-contracts)
- [OpenRouter Rate Limits](https://openrouter.ai/docs/api/reference/limits)
- [OpenRouter Error Handling](https://openrouter.ai/docs/api/reference/errors-and-debugging)
- [AES-GCM Pitfalls (Soatok)](https://soatok.blog/2020/05/13/why-aes-gcm-sucks/)
- [Crypto Wallet Security (Cossack Labs)](https://www.cossacklabs.com/blog/crypto-wallets-security/)
- [ERC-8004 Practical Explainer (Composable Security)](https://composable-security.com/blog/erc-8004-a-practical-explainer-for-trustless-agents/)