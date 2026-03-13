# CeloSpawn

## What This Is

CeloSpawn is a no-code platform where anyone can launch, monetize, and manage AI agents on Celo blockchain in 10 seconds. Users pick a template, name their agent, set a price, and deploy — the platform handles wallet generation, on-chain identity (ERC-8004), pay-per-call monetization (x402), and job escrow (ERC-8183) automatically.

## Core Value

Anyone can deploy a monetizable AI agent on Celo in 10 seconds with just 3 form fields — no coding, no wallet setup, no payment integration required.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

**Smart Contracts (Foundry)**
- [ ] SpawnRegistry.sol — ERC-721 + ERC-8004 agent identity, subscription management, badge system
- [ ] AgentCommerce.sol — ERC-8183 job escrow with state machine (Open→Funded→Submitted→Terminal)
- [ ] EarthPool.sol — 15% premium revenue collector, campaign tracking, $500 threshold trigger
- [ ] Deploy script for Celo Mainnet (Deploy.s.sol)
- [ ] Comprehensive Foundry tests for all contracts

**Backend (Node.js)**
- [ ] Agent registration API — wallet generation, encryption, on-chain registration
- [ ] Agent chat endpoint — LLM routing via OpenRouter (free/premium models)
- [ ] x402 payment gateway — thirdweb SDK integration for pay-per-call
- [ ] ERC-8183 job manager — create, fund, submit, complete, reject jobs
- [ ] Rate limiting — free tier (10/30 calls/day), premium (200 calls/month)
- [ ] PostgreSQL schema — agents, call_logs, jobs tables

**Frontend (Next.js)**
- [ ] Landing page with "Launch Agent" CTA
- [ ] 3-field deploy form (name, template, price) + wallet connect
- [ ] Agent dashboard — list agents, stats, manage
- [ ] Agent Registry — public discovery page with search/filter
- [ ] AgentScan — per-agent detail page with on-chain data
- [ ] Chat interface for using agents
- [ ] Premium subscription UI + payment flow
- [ ] Self Protocol verification flow
- [ ] Badge display (grey/blue/gold/green) across UI

**Templates**
- [ ] 10 pre-built agent templates (DeFi, Payment, Content, Research, Support, Data, ReFi, DAO, Tutor, Custom)
- [ ] System prompts, suggested pricing, guardrails per template

**Integrations**
- [ ] Self Protocol — proof-of-human verification (ZK proof)
- [ ] OpenRouter — unified LLM gateway (free + premium models)
- [ ] thirdweb x402 SDK — payment settlement
- [ ] IPFS (Pinata/web3.storage) — deliverable storage for jobs

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real-time chat between users — high complexity, not core to agent platform
- Video/audio agent responses — storage/bandwidth costs, defer to v2+
- Mobile native app — web-first, mobile later
- Agent-to-agent autonomous job creation — complex orchestration, P2 nice-to-have
- MiniPay wallet support — P2, MetaMask/WalletConnect sufficient for MVP
- Model selection UI for premium — P2, auto-routing to best model sufficient
- Reputation scoring system — P2, basic stats sufficient for MVP

## Context

- **Hackathon:** Synthesis Hackathon (Ethereum ecosystem, Celo track) — building starts March 13, 2026
- **Target tracks:** Celo track + Agent Infrastructure track
- **Judging:** AI agent judges + human judges
- **Tagline:** "10 detik bikin AI Agent di Celo. No code. No hassle."
- **Key standards:** ERC-8004 (agent identity), ERC-8183 (job escrow), x402 (HTTP payments)
- **Payment token:** cUSD (Celo stablecoin) on Celo Mainnet (chainId: 42220)
- **Celo Mainnet cUSD:** 0x765DE816845861e75A25fCA122bb6898B8B1282a
- **Revenue model:** $20/month premium subscriptions (85% treasury, 15% EarthPool), 5% job escrow fees
- **Free tier:** OpenRouter free models (Gemma, Llama), no API key needed from user
- **Premium tier:** OpenRouter premium models (Claude, GPT-4o, Gemini Pro)

## Constraints

- **Timeline**: Hackathon scope — MVP must be demoable within 2 weeks
- **Tech stack**: Foundry (contracts), Next.js 14+ App Router (frontend), Node.js + Express/Hono (backend), PostgreSQL + Redis
- **Blockchain**: Celo Mainnet only (chainId: 42220), cUSD as payment token
- **Dependencies**: OpenZeppelin Contracts v5, wagmi + viem, shadcn/ui, thirdweb x402 SDK
- **Security**: AES-256-GCM for agent private keys, ReentrancyGuard on all token transfers, SafeERC20

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Foundry over Hardhat for contracts | Faster compilation, native Solidity tests, better tooling for Celo | — Pending |
| OpenRouter as unified LLM gateway | Single API for free + premium models, no per-provider integration | — Pending |
| cUSD as sole payment token | Stablecoin reduces volatility risk, native to Celo ecosystem | — Pending |
| ERC-721 for agent identity (not ERC-1155) | Each agent is unique with its own wallet, 1:1 mapping cleaner | — Pending |
| Server-side wallet generation | Simpler UX — user doesn't need to manage agent wallet separately | — Pending |
| thirdweb x402 SDK for payments | Official x402 implementation, handles settlement complexity | — Pending |
| PostgreSQL + Redis (not pure on-chain) | On-chain for ownership/payments, off-chain for metadata/logs/performance | — Pending |

---
*Last updated: 2026-03-13 after initialization*
