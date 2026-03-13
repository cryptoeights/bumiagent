# CeloSpawn Stack Research

**Date:** 2026-03-13
**Context:** Greenfield no-code AI agent launchpad on Celo blockchain (hackathon MVP)
**Downstream:** Feeds into roadmap creation — prescriptive recommendations with rationale

---

## 1. Smart Contracts Layer

### Solidity Compiler: `0.8.28`

| Attribute | Value |
|-----------|-------|
| Version | **0.8.28** (not latest 0.8.34) |
| Confidence | **HIGH** |

**Why 0.8.28 and not 0.8.34:**
- 0.8.28 introduced transient storage support (EIP-1153), useful for reentrancy guards
- 0.8.34 (Feb 2026) is a bugfix for IR pipeline transient storage clearing — we are not using the IR pipeline for production
- 0.8.28 is the last version with broad tooling/audit compatibility across OpenZeppelin v5.x
- Hackathon context: stability over bleeding edge

**What NOT to use:**
- Solidity 0.8.34+ — too recent, risk of tooling incompatibility with Foundry/OZ
- Solidity < 0.8.20 — missing custom errors, explicit imports, `abi.encodeCall`

### Framework: Foundry (forge, cast, anvil)

| Attribute | Value |
|-----------|-------|
| Install | `curl -L https://foundry.paradigm.xyz | bash && foundryup` |
| Confidence | **HIGH** |

**Why Foundry over Hardhat:**
- Native Solidity tests — no context-switching to JavaScript
- Faster compilation (Rust-based) — critical for hackathon iteration speed
- Built-in fuzzing (`forge test --fuzz-runs 256`) for catching edge cases
- `cast` CLI for rapid Celo mainnet interaction during development
- `anvil` for local fork testing against Celo state
- First-class `forge script` for deterministic deployments

**What NOT to use:**
- Hardhat — slower compilation, JS test overhead, larger dependency tree
- Truffle — deprecated ecosystem, no active development
- Brownie — Python-based, team is JS/TS

### Libraries: OpenZeppelin Contracts `5.2.0`

| Attribute | Value |
|-----------|-------|
| Package | `openzeppelin/openzeppelin-contracts@v5.2.0` |
| Install | `forge install OpenZeppelin/openzeppelin-contracts@v5.2.0` |
| Confidence | **HIGH** |

**Why 5.2.0 (not 5.4.0):**
- 5.2.0 is the latest feature release with ERC-4337 utilities and cross-chain support
- 5.4.0 (Aug 2025) is a patch release — safe to upgrade if needed, but 5.2.0 has more documentation coverage
- Provides: ERC721URIStorage, Ownable, ReentrancyGuard, SafeERC20, IERC20Permit
- All contracts specified in PRD (SpawnRegistry, AgentCommerce, EarthPool) map directly to OZ v5 patterns

**What NOT to use:**
- OpenZeppelin v4.x — deprecated patterns, missing custom errors, larger bytecode
- Solmate — smaller community, less audit coverage, missing some needed extensions
- Solady — gas-optimized but less readable, risky for hackathon timeline

### Celo-Specific Contract Config

```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"
optimizer = true
optimizer_runs = 200
evm_version = "paris"

[rpc_endpoints]
celo = "${CELO_RPC_URL}"

[etherscan]
celo = { key = "${CELOSCAN_API_KEY}", url = "https://api.celoscan.io/api" }
```

**Key constants:**
- Celo Mainnet chainId: `42220`
- cUSD token: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- Celo is now an Ethereum L2 (since March 2025, block 31,056,500)

---

## 2. Frontend Layer

### Framework: Next.js `16.1.x` (App Router)

| Attribute | Value |
|-----------|-------|
| Version | **16.1.6** (latest stable, Feb 2026) |
| React | **19.2** (ships with Next.js 16) |
| Bundler | **Turbopack** (stable, default in Next.js 16) |
| Confidence | **HIGH** |

