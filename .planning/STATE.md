# State: CeloSpawn

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-13)
**Core value:** Anyone can deploy a monetizable AI agent on Celo in 10 seconds
**Current focus:** Phase 1

## Current Position
- **Active phase:** None (ready to start)
- **Completed phases:** None
- **Next action:** /gsd:plan-phase 1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Foundry over Hardhat for contracts | Faster compilation, native Solidity tests, better tooling for Celo | Pending |
| OpenRouter as unified LLM gateway | Single API for free + premium models, no per-provider integration | Pending |
| cUSD as sole payment token | Stablecoin reduces volatility risk, native to Celo ecosystem | Pending |
| ERC-721 for agent identity (not ERC-1155) | Each agent is unique with its own wallet, 1:1 mapping cleaner | Pending |
| Server-side wallet generation | Simpler UX — user doesn't need to manage agent wallet separately | Pending |
| thirdweb x402 SDK for payments | Official x402 implementation, handles settlement complexity | Pending |
| PostgreSQL + Redis (not pure on-chain) | On-chain for ownership/payments, off-chain for metadata/logs/performance | Pending |

## Open Issues
- OpenRouter free tier limit 50 req/day — buy $10 credits before testing
- Agent wallets need gas funding mechanism (0.01 CELO per wallet or ERC-2771 meta-transactions)
- Celo Foundry precompile workaround needed (celo-foundry + vm.etch)
- x402 v1/v2 header mismatch risk — use SDK header extraction, pin SDK version
- On-chain/off-chain state desync — write DB first (pending), transact on-chain, update DB (confirmed)

## Session Continuity
*Last session: 2026-03-13 — Project initialized, research complete, roadmap created*
