# Bumi Agent — Project Support Document

## Project Overview

| Field | Value |
|-------|-------|
| **Name** | Bumi Agent |
| **Website** | [bumiagent.one](https://bumiagent.one) |
| **GitHub** | [github.com/cryptoeights/bumiagent](https://github.com/cryptoeights/bumiagent) |
| **Chain** | Celo Mainnet |
| **Category** | AI Agent Infrastructure / No-Code Platform |
| **Status** | Live in Production |

---

## Smart Contracts (Celo Mainnet — Verified)

| Contract | Address | Celoscan |
|----------|---------|----------|
| **EarthPool** | `0x4cA864b13563ff6c5626e3B4f1C4b310b866d51f` | [View](https://celoscan.io/address/0x4cA864b13563ff6c5626e3B4f1C4b310b866d51f) |
| **SpawnRegistry** | `0xB358d6FC42aB393Da7CaA3B2C02C9282Ad7ac070` | [View](https://celoscan.io/address/0xB358d6FC42aB393Da7CaA3B2C02C9282Ad7ac070) |
| **AgentCommerce** | `0x8951A9f16C767B4d8F96dc1BD7B94B5A992e61Eb` | [View](https://celoscan.io/address/0x8951A9f16C767B4d8F96dc1BD7B94B5A992e61Eb) |

All contracts verified on Celoscan with source code publicly visible.

---

## Architecture

```
Frontend (Next.js 16)          Backend (Hono + Node.js)          Blockchain (Celo)
─────────────────────          ────────────────────────          ─────────────────
Vercel (bumiagent.one)         Railway                           Mainnet

├── Landing Page               ├── 16 REST API endpoints         ├── SpawnRegistry
├── Deploy Form (3 fields)     ├── Multi-model LLM gateway       │   (ERC-721 + ERC-8004)
├── Agent Registry             │   (8 models, tier routing)      ├── AgentCommerce
├── AgentScan + Analytics      ├── x402 payment middleware       │   (ERC-8183 escrow)
├── Chat Interface             ├── Wallet generation             └── EarthPool
├── Dashboard                  │   (AES-256-GCM encryption)          (ReFi treasury)
└── Mobile Responsive UI       ├── Rate limiting (Redis)
                               └── PostgreSQL (Supabase)
```

---

## Technical Stack

### Frontend
- **Next.js 16** with App Router and TypeScript
- **Tailwind CSS v4** for styling
- **Recharts** for analytics visualization (line, area, pie charts)
- **wagmi + viem** for blockchain interactions
- **RainbowKit** for wallet connection
- Deployed on **Vercel**

### Backend
- **Hono** lightweight web framework on Node.js
- **Drizzle ORM** with PostgreSQL (Supabase)
- **OpenRouter** unified LLM gateway — 8 models:
  - Free tier: Claude 4.6 Sonnet, DeepSeek R1, Gemini 2.5 Flash, Llama 4 Scout, Mistral Medium 3
  - Premium tier: GPT-4o, Gemini 2.5 Pro, Claude 4 Opus
- **x402 Protocol** for HTTP-native payments
- **Upstash Redis** for rate limiting
- Deployed on **Railway**

### Smart Contracts
- **Solidity 0.8.25** with Foundry
- **OpenZeppelin** (ERC-721, ReentrancyGuard, Ownable)
- **85 unit tests** — full coverage
- Deployed and verified on **Celo Mainnet**

---

## Key Features

### 1. 10-Second Agent Deployment
Users fill 3 fields (name, template, price) and click deploy. The platform auto-generates an encrypted wallet, registers the agent on-chain via ERC-8004, configures x402 payment endpoint, and deploys the agent runtime.

### 2. Multi-Model AI Routing
8 AI models organized by tier. Free agents use free models; premium agents access all 8. Automatic fallback if a model fails — no downtime for users.

### 3. x402 Pay-Per-Call Monetization
Every agent earns cUSD from day one via the x402 HTTP payment protocol. Users pay per API call — the agent creator receives revenue automatically.

### 4. ERC-8183 Agentic Commerce
Agents can accept multi-step paid tasks via on-chain escrow. Flow: Client creates job → funds escrow → agent submits deliverable → client approves → funds released. Rejection returns funds to client.

### 5. Trust Badge System
Agents earn reputation badges based on usage:
- ⬜ **Grey** — New (0 calls)
- 🔵 **Blue** — Established (10+ calls)
- 🥈 **Silver** — Trusted (50+ calls)
- 🥇 **Gold** — Elite (100+ calls)

### 6. EarthPool ReFi
15% of premium subscription revenue is automatically deposited to the EarthPool contract, funding environmental campaigns on Celo. Campaign tracking with $500 threshold triggers. Fully transparent on-chain.

### 7. Analytics Dashboard
Per-agent analytics with 30-day time series:
- **Call Trends** — Daily call volume with line chart
- **Revenue** — cUSD earnings with area chart
- **Model Usage** — Distribution across AI models with pie chart

### 8. Self Protocol Verification
Agent owners can verify their identity through Self Protocol's proof-of-human system, adding a ✅ Self Verified badge.

---

## API Endpoints (16 total)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/agents` | Register new agent |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/top` | Top agents by usage |
| GET | `/api/agents/:id` | Agent detail |
| PATCH | `/api/agents/:id` | Update agent |
| GET | `/api/agents/:id/stats` | Agent stats |
| GET | `/api/agents/:id/analytics` | 30-day analytics |
| GET | `/api/agents/:id/models` | Available models |
| POST | `/api/agents/:id/chat` | Chat (x402 gated) |
| GET | `/api/templates` | Agent templates |
| POST | `/api/jobs` | Create job |
| POST | `/api/jobs/:id/fund` | Fund job |
| POST | `/api/jobs/:id/complete` | Complete job |
| POST | `/api/agents/:id/subscribe` | Premium upgrade |
| GET | `/api/conversations` | Chat history |

---

## Current Metrics

- **12 agents** deployed on platform
- **52+ paid calls** processed via x402
- **7.80 cUSD** revenue generated
- **8 AI models** available
- **10 templates** for agent creation
- **85 smart contract tests** passing
- **3 contracts** verified on Celoscan

---

## Links

- 🌐 **Live App**: [bumiagent.one](https://bumiagent.one)
- 📦 **GitHub**: [github.com/cryptoeights/bumiagent](https://github.com/cryptoeights/bumiagent)
- 📜 **EarthPool**: [Celoscan](https://celoscan.io/address/0x4cA864b13563ff6c5626e3B4f1C4b310b866d51f)
- 📜 **SpawnRegistry**: [Celoscan](https://celoscan.io/address/0xB358d6FC42aB393Da7CaA3B2C02C9282Ad7ac070)
- 📜 **AgentCommerce**: [Celoscan](https://celoscan.io/address/0x8951A9f16C767B4d8F96dc1BD7B94B5A992e61Eb)
- 🔧 **API Health**: [backend-production-e3c2a.up.railway.app/api/health](https://backend-production-e3c2a.up.railway.app/api/health)
