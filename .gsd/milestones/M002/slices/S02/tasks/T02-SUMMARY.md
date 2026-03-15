---
id: T02
parent: S02
milestone: M002
provides:
  - Tier-aware frontend model selector
  - Default model selection based on agent tier
  - Premium included/locked UI states
key_files:
  - frontend/src/app/chat/[agentId]/page.tsx
key_decisions:
  - Premium models shown to all users but marked with lock icon for free-tier agents
  - Default model auto-selects first available model matching agent tier
duration: 8m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Update frontend model selector for tier-aware display

**Frontend model selector now defaults to agent's tier, shows premium models as "included" for premium agents and "pay per call" with lock icon for free agents.**

## What Happened

Added `agentTier` state from the `/models` endpoint response. Default model selection now picks the first available model matching the agent's tier instead of always defaulting to the first model.

Model selector shows tier-appropriate labels:
- Premium agents: "Premium (included)" group header, "included" label per model
- Free agents: "Premium (pay per call)" group header, 🔒 icon on unavailable premium models

Premium info bar and empty state messages updated to show "Included with Premium ✓" for premium-tier agents vs per-call pricing for free-tier.

Cost display badge in header now shows "Included" for premium models on premium agents.

## Verification

- `cd frontend && npx next build` — passes clean, all 7 routes generated