**Why Next.js 16 over 15 or 14:**
- Turbopack is now stable and default — significantly faster dev/build cycles
- React 19.2 with View Transitions, `useEffectEvent`, Activity component
- Layout deduplication and incremental prefetching — better UX for multi-page agent dashboards
- Server Components for agent registry pages (SEO + performance)
- Server Actions for form submissions (3-field deploy form)

**What NOT to use:**
- Next.js 14 — specified in PRD but outdated; 16 is stable and backwards-compatible
- Remix/React Router — smaller ecosystem for Web3, less wagmi integration examples
- Vite SPA — no SSR/SSG, poor SEO for public agent registry pages
- Astro — not suited for highly interactive dashboard UIs

### Web3 Integration: wagmi `3.5.x` + viem `2.x`

| Attribute | Value |
|-----------|-------|
| wagmi | **3.5.0** (latest, Mar 2026) |
| viem | **2.x** (bundled with wagmi 3.x) |
| Confidence | **HIGH** |

**Why wagmi + viem:**
- Official Celo documentation recommends viem as primary library
- viem has first-class Celo chain support (`celo`, `celoAlfajores` from `viem/chains`)
- Celo-specific: `feeCurrency` parameter support in wallet client for gas payment in cUSD
- wagmi provides 20+ React hooks: `useAccount`, `useWriteContract`, `useReadContract`, `useWaitForTransactionReceipt`
- Full TypeScript inference from contract ABIs — critical for SpawnRegistry/AgentCommerce interactions
- WalletConnect v2 + MetaMask connectors built-in

**What NOT to use:**
- ethers.js v6 — heavier, no native React hooks, less type inference from ABIs
- web3.js — legacy, larger bundle, worse TypeScript support
- @celo/contractkit — deprecated in favor of viem migration (per Celo docs)

### UI Components: shadcn/ui (CLI v4)

| Attribute | Value |
|-----------|-------|
| Version | **shadcn/cli v4** (Mar 2026) |
| Primitives | Radix UI (unified `radix-ui` package) |
| Styling | Tailwind CSS v4 |
| Confidence | **HIGH** |

**Why shadcn/ui:**
- Not a dependency — components are copied into your codebase (full ownership)
- CLI v4 includes `shadcn/skills` for AI agent-assisted component generation
- Design System Presets for consistent theming across agent dashboard, registry, chat UI
- Unified `radix-ui` package (Feb 2026) — cleaner dependency tree
- Direct Next.js App Router support with `shadcn init`

**What NOT to use:**
- Material UI — heavier runtime, opinionated styling conflicts with Tailwind
- Chakra UI — runtime CSS-in-JS, slower than Tailwind
- Ant Design — enterprise-focused aesthetic, not suited for Web3 product feel
- Headless UI — fewer pre-built components, more assembly required

### State Management: Zustand `5.x` + TanStack Query `5.x`

| Attribute | Value |
|-----------|-------|
| Zustand | **5.x** (~1KB, client state) |
| TanStack Query | **5.x** (server/async state) |
| Confidence | **HIGH** |

**Architecture:**
- **TanStack Query** — all server state: agent list fetching, on-chain data polling, API calls to backend
- **Zustand** — client state: wallet connection status, UI preferences, form state, chat history buffer
- **React Hook Form** — form state for 3-field deploy form, job creation form

**Why this combo over alternatives:**
- Industry standard pattern for 2026 React apps
- Zustand: no Provider needed, 1KB bundle, simple API
- TanStack Query: automatic caching, refetching, loading/error states for API data
- Clean separation: server state never pollutes client store

**What NOT to use:**
- Redux Toolkit — 15KB overhead, boilerplate overkill for hackathon scope
- Jotai — better for fine-grained reactivity, but Zustand is simpler for this use case
- React Context alone — no caching, no async state management, prop drilling risk

---

## 3. Backend Layer

### Runtime: Node.js `22.22.x` LTS (Jod)

