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
