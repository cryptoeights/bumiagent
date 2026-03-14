# S02: Backend Core — Agent Registration + Chat

**Goal:** Backend API handles agent registration (wallet gen, encryption, DB persistence), chat via OpenRouter (free models), rate limiting via Redis, and serves template data. Testable via curl.
**Demo:** `curl POST /agents` creates an agent with auto-generated wallet; `curl POST /agents/:id/chat` returns an LLM response; rate limits enforce 10 calls/day for free tier.

## Must-Haves

- Node.js + Hono backend with TypeScript
- PostgreSQL schema (agents, call_logs tables) via Drizzle ORM
- POST /agents — wallet generation, AES-256-GCM encryption, DB insert
- POST /agents/:agentId/chat — OpenRouter free model routing, conversation
- GET /agents — list agents with pagination
- GET /agents/:agentId — agent detail
- GET /templates — list all 10 templates
- Rate limiting via Redis (10 calls/day free tier)
- Environment validation at startup (fail fast)
- Contract ABI exports for frontend consumption

## Proof Level

- This slice proves: integration (backend ↔ PostgreSQL ↔ Redis ↔ OpenRouter)
- Real runtime required: yes (live DB, Redis, OpenRouter API)
- Human/UAT required: no (curl verification sufficient)

## Verification

- `cd backend && npm run build` — compiles without errors
- `cd backend && npm run dev` — server starts on port 3001
- `curl POST localhost:3001/api/agents` — returns created agent with wallet
- `curl POST localhost:3001/api/agents/1/chat` — returns LLM response
- `curl GET localhost:3001/api/templates` — returns 10 templates
- Rate limit enforced after 10 calls

## Tasks

- [ ] **T01: Backend project setup + DB schema** `est:25m`
  - Why: Foundation — project structure, dependencies, Drizzle ORM, DB migration
  - Files: `backend/package.json`, `backend/tsconfig.json`, `backend/src/db/schema.ts`, `backend/src/db/index.ts`, `backend/drizzle.config.ts`
  - Do: Init Node.js project with Hono, TypeScript, Drizzle ORM, dotenv. Define agents + call_logs tables. Run migration against Supabase. Validate env at startup.
  - Verify: `npm run db:push` succeeds, tables visible in Supabase
  - Done when: DB schema deployed, dev server starts

- [ ] **T02: Agent registration endpoint + wallet encryption** `est:30m`
  - Why: Core functionality — the "10 second deploy" backend
  - Files: `backend/src/routes/agents.ts`, `backend/src/services/wallet.ts`, `backend/src/services/crypto.ts`
  - Do: POST /agents — validate input, generate wallet (ethers), encrypt private key (AES-256-GCM with master key), insert to DB. GET /agents (list), GET /agents/:id (detail).
  - Verify: `curl -X POST localhost:3001/api/agents -d '{"name":"Test","templateId":0,"pricePerCall":"50000000000000000","ownerAddress":"0x..."}' ` returns agent with wallet address
  - Done when: Agent created in DB with encrypted key, retrievable via GET

- [ ] **T03: Templates data + OpenRouter chat endpoint** `est:30m`
  - Why: Agents need to talk — LLM routing via OpenRouter with template system prompts
  - Files: `backend/src/routes/chat.ts`, `backend/src/services/openrouter.ts`, `backend/src/data/templates.ts`
  - Do: Define 10 templates with system prompts. POST /agents/:id/chat — load template, build messages, call OpenRouter free model, log to call_logs. GET /templates endpoint.
  - Verify: `curl POST localhost:3001/api/agents/1/chat -d '{"message":"Hello"}'` returns LLM response
  - Done when: Chat works with free model, response logged in call_logs

- [ ] **T04: Rate limiting + env validation + contract ABIs** `est:20m`
  - Why: Rate limits protect OpenRouter budget; env validation prevents cryptic failures; ABIs needed by frontend
  - Files: `backend/src/middleware/rateLimit.ts`, `backend/src/config/env.ts`, `backend/src/config/contracts.ts`
  - Do: Redis-based rate limiter (10 calls/day per agent for free tier). Zod env validation at startup. Export contract ABIs + addresses from S01 for shared consumption.
  - Verify: 11th chat call returns 429; server fails fast with missing env var
  - Done when: Rate limiting works, env validated, ABIs exportable

## Files Likely Touched

- `backend/package.json`
- `backend/tsconfig.json`
- `backend/drizzle.config.ts`
- `backend/src/index.ts`
- `backend/src/db/schema.ts`
- `backend/src/db/index.ts`
- `backend/src/routes/agents.ts`
- `backend/src/routes/chat.ts`
- `backend/src/services/wallet.ts`
- `backend/src/services/crypto.ts`
- `backend/src/services/openrouter.ts`
- `backend/src/data/templates.ts`
- `backend/src/middleware/rateLimit.ts`
- `backend/src/config/env.ts`
- `backend/src/config/contracts.ts`