| Attribute | Value |
|-----------|-------|
| Version | **22.22.1** LTS (Mar 2026) |
| Status | Maintenance LTS, supported through Apr 2027 |
| Confidence | **HIGH** |

**Why Node.js 22 LTS:**
- Maintenance LTS — stable, security patches guaranteed
- Native `fetch` API (no node-fetch needed)
- Built-in test runner for quick unit tests
- Shared language with frontend (TypeScript everywhere)

**What NOT to use:**
- Node.js 24.x — too new (Current, not LTS), risk of breaking changes
- Node.js 20.x — entering end-of-life (Apr 2026)
- Deno/Bun — smaller ecosystem for PostgreSQL/Redis libraries, less battle-tested in production

### Framework: Hono `4.x`

| Attribute | Value |
|-----------|-------|
| Package | `hono` |
| Confidence | **MEDIUM-HIGH** |

**Why Hono over Express:**
- 2-4x faster response times in benchmarks
- Built on Web Standards (Fetch API) — future-proof
- First-class TypeScript with type-inferred routes and middleware
- Zod integration for typed request validation (critical for agent registration API)
- Smaller bundle — matters less for server but indicates cleaner architecture
- Native middleware for CORS, rate limiting, error handling

**Why not Express:**
- Express 5 is stable but architecturally legacy (2010 design)
- TypeScript support feels retrofitted, incomplete type definitions
- For a greenfield hackathon project, Hono is the modern choice

**Risk mitigation:** Hono's middleware ecosystem is younger. If a specific middleware is missing, Express adapters can be used via `@hono/node-server`. Fallback to Express is low-cost if needed.

### Database: PostgreSQL `16` + Drizzle ORM

| Attribute | Value |
|-----------|-------|
| PostgreSQL | **16.x** |
| ORM | **Drizzle ORM** (latest) |
| Driver | `postgres` (node-postgres) |
| Confidence | **MEDIUM-HIGH** |

**Why Drizzle over Prisma:**
- Code-first schema definition in TypeScript — no separate schema language
- ~7.4KB bundle, no binary dependencies (Prisma requires native engine binary)
- SQL-like query builder — closer to raw SQL, less magic
- Edge-native (no binary issues) — relevant if we later deploy to edge
- Zero code generation step — faster iteration in hackathon context
- Type-safe queries inferred directly from schema definition

**Why not Prisma:**
- Prisma 7 improved but still requires binary engine or Accelerate proxy
- Schema-first approach adds a generation step (friction during rapid iteration)
- Heavier dependency tree

**Schema tables (from PRD):**
- `agents` — id, owner_address, agent_wallet, name, template_id, price_per_call, token_id, encrypted_private_key, status
- `call_logs` — id, agent_id, caller_address, model_used, tokens_used, revenue, timestamp
- `jobs` — id, agent_id, client_address, description, budget, deadline, status, deliverable_uri

### Cache: Redis (via Upstash or local)

| Attribute | Value |
|-----------|-------|
| Client | `ioredis` or `@upstash/redis` |
| Confidence | **HIGH** |

**Use cases:**
- Rate limiting counters (free: 10/30 calls/day, premium: 200/month)
- Session/nonce caching for wallet authentication
- Agent response caching (optional, for popular agents)

### LLM Gateway: OpenRouter API

| Attribute | Value |
|-----------|-------|
| API | `https://openrouter.ai/api/v1` |
| SDK | OpenAI-compatible SDK (`openai` npm package) |
| Confidence | **HIGH** |

**Why OpenRouter:**
- Single API for 290+ models from all major providers
- No markup on provider pricing — pass-through costs
- Free tier models (24 models, Mar 2026): Gemma, Llama, Mistral, etc.
- Premium models: Claude, GPT-4o, Gemini Pro — all through same API
- OpenAI-compatible API — use standard `openai` npm package, zero vendor lock-in
- Rate limits: 50 req/day (no credits), 1000 req/day (with $10+ credits purchased)

