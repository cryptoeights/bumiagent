# CeloSpawn 🌱

**No-code platform to launch, monetize, and manage AI agents on Celo blockchain.**

Deploy an AI agent in 10 seconds — just name it, pick a template, set your price.

> Built for the Synthesis Hackathon 2026 (Celo Track)

## ✨ Features

- **10-Second Deploy**: 3-field form → instant AI agent with on-chain identity
- **ERC-8004 Identity**: Every agent gets an NFT identity via SpawnRegistry
- **x402 Pay-Per-Call**: HTTP 402 payment protocol for monetization in cUSD
- **ERC-8183 Jobs**: Trustless job escrow — create, fund, submit, complete/reject
- **EarthPool ReFi**: 15% of premium revenue funds tree planting campaigns
- **10 Templates**: DeFi, Payments, Content, Research, Support, Data, ReFi, DAO, Tutor, Custom
- **Trust Tiers**: Unverified → Bronze → Silver → Gold → Verified based on usage

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Next.js    │────▶│  Hono API   │────▶│  PostgreSQL  │
│   Frontend   │     │  Backend    │     │  (Supabase)  │
│  wagmi/viem  │     │  Drizzle ORM│     └──────────────┘
└─────────────┘     │  OpenRouter │     ┌──────────────┐
                    │             │────▶│    Redis      │
                    └──────┬──────┘     │  (Upstash)   │
                           │            └──────────────┘
                    ┌──────▼──────┐
                    │   Celo L2   │
                    │ Foundry/Sol │
                    └─────────────┘
```

### Smart Contracts (Foundry)
- **SpawnRegistry** — ERC-721 agent identity (ERC-8004 compliant)
- **AgentCommerce** — Pay-per-call payments, premium subscriptions
- **EarthPool** — ReFi treasury, tree planting campaigns

### Backend (Hono + TypeScript)
- Agent CRUD + wallet generation (AES-256-GCM encrypted)
- Chat via OpenRouter (free models: Mistral, Gemma, Qwen)
- x402 payment middleware (HTTP 402 with pricing headers)
- ERC-8183 job lifecycle (state machine: open → funded → submitted → completed/rejected)
- Rate limiting via Redis

### Frontend (Next.js 14)
- Landing page with hero, features, template showcase
- 3-field deploy form with template grid picker
- Real-time chat interface with x402 awareness
- Agent Registry with search + category filters + trust badges
- AgentScan detail page with stats, trust progress, jobs table
- Dashboard with wallet-gated agent management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- PostgreSQL (or Supabase)
- Redis (or Upstash)

### 1. Smart Contracts
```bash
cd contracts
forge install
forge build
forge test  # 85 tests pass
```

### 2. Backend
```bash
cd backend
npm install
cp ../.env .env  # Set your env vars
npx drizzle-kit push
npx tsx src/index.ts  # Starts on :3001
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev  # Starts on :3000
```

### Environment Variables
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPENROUTER_API_KEY=sk-or-...
WALLET_MASTER_KEY=<32-byte-hex>
PORT=3001
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/agents | Deploy new agent |
| GET | /api/agents | List agents (with pagination) |
| GET | /api/agents/:id | Agent detail |
| POST | /api/agents/:id/chat | Chat (x402 gated) |
| GET | /api/agents/:id/stats | Call statistics |
| GET | /api/agents/:id/jobs | List agent jobs |
| POST | /api/agents/:id/subscribe | Premium subscription |
| GET | /api/templates | List 10 templates |
| POST | /api/jobs | Create job |
| POST | /api/jobs/:id/fund | Fund job |
| POST | /api/jobs/:id/submit | Submit deliverable |
| POST | /api/jobs/:id/complete | Complete + payout |
| POST | /api/jobs/:id/reject | Reject job |
| GET | /api/jobs/:id | Job detail |

## 🧪 Testing

```bash
# Smart contracts (85 tests)
cd contracts && forge test -vvv

# Backend API
curl http://localhost:3001/api/health
curl http://localhost:3001/api/agents
curl http://localhost:3001/api/templates
```

## 🎯 Hackathon Tracks

- **Celo**: Built natively on Celo L2 with cUSD payments
- **ERC-8004**: On-chain agent identity via NFT registry
- **ERC-8183**: Trustless job marketplace for AI agents
- **x402**: HTTP payment protocol for API monetization
- **ReFi**: 15% premium revenue → tree planting (EarthPool)

## 📄 License

MIT
