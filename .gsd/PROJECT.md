# Bumi Agent (formerly CeloSpawn)

## What This Is

Bumi Agent is a no-code platform where anyone can launch, monetize, and manage AI agents on Celo blockchain in 10 seconds. Users pick a template, name their agent, set a price, and deploy — the platform handles wallet generation, on-chain identity (ERC-8004), pay-per-call monetization (x402), and job escrow (ERC-8183) automatically.

## Core Value

Anyone can deploy a monetizable AI agent on Celo in 10 seconds with just 3 form fields — no coding, no wallet setup, no payment integration required.

## Current State

**MVP complete.** Full stack deployed and live at bumiagent.one.

### What's Built

**Smart Contracts (Foundry)** — 85 tests, all passing
- ✅ SpawnRegistry.sol — ERC-721 + ERC-8004 agent identity, subscription management (85/15 split), badge system (grey/blue/gold/green)
- ✅ AgentCommerce.sol — ERC-8183 job escrow with state machine (Open→Funded→Submitted→Completed/Rejected), 5% platform fee
- ✅ EarthPool.sol — 15% premium revenue collector, campaign tracking, $500 threshold trigger
- ✅ Deploy.s.sol for Celo Mainnet/Alfajores deployment
- ✅ Comprehensive Foundry tests (33 SpawnRegistry + 29 AgentCommerce + 19 EarthPool + 4 Integration)

**Backend (Hono + Node.js)**
- ✅ Agent registration API — wallet generation, AES-256-GCM encryption, on-chain registration
- ✅ Agent chat endpoint — OpenRouter routing with template system prompts
- ✅ x402 payment gateway — HTTP 402 → cUSD payment → on-chain verification via viem
- ✅ ERC-8183 job manager — create, fund, submit, complete, reject with auto-processing
- ✅ Rate limiting — Redis-based, tier-enforced (10/30/200 calls)
- ✅ PostgreSQL schema (Drizzle ORM) — agents, call_logs, jobs, conversations
- ✅ Self Protocol verification endpoints
- ✅ Premium subscription with on-chain payment verification

**Frontend (Next.js 14 App Router)**
- ✅ Landing page with "Launch Your AI Agent" CTA, feature grid, top agents
- ✅ 3-field deploy form (name, template, price) + wagmi wallet connect
- ✅ Agent dashboard — list agents, edit, Self verification, premium upgrade
- ✅ Agent Registry — search, filter, badge display
- ✅ AgentScan — per-agent detail with stats, services, jobs, chat link
- ✅ Chat interface — markdown rendering, conversation history, model selector, x402 payment
- ✅ Trust badge system across all surfaces

**Templates & Integrations**
- ✅ 10 agent templates (DeFi, Payment, Content, Research, Support, Data, ReFi, DAO, Tutor, Custom)
- ✅ Self Protocol verification (QR → passport scan → polling → badge update)
- ✅ OpenRouter integration (free: Gemma/Llama, premium: Claude/GPT-4o/Gemini)

## Requirements

### Validated

**Smart Contracts:** SC-01 through SC-12 — all validated via 85 passing Foundry tests
**Backend API:** API-01 through API-10 — all validated via TypeScript compilation and code verification
**Frontend UI:** UI-01 through UI-09 — all validated via Next.js build (7 routes)
**Integrations:** INT-01 through INT-04 — all validated

### Active

(None — all M001 requirements validated)

### Out of Scope

- Real-time chat between users — high complexity, not core to agent platform
- Video/audio agent responses — storage/bandwidth costs, defer to v2+
- Mobile native app — web-first, mobile later
- Agent-to-agent autonomous job creation — complex orchestration, P2 nice-to-have
- MiniPay wallet support — P2, MetaMask/WalletConnect sufficient for MVP
- Model selection UI for premium — P2, auto-routing to best model sufficient
- Reputation scoring system — P2, basic stats sufficient for MVP

## Context

- **Hackathon:** Synthesis Hackathon (Ethereum ecosystem, Celo track)
- **Live URL:** bumiagent.one
- **Target tracks:** Celo track + Agent Infrastructure track
- **Key standards:** ERC-8004 (agent identity), ERC-8183 (job escrow), x402 (HTTP payments)
- **Payment token:** cUSD (Celo stablecoin) on Celo Mainnet (chainId: 42220)
- **Celo Mainnet cUSD:** 0x765DE816845861e75A25fCA122bb6898B8B1282a
- **Revenue model:** Premium subscriptions (85% treasury, 15% EarthPool), 5% job escrow fees
- **Free tier:** OpenRouter free models (Gemma, Llama)
- **Premium tier:** OpenRouter premium models (Claude, GPT-4o, Gemini Pro)

## Constraints

- **Tech stack**: Foundry (contracts), Next.js 14 App Router (frontend), Hono + Node.js (backend), PostgreSQL + Redis
- **Blockchain**: Celo Mainnet (chainId: 42220), cUSD as payment token
- **EVM version**: Shanghai (no cancun opcodes) — constrains OpenZeppelin to v5.1.0
- **Dependencies**: OpenZeppelin Contracts v5.1.0, wagmi + viem, shadcn/ui, qrcode.react, Drizzle ORM

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Foundry over Hardhat for contracts | Faster compilation, native Solidity tests, better tooling for Celo | ✅ 85 tests, sub-second compilation |
| OpenZeppelin v5.1.0 (not latest) | v5.6.1 uses mcopy (cancun), Celo L2 runs shanghai EVM | ✅ All contracts compile and deploy |
| OpenRouter as unified LLM gateway | Single API for free + premium models, no per-provider integration | ✅ Working with model selection |
| cUSD as sole payment token | Stablecoin reduces volatility risk, native to Celo ecosystem | ✅ Used in x402 and subscriptions |
| ERC-721 for agent identity (not ERC-1155) | Each agent is unique with its own wallet, 1:1 mapping cleaner | ✅ Clean ownership model |
| Server-side wallet generation | Simpler UX — user doesn't need to manage agent wallet separately | ✅ AES-256-GCM encryption |
| Hono over Express | Lighter, faster, TypeScript-native, better DX | ✅ Clean API with middleware |
| Drizzle ORM for PostgreSQL | Type-safe schema, simple migrations, lightweight | ✅ 4 tables, clean schema |
| Agent/Job IDs start at 1 | 0 used as sentinel for reverse lookups and existence checks | ✅ No ambiguity |

---
*Last updated: 2026-03-15 after M001 completion*
