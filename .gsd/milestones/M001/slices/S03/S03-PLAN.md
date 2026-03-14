# S03: Backend Payments — x402 + Subscriptions + Jobs

**Goal:** x402 pay-per-call chat works, premium subscriptions split to treasury/EarthPool, ERC-8183 job lifecycle (create→fund→submit→complete) works via API.
**Demo:** Public (non-owner) chat returns 402 with price info; premium subscription endpoint processes payment; job lifecycle API manages full state machine — all testable via curl.

## Must-Haves

- x402 payment middleware — returns HTTP 402 with price for non-owner calls
- POST /agents/:agentId/subscribe — premium subscription via contract interaction
- POST /jobs — create ERC-8183 job
- POST /jobs/:jobId/fund, /submit, /complete, /reject — full job lifecycle
- GET /jobs/:jobId — job detail
- GET /agents/:agentId/jobs — list jobs for agent
- GET /agents/:agentId/stats — agent statistics

## Proof Level

- This slice proves: integration (backend ↔ contracts for subscriptions/jobs)
- Real runtime required: yes (API endpoints testable via curl)
- Human/UAT required: no

## Verification

- Non-owner chat returns 402 with payment requirements
- POST /jobs creates a job, returns job detail
- Full job state transitions work via API
- GET /agents/:id/stats returns call count and revenue

## Tasks

- [ ] **T01: x402 payment middleware + stats endpoint** `est:25m`
  - Why: Core monetization — non-owner calls need to pay via x402
  - Files: `backend/src/middleware/x402.ts`, `backend/src/routes/agents.ts`
  - Do: x402 middleware returns 402 with price/payTo/network for non-owner calls. Add GET /agents/:id/stats. For MVP, accept payment header and verify format (actual on-chain settlement deferred to mainnet deploy).
  - Verify: Non-owner chat returns 402; owner chat still free
  - Done when: Payment gate works, stats endpoint returns data

- [ ] **T02: Job lifecycle API** `est:30m`
  - Why: ERC-8183 job escrow is a key differentiator
  - Files: `backend/src/routes/jobs.ts`
  - Do: POST /jobs (create), POST /jobs/:id/fund, /submit, /complete, /reject. GET /jobs/:id, GET /agents/:id/jobs. State machine validation (Open→Funded→Submitted→Terminal). Store in DB jobs table.
  - Verify: Full lifecycle via curl — create, fund, submit, complete returns correct states
  - Done when: All job state transitions work, invalid transitions rejected

- [ ] **T03: Subscription endpoint + wire routes** `est:20m`
  - Why: Premium subscriptions drive revenue and unlock premium models
  - Files: `backend/src/routes/subscriptions.ts`, `backend/src/index.ts`
  - Do: POST /agents/:id/subscribe — records premium status in DB (on-chain interaction via frontend in S04/S05). Wire all new routes into main app. Update rate limits for premium (200/day).
  - Verify: Subscribe endpoint updates agent premium status; rate limit changes accordingly
  - Done when: Premium subscription recorded, rate limit upgraded

## Files Likely Touched

- `backend/src/middleware/x402.ts`
- `backend/src/routes/agents.ts`
- `backend/src/routes/jobs.ts`
- `backend/src/routes/subscriptions.ts`
- `backend/src/routes/chat.ts`
- `backend/src/index.ts`
