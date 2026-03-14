# M001: Migration

**Vision:** CeloSpawn is a no-code platform where anyone can launch, monetize, and manage AI agents on Celo blockchain in 10 seconds — with automatic on-chain identity (ERC-8004), pay-per-call monetization (x402), and job escrow (ERC-8183).

## Success Criteria

- User can deploy an AI agent by filling 3 fields (name, template, price) and clicking deploy
- Deployed agent is registered on-chain as ERC-721 with ERC-8004 identity
- Anyone can chat with an agent; owner chats free, public pays via x402
- Agent registry page lists all agents with badge, stats, and search
- AgentScan shows per-agent on-chain data, x402 endpoint, and stats
- ERC-8183 jobs can be created, funded, submitted, completed, and rejected with escrow
- Premium subscription splits payment 85/15 to treasury/EarthPool
- Badge system renders correctly (grey/blue/gold/green) across all surfaces
- 10 agent templates are available with appropriate system prompts and guardrails

## Key Risks / Unknowns

- Foundry + Celo L2 compatibility — precompile issues, gas estimation, EVM version differences could block all on-chain work
- ERC-8004 draft status — interface may differ from what we implement; no canonical Foundry reference implementation exists
- x402 protocol integration — v1/v2 header differences, thirdweb SDK maturity on Celo, settlement timing
- OpenRouter free model rate limits — 50 requests/day without credits could break demo
- Server-side wallet encryption — signature-based key derivation varies across wallet implementations

## Proof Strategy

- Foundry + Celo L2 → retire in S01 by deploying and testing all 3 contracts against Celo-compatible EVM
- ERC-8004 interface → retire in S01 by implementing SpawnRegistry with ERC-721 + custom identity fields that satisfy the standard's intent
- x402 integration → retire in S03 by completing a paid chat roundtrip through the x402 gateway
- OpenRouter limits → retire in S02 by building with fallback chain and response caching
- Wallet encryption → retire in S02 by implementing server-managed master key derivation (defer signature-based to post-MVP)

## Verification Classes

- Contract verification: Foundry tests with 100% critical path coverage, deployment script dry-run
- Integration verification: Backend ↔ contracts via viem, backend ↔ OpenRouter API, x402 payment flow end-to-end
- Operational verification: Dev server starts, DB migrations run, contracts deploy to local Anvil
- UAT / human verification: Full deploy → chat → pay flow in browser, agent registry browsing, AgentScan page

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 3 smart contracts deployed and tested (SpawnRegistry, AgentCommerce, EarthPool)
- Backend API handles agent registration, chat, x402 payments, job lifecycle, subscriptions
- Frontend has landing page, deploy form, dashboard, registry, AgentScan, chat interface
- A user can deploy an agent, chat with it, and see it in the registry — end-to-end in browser
- x402 paid chat works with cUSD settlement
- ERC-8183 job lifecycle works end-to-end
- Badge system displays correctly based on verification + premium status
- 10 templates with system prompts are functional

## Requirement Coverage

- Covers: SC-01 through SC-12, API-01 through API-10, UI-01 through UI-09, INT-01 through INT-04
- Partially covers: none
- Leaves for later: none (all requirements are MVP scope)
- Orphan risks: Demo day resilience (pre-warmed data, backup video)

## Slices

- [x] **S01: Smart Contracts Foundation** `risk:high` `depends:[]`
  > After this: All 3 contracts (SpawnRegistry, AgentCommerce, EarthPool) compile, pass Foundry tests, and deploy to local Anvil with a working Deploy.s.sol script
- [x] **S02: Backend Core — Agent Registration + Chat** `risk:high` `depends:[S01]`
  > After this: Backend API registers agents (wallet gen, encryption, DB), chats with agents via OpenRouter, rate-limits calls — testable via curl/httpie
- [x] **S03: Backend Payments — x402 + Subscriptions + Jobs** `risk:high` `depends:[S01,S02]`
  > After this: x402 pay-per-call chat works end-to-end, premium subscriptions split to treasury/EarthPool, ERC-8183 job lifecycle (create→fund→submit→complete) works via API
- [x] **S04: Frontend — Landing, Deploy Form, Chat** `risk:medium` `depends:[S02]`
  > After this: User can visit landing page, connect wallet, fill 3-field form to deploy an agent, and chat with it in the browser
- [x] **S05: Frontend — Registry, AgentScan, Dashboard** `risk:medium` `depends:[S03,S04]`
  > After this: Agent registry page lists all agents with search/filter, AgentScan shows per-agent on-chain data + stats, owner dashboard shows agent list with management
- [ ] **S06: Verification, Badges, Templates + Polish** `risk:low` `depends:[S04,S05]`
  > After this: Self Protocol verification flow works, badge system renders across all surfaces, 10 templates with system prompts are live, premium subscription UI + job creation UI complete — full MVP demoable

## Boundary Map

### S01 → S02

Produces:
- Deployed contract ABIs and addresses (SpawnRegistry, AgentCommerce, EarthPool)
- Contract interfaces: registerAgent(), getAgent(), recordCall(), canAcceptCall(), getBadge()
- AgentData struct shape and event signatures
- foundry.toml config and deployment script

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- POST /agents endpoint (registration with wallet gen + on-chain call)
- POST /agents/:agentId/chat endpoint (OpenRouter routing, free model)
- PostgreSQL schema (agents, call_logs tables)
- Agent model with wallet encryption (AES-256-GCM)
- Rate limiting middleware via Redis

Consumes:
- Contract ABIs and deployment addresses from S01

### S02 → S04

Produces:
- API contract for agent registration and chat
- Agent templates data (ids, names, descriptions)

Consumes:
- Contract ABIs from S01

### S03 → S05

Produces:
- x402 payment middleware
- GET /agents (list with pagination/search)
- GET /agents/:agentId (detail with on-chain data)
- POST /agents/:agentId/subscribe
- Job lifecycle API (POST /jobs, fund, submit, complete, reject)

Consumes:
- Agent registration + chat from S02
- Contract interfaces from S01

### S04 → S05

Produces:
- Next.js app shell with routing, wallet connect (wagmi), shared layouts
- Component library base (shadcn/ui configured)
- Agent deploy form component
- Chat interface component

Consumes:
- Backend API from S02

### S05 → S06

Produces:
- Registry page with agent cards
- AgentScan page layout
- Dashboard page layout
- Shared badge component (rendering grey/blue/gold/green)

Consumes:
- All backend APIs from S02, S03
- Frontend shell from S04

### S04,S05 → S06

Produces:
- nothing (final slice)

Consumes:
- All frontend pages and components from S04, S05
- All backend APIs from S02, S03
- Contract interfaces from S01
