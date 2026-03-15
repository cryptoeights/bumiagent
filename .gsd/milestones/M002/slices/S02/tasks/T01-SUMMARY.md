---
id: T01
parent: S02
milestone: M002
provides:
  - Expanded model roster (8 models: 4 free, 4 premium)
  - Tier-based auto-routing in chatCompletion()
  - Tier-aware /models endpoint
  - modelTier field in chat response
key_files:
  - backend/src/services/openrouter.ts
  - backend/src/routes/chat.ts
key_decisions:
  - Premium-tier agents get premium models included (no per-call payment)
  - Free-tier agents can still use premium models but pay per call
patterns_established:
  - getFallbacksForTier() / getModelsForTier() as tier-routing primitives
duration: 10m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Expand model roster and implement tier-based auto-routing

**Added Llama 4 Scout (free), GPT-4o and Gemini 2.5 Pro (premium) to model roster. Implemented auto-routing by agent subscription tier with premium fallback chain.**

## What Happened

Expanded `AVAILABLE_MODELS` from 5 to 8 models:
- Free: Step 3.5 Flash, Gemma 3 4B, Gemma 3 27B, **Llama 4 Scout** (new)
- Premium: Claude Sonnet 4.6, **GPT-4o** (new), **Gemini 2.5 Pro** (new), Claude Sonnet 4.6 + Web

Added `PREMIUM_FALLBACKS` chain alongside existing `FREE_FALLBACKS`. New `getFallbacksForTier()` returns the right chain. `chatCompletion()` now takes `agentTier` param — when no `modelId` specified, uses tier-appropriate fallback chain.

Updated chat route: passes `agent.subscriptionTier` to `chatCompletion()`. Premium-tier agents get premium models included (no 402 payment required). Free-tier agents using premium models still pay per call.

Updated `/models` endpoint to return `agentTier` and per-model `available` flag. Chat response now includes `modelTier` field.

## Verification

- `cd backend && npx tsc --noEmit` — passes clean
