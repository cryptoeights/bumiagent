# S02: Multi-Model Agent Routing

**Goal:** Chat automatically selects the right LLM based on agent subscription tier — free-tier agents default to free models, premium agents default to premium models. Model roster expanded to include Llama, GPT-4o, and Gemini Pro.
**Demo:** Chat with a free-tier agent → uses Gemma/Llama. Chat with a premium-tier agent → uses Claude/GPT-4o. Response includes `modelTier` field.

## Must-Haves

- Expanded model roster: add Llama (free), GPT-4o and Gemini Pro (premium)
- Auto-routing: when no `modelId` specified, default model chosen by agent's subscription tier
- `/models` endpoint returns tier-aware availability (premium models marked as locked for free-tier agents)
- Chat response includes `modelTier` in the JSON body
- Frontend model selector reflects tier — shows available models first, premium models as locked/upgrade for free agents
- Fallback chain works per tier (free → free fallbacks, premium → premium fallbacks)

## Verification

- Backend builds cleanly: `cd backend && npx tsc --noEmit`
- Frontend builds cleanly: `cd frontend && npx next build`
- Manual: POST to `/agents/:id/chat` without `modelId` for a free agent → response shows free model
- Manual: POST to `/agents/:id/chat` without `modelId` for a premium agent → response shows premium model

## Tasks

- [x] **T01: Expand model roster and implement tier-based auto-routing** `est:20m`
  - Why: Core backend logic — expand available models and route by tier automatically
  - Files: `backend/src/services/openrouter.ts`, `backend/src/routes/chat.ts`
  - Do: Add Llama 3.3 (free), GPT-4o and Gemini 2.5 Pro (premium) to AVAILABLE_MODELS. Add `PREMIUM_FALLBACKS` chain mirroring `FREE_FALLBACKS`. Add `getDefaultModels(tier)` that returns the right fallback chain. Update `chatCompletion()` to accept tier and auto-select. Update chat route to pass agent's `subscriptionTier` for auto-routing when no `modelId` specified. Update `/models` endpoint to accept agent tier and mark model availability. Include `modelTier` in chat response.
  - Verify: `cd backend && npx tsc --noEmit` passes
  - Done when: Backend compiles, auto-routing logic selects different models based on agent tier

- [x] **T02: Update frontend model selector for tier-aware display** `est:15m`
  - Why: Frontend needs to show which models are available vs locked based on agent's subscription tier
  - Files: `frontend/src/app/chat/[agentId]/page.tsx`
  - Do: Fetch agent's subscription tier (already available from agent data). Pass tier to models endpoint or filter client-side. Show premium models as locked with "Upgrade to Premium" badge for free-tier agents. Default selection to first available model for the agent's tier. Keep manual override possible (free-tier can still select premium and pay per call).
  - Verify: `cd frontend && npx next build` passes
  - Done when: Free-tier agents see free models selected by default with premium locked; premium agents see premium models selected by default

## Files Likely Touched

- `backend/src/services/openrouter.ts`
- `backend/src/routes/chat.ts`
- `frontend/src/app/chat/[agentId]/page.tsx`
