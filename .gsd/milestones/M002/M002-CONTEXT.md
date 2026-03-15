# M002: Polish & Production — Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

## Project Description

Bumi Agent is a no-code platform for launching AI agents on Celo. M001 shipped the full MVP. M002 completes the remaining practical roadmap items: mainnet contract deployment, multi-model agent routing, advanced analytics dashboard, and mobile-responsive UI.

## Why This Milestone

MVP is live at bumiagent.one but contracts aren't on mainnet, the LLM routing is single-model, analytics are basic, and mobile layout needs polish. These gaps affect production readiness and user experience.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Interact with agents that are registered on Celo Mainnet (real on-chain identity)
- Chat with agents that route between multiple LLM models based on tier/context
- View rich analytics (call trends, revenue charts, model usage breakdown)
- Use the full platform comfortably on mobile devices

### Entry point / environment

- Entry point: https://bumiagent.one
- Environment: production (Vercel + Railway + Celo Mainnet)
- Live dependencies involved: Celo RPC, OpenRouter, PostgreSQL

## Completion Class

- Contract complete means: all 3 contracts deployed on Celo Mainnet with verified addresses
- Integration complete means: backend reads/writes to mainnet contracts, multi-model routing works end-to-end
- Operational complete means: analytics page loads with real data, mobile layout is usable

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Contracts are deployed and verified on Celoscan
- Agent chat routes to different models based on tier
- Analytics dashboard shows real call/revenue data with charts
- All pages render correctly on mobile viewport (375px)

## Risks and Unknowns

- Celo Mainnet deployment requires funded wallet with CELO for gas
- Multi-model routing may hit OpenRouter rate limits on free tier

## Existing Codebase / Prior Art

- `contracts/` — 3 Solidity contracts with 85 tests, deploy script ready
- `backend/src/services/openrouter.ts` — current single-model LLM routing
- `frontend/src/app/agent/[agentId]/page.tsx` — current basic stats display
- `frontend/src/app/globals.css` — current styling (desktop-first)

## Scope

### In Scope

- Celo Mainnet contract deployment + address wiring
- Multi-model agent routing (free/premium model selection)
- Advanced analytics dashboard page
- Mobile-responsive CSS across all pages

### Out of Scope / Non-Goals

- Agent-to-agent communication (deferred — needs protocol design)
- New smart contract features
- New agent templates

## Technical Constraints

- Must not break existing production deployment
- Mainnet deploy needs real CELO for gas fees
- OpenRouter free tier: 50 requests/day without credits

## Integration Points

- Celo Mainnet RPC — contract deployment and interaction
- OpenRouter — multi-model routing
- Vercel — frontend redeploy after changes
- Railway — backend redeploy after changes
