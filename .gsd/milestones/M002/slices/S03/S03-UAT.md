# S03: Advanced Analytics Dashboard — UAT

**Milestone:** M002
**Written:** 2026-03-15

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: Chart rendering verified via build; data shape verified via endpoint inspection.

## Preconditions

- Backend running with PostgreSQL connection
- At least one agent with call history in the database
- Frontend builds cleanly

## Smoke Test

Run `cd frontend && npx next build` — should compile successfully including the AgentAnalytics component.

## Test Cases

### 1. Analytics endpoint returns correct shape

1. `curl http://localhost:3001/agents/1/analytics | jq .`
2. **Expected:** JSON with `agentId`, `days`, `dailyCalls` (array of objects with date/count/revenue/freeCount/premiumCount), `modelUsage` (array with model/tier/count)

### 2. Daily calls array fills missing dates

1. `curl http://localhost:3001/agents/1/analytics | jq '.dailyCalls | length'`
2. **Expected:** Returns ~30 (one entry per day for last 30 days, including zero-count days)

### 3. Charts render on AgentScan page

1. Navigate to `/agent/:agentId` for an agent with call data
2. Scroll down past the Call Breakdown section
3. **Expected:** See "Analytics (Last 30 Days)" heading with Call Trends line chart and Revenue area chart side by side, plus Model Usage donut chart below

### 4. Empty state renders gracefully

1. Navigate to `/agent/:agentId` for an agent with zero calls
2. **Expected:** Analytics section shows "No call data yet — analytics will appear after the first chat."

### 5. Charts show correct data

1. Navigate to `/agent/:agentId` for an agent with mixed free/premium calls
2. **Expected:** Call Trends shows green solid line (total), blue dashed (free), gold dashed (premium). Revenue chart shows gold area. Pie chart shows model breakdown with tier badges.

## Edge Cases

### Agent with only one day of data

1. Navigate to analytics for agent with calls only today
2. **Expected:** Charts render with a single data point — no crash or empty chart

### Custom days parameter

1. `curl http://localhost:3001/agents/1/analytics?days=7 | jq '.dailyCalls | length'`
2. **Expected:** Returns ~7 entries

## Failure Signals

- Frontend build fails — TypeScript or Recharts import error
- Charts render blank — data shape mismatch between endpoint and component
- "Loading analytics..." stuck — API endpoint unreachable or erroring
- Missing dates in chart — date-fill logic broken in endpoint

## Requirements Proved By This UAT

- Analytics dashboard shows call trends, revenue over time, and model usage with charts (M002 success criterion)

## Not Proven By This UAT

- Performance under high data volume (thousands of daily calls)
- Chart responsiveness at mobile viewport (deferred to S04)

## Notes for Tester

- If the agent has no call history, the analytics section shows a clean empty state — this is expected behavior.
- Charts use Recharts which renders as SVG — they're interactive (hover for tooltips).
