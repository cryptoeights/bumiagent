# M002: Polish & Production

**Vision:** Complete production readiness — mainnet contracts, intelligent model routing, rich analytics, and mobile-first UI across the entire platform.

## Success Criteria

- All 3 contracts (SpawnRegistry, AgentCommerce, EarthPool) are deployed and verified on Celo Mainnet
- Backend contract addresses are updated and backend interacts with mainnet
- Agent chat selects between free and premium LLM models based on subscription tier
- Analytics dashboard shows call trends, revenue over time, and model usage with charts
- All pages (landing, deploy, registry, agentscan, chat, dashboard) render correctly on 375px mobile viewport

## Key Risks / Unknowns

- Celo Mainnet gas — need funded wallet to deploy 3 contracts
- OpenRouter model availability — free models may change or rate limit

## Proof Strategy

- Mainnet deployment → retire in S01 by deploying all 3 contracts and verifying on Celoscan
- Model routing → retire in S02 by completing a chat that uses different models based on tier

## Verification Classes

- Contract verification: Celoscan verified, backend reads from mainnet
- Integration verification: chat endpoint routes to correct model per tier
- Operational verification: analytics page loads with real data
- UAT / human verification: mobile viewport check on all pages

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 3 contracts deployed on Celo Mainnet with verified addresses
- Backend wired to mainnet contract addresses
- Multi-model routing works (free tier → free model, premium → premium model)
- Analytics dashboard shows charts with real data
- All pages pass mobile viewport visual check at 375px
- Changes deployed to production (Vercel + Railway)
- README roadmap items checked off

## Slices

- [ ] **S01: Celo Mainnet Contract Deployment** `risk:high` `depends:[]`
  > After this: all 3 contracts are live on Celo Mainnet, addresses wired into backend config
- [ ] **S02: Multi-Model Agent Routing** `risk:medium` `depends:[]`
  > After this: free-tier agents use free models, premium agents use premium models in chat
- [ ] **S03: Advanced Analytics Dashboard** `risk:low` `depends:[]`
  > After this: per-agent analytics page shows call trends, revenue charts, model usage breakdown
- [ ] **S04: Mobile-Responsive UI** `risk:low` `depends:[]`
  > After this: all pages render correctly on 375px mobile viewport

## Boundary Map

### S01 (standalone)

Produces:
- Mainnet contract addresses in `backend/src/config/contracts.ts`
- Deploy broadcast artifacts in `contracts/broadcast/`

### S02 (standalone)

Produces:
- Updated `backend/src/services/openrouter.ts` with model selection logic
- Model tier info in chat API response

### S03 (standalone)

Produces:
- New analytics page or enhanced AgentScan with chart components
- New DB queries for time-series call/revenue data

### S04 (standalone)

Produces:
- Responsive CSS across all pages
- Mobile-friendly navigation
