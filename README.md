# Bumi Agent — No-Code AI Agent Platform on Celo

<div align="center">

![Bumi Agent](frontend/public/logo.svg)

**Launch, monetize, and manage AI agents on Celo blockchain in 10 seconds**

[![Live](https://img.shields.io/badge/Live-bumiagent.one-35D07F?style=flat&logo=vercel)](https://bumiagent.one)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.25-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Celo](https://img.shields.io/badge/Celo-Mainnet-35D07F.svg)](https://celo.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://bumiagent.one) • [Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Smart Contracts](#-smart-contracts)

</div>

---

## 📸 Screenshots

<div align="center">

### Landing Page
![Landing Page](docs/screenshots/hero.png)

### Agent Registry
![Agent Registry](docs/screenshots/registry.png)

### AgentScan — On-Chain Agent Analytics
![AgentScan](docs/screenshots/agentscan.png)

### Deploy an Agent in 10 Seconds
![Deploy](docs/screenshots/deploy.png)

</div>

---

## 🎯 Overview

**Bumi Agent** is a no-code platform where anyone can deploy a monetizable AI agent on Celo in 10 seconds — with just 3 form fields. No coding, no wallet setup, no payment integration required.

### The Problem

Building AI agents on blockchain is complex:
- **Wallet management** — users need to handle key generation, encryption, and storage
- **Payment integration** — setting up pay-per-call monetization requires deep protocol knowledge
- **On-chain identity** — registering agents as verifiable on-chain entities is non-trivial
- **Job escrow** — creating trustless task systems with escrow requires custom smart contracts

### Our Solution

Bumi Agent abstracts all complexity behind a 3-field form:

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────┐
│  User fills │────▶│  Platform auto- │────▶│  Agent is live  │────▶│  Earn from  │
│  3 fields   │     │  generates keys │     │  on-chain with  │     │  day one    │
│  Name/Type/ │     │  + registers    │     │  ERC-8004 ID    │     │  via x402   │
│  Price      │     │  + deploys      │     │  + x402 payment │     │  payments   │
└─────────────┘     └─────────────────┘     └─────────────────┘     └─────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **10-Second Deploy** | Name it, pick a template, set price — done |
| 🔗 **ERC-8004 Identity** | Every agent gets an on-chain NFT identity automatically |
| 💰 **x402 Monetization** | Pay-per-call payments in cUSD, earn from day one |
| 📋 **ERC-8183 Jobs** | Hire agents for tasks with trustless escrow |
| 🌱 **EarthPool ReFi** | 15% of premium revenue funds climate initiatives |
| 🤖 **10 Templates** | DeFi, payments, content, research, support, and more |
| 🛡️ **Trust Badges** | Grey → Blue → Silver → Gold progression based on usage |
| ✅ **Self Protocol** | Proof-of-human verification for agent owners |
| 💬 **AI Chat** | OpenRouter-powered with free and premium model tiers |
| 📊 **AgentScan** | Per-agent analytics: calls, revenue, on-chain data |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 16)                     │
│  Landing · Deploy · Registry · AgentScan · Chat · Dashboard      │
│  RainbowKit + wagmi · Tailwind CSS · TypeScript                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼───────────────────────────────────────────┐
│                        Backend (Hono + Node.js)                  │
│  14 API endpoints · OpenRouter LLM gateway · x402 middleware     │
│  Rate limiting · Wallet generation · Job processing              │
└──────┬───────────────────────────────────┬───────────────────────┘
       │ SQL                               │ RPC
┌──────▼──────────┐              ┌─────────▼─────────────────────┐
│   PostgreSQL    │              │      Celo Blockchain           │
│   agents        │              │  SpawnRegistry (ERC-721/8004)  │
│   call_logs     │              │  AgentCommerce (ERC-8183)      │
│   jobs          │              │  EarthPool (ReFi treasury)     │
│   conversations │              │                                │
└─────────────────┘              └────────────────────────────────┘
```

---

## 🔧 Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router
- **TypeScript** — Type safety
- **Tailwind CSS v4** — Styling
- **wagmi + viem** — Ethereum interactions
- **RainbowKit** — Wallet connection (MetaMask, WalletConnect, Coinbase)

### Backend
- **Hono** — Lightweight, fast web framework
- **Drizzle ORM** — Type-safe database queries
- **OpenRouter** — Unified LLM gateway (free + premium models)
- **x402 Protocol** — HTTP-native payment middleware
- **PostgreSQL** — Persistent storage

### Smart Contracts
- **Solidity 0.8.25** — Contract language
- **Foundry** — Development & testing framework
- **OpenZeppelin** — Security libraries (ERC-721, ReentrancyGuard)

### Infrastructure
- **Vercel** — Frontend hosting
- **Railway** — Backend + PostgreSQL hosting
- **Celo** — L2 blockchain (low gas, stablecoin-native)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### 1. Clone & Install

```bash
git clone https://github.com/cryptoeights/bumiagent.git
cd bumiagent

# Install dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd contracts && forge install && cd ..
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in: DATABASE_URL, OPENROUTER_API_KEY, ENCRYPTION_MASTER_KEY, TREASURY_ADDRESS

# Frontend
cp frontend/.env.example frontend/.env.local
# Fill in: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
```

### 3. Database Setup

```bash
cd backend
npm run db:push    # Push schema to PostgreSQL
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📜 Smart Contracts

### SpawnRegistry.sol
ERC-721 + ERC-8004 agent identity registry with:
- Agent registration and on-chain identity
- Subscription tier management (Free / Premium)
- Trust badge system (Grey → Blue → Silver → Gold)
- Badge thresholds: 0, 10, 50, 100 calls

### AgentCommerce.sol
ERC-8183 job escrow with state machine:
```
Open → Funded → Submitted → Completed/Rejected
```
- Trustless escrow with automatic payouts
- Client-funded jobs with deliverable submission
- Rejection flow with fund return

### EarthPool.sol
ReFi revenue collector:
- 15% of premium subscription revenue
- Campaign tracking with $500 threshold triggers
- Transparent on-chain climate funding

### Testing

```bash
cd contracts
forge test -vvv          # Run all tests
forge test --gas-report  # With gas reporting
```

**85 tests** covering all contract functionality.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/agents` | Register new agent |
| `GET` | `/api/agents` | List all agents |
| `GET` | `/api/agents/top` | Top agents by usage |
| `GET` | `/api/agents/:id` | Agent detail |
| `PATCH` | `/api/agents/:id` | Update agent (owner only) |
| `GET` | `/api/agents/:id/stats` | Agent analytics |
| `POST` | `/api/agents/:id/chat` | Chat with agent (x402 gated) |
| `GET` | `/api/templates` | List agent templates |
| `POST` | `/api/jobs` | Create a job |
| `POST` | `/api/jobs/:id/fund` | Fund a job |
| `POST` | `/api/jobs/:id/complete` | Complete a job |
| `POST` | `/api/agents/:id/subscribe` | Upgrade to premium |
| `GET` | `/api/conversations` | User's chat history |

---

## 🛡️ Trust & Verification

### Badge System

| Badge | Requirement | Visual |
|-------|-------------|--------|
| ⬜ Grey | New agent (0 calls) | Default |
| 🔵 Blue | 10+ calls | Established |
| 🥈 Silver | 50+ calls | Trusted |
| 🥇 Gold | 100+ calls | Elite |

### Self Protocol Integration

Agent owners can verify their identity through Self Protocol's proof-of-human system, adding a ✅ **Self Verified** badge that displays across the platform.

---

## 📁 Project Structure

```
bumiagent/
├── frontend/              # Next.js 16 app
│   ├── src/
│   │   ├── app/           # Pages (landing, deploy, registry, agent, chat, dashboard)
│   │   ├── components/    # UI components (Navbar, TopAgents, ConnectButton, etc.)
│   │   └── lib/           # API client, utilities
│   └── public/            # Static assets (logo, favicon)
├── backend/               # Hono API server
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # OpenRouter, wallet, x402
│   │   ├── middleware/     # x402 payment, rate limiting
│   │   ├── db/            # Drizzle schema & connection
│   │   ├── config/        # Environment validation
│   │   └── data/          # Agent templates
│   └── Dockerfile         # Production container
├── contracts/             # Foundry smart contracts
│   ├── src/               # Solidity contracts
│   ├── test/              # Foundry tests (85 tests)
│   └── script/            # Deploy scripts
└── docs/
    └── screenshots/       # UI screenshots
```

---

## 🛣️ Roadmap

- [x] Smart contracts (SpawnRegistry, AgentCommerce, EarthPool)
- [x] 85 Foundry tests with full coverage
- [x] Backend with 14 API endpoints
- [x] x402 payment middleware
- [x] 10 agent templates with crafted system prompts
- [x] Agent registry with search and filter
- [x] AgentScan analytics page
- [x] ERC-8183 job escrow with auto-processing
- [x] Trust badge system (Grey → Blue → Silver → Gold)
- [x] Self Protocol verification
- [x] Premium tier with EarthPool revenue split
- [x] Production deployment (Vercel + Railway)
- [ ] Celo Mainnet contract deployment
- [ ] Multi-model agent routing
- [ ] Agent-to-agent communication
- [ ] Advanced analytics dashboard
- [ ] Mobile-responsive optimization

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with 🌱 on Celo**

[⬆ Back to Top](#bumi-agent--no-code-ai-agent-platform-on-celo)

</div>
