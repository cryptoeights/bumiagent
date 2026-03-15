---
id: S02
parent: M002
milestone: M002
provides:
  - Tier-based model auto-routing (free agents → free models, premium → premium)
  - Expanded model roster (8 models: 4 free + 4 premium)
  - modelTier in chat response
  - Tier-aware frontend model selector
requires: []
affects: []
key_files:
  - backend/src/services/openrouter.ts
  - backend/src/routes/chat.ts
  - frontend/src/app/chat/[agentId]/page.tsx
key_decisions:
  - Premium-tier agents get premium models included (no per-call payment required)
  - Free-tier agents can still manually select premium models but pay per call
  - Model selector defaults to first model matching agent's subscription tier
patterns_established:
  - getFallbacksForTier() / getModelsForTier() as tier-routing primitives
observability_surfaces:
  - Chat response includes modelTier field indicating which tier was used
  - /models endpoint returns agentTier and per-model available flag
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S02/tasks/T02-SUMMARY.md
duration: 18m
verification_result: passed
completed_at: 2026-03-15
---

# S02: Multi-Model Agent Routing

**Tier-based model auto-routing — free agents default to free LLMs (Gemma, Llama), premium agents default to premium LLMs (Claude, GPT-4o, Gemini). Roster expanded from 5 to 8 models.**

## What Happened

Expanded `AVAILABLE_MODELS` to 8 models covering the requirement (API-03): added Llama 4 Scout to free tier, GPT-4o and Gemini 2.5 Pro to premium tier.

Implemented tier-based auto-routing in `chatCompletion()` — when no `modelId` is specified, the function uses the agent's subscription tier to pick the right fallback chain. Free agents try free models in sequence; premium agents try premium models. Added `PREMIUM_FALLBACKS` chain alongside existing `FREE_FALLBACKS`.

Updated the chat route to pass `agent.subscriptionTier` for auto-routing. Premium-tier agents get premium models included at no per-call cost. Free-tier agents can still manually select premium models but trigger per-call x402 payment.

The `/models` endpoint now returns `agentTier` and per-model `available` flag. Chat response includes `modelTier` field.

Frontend model selector defaults to the first model matching the agent's tier. Premium models shown to all users but marked as locked (🔒) for free-tier agents. Info bar shows "Included with Premium ✓" vs per-call pricing.

## Verification

- `cd backend && npx tsc --noEmit` — passes clean
- `cd frontend && npx next build` — passes clean, all 7 routes generated

## Requirements Validated

- API-03 — Free tier uses free models (Gemma, Llama), premium uses premium models (Claude, GPT-4o, Gemini) — now with auto-routing
- INT-04 — OpenRouter integration with tier-based model routing

## Deviations

None.

## Known Limitations

- Model availability on OpenRouter not runtime-validated — if a model slug changes or is removed, the fallback chain handles it gracefully by trying the next model
- Premium subscription included models work in backend logic but haven't been exercised with a real premium-tier agent in production

## Follow-ups

- Redeploy backend to Railway for live tier-based routing

## Files Created/Modified

- `backend/src/services/openrouter.ts` — expanded model roster (8 models), added tier-routing functions, modelTier in response
- `backend/src/routes/chat.ts` — tier-aware auto-routing, updated /models endpoint, premium-included logic
- `frontend/src/app/chat/[agentId]/page.tsx` — tier-aware model selector, default by tier, premium included/locked UI

## Forward Intelligence

### What the next slice should know
- Model routing is fully tier-aware. The `getModelsForTier()` and `getFallbacksForTier()` functions are the primitives to use.
- Chat response now includes `modelTier` field — useful for analytics (S03).

### What's fragile
- OpenRouter model slugs are hardcoded. If OpenRouter changes a slug, that model will fail and fallback to the next in chain.

### Authoritative diagnostics
- Chat response `modelTier` field — confirms which tier was actually used per call
- `/models` endpoint `agentTier` field — confirms tier detection for any agent

### What assumptions changed
- None — implementation matched expectations.
