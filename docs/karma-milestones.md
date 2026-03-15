# Bumi Agent — Karma GAP Milestones

Karma GAP form entries for project milestones from start to finish.
Each milestone includes a **Follow Up** with completion description and GitHub commit links.

**Repository:** [github.com/cryptoeights/bumiagent](https://github.com/cryptoeights/bumiagent)

---

## Milestone 1

**Title:** Smart Contracts Foundation

**Description:** Designed and developed 3 Solidity smart contracts using Foundry framework with OpenZeppelin libraries: SpawnRegistry (ERC-721 + ERC-8004 agent identity and subscription management), AgentCommerce (ERC-8183 job escrow with full state machine — Open, Funded, Submitted, Completed, Rejected), and EarthPool (ReFi treasury that collects 15% of premium revenue for environmental campaigns with $500 threshold triggers). All contracts written in Solidity 0.8.25, secured with ReentrancyGuard, and covered by 85 comprehensive unit tests with 100% coverage. Contracts compiled, tested, and prepared for deployment.

**Follow Up — Completed ✅**

All three smart contracts (SpawnRegistry, AgentCommerce, EarthPool) have been fully developed with 85 unit tests using Foundry. All tests pass with 100% coverage. Contracts use OpenZeppelin patterns (ERC-721, ReentrancyGuard, Ownable) and are deployment-ready. SpawnRegistry handles agent identity as NFTs with subscription management, AgentCommerce implements a full state machine for job escrow (Open → Funded → Submitted → Completed/Rejected), and EarthPool manages 15% of premium revenue for environmental campaigns.

**Commits:**
- [`01a7dbd`](https://github.com/cryptoeights/bumiagent/commit/01a7dbda30cb80d156921138a4939ea2c1322722) — feat(contracts): S01 — SpawnRegistry, AgentCommerce, EarthPool with 85 tests
- [`c7f5c05`](https://github.com/cryptoeights/bumiagent/commit/c7f5c05c4cac05b11f1851dae96f528250dde1b7) — feat(M001/S01): Smart Contracts Foundation

---

## Milestone 2

**Title:** Backend API Development

**Description:** Built the complete backend API using Hono framework on Node.js with TypeScript. Implemented 16 REST API endpoints covering agent registration, chat with AI, x402 pay-per-call monetization, job lifecycle management (create, fund, complete, reject), premium subscriptions, agent analytics, and conversation history. Integrated OpenRouter as unified LLM gateway, Drizzle ORM with PostgreSQL (Supabase) for persistent storage, and Upstash Redis for rate limiting and caching. Implemented secure wallet generation with AES-256-GCM encryption so agent wallets are auto-generated at deploy time without user setup.

**Follow Up — Completed ✅**

Backend API is fully functional with 16 endpoints. Agent registration automatically generates AES-256-GCM encrypted wallets. Chat endpoint integrates with OpenRouter for access to 8 AI models. x402 payment middleware processes cUSD payments per API call. Job lifecycle is complete — create, fund, complete, and reject with full state tracking. Rate limiting via Upstash Redis prevents abuse. All data is persisted in PostgreSQL (Supabase) via Drizzle ORM.

**Commits:**
- [`0ee8b20`](https://github.com/cryptoeights/bumiagent/commit/0ee8b200dcf26b3a0cdbd7c8274872f6a63dada5) — feat(backend): S02 — Agent registration, chat via OpenRouter, rate limiting
- [`9b2ccab`](https://github.com/cryptoeights/bumiagent/commit/9b2ccabfbf9d24fd43bd2eb7b58fe856a9640e23) — feat(backend): S03 — x402 payments, job lifecycle, subscriptions
- [`39da862`](https://github.com/cryptoeights/bumiagent/commit/39da862da5f7f0f06a74f5809eb933e8c895268f) — fix: OpenRouter models, x402 payment flow, enriched template prompts
- [`84068dc`](https://github.com/cryptoeights/bumiagent/commit/84068dc3b574b6d541690adc2d0a3a9c7f55d65f) — feat: real cUSD on-chain payment for x402 chat
- [`cc9ed60`](https://github.com/cryptoeights/bumiagent/commit/cc9ed60809cebe2e1264b946bc60a6a9d9e40025) — fix: prevent multiple OpenRouter calls per payment

---

## Milestone 3

**Title:** Frontend Application

**Description:** Developed the complete frontend application using Next.js 16 with TypeScript, Tailwind CSS v4, and App Router. Built 7 pages: Landing page with hero section and top agents, Deploy form (3 fields — name, template, price), Agent Registry with search and filtering, AgentScan detail page with trust badges and services, Chat interface with markdown rendering, Dashboard for agent management, and mobile-responsive navigation. Integrated RainbowKit + wagmi for wallet connection and viem for blockchain interactions. Added 10 pre-built agent templates (DeFi, payments, content, research, support, data analyst, ReFi, DAO governance, tutor, custom).

**Follow Up — Completed ✅**

All 7 frontend pages are live: Landing page with hero section and Top 3 Agents ranking, Deploy form with 3 fields (name, template, price) and 10 built-in templates, Registry as an "App Store" for browsing agents, AgentScan detail page, Chat interface with markdown rendering and conversation history, and Dashboard for managing user-owned agents. Wallet connection via RainbowKit + wagmi is fully functional. All blockchain interactions use viem. Rebranding from CeloSpawn to Bumi Agent was completed including new logo and favicon.

**Commits:**
- [`73894e0`](https://github.com/cryptoeights/bumiagent/commit/73894e0e531d27b6f39a8549dddbaaf18eebd3ff) — feat(frontend): S04 — Landing page, deploy form, chat interface
- [`0140560`](https://github.com/cryptoeights/bumiagent/commit/0140560c97a00c8f1d2d464bcd29c98bab520e56) — feat(frontend): S05 — Registry, AgentScan, Dashboard pages
- [`8867095`](https://github.com/cryptoeights/bumiagent/commit/8867095a839831563212fed87a183e48b43de57d) — feat: S06 — Trust badges, verification display, README, final polish
- [`d128185`](https://github.com/cryptoeights/bumiagent/commit/d128185677c08502a4afa0025a1c4eaf874f2498) — feat: markdown rendering in chat responses
- [`f41ce4f`](https://github.com/cryptoeights/bumiagent/commit/f41ce4f3430fdae2621e7666e30219c9731cc5e5) — feat: chat history with conversations
- [`63d10c5`](https://github.com/cryptoeights/bumiagent/commit/63d10c5bce827a349b2446e315cb98d61f0684db) — feat: agent logo + description, editable via dashboard
- [`997f5b2`](https://github.com/cryptoeights/bumiagent/commit/997f5b22d6f39ff03c93d384bd009a4ac948cae5) — feat: file upload for agent logo (+ URL fallback)
- [`da7e9f0`](https://github.com/cryptoeights/bumiagent/commit/da7e9f01a9b9f305c4e9bac0451f8cdffb2381a1) — rebrand: CeloSpawn → Bumi Agent — new logo, favicon, all UI text
- [`7793493`](https://github.com/cryptoeights/bumiagent/commit/77934937ee51c010de5e58d0b86384f33374f0e4) — feat: Top 3 Agents section on landing page — ranked by usage

---

## Milestone 4

**Title:** Payment System & Agentic Commerce

**Description:** Implemented the x402 HTTP-native payment protocol for pay-per-call agent monetization in cUSD stablecoin. Every agent automatically earns revenue from day one — users pay per API call, creators receive payment without any payment integration setup. Built the ERC-8183 Agentic Commerce UI: clients can browse agent services, create jobs with defined scope, fund escrow on-chain, and agents auto-process deliverables using AI. Full job lifecycle with reject/approve flow, transaction hash tracking, and Celoscan links for on-chain verification. Implemented tier-based pricing — free and premium tiers with different model access and rate limits.

**Follow Up — Completed ✅**

The x402 payment protocol is fully operational — every chat call automatically processes cUSD payments on-chain. The ERC-8183 Agentic Commerce UI is complete: agent owners can define custom services with pricing, clients can browse and hire agents directly from the AgentScan page, funds enter on-chain escrow, agents auto-generate deliverables using AI when a job is funded, and owners can approve or reject results. All transactions include TX hash and Celoscan links. Tier system is implemented with EarthPool revenue split — 15% of premium revenue automatically goes to the ReFi treasury.

**Commits:**
- [`84068dc`](https://github.com/cryptoeights/bumiagent/commit/84068dc3b574b6d541690adc2d0a3a9c7f55d65f) — feat: real cUSD on-chain payment for x402 chat
- [`78ca149`](https://github.com/cryptoeights/bumiagent/commit/78ca149ca32dd32b6f14852b97603d634fdc2f99) — feat: model selector, private key display, premium model billing
- [`aaff634`](https://github.com/cryptoeights/bumiagent/commit/aaff63422de0aaf7e4613ec478f085395c7777ba) — feat: tier system with EarthPool revenue split
- [`141c025`](https://github.com/cryptoeights/bumiagent/commit/141c025c1002d7c9fa44707bf7b663747f2342b6) — feat: skill.md field + premium tier upgrade + deploy/dashboard improvements
- [`b28ab5d`](https://github.com/cryptoeights/bumiagent/commit/b28ab5dd778ee8ee5267afebd01f616ce8c4a0bb) — feat: ERC-8183 Jobs UI on AgentScan page
- [`f868199`](https://github.com/cryptoeights/bumiagent/commit/f8681998c3091a41b6dfea87999d75995fcc5e3f) — feat: auto-process ERC-8183 jobs — agent generates deliverable on fund
- [`d1e6cbf`](https://github.com/cryptoeights/bumiagent/commit/d1e6cbfd46f82c62f162e5c8af0a323d371edc79) — feat: TX hash tracking + Celoscan links for ERC-8183 jobs
- [`eb14fcc`](https://github.com/cryptoeights/bumiagent/commit/eb14fcccccd07da99e504aaf6ef947826d304bd2) — feat: agent services & pricing — owner-defined job pricing
- [`88ac9da`](https://github.com/cryptoeights/bumiagent/commit/88ac9da850465354a63f9c8f1594f4d6baed2180) — fix: simplify hire flow — click service → inline form, no scroll
- [`53dfe6d`](https://github.com/cryptoeights/bumiagent/commit/53dfe6de29211b6eeadbe0ab7241fa248831fc2a) — fix: job reject — agent owner can reject + clear UI feedback

---

## Milestone 5

**Title:** Trust & Verification System

**Description:** Implemented the trust badge system where agents earn reputation based on usage: Grey (new, 0 calls), Blue (established, 10+ calls), Silver (trusted, 50+ calls), and Gold (elite, 100+ calls). Badges display across all pages — registry, agent detail, and dashboard. Integrated Self Protocol for proof-of-human verification — agent owners can verify their identity through Self's QR code flow, earning a verified badge that provides sybil resistance. Verification status persists in the database and displays as a ✅ Self Verified badge on agent profiles.

**Follow Up — Completed ✅**

Trust badge system works automatically based on call count — badges progress from Grey to Blue, Silver, and Gold as usage grows. Self Protocol is fully integrated — agent owners can scan a QR code for proof-of-human verification, status persists in the database, and the ✅ Self Verified badge displays across all pages (registry, agent detail, dashboard). The verification flow uses a deepLink URL encoded into a QR code. UI shows both trust badges and Self verification inline per agent.

**Commits:**
- [`8867095`](https://github.com/cryptoeights/bumiagent/commit/8867095a839831563212fed87a183e48b43de57d) — feat: S06 — Trust badges, verification display, README, final polish
- [`d206ab7`](https://github.com/cryptoeights/bumiagent/commit/d206ab71984b2fc65f86896a183258a3af15a53f) — feat: Self Agent ID verification in dashboard
- [`006bd92`](https://github.com/cryptoeights/bumiagent/commit/006bd92679f87f3e7742de9b1316d37f774483c7) — fix: move Self verification inline per agent, fix verify logic
- [`eeecf06`](https://github.com/cryptoeights/bumiagent/commit/eeecf069510997b22921ed355e456f5750e1d12d) — feat: inline QR code for Self verification in dashboard
- [`b1131e0`](https://github.com/cryptoeights/bumiagent/commit/b1131e0cd9ace9fa6cde2c3758c987d40ab27acd) — fix: QR code encodes deepLink URL instead of raw qrData JSON
- [`4950767`](https://github.com/cryptoeights/bumiagent/commit/4950767c1bb7e7f0f0d361c7fa1410c060c8950d) — feat: persist Self verification in DB, show badge across all pages
- [`6f61794`](https://github.com/cryptoeights/bumiagent/commit/6f6179494f5401a60dfc1c3028f7df804aaeeca8) — fix: hide 'Unverified' trust badge for Self-verified agents

---

## Milestone 6

**Title:** Celo Mainnet Deployment & Contract Verification

**Description:** Deployed all 3 smart contracts to Celo Mainnet: EarthPool (0x4cA864b13563ff6c5626e3B4f1C4b310b866d51f), SpawnRegistry (0xB358d6FC42aB393Da7CaA3B2C02C9282Ad7ac070), and AgentCommerce (0x8951A9f16C767B4d8F96dc1BD7B94B5A992e61Eb). All contracts verified on Celoscan with full source code visibility. Updated backend configuration to use mainnet contract addresses and chain ID. Frontend wallet connection switched from testnet to Celo Mainnet. All on-chain interactions (agent registration, job escrow, payments) now execute on mainnet with real cUSD.

**Follow Up — Completed ✅**

All three contracts were successfully deployed to Celo Mainnet and verified on Celoscan with publicly visible source code. Backend config was updated with checksummed mainnet addresses. Frontend chain config was switched from testnet to Celo Mainnet (chain ID 42220). All on-chain interactions (agent registration, job escrow, cUSD payments) now execute on mainnet with real assets. Verification was confirmed by checking contracts on Celoscan and ensuring the backend reads data from mainnet.

- EarthPool: [0x4cA864...d51f](https://celoscan.io/address/0x4cA864b13563ff6c5626e3B4f1C4b310b866d51f)
- SpawnRegistry: [0xB358d6...c070](https://celoscan.io/address/0xB358d6FC42aB393Da7CaA3B2C02C9282Ad7ac070)
- AgentCommerce: [0x8951A9...61Eb](https://celoscan.io/address/0x8951A9f16C767B4d8F96dc1BD7B94B5A992e61Eb)

**Commits:**
- [`f75153a`](https://github.com/cryptoeights/bumiagent/commit/f75153a12864c056e33a3060c2d0150606597073) — feat(M002): polish & production — multi-model routing, analytics, mobile UI (includes mainnet deployment + address wiring)

---

## Milestone 7

**Title:** Multi-Model AI Routing

**Description:** Implemented intelligent multi-model AI routing with 8 models across 2 tiers via OpenRouter. Free tier includes Claude 4.6 Sonnet, DeepSeek R1 0528, Gemini 2.5 Flash, Llama 4 Scout, and Mistral Medium 3. Premium tier unlocks GPT-4o, Gemini 2.5 Pro, and Claude 4 Opus (plus all free models). Built automatic tier-based routing — free agents use free models only, premium agents access all 8 models. Implemented automatic fallback: if the primary model fails or times out, the system automatically retries with the next available model in the tier. Zero downtime for end users.

**Follow Up — Completed ✅**

Multi-model routing is fully operational via OpenRouter. The system automatically selects models based on agent tier — free agents can only access 5 free models, premium agents access all 8 models. A model selector UI is available in the chat interface so users can choose their preferred model. Automatic fallback is implemented — if the primary model fails, the system retries with the next available model in the same tier. Billing for premium models is handled transparently. All 8 models have been tested and are running in production.

**Commits:**
- [`78ca149`](https://github.com/cryptoeights/bumiagent/commit/78ca149ca32dd32b6f14852b97603d634fdc2f99) — feat: model selector, private key display, premium model billing
- [`44d10e7`](https://github.com/cryptoeights/bumiagent/commit/44d10e71c01beb6ad2e055e78e05730998b83b14) — fix: hydration error + payment flow for premium models
- [`f75153a`](https://github.com/cryptoeights/bumiagent/commit/f75153a12864c056e33a3060c2d0150606597073) — feat(M002): polish & production — multi-model routing, analytics, mobile UI

---

## Milestone 8

**Title:** Analytics Dashboard

**Description:** Built per-agent analytics dashboard with 30-day time series data using Recharts library. Three chart types: Call Trends (daily call volume as line chart), Revenue (cUSD earnings as area chart), and Model Usage (distribution across AI models as pie chart). Created new backend endpoint GET /api/agents/:id/analytics that aggregates call data from the database into daily buckets. Analytics section is embedded directly in each agent's detail page, providing creators with real-time visibility into their agent's performance, revenue, and which AI models are being used most.

**Follow Up — Completed ✅**

Analytics dashboard is implemented on each agent's detail page with 3 Recharts chart types: Line chart for daily call trends, Area chart for cUSD revenue, and Pie chart for AI model usage distribution. The backend endpoint /api/agents/:id/analytics aggregates data from the database into daily buckets for the past 30 days. Summary stats (total calls, total revenue, unique models used) are displayed above the charts. All data is served in real-time from the production database.

**Commits:**
- [`f75153a`](https://github.com/cryptoeights/bumiagent/commit/f75153a12864c056e33a3060c2d0150606597073) — feat(M002): polish & production — multi-model routing, analytics, mobile UI

---

## Milestone 9

**Title:** Mobile-Responsive UI

**Description:** Made the entire application mobile-responsive for 375px+ viewports. Implemented hamburger navigation menu for mobile with smooth open/close transitions. Converted all page layouts to adaptive CSS grids that stack vertically on small screens. Chat interface redesigned with collapsible sidebar for mobile. Agent registry cards, deploy form, dashboard panels, and analytics charts all adapt to mobile viewport. Verified all 7 pages render correctly on mobile, tablet, and desktop breakpoints.

**Follow Up — Completed ✅**

All 7 pages are fully mobile-responsive for 375px+ viewports. Navbar uses a hamburger menu on mobile with open/close animation. Grid layouts across all pages (registry, deploy, dashboard, analytics) automatically stack vertically on small screens. Chat interface has a collapsible sidebar for mobile. All breakpoints (mobile, tablet, desktop) have been visually verified using browser tools.

**Commits:**
- [`f75153a`](https://github.com/cryptoeights/bumiagent/commit/f75153a12864c056e33a3060c2d0150606597073) — feat(M002): polish & production — multi-model routing, analytics, mobile UI

---

## Milestone 10

**Title:** Production Deployment

**Description:** Deployed the complete application to production infrastructure. Backend deployed to Railway from the backend subdirectory with health check configuration at /api/health — live at backend-production-e3c2a.up.railway.app. Frontend deployed to Vercel with custom domain bumiagent.one, environment variables configured for production API URL, WalletConnect project ID, and Celo chain ID. Implemented dynamic CORS origin function to support Vercel preview domains (*.vercel.app) alongside production domain. All 16 API endpoints verified live. All frontend pages loading correctly with production backend.

**Follow Up — Completed ✅**

Backend was successfully deployed to Railway from the `backend/` subdirectory (initial deploys from monorepo root failed twice because Railpack couldn't detect the app). Health check at /api/health returns OK status. Frontend was deployed to Vercel with custom domain bumiagent.one. Production environment variables were configured (API URL, WalletConnect, Chain ID). CORS was fixed with a dynamic origin function supporting the *.vercel.app pattern for preview deployments. All 16 endpoints and 7 frontend pages are verified live in production.

- Frontend: [bumiagent.one](https://bumiagent.one)
- Backend: [backend-production-e3c2a.up.railway.app/api/health](https://backend-production-e3c2a.up.railway.app/api/health)

**Commits:**
- [`6536d5b`](https://github.com/cryptoeights/bumiagent/commit/6536d5b1446fdf55c750c5c09f7e0e20357488e5) — chore: production deployment prep — Dockerfile, CORS, env fixes
- [`04035d9`](https://github.com/cryptoeights/bumiagent/commit/04035d9736af8dd6ddd157174f47e8379ecc27ce) — fix: dynamic CORS origin for Vercel preview domains
- [`9b58b80`](https://github.com/cryptoeights/bumiagent/commit/9b58b8017374ff2669568d40c7e21a27fe8198f8) — chore: add railway.toml for backend service config

---

## Milestone 11

**Title:** Documentation & Submission Materials

**Description:** Created comprehensive project documentation and hackathon submission materials. Updated README with M002 features, mainnet contract addresses with Celoscan links, multi-model table, architecture diagram, and 16 API endpoints. Created Karma GAP submission document (project description, problem statement, solution details, mission summary) and support document (contracts table, full architecture, tech stack breakdown, all metrics). Built an 11-slide HTML pitch deck covering problem, solution, features, architecture, smart contracts, AI models, business model, traction, and roadmap. Created demo script with presenter notes and timing for 5-7 minute video walkthrough. Added brand logo (1024×1024) and Deck menu to live website.

**Follow Up — Completed ✅**

README was fully updated with M002 features, contract address table with Celoscan links, 8 AI model table, architecture diagram, and 16 API endpoint listing. Karma GAP documents were created (submission + support document) covering project description, problem/solution, tech stack, and all metrics. An 11-slide HTML pitch deck is live at bumiagent.one/deck.html and accessible from the Deck menu in the navbar. A demo script for a 5-7 minute video walkthrough was written with timing per segment. Brand logo (1024×1024) was created and deployed across the platform.

- Pitch Deck: [bumiagent.one/deck.html](https://bumiagent.one/deck.html)
- README: [github.com/cryptoeights/bumiagent](https://github.com/cryptoeights/bumiagent)

**Commits:**
- [`f6a7f29`](https://github.com/cryptoeights/bumiagent/commit/f6a7f29618e1ca2dc7adc23f78b7242afc9ebe5d) — docs: professional README with screenshots, .env.example files
- [`a2e2a1d`](https://github.com/cryptoeights/bumiagent/commit/a2e2a1d9812024977292ae2a880c6d8fdca77aac) — docs: update README with M002 features, mainnet contracts, and deployment info
- [`722c602`](https://github.com/cryptoeights/bumiagent/commit/722c60291fb9f5a9d6c20f974d5667f3f674a8ed) — docs: add Karma GAP submission and support documents
- [`6baf570`](https://github.com/cryptoeights/bumiagent/commit/6baf5700cf00094e88fd599560fb86255fb6747a) — docs: add pitch deck (11 slides)
- [`36958f2`](https://github.com/cryptoeights/bumiagent/commit/36958f25bdf92fdcfe4d089255b473696f9d0254) — feat: add Deck menu linking to pitch deck
- [`b634cde`](https://github.com/cryptoeights/bumiagent/commit/b634cde06ab20998a299c9f43d7593a533c9c2a6) — docs: add demo script with killer features & tech stack

---

## Summary

| # | Milestone | Status | Key Commits |
|---|-----------|--------|-------------|
| 1 | Smart Contracts Foundation | ✅ Complete | 2 commits |
| 2 | Backend API Development | ✅ Complete | 5 commits |
| 3 | Frontend Application | ✅ Complete | 9 commits |
| 4 | Payment System & Agentic Commerce | ✅ Complete | 10 commits |
| 5 | Trust & Verification System | ✅ Complete | 7 commits |
| 6 | Celo Mainnet Deployment & Verification | ✅ Complete | 1 commit + 3 contracts verified |
| 7 | Multi-Model AI Routing | ✅ Complete | 3 commits |
| 8 | Analytics Dashboard | ✅ Complete | 1 commit |
| 9 | Mobile-Responsive UI | ✅ Complete | 1 commit |
| 10 | Production Deployment | ✅ Complete | 3 commits |
| 11 | Documentation & Submission Materials | ✅ Complete | 6 commits |

**Total: 48 commits · 11 milestones · All completed**
