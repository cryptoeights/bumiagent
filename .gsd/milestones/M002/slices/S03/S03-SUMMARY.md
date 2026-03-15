---
id: S03
parent: M002
milestone: M002
provides:
  - Time-series analytics API endpoint
  - AgentAnalytics component with 3 chart types
  - Charts integrated into AgentScan page
requires: []
affects: []
key_files:
  - backend/src/routes/agents.ts
  - frontend/src/components/AgentAnalytics.tsx
  - frontend/src/app/agent/[agentId]/page.tsx
  - frontend/package.json
key_decisions:
  - Recharts for charting (lightweight, React-native, good dark theme support)
  - Charts always rendered on AgentScan (self-handle empty state)
patterns_established:
  - Analytics endpoint pattern with date-fill for continuous chart data
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md
duration: 18m
verification_result: passed
completed_at: 2026-03-15
---

# S03: Advanced Analytics Dashboard

**Per-agent analytics on AgentScan page — call trends line chart, revenue area chart, and model usage pie chart powered by time-series backend endpoint.**

## What Happened

Added `GET /agents/:agentId/analytics` endpoint that returns `dailyCalls` (per-day with count, revenue, free/premium breakdown) and `modelUsage` (per-model with tier and count) for the last 30 days. Fills in zero-data dates for continuous chart rendering.

Built `AgentAnalytics` React component using Recharts with 3 charts:
1. **Call Trends (LineChart)**: solid line for total calls, dashed lines for free/premium tier split
2. **Revenue (AreaChart)**: daily revenue in cUSD with gold gradient fill
3. **Model Usage (PieChart)**: donut chart with per-model breakdown and tier badges in legend

All charts use dark theme styling matching the existing zinc-based UI. Component self-handles loading and empty states.

Integrated into AgentScan page below the existing Call Breakdown section.

## Verification

- `cd backend && npx tsc --noEmit` — passes clean
- `cd frontend && npx next build` — passes clean, all 7 routes generated

## Deviations

None.

## Known Limitations

- Charts show last 14 data points max for readability — configurable via endpoint `days` param
- No caching on analytics endpoint — acceptable at current scale

## Files Created/Modified

- `backend/src/routes/agents.ts` — added analytics endpoint with time-series queries
- `frontend/src/components/AgentAnalytics.tsx` — new component with 3 Recharts charts
- `frontend/src/app/agent/[agentId]/page.tsx` — integrated AgentAnalytics component
- `frontend/package.json` — added recharts dependency

## Forward Intelligence

### What the next slice should know
- Recharts is available in the frontend — import from `recharts` for any future chart needs.
- The analytics endpoint uses Drizzle raw SQL with `to_char` for date grouping — PostgreSQL-specific.

### What's fragile
- Nothing particularly fragile. The endpoint degrades gracefully with no data.

### Authoritative diagnostics
- `GET /agents/:id/analytics` — returns structured JSON, easy to inspect for data shape issues.