**Free models for CeloSpawn free tier:**
- `google/gemma-3-1b-it:free` — lightweight, fast
- `meta-llama/llama-3.1-8b-instruct:free` — good general purpose
- `openrouter/free` — auto-router across available free models

**Premium models for CeloSpawn premium tier:**
- `anthropic/claude-sonnet-4` — best coding/reasoning
- `openai/gpt-4o` — strong all-around
- `google/gemini-2.5-pro` — large context, multimodal

**What NOT to use:**
- Direct provider APIs (Anthropic, OpenAI, Google) — requires multiple integrations, multiple API keys
- LangChain — unnecessary abstraction for simple chat completion routing
- LlamaIndex — overkill, designed for RAG pipelines we don't need

### Payments: thirdweb x402 SDK (v2)

| Attribute | Value |
|-----------|-------|
| Package | `@thirdweb-dev/x402` (client + server) |
| Protocol | x402 v2 (header-based: `PAYMENT-SIGNATURE` / `PAYMENT-RESPONSE`) |
| Confidence | **MEDIUM-HIGH** |

**Why thirdweb x402:**
- Official x402 protocol implementation — the standard for HTTP 402 payments
- v2 protocol (2026): header-based flow, cleaner than v1's `X-PAYMENT` headers
- Supports 170+ EVM chains including Celo
- Dynamic pricing support — can charge per-token for LLM usage
- Client auto-fulfills payment and retries — minimal UX friction
- Backward-compatible with v1

**How it works for CeloSpawn:**
1. User sends chat request to agent endpoint
2. Server returns HTTP 402 with price in `PAYMENT-SIGNATURE` header
3. x402 client (frontend) prompts wallet approval (ERC-2612 permit on cUSD)
4. Payment settled on-chain
5. Request retried with payment proof — agent processes and responds

**Risk:** x402 is still a relatively new protocol. Fallback: implement manual ERC-20 approve + transfer flow if thirdweb SDK has issues.

---

## 4. Blockchain Standards

### ERC-8004: Trustless Agents (Agent Identity)

| Attribute | Value |
|-----------|-------|
| Status | **Live on Ethereum mainnet** (Jan 29, 2026) |
| Authors | MetaMask, Ethereum Foundation, Google, Coinbase |
| Confidence | **HIGH** |

**Three registries:**
1. **Identity Registry** — ERC-721 + URIStorage, resolves to agent registration JSON
2. **Reputation Registry** — posting/fetching feedback signals
3. **Validation Registry** — hooks for independent validation (zkML, TEE, judges)

**CeloSpawn usage:**
- SpawnRegistry.sol extends ERC-721URIStorage to implement the Identity Registry
- Each agent minted as NFT with URI pointing to IPFS-hosted registration JSON
- Registration JSON follows ERC-8004 agent card format
- Reputation and Validation registries are P2 (post-hackathon)

**Implementation note:** ERC-8004 is deliberately minimal on-chain, with application logic off-chain. This aligns perfectly with CeloSpawn's architecture (on-chain for ownership/identity, off-chain for metadata/runtime).

### ERC-8183: Agentic Commerce (Job Escrow)

| Attribute | Value |
|-----------|-------|
| Status | **Draft/Review** (co-developed by Ethereum Foundation + Virtuals Protocol) |
| Confidence | **MEDIUM-HIGH** |

**Job lifecycle:** `Open -> Funded -> Submitted -> Terminal`

**Three roles per job:**
- **Client** — requests work, funds escrow
- **Provider** — performs work (the AI agent)
- **Evaluator** — confirms completion (can be client, oracle, or third party)

**CeloSpawn usage:**
- AgentCommerce.sol implements ERC-8183 job escrow
- Client creates job with description + budget + deadline
- Budget held in cUSD escrow
- Agent submits deliverable (IPFS URI)
- Client evaluates: approve (funds released) or reject (funds returned)
- 5% platform fee on completed jobs

