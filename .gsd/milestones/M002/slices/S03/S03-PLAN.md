# S03: Advanced Analytics Dashboard

**Goal:** Per-agent analytics page with call trends over time, revenue chart, and model usage breakdown — all rendered with real charts.
**Demo:** Navigate to `/agent/:agentId` → analytics section shows line chart of calls over time, area chart of revenue, and donut chart of model usage.

## Must-Haves

- Backend endpoint for time-series analytics data (calls per day, revenue per day, model usage breakdown)
- Recharts charting library added to frontend
- Call trend line chart (calls per day over last 30 days)
- Revenue area chart (cumulative or daily revenue over last 30 days)
- Model usage donut/pie chart (free vs premium, breakdown by model)
- Charts integrated into AgentScan page (`/agent/:agentId`)

## Verification

- `cd backend && npx tsc --noEmit` passes
- `cd frontend && npx next build` passes
- AgentScan page renders charts when call data exists

## Tasks

- [x] **T01: Add analytics endpoint and install Recharts** `est:15m`
  - Why: Backend needs to serve time-series data; frontend needs charting library
  - Files: `backend/src/routes/agents.ts`, `frontend/package.json`
  - Do: Add `GET /agents/:agentId/analytics` endpoint that returns `{ dailyCalls: [{date, count, revenue, freeCount, premiumCount}], modelUsage: [{model, count}] }` for last 30 days. Install recharts in frontend.
  - Verify: `cd backend && npx tsc --noEmit` passes
  - Done when: Analytics endpoint returns properly shaped time-series data

- [x] **T02: Build analytics charts and integrate into AgentScan** `est:20m`
  - Why: Render the time-series data as visual charts on the agent detail page
  - Files: `frontend/src/components/AgentAnalytics.tsx`, `frontend/src/app/agent/[agentId]/page.tsx`
  - Do: Create AgentAnalytics component with 3 charts: (1) line chart for daily calls, (2) area chart for revenue over time, (3) pie chart for model usage. Use recharts with dark theme styling matching existing UI. Integrate into AgentScan page below existing stats.
  - Verify: `cd frontend && npx next build` passes
  - Done when: Charts render on AgentScan page with real data shape

## Files Likely Touched

- `backend/src/routes/agents.ts`
- `frontend/package.json`
- `frontend/src/components/AgentAnalytics.tsx`
- `frontend/src/app/agent/[agentId]/page.tsx`
