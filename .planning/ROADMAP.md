# Roadmap: CeloSpawn

**Created:** 2026-03-13
**Granularity:** Coarse (4 phases)
**Total Requirements:** 35

## Phases

### Phase 1: Smart Contracts (Foundation)
**Goal:** Deploy all core smart contracts with full test coverage on a Celo mainnet fork, producing verified ABIs for backend consumption.
**Requirements:** SC-01, SC-02, SC-03, SC-04, SC-05, SC-06, SC-07, SC-08, SC-09, SC-10
**Success Criteria:**
1. SpawnRegistry mints an ERC-721 agent NFT with ERC-8004 metadata, stores AgentData, and manages subscriptions/badges on a Celo fork
2. AgentCommerce creates a job, transitions through Open/Funded/Submitted/Completed states, and correctly splits the 5% platform fee
3. EarthPool accumulates 15% of premium revenue and emits CampaignReady when balance crosses $500 threshold
4. All three contracts pass Foundry tests on a Celo mainnet fork (celo-foundry + vm.etch for precompiles)

### Phase 2: Backend (Agent Runtime)
**Goal:** Build the API layer that powers agent registration, chat, payments, and job management — fully testable via HTTP without a frontend.
**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, INT-02, INT-04
**Success Criteria:**
1. A curl request to POST /agents creates a new agent with a server-generated wallet (AES-256-GCM encrypted), registers it on-chain, and returns the agent ID
2. POST /agents/:agentId/chat returns an LLM response routed through OpenRouter (free model for unverified, premium model for subscribers)
3. An unauthenticated caller hitting a paid agent receives HTTP 402 with x402 payment headers, and after thirdweb settlement the call succeeds
4. Rate limiting enforces 10/30/200 call tiers via Redis, returning 429 when exceeded
5. Job lifecycle (create, fund, submit, complete) works end-to-end via API with correct escrow state transitions

### Phase 3: Frontend (User Experience)
**Goal:** Build the Next.js UI that lets users deploy agents in 10 seconds, discover agents, chat, create jobs, and manage subscriptions.
**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09
**Success Criteria:**
1. A user can connect MetaMask, fill 3 fields (name, template, price), click deploy, and see their agent live in the registry within 10 seconds
2. The agent registry page loads all public agents with working search, filter, and sort — clicking an agent opens AgentScan with on-chain data and badge
3. The chat interface sends messages, displays responses, and triggers x402 payment flow for paid agents
4. A user can create an ERC-8183 job with description/budget/deadline and track its status through completion

### Phase 4: Integration, Testing & Demo Prep
**Goal:** Wire all layers together, deploy to production (Celo mainnet, Vercel, Railway), verify end-to-end flows, and prepare a reliable demo.
**Requirements:** SC-11, SC-12, INT-01, INT-03
**Success Criteria:**
1. All contracts deployed to Celo mainnet via Deploy.s.sol and verified on Celoscan
2. Self Protocol verification flow works end-to-end (redirect, ZK proof, callback, on-chain setVerified, badge upgrade)
3. ERC-8183 job deliverables are uploaded to IPFS via Pinata and retrievable by the job requester
4. The full golden path (deploy agent, chat, pay, create job, complete job) works on production without fallback
5. Comprehensive Foundry tests pass on Celo mainnet fork with 100% critical path coverage

## Requirement Coverage

| Requirement | Phase |
|-------------|-------|
| SC-01 | 1 |
| SC-02 | 1 |
| SC-03 | 1 |
| SC-04 | 1 |
| SC-05 | 1 |
| SC-06 | 1 |
| SC-07 | 1 |
| SC-08 | 1 |
| SC-09 | 1 |
| SC-10 | 1 |
| SC-11 | 4 |
| SC-12 | 4 |
| API-01 | 2 |
| API-02 | 2 |
| API-03 | 2 |
| API-04 | 2 |
| API-05 | 2 |
| API-06 | 2 |
| API-07 | 2 |
| API-08 | 2 |
| API-09 | 2 |
| API-10 | 2 |
| UI-01 | 3 |
| UI-02 | 3 |
| UI-03 | 3 |
| UI-04 | 3 |
| UI-05 | 3 |
| UI-06 | 3 |
| UI-07 | 3 |
| UI-08 | 3 |
| UI-09 | 3 |
| INT-01 | 4 |
| INT-02 | 2 |
| INT-03 | 4 |
| INT-04 | 2 |

**Coverage:** 35/35 (100%)

---
*Created: 2026-03-13*
