# 🎬 Bumi Agent — Demo Script

> **Duration:** 5-7 minutes  
> **Format:** Screen recording + voice-over  
> **Live URL:** [bumiagent.one](https://bumiagent.one)  
> **Hackathon:** Synthesis Hackathon — Celo Track

---

## 🎤 OPENING (30 seconds)

**[Screen: Landing page bumiagent.one]**

> "Hey, this is Bumi Agent — a no-code platform where anyone can launch, monetize, and manage AI agents on Celo blockchain in 10 seconds.
>
> The problem is simple: deploying a single AI agent that can receive payments on-chain takes 2 to 4 weeks of engineering. Wallet infrastructure, payment integration, on-chain identity, escrow systems — all built from scratch.
>
> Bumi Agent reduces all of that to 3 fields and 1 button. Let me show you."

---

## 🚀 DEMO 1: Deploy an Agent (60 seconds)

**[Screen: Click "Deploy" in navbar → /deploy page]**

> "To deploy an agent, you only need 3 things:"

**[Fill the form]**
1. **Name** → type "Climate Research Bot"
2. **Template** → select "Research Agent"
3. **Price** → set "0.15" cUSD per call

> "Click Deploy — and within seconds, the platform automatically:
> - Generates an encrypted wallet (AES-256-GCM)
> - Registers the agent as an on-chain NFT via ERC-8004
> - Configures an x402 payment endpoint
> - The agent is immediately live and ready to earn cUSD
>
> Zero code. Zero Solidity. Zero wallet setup."

---

## 💬 DEMO 2: Chat with an Agent (60 seconds)

**[Screen: Open an agent from Registry → click Chat]**

> "Now let's chat with a deployed agent."

**[Type a question in the chat interface]**

> "Every incoming chat call is automatically monetized via the x402 protocol. The agent creator receives cUSD revenue instantly — no payment gateway setup required.
>
> Behind the scenes, the platform has 8 AI models with smart routing. Free agents use free models — Claude 4.6 Sonnet, DeepSeek R1, Gemini Flash, Llama 4 Scout, Mistral Medium. Premium agents unlock GPT-4o, Gemini 2.5 Pro, and Claude 4 Opus. If one model fails, it automatically falls back to another. Zero downtime."

---

## 📊 DEMO 3: Analytics Dashboard (45 seconds)

**[Screen: Click on an agent → scroll to the Analytics section]**

> "Every agent has its own analytics dashboard with 30 days of data:"

**[Show each chart]**

> "- **Call Trends** — daily call volume as a line chart
> - **Revenue** — cUSD earnings as an area chart
> - **Model Usage** — AI model distribution as a pie chart
>
> All real-time, served directly from the production database."

---

## 🔍 DEMO 4: Agent Registry / AgentScan (45 seconds)

**[Screen: Navigate to /registry]**

> "The Registry is like an 'App Store' for AI agents. Every deployed agent appears here — complete with trust badges, pricing, and call count.
>
> Trust badges level up automatically based on usage:
> - Grey — new, 0 calls
> - Blue — 10+ calls
> - Silver — 50+ calls
> - Gold — 100+ calls
>
> Plus, agent owners can verify their identity through Self Protocol — proof-of-human, anti-sybil."

---

## 🔗 DEMO 5: Smart Contracts (45 seconds)

**[Screen: Open Celoscan — show the 3 verified contracts]**

> "Everything runs on top of 3 smart contracts verified on Celo Mainnet:"

> "1. **SpawnRegistry** — ERC-721 + ERC-8004. Every agent is registered as an NFT with on-chain identity and subscription management.
>
> 2. **AgentCommerce** — ERC-8183. A job escrow system — clients create tasks, fund escrow, agents deliver, clients approve, funds release. Fully trustless.
>
> 3. **EarthPool** — A ReFi smart contract. 15% of premium subscription revenue automatically goes here to fund environmental campaigns on Celo. Fully transparent, on-chain."

---

## 🌱 DEMO 6: EarthPool / ReFi (30 seconds)

**[Screen: Show EarthPool on Celoscan]**

> "This is what makes Bumi Agent unique — every premium agent automatically contributes to the environment. 15% of revenue goes into the EarthPool contract. When funds reach the threshold, a new campaign is triggered.
>
> AI growth and environmental sustainability go hand in hand — aligned with Celo's mission: prosperity for all."

---

## 🏗️ TECH DEEP-DIVE (60 seconds)

**[Screen: Pitch deck Architecture slide, or the README diagram]**

> "Architecturally, Bumi Agent consists of 3 layers:"

### Frontend
> "**Next.js 16** with TypeScript and Tailwind CSS v4. Wallet connection via RainbowKit + wagmi. Analytics charts powered by Recharts. Fully mobile-responsive. Deployed on **Vercel**."

### Backend
> "**Hono** — a lightweight Node.js framework. 16 REST API endpoints. PostgreSQL database on **Supabase** via Drizzle ORM. Caching and rate limiting on **Upstash Redis**. LLM gateway through **OpenRouter** — one endpoint, 8 models. Payment processing via **x402 protocol**. Wallet encryption using **AES-256-GCM**. Deployed on **Railway**."

### Blockchain
> "3 smart contracts on **Celo Mainnet**, written in **Solidity 0.8.25** with **Foundry**. Using **OpenZeppelin** libraries — ERC-721, ReentrancyGuard, Ownable. **85 unit tests**, full coverage. All verified on Celoscan."

---

## 🔑 KILLER FEATURES — Summary (45 seconds)

**[Screen: Landing page or pitch deck]**

> "If I had to pick 5 killer features:"

> "**First — 10-Second Deploy.** 3 fields, 1 click. From zero to earning in 10 seconds. No other platform can do this.
>
> **Second — x402 Pay-Per-Call.** HTTP-native payment protocol. Agents monetize from day one with zero setup.
>
> **Third — Multi-Model AI with Fallback.** 8 models, tier-based routing, auto-fallback. Users always get a response.
>
> **Fourth — ERC-8183 Job Escrow.** Not just chat — agents can accept paid tasks through trustless on-chain escrow.
>
> **Fifth — EarthPool ReFi.** 15% of revenue goes to the environment, on-chain, transparent. AI that cares about the planet."

---

## 📈 CLOSING — Traction & CTA (30 seconds)

**[Screen: Traction slide from pitch deck or live registry]**

> "Right now, Bumi Agent has:
> - 12 agents live on Celo Mainnet
> - 52+ paid API calls processed
> - 7.80 cUSD revenue generated
> - 3 verified smart contracts
> - 8 AI models running
> - 16 API endpoints in production
>
> Everything is live at **bumiagent.one**. Source code is open on GitHub.
>
> Bumi Agent — AI agents for everyone. Built with 🌱 on Celo."

---

## 📋 Tech Stack — Quick Reference

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + TypeScript | App Router, SSR/SSG |
| | Tailwind CSS v4 | Utility-first styling |
| | Recharts | Analytics charts (line, area, pie) |
| | RainbowKit + wagmi + viem | Wallet connection + blockchain |
| | Vercel | Hosting + CDN |
| **Backend** | Hono + Node.js | Lightweight REST API |
| | Drizzle ORM | Type-safe database queries |
| | PostgreSQL (Supabase) | Persistent data store |
| | Upstash Redis | Rate limiting + caching |
| | OpenRouter | Unified LLM gateway (8 models) |
| | x402 Protocol | HTTP-native micropayments |
| | AES-256-GCM | Wallet key encryption |
| | Railway | Backend hosting |
| **Blockchain** | Solidity 0.8.25 | Smart contract language |
| | Foundry | Build + test framework |
| | OpenZeppelin | Security libraries |
| | Celo Mainnet | L1 blockchain |
| **Standards** | ERC-721 | NFT base for agent identity |
| | ERC-8004 | On-chain agent identity + URI |
| | ERC-8183 | Agentic commerce / job escrow |
| | x402 | HTTP payment protocol |
| **Infra** | Self Protocol | Proof-of-human verification |
| | Celoscan | Contract verification + explorer |

---

## 🎯 Key Numbers to Mention

| Metric | Value |
|--------|-------|
| Agent deploy time | 10 seconds |
| Form fields to fill | 3 |
| Smart contracts | 3 (all verified) |
| AI models | 8 (5 free + 3 premium) |
| API endpoints | 16 |
| Agent templates | 10 |
| Contract tests | 85 |
| Agents deployed | 12 |
| Paid calls | 52+ |
| Revenue | 7.80 cUSD |
| ReFi contribution | 15% of premium revenue |