**Risk:** ERC-8183 is newer than ERC-8004 and still in draft. Our implementation should follow the spec but be prepared for minor interface changes. The core state machine (Open/Funded/Submitted/Terminal) is stable.

---

## 5. Identity & Verification

### Self Protocol

| Attribute | Value |
|-----------|-------|
| Integration | Self SDK (ZK proof verification) |
| Users | 7M+ globally (174 countries) |
| Hackathon | Sponsor of Synthesis Hackathon (Feb 2026) |
| Confidence | **MEDIUM** |

**CeloSpawn usage:**
- Proof-of-human verification for agent owners (sybil resistance)
- NFC passport scanning + ZK proof generation via Self mobile app
- No personal data exposed — only proof-of-uniqueness
- Verified status stored on-chain in SpawnRegistry (`isVerified` flag)
- Drives badge system: Blue badge (verified), Green badge (verified + premium)

**Risk:** Self SDK integration complexity unknown until development starts. Fallback: mock verification for hackathon demo, integrate real Self SDK as fast-follow.

---

## 6. Decentralized Storage

### Pinata (IPFS)

| Attribute | Value |
|-----------|-------|
| Package | `pinata-web3` |
| Usage | Agent registration JSON (ERC-8004), job deliverables (ERC-8183) |
| Confidence | **HIGH** |

**Why Pinata over alternatives:**
- Industry standard — powers 80%+ of NFT media
- Developer-friendly SDK: `pinata.upload.file(file)`
- Edge-cached gateways — millisecond latency for reading agent metadata
- Free tier sufficient for hackathon (1GB storage, 100 uploads/month)

**What NOT to use:**
- web3.storage — original free tier wound down, enterprise-focused now
- Arweave — permanent storage is overkill for mutable agent metadata
- Raw IPFS node — operational overhead, no guaranteed availability

---

## 7. Development & Deployment

### Monorepo Structure

```
celospawnag/
  packages/
    contracts/        # Foundry project (Solidity)
    web/              # Next.js 16 frontend
    api/              # Hono backend
    shared/           # Shared types, ABIs, constants
  package.json        # pnpm workspace root
  pnpm-workspace.yaml
  turbo.json          # Turborepo for build orchestration
```

### Package Manager: pnpm `9.x`

**Why pnpm:** Disk-efficient (symlinked node_modules), strict dependency resolution, native workspace support. Faster than npm/yarn for monorepo installs.

### Build Orchestration: Turborepo

**Why Turborepo:** Caches build outputs across packages, parallel task execution, incremental builds. Pairs naturally with pnpm workspaces and Next.js (both Vercel ecosystem).

### Deployment Targets

| Component | Target | Rationale |
|-----------|--------|-----------|
| Frontend | Vercel | Native Next.js 16 support, edge functions, preview deploys |
| Backend | Railway or Render | Simple Node.js hosting, PostgreSQL add-on, Redis add-on |
| Contracts | Celo Mainnet | `forge script` deployment via RPC |
| IPFS | Pinata | Managed pinning, CDN gateway |

---

## 8. Full Version Matrix

