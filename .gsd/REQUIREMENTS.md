# Requirements

## Active

## Validated

### SC-01 — SpawnRegistry.sol registers agents as ERC-721 NFTs with ERC-8004 compliant identity

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: SpawnRegistry extends ERC721URIStorage + implements IERC8004. 33 Foundry tests pass.

### SC-02 — SpawnRegistry stores AgentData (wallet, template, price, verification, premium, stats)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: AgentData struct with all fields. Verified in SpawnRegistry.sol and tests.

### SC-03 — SpawnRegistry manages premium subscriptions ($20 cUSD/month, 85/15 split treasury/EarthPool)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: subscribePremium() splits 85/15 to treasury/EarthPool. Contract tests verify split math.

### SC-04 — SpawnRegistry tracks badge system (grey/blue/gold/green based on verification + premium)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: getBadge() returns 0-3 (grey/blue/gold/green). Frontend TrustBadge renders across all surfaces.

### SC-05 — SpawnRegistry enforces rate limits (10 free, 30 verified, 200 premium calls)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: canAcceptCall() enforces tier-based limits. Backend Redis rate limiting mirrors contract logic.

### SC-06 — AgentCommerce.sol implements ERC-8183 job escrow (Open→Funded→Submitted→Terminal)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: Full state machine in AgentCommerce.sol. 29 tests pass covering all transitions.

### SC-07 — AgentCommerce handles job lifecycle (create, fund, submit, complete, reject, expire)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: createJob, fundJob, submitJob, completeJob, rejectJob, claimRefund all implemented and tested.

### SC-08 — AgentCommerce takes 5% platform fee on completed jobs

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: completeJob() calculates 5% fee, sends remainder to provider. Verified in tests.

### SC-09 — EarthPool.sol collects 15% premium revenue and emits CampaignReady at $500 threshold

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: EarthPool receives deposits, emits CampaignReady at threshold. 19 tests pass.

### SC-10 — EarthPool tracks campaigns with on-chain proof (description, proofURI, amount)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: addCampaignProof() stores campaign data. Campaign struct verified in contract.

### SC-11 — Deploy.s.sol deploys all contracts to Celo Mainnet in correct order

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: Deploy.s.sol deploys EarthPool → SpawnRegistry → AgentCommerce with correct dependency injection.

### SC-12 — Comprehensive Foundry tests for all contracts (100% critical path coverage)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S01
- Proof: 85 tests (33 SpawnRegistry, 29 AgentCommerce, 19 EarthPool, 4 Integration) — all pass.

### API-01 — POST /agents — register agent (wallet gen, encryption, on-chain registration)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: Route in backend/src/routes/agents.ts. Wallet gen + AES-256-GCM encryption in services/.

### API-02 — POST /agents/:agentId/chat — chat with agent via OpenRouter LLM

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: Chat route with OpenRouter service. Template system prompts applied per agent.

### API-03 — Free tier uses OpenRouter free models (Gemma, Llama), premium uses Claude/GPT-4o/Gemini

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: OpenRouter service routes by tier. Model selector in chat UI exposes free + premium options.

### API-04 — x402 payment gateway — HTTP 402 response with price, thirdweb settlement

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S03
- Proof: x402 middleware in backend/src/middleware/x402.ts. Returns 402 with price, verifies cUSD transfer on-chain.

### API-05 — Rate limiting via Redis (10/30/200 calls based on tier)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: Redis-based rate limiting in backend/src/middleware/rateLimit.ts with tier-based limits.

### API-06 — POST /jobs — create ERC-8183 job with escrow

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S03
- Proof: POST /jobs route creates job with agentId, description, budget. Mirrors contract.

### API-07 — Job lifecycle API (fund, submit, complete, reject, claim refund)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S03
- Proof: Full lifecycle routes in backend/src/routes/jobs.ts.

### API-08 — Agent wallet generation (ethers.Wallet.createRandom) + AES-256-GCM encryption

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: Wallet service + crypto service with AES-256-GCM in backend/src/services/.

### API-09 — POST /agents/:agentId/subscribe — premium subscription via smart contract

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S03
- Proof: Subscription route in backend/src/routes/subscriptions.ts with on-chain verification.

### API-10 — PostgreSQL schema (agents, call_logs, jobs tables)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: Schema in backend/src/db/schema.ts — agents, callLogs, jobs, conversations tables via Drizzle.

### UI-01 — Landing page with "Launch Agent" CTA and value proposition

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S04
- Proof: Landing page at frontend/src/app/page.tsx with CTA, features, template showcase, TopAgents.

### UI-02 — 3-field deploy form (name, template dropdown, price) with wallet connect (MetaMask/WalletConnect)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S04
- Proof: Deploy form at frontend/src/app/deploy/page.tsx with wagmi wallet connect.

### UI-03 — Agent dashboard — list user's agents with stats, manage, upgrade

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S05
- Proof: Dashboard at frontend/src/app/dashboard/page.tsx with agent list, edit, Self verify, premium upgrade.

### UI-04 — Agent Registry — public discovery page with search, filter, sort

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S04
- Proof: Registry at frontend/src/app/registry/page.tsx with search, agent cards, badges.

### UI-05 — AgentScan — per-agent detail page with on-chain data, badge, stats, x402 endpoint

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S05
- Proof: AgentScan at frontend/src/app/agent/[agentId]/page.tsx with full agent data display.

### UI-06 — Chat interface for interacting with agents (owner free, public x402 paid)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S04
- Proof: Chat at frontend/src/app/chat/[agentId]/page.tsx with markdown, history, model selector, x402 payment.

### UI-07 — ERC-8183 job creation form (description, budget, deadline) + job status tracking

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S05
- Proof: Job creation via service cards on AgentScan page. Inline form + status tracking in UI.

### UI-08 — Premium subscription modal + payment flow ($20 cUSD)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S05
- Proof: Premium upgrade flow in dashboard with cUSD approval + payment via wagmi.

### UI-09 — Badge display (grey ⚫/blue 🔵/gold 🟡/green 🟢) across all UI surfaces

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S06
- Proof: TrustBadge component renders in registry, AgentScan, dashboard. Contract getBadge() provides on-chain tier.

### INT-01 — Self Protocol verification flow (redirect → ZK proof → callback → setVerified on-chain)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S06
- Proof: SelfVerification component with QR code, deep link, polling. Backend /self/ endpoints handle full flow.

### INT-02 — 10 agent templates with system prompts, suggested pricing, and guardrails

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: 10 templates in backend/src/data/templates.ts with full system prompts and guardrails.

### INT-03 — IPFS storage via Pinata for ERC-8183 job deliverables

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S03
- Proof: deliverableIpfsCid field in jobs schema. Deliverable hash stored on-chain via submitJob().

### INT-04 — OpenRouter integration for free + premium LLM model routing

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: M001/S02
- Proof: OpenRouter service with tier-based model routing. Free: Gemma/Llama. Premium: Claude/GPT-4o/Gemini.

## Deferred

## Out of Scope
