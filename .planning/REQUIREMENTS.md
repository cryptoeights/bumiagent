# Requirements: CeloSpawn

**Defined:** 2026-03-13
**Core Value:** Anyone can deploy a monetizable AI agent on Celo in 10 seconds with just 3 form fields

## v1 Requirements

Requirements for hackathon MVP. Each maps to roadmap phases.

### Smart Contracts

- [ ] **SC-01**: SpawnRegistry.sol registers agents as ERC-721 NFTs with ERC-8004 compliant identity
- [ ] **SC-02**: SpawnRegistry stores AgentData (wallet, template, price, verification, premium, stats)
- [ ] **SC-03**: SpawnRegistry manages premium subscriptions ($20 cUSD/month, 85/15 split treasury/EarthPool)
- [ ] **SC-04**: SpawnRegistry tracks badge system (grey/blue/gold/green based on verification + premium)
- [ ] **SC-05**: SpawnRegistry enforces rate limits (10 free, 30 verified, 200 premium calls)
- [ ] **SC-06**: AgentCommerce.sol implements ERC-8183 job escrow (Open→Funded→Submitted→Terminal)
- [ ] **SC-07**: AgentCommerce handles job lifecycle (create, fund, submit, complete, reject, expire)
- [ ] **SC-08**: AgentCommerce takes 5% platform fee on completed jobs
- [ ] **SC-09**: EarthPool.sol collects 15% premium revenue and emits CampaignReady at $500 threshold
- [ ] **SC-10**: EarthPool tracks campaigns with on-chain proof (description, proofURI, amount)
- [ ] **SC-11**: Deploy.s.sol deploys all contracts to Celo Mainnet in correct order
- [ ] **SC-12**: Comprehensive Foundry tests for all contracts (100% critical path coverage)

### Backend API

- [ ] **API-01**: POST /agents — register agent (wallet gen, encryption, on-chain registration)
- [ ] **API-02**: POST /agents/:agentId/chat — chat with agent via OpenRouter LLM
- [ ] **API-03**: Free tier uses OpenRouter free models (Gemma, Llama), premium uses Claude/GPT-4o/Gemini
- [ ] **API-04**: x402 payment gateway — HTTP 402 response with price, thirdweb settlement
- [ ] **API-05**: Rate limiting via Redis (10/30/200 calls based on tier)
- [ ] **API-06**: POST /jobs — create ERC-8183 job with escrow
- [ ] **API-07**: Job lifecycle API (fund, submit, complete, reject, claim refund)
- [ ] **API-08**: Agent wallet generation (ethers.Wallet.createRandom) + AES-256-GCM encryption
- [ ] **API-09**: POST /agents/:agentId/subscribe — premium subscription via smart contract
- [ ] **API-10**: PostgreSQL schema (agents, call_logs, jobs tables)

### Frontend

- [ ] **UI-01**: Landing page with "Launch Agent" CTA and value proposition
- [ ] **UI-02**: 3-field deploy form (name, template dropdown, price) with wallet connect (MetaMask/WalletConnect)
- [ ] **UI-03**: Agent dashboard — list user's agents with stats, manage, upgrade
- [ ] **UI-04**: Agent Registry — public discovery page with search, filter, sort
- [ ] **UI-05**: AgentScan — per-agent detail page with on-chain data, badge, stats, x402 endpoint
- [ ] **UI-06**: Chat interface for interacting with agents (owner free, public x402 paid)
- [ ] **UI-07**: ERC-8183 job creation form (description, budget, deadline) + job status tracking
- [ ] **UI-08**: Premium subscription modal + payment flow ($20 cUSD)
- [ ] **UI-09**: Badge display (grey ⚫/blue 🔵/gold 🟡/green 🟢) across all UI surfaces

### Integrations

- [ ] **INT-01**: Self Protocol verification flow (redirect → ZK proof → callback → setVerified on-chain)
- [ ] **INT-02**: 10 agent templates with system prompts, suggested pricing, and guardrails
- [ ] **INT-03**: IPFS storage via Pinata for ERC-8183 job deliverables
- [ ] **INT-04**: OpenRouter integration for free + premium LLM model routing

## v2 Requirements

Deferred to post-hackathon. Tracked but not in current roadmap.

### Enhanced Features

- **V2-01**: MiniPay wallet support (Celo mobile wallet)
- **V2-02**: Model selection UI for premium users (choose specific OpenRouter models)
- **V2-03**: EarthPool dashboard with campaign tracker and impact visualization
- **V2-04**: Agent-to-agent autonomous job creation
- **V2-05**: Reputation scoring system with on-chain attestations
- **V2-06**: Multi-chain deployment (Base, Optimism)
- **V2-07**: Visual workflow builder for custom agent logic
- **V2-08**: Agent fine-tuning with user data

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Token/bonding curve speculation | Utility-first, not speculation — aligns with Celo values |
| Real-time chat between users | Not core to agent platform, high complexity |
| Video/audio agent responses | Storage/bandwidth costs prohibitive for MVP |
| Native mobile app | Web-first approach, mobile later |
| Agent-to-agent autonomy | Complex orchestration, safety concerns for MVP |
| Model fine-tuning | Requires training infra, out of hackathon scope |
| Multi-chain support | Celo-first for hackathon, expand later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SC-01 | 1 | Pending |
| SC-02 | 1 | Pending |
| SC-03 | 1 | Pending |
| SC-04 | 1 | Pending |
| SC-05 | 1 | Pending |
| SC-06 | 1 | Pending |
| SC-07 | 1 | Pending |
| SC-08 | 1 | Pending |
| SC-09 | 1 | Pending |
| SC-10 | 1 | Pending |
| SC-11 | 4 | Pending |
| SC-12 | 4 | Pending |
| API-01 | 2 | Pending |
| API-02 | 2 | Pending |
| API-03 | 2 | Pending |
| API-04 | 2 | Pending |
| API-05 | 2 | Pending |
| API-06 | 2 | Pending |
| API-07 | 2 | Pending |
| API-08 | 2 | Pending |
| API-09 | 2 | Pending |
| API-10 | 2 | Pending |
| UI-01 | 3 | Pending |
| UI-02 | 3 | Pending |
| UI-03 | 3 | Pending |
| UI-04 | 3 | Pending |
| UI-05 | 3 | Pending |
| UI-06 | 3 | Pending |
| UI-07 | 3 | Pending |
| UI-08 | 3 | Pending |
| UI-09 | 3 | Pending |
| INT-01 | 4 | Pending |
| INT-02 | 2 | Pending |
| INT-03 | 4 | Pending |
| INT-04 | 2 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap phase mapping*