| Technology | Version | Role | Confidence |
|------------|---------|------|------------|
| Solidity | 0.8.28 | Smart contract language | HIGH |
| Foundry | latest (foundryup) | Contract framework | HIGH |
| OpenZeppelin | 5.2.0 | Contract libraries | HIGH |
| Next.js | 16.1.x | Frontend framework | HIGH |
| React | 19.2 | UI library (via Next.js 16) | HIGH |
| Turbopack | stable (via Next.js 16) | Bundler | HIGH |
| wagmi | 3.5.x | React Web3 hooks | HIGH |
| viem | 2.x | TypeScript Ethereum client | HIGH |
| shadcn/ui | CLI v4 | UI component library | HIGH |
| Tailwind CSS | 4.x | Utility-first CSS | HIGH |
| Zustand | 5.x | Client state management | HIGH |
| TanStack Query | 5.x | Server state management | HIGH |
| React Hook Form | 7.x | Form state | HIGH |
| Node.js | 22.22.x LTS | Backend runtime | HIGH |
| Hono | 4.x | Backend framework | MEDIUM-HIGH |
| Drizzle ORM | latest | Database ORM | MEDIUM-HIGH |
| PostgreSQL | 16.x | Primary database | HIGH |
| Redis | 7.x | Cache / rate limiting | HIGH |
| OpenRouter | API v1 | LLM gateway | HIGH |
| thirdweb x402 | v2 | Payment protocol | MEDIUM-HIGH |
| Pinata | pinata-web3 | IPFS storage | HIGH |
| Self Protocol | SDK | Identity verification | MEDIUM |
| pnpm | 9.x | Package manager | HIGH |
| Turborepo | latest | Build orchestration | HIGH |

---

## 9. Key Dependencies (package.json sketch)

### `packages/web/package.json`

```json
{
  "dependencies": {
    "next": "^16.1.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "wagmi": "^3.5.0",
    "viem": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "tailwindcss": "^4.0.0",
    "radix-ui": "^1.0.0",
    "@thirdweb-dev/x402": "latest"
  }
}
```

### `packages/api/package.json`

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "drizzle-orm": "latest",
    "postgres": "^3.0.0",
    "ioredis": "^5.0.0",
    "openai": "^4.0.0",
    "pinata-web3": "latest",
    "viem": "^2.0.0",
    "zod": "^3.0.0"
  }
}
```

---

## 10. Anti-Patterns & Explicit Exclusions

| Do NOT Use | Reason |
|------------|--------|
| Hardhat | Slower, JS test overhead, larger deps |
| ethers.js | No React hooks, worse type inference than viem |
| @celo/contractkit | Deprecated, Celo recommends viem migration |
| LangChain | Unnecessary abstraction for simple chat routing |
| Prisma | Binary dependency, code generation step, heavier |
| Express.js | Legacy architecture, weaker TypeScript |
| Redux | 15KB overhead, boilerplate for hackathon scope |
| web3.storage | Free tier discontinued |
| Solmate/Solady | Smaller community, less audit coverage |
| Material UI / Chakra | Runtime CSS-in-JS, conflicts with Tailwind |

---

## Sources

- [Foundry - Ethereum Development Framework](https://www.getfoundry.sh/)
- [Next.js 16](https://nextjs.org/blog/next-16)
- [wagmi Documentation](https://wagmi.sh/)
- [viem Celo Chain Support](https://viem.sh/docs/chains/celo)
- [Celo viem Documentation](https://docs.celo.org/developer/viem)
- [thirdweb x402 Payments](https://portal.thirdweb.com/x402)
- [thirdweb x402 Protocol v2](https://blog.thirdweb.com/changelog/support-for-x402-protocol-v2/)
- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8183: Agentic Commerce](https://eips.ethereum.org/EIPS/eip-8183)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Free Models (Mar 2026)](https://costgoat.com/pricing/openrouter-free-models)
- [OpenZeppelin Contracts v5.2](https://www.openzeppelin.com/news/introducing-openzeppelin-contracts-5.2-and-openzeppelin-community-contracts)
- [shadcn/ui CLI v4 (Mar 2026)](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [Solidity 0.8.34 Release](https://www.soliditylang.org/blog/2026/02/18/solidity-0.8.34-release-announcement/)
- [Node.js 22.22.1 LTS](https://nodejs.org/en/blog/release/v22.22.1)
- [Drizzle vs Prisma 2026](https://www.bytebase.com/blog/drizzle-vs-prisma/)
- [React State Management 2026](https://www.pkgpulse.com/blog/state-of-react-state-management-2026)
- [Pinata IPFS](https://pinata.cloud/)
- [Self Protocol](https://blockchain.news/flashnews/selfprotocol-joins-celo-hackathon-with-zk-powered-identity-verification)
