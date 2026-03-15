# S02: Multi-Model Agent Routing — UAT

**Milestone:** M002
**Written:** 2026-03-15

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: Model roster and routing logic are verifiable via build checks and code inspection. Full runtime test requires a running backend with OpenRouter API key.

## Preconditions

- Backend builds cleanly (`cd backend && npx tsc --noEmit`)
- Frontend builds cleanly (`cd frontend && npx next build`)
- For runtime tests: backend running with valid `OPENROUTER_API_KEY`, at least one agent registered in DB

## Smoke Test

Run `cd backend && npx tsc --noEmit && echo "OK"` — should print "OK" with no errors.

## Test Cases

### 1. Model roster contains all required models

1. Open `backend/src/services/openrouter.ts`
2. Count entries in `AVAILABLE_MODELS`
3. **Expected:** 8 models — 4 free (Step Flash, Gemma 4B, Gemma 27B, Llama 4 Scout) and 4 premium (Claude Sonnet 4.6, GPT-4o, Gemini 2.5 Pro, Claude Sonnet 4.6 + Web)

### 2. Free-tier agent auto-routes to free models

1. POST `/agents/:agentId/chat` for a free-tier agent with no `modelId` in body
2. **Expected:** Response includes `modelTier: "free"` and `model` is one of the free model slugs

### 3. Premium-tier agent auto-routes to premium models

1. POST `/agents/:agentId/chat` for a premium-tier agent with no `modelId` in body
2. **Expected:** Response includes `modelTier: "premium"` and `model` is one of the premium model slugs

### 4. Models endpoint returns tier-aware availability

1. GET `/agents/:agentId/models` for a free-tier agent
2. **Expected:** Response includes `agentTier: "free"`, free models have `available: true`, premium models have `available: false`
3. GET `/agents/:agentId/models` for a premium-tier agent
4. **Expected:** Response includes `agentTier: "premium"`, all models have `available: true`

### 5. Chat response includes modelTier field

1. POST `/agents/:agentId/chat` with any valid message
2. **Expected:** Response JSON includes `modelTier` field with value `"free"` or `"premium"`

### 6. Frontend defaults to correct model per tier

1. Open `/chat/:agentId` for a free-tier agent
2. **Expected:** Model selector defaults to a free model (Step Flash or Gemma)
3. Open `/chat/:agentId` for a premium-tier agent
4. **Expected:** Model selector defaults to a premium model (Claude Sonnet 4.6)

### 7. Frontend shows locked premium models for free agents

1. Open `/chat/:agentId` for a free-tier agent
2. Open the model selector dropdown
3. **Expected:** Premium models show with 🔒 icon and "pay per call" label

### 8. Premium-tier agents see "included" label

1. Open `/chat/:agentId` for a premium-tier agent
2. Select a premium model
3. **Expected:** Info bar shows "Included with Premium ✓" instead of per-call pricing

## Edge Cases

### Manual premium model override for free agent

1. Open `/chat/:agentId` for a free-tier agent
2. Manually select a premium model (e.g., GPT-4o)
3. Send a message
4. **Expected:** Backend returns 402 payment required with correct pricing for GPT-4o

### Model fallback on failure

1. If the primary model in the chain fails (e.g., rate limited)
2. **Expected:** Backend transparently falls back to the next model in the same tier's chain

## Failure Signals

- `npx tsc --noEmit` fails — TypeScript compilation error in model routing code
- `npx next build` fails — Frontend build error in chat page
- Chat response missing `modelTier` field — response schema not updated
- Free-tier agent getting premium models without payment — routing logic broken
- All models showing `available: true` for free-tier agents — tier filtering broken

## Requirements Proved By This UAT

- API-03 — Free tier uses free models (Gemma, Llama), premium uses Claude/GPT-4o/Gemini
- INT-04 — OpenRouter integration with tier-based model routing

## Not Proven By This UAT

- Actual LLM response quality differences between tiers (subjective)
- OpenRouter rate limits and fallback behavior under load
- Premium subscription purchase flow (proved in M001/S05)

## Notes for Tester

- Runtime tests (cases 2-5) require a running backend with valid OPENROUTER_API_KEY
- To test premium-tier behavior, manually update an agent's `subscriptionTier` to 'premium' in the database
- Model slugs are OpenRouter-specific — if a slug is retired, that model will fail gracefully to next in chain
