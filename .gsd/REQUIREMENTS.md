# Requirements

## Active

### SC-01 — SpawnRegistry.sol registers agents as ERC-721 NFTs with ERC-8004 compliant identity

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

SpawnRegistry.sol registers agents as ERC-721 NFTs with ERC-8004 compliant identity

### SC-02 — SpawnRegistry stores AgentData (wallet, template, price, verification, premium, stats)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

SpawnRegistry stores AgentData (wallet, template, price, verification, premium, stats)

### SC-03 — SpawnRegistry manages premium subscriptions ($20 cUSD/month, 85/15 split treasury/EarthPool)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

SpawnRegistry manages premium subscriptions ($20 cUSD/month, 85/15 split treasury/EarthPool)

### SC-04 — SpawnRegistry tracks badge system (grey/blue/gold/green based on verification + premium)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

SpawnRegistry tracks badge system (grey/blue/gold/green based on verification + premium)

### SC-05 — SpawnRegistry enforces rate limits (10 free, 30 verified, 200 premium calls)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

SpawnRegistry enforces rate limits (10 free, 30 verified, 200 premium calls)

### SC-06 — AgentCommerce.sol implements ERC-8183 job escrow (Open→Funded→Submitted→Terminal)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AgentCommerce.sol implements ERC-8183 job escrow (Open→Funded→Submitted→Terminal)

### SC-07 — AgentCommerce handles job lifecycle (create, fund, submit, complete, reject, expire)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AgentCommerce handles job lifecycle (create, fund, submit, complete, reject, expire)

### SC-08 — AgentCommerce takes 5% platform fee on completed jobs

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AgentCommerce takes 5% platform fee on completed jobs

### SC-09 — EarthPool.sol collects 15% premium revenue and emits CampaignReady at $500 threshold

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

EarthPool.sol collects 15% premium revenue and emits CampaignReady at $500 threshold

### SC-10 — EarthPool tracks campaigns with on-chain proof (description, proofURI, amount)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

EarthPool tracks campaigns with on-chain proof (description, proofURI, amount)

### SC-11 — Deploy.s.sol deploys all contracts to Celo Mainnet in correct order

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Deploy.s.sol deploys all contracts to Celo Mainnet in correct order

### SC-12 — Comprehensive Foundry tests for all contracts (100% critical path coverage)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Comprehensive Foundry tests for all contracts (100% critical path coverage)

### API-01 — POST /agents — register agent (wallet gen, encryption, on-chain registration)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

POST /agents — register agent (wallet gen, encryption, on-chain registration)

### API-02 — POST /agents/:agentId/chat — chat with agent via OpenRouter LLM

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

POST /agents/:agentId/chat — chat with agent via OpenRouter LLM

### API-03 — Free tier uses OpenRouter free models (Gemma, Llama), premium uses Claude/GPT-4o/Gemini

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Free tier uses OpenRouter free models (Gemma, Llama), premium uses Claude/GPT-4o/Gemini

### API-04 — x402 payment gateway — HTTP 402 response with price, thirdweb settlement

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

x402 payment gateway — HTTP 402 response with price, thirdweb settlement

### API-05 — Rate limiting via Redis (10/30/200 calls based on tier)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Rate limiting via Redis (10/30/200 calls based on tier)

### API-06 — POST /jobs — create ERC-8183 job with escrow

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

POST /jobs — create ERC-8183 job with escrow

### API-07 — Job lifecycle API (fund, submit, complete, reject, claim refund)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Job lifecycle API (fund, submit, complete, reject, claim refund)

### API-08 — Agent wallet generation (ethers.Wallet.createRandom) + AES-256-GCM encryption

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Agent wallet generation (ethers.Wallet.createRandom) + AES-256-GCM encryption

### API-09 — POST /agents/:agentId/subscribe — premium subscription via smart contract

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

POST /agents/:agentId/subscribe — premium subscription via smart contract

### API-10 — PostgreSQL schema (agents, call_logs, jobs tables)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

PostgreSQL schema (agents, call_logs, jobs tables)

### UI-01 — Landing page with "Launch Agent" CTA and value proposition

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Landing page with "Launch Agent" CTA and value proposition

### UI-02 — 3-field deploy form (name, template dropdown, price) with wallet connect (MetaMask/WalletConnect)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

3-field deploy form (name, template dropdown, price) with wallet connect (MetaMask/WalletConnect)

### UI-03 — Agent dashboard — list user's agents with stats, manage, upgrade

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Agent dashboard — list user's agents with stats, manage, upgrade

### UI-04 — Agent Registry — public discovery page with search, filter, sort

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Agent Registry — public discovery page with search, filter, sort

### UI-05 — AgentScan — per-agent detail page with on-chain data, badge, stats, x402 endpoint

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AgentScan — per-agent detail page with on-chain data, badge, stats, x402 endpoint

### UI-06 — Chat interface for interacting with agents (owner free, public x402 paid)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Chat interface for interacting with agents (owner free, public x402 paid)

### UI-07 — ERC-8183 job creation form (description, budget, deadline) + job status tracking

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

ERC-8183 job creation form (description, budget, deadline) + job status tracking

### UI-08 — Premium subscription modal + payment flow ($20 cUSD)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Premium subscription modal + payment flow ($20 cUSD)

### UI-09 — Badge display (grey ⚫/blue 🔵/gold 🟡/green 🟢) across all UI surfaces

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Badge display (grey ⚫/blue 🔵/gold 🟡/green 🟢) across all UI surfaces

### INT-01 — Self Protocol verification flow (redirect → ZK proof → callback → setVerified on-chain)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Self Protocol verification flow (redirect → ZK proof → callback → setVerified on-chain)

### INT-02 — 10 agent templates with system prompts, suggested pricing, and guardrails

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

10 agent templates with system prompts, suggested pricing, and guardrails

### INT-03 — IPFS storage via Pinata for ERC-8183 job deliverables

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

IPFS storage via Pinata for ERC-8183 job deliverables

### INT-04 — OpenRouter integration for free + premium LLM model routing

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

OpenRouter integration for free + premium LLM model routing

## Validated

## Deferred

## Out of Scope
