# 🎬 Bumi Agent — Demo Script

> **Durasi:** 5-7 menit  
> **Format:** Screen recording + voice-over  
> **URL Live:** [bumiagent.one](https://bumiagent.one)  
> **Hackathon:** Synthesis Hackathon — Celo Track

---

## 🎤 OPENING (30 detik)

**[Screen: Landing page bumiagent.one]**

> "Hai, ini Bumi Agent — platform no-code dimana siapapun bisa launch, monetize, dan manage AI agent di Celo blockchain dalam 10 detik.
>
> Masalahnya simpel: deploy 1 AI agent yang bisa terima pembayaran on-chain butuh 2-4 minggu engineering. Wallet infrastructure, payment integration, on-chain identity, escrow system — semuanya harus dibangun dari nol.
>
> Bumi Agent mereduksi semua itu jadi 3 field dan 1 tombol. Let me show you."

---

## 🚀 DEMO 1: Deploy Agent (60 detik)

**[Screen: Klik "Deploy" di navbar → halaman /deploy]**

> "Untuk deploy agent, cuma butuh 3 hal:"

**[Isi form]**
1. **Name** → ketik "Climate Research Bot"
2. **Template** → pilih "Research Agent"
3. **Price** → set "0.15" cUSD per call

> "Klik Deploy — dan dalam hitungan detik, platform otomatis:
> - Generate wallet terenkripsi (AES-256-GCM)
> - Daftarkan agent sebagai NFT on-chain lewat ERC-8004
> - Konfigurasi endpoint pembayaran x402
> - Agent langsung live dan bisa terima pembayaran di cUSD
>
> Zero code. Zero Solidity. Zero wallet setup."

---

## 💬 DEMO 2: Chat dengan Agent (60 detik)

**[Screen: Buka agent dari Registry → klik Chat]**

> "Sekarang kita coba chat dengan agent yang sudah di-deploy."

**[Ketik pertanyaan di chat interface]**

> "Setiap chat call yang masuk secara otomatis di-monetize lewat protokol x402. Creator agent langsung dapat revenue di cUSD — tanpa perlu setup payment gateway apapun.
>
> Di balik layar, platform punya 8 AI model dengan smart routing. Free agent pakai free model — Claude 4.6 Sonnet, DeepSeek R1, Gemini Flash, Llama 4 Scout, Mistral Medium. Premium agent unlock GPT-4o, Gemini 2.5 Pro, dan Claude 4 Opus. Kalau 1 model gagal, otomatis fallback ke model lain. Zero downtime."

---

## 📊 DEMO 3: Analytics Dashboard (45 detik)

**[Screen: Klik agent → scroll ke Analytics section]**

> "Setiap agent punya analytics dashboard sendiri dengan data 30 hari:"

**[Tunjukkan chart satu per satu]**

> "- **Call Trends** — volume harian dalam line chart
> - **Revenue** — pendapatan cUSD dalam area chart
> - **Model Usage** — distribusi pemakaian AI model dalam pie chart
>
> Semua real-time, langsung dari production database."

---

## 🔍 DEMO 4: Agent Registry / AgentScan (45 detik)

**[Screen: Buka /registry]**

> "Registry ini kayak 'App Store' untuk AI agent. Semua agent yang di-deploy muncul di sini — lengkap dengan trust badge, harga, dan jumlah call.
>
> Trust badge naik otomatis berdasarkan usage:
> - Grey — baru, 0 calls
> - Blue — 10+ calls
> - Silver — 50+ calls
> - Gold — 100+ calls
>
> Plus, owner agent bisa verifikasi identitas lewat Self Protocol — proof-of-human, anti-sybil."

---

## 🔗 DEMO 5: Smart Contracts (45 detik)

**[Screen: Buka Celoscan — tunjukkan 3 kontrak verified]**

> "Semua berjalan di atas 3 smart contract yang sudah verified di Celo Mainnet:"

> "1. **SpawnRegistry** — ERC-721 + ERC-8004. Setiap agent terdaftar sebagai NFT dengan on-chain identity dan subscription management.
>
> 2. **AgentCommerce** — ERC-8183. Sistem job escrow — client bikin task, dana masuk escrow, agent kirim deliverable, client approve, dana release. Trustless.
>
> 3. **EarthPool** — Smart contract ReFi. 15% dari revenue premium subscription otomatis masuk sini untuk mendanai kampanye lingkungan di Celo. Fully transparent, on-chain."

---

## 🌱 DEMO 6: EarthPool / ReFi (30 detik)

**[Screen: Tunjukkan EarthPool di Celoscan]**

> "Ini yang bikin Bumi Agent unik — setiap premium agent secara otomatis berkontribusi ke lingkungan. 15% revenue masuk EarthPool contract. Ketika dana mencapai threshold, campaign baru ter-trigger.
>
> Jadi AI growth dan environmental sustainability berjalan bareng — sesuai dengan misi Celo: prosperity for all."

---

## 🏗️ TECH DEEP-DIVE (60 detik)

**[Screen: Pitch deck slide Architecture, atau diagram di README]**

> "Secara arsitektur, Bumi Agent terdiri dari 3 layer:"

### Frontend
> "**Next.js 16** dengan TypeScript dan Tailwind CSS v4. Wallet connection pakai RainbowKit + wagmi. Analytics chart pakai Recharts. Fully mobile-responsive. Di-deploy di **Vercel**."

### Backend
> "**Hono** — framework ringan di Node.js. 16 REST API endpoint. Database PostgreSQL di **Supabase** lewat Drizzle ORM. Caching dan rate limiting di **Upstash Redis**. LLM gateway lewat **OpenRouter** — satu endpoint, 8 model. Payment processing pakai **x402 protocol**. Wallet encryption pakai **AES-256-GCM**. Di-deploy di **Railway**."

### Blockchain
> "3 smart contract di **Celo Mainnet**, ditulis pakai **Solidity 0.8.25** dan **Foundry**. Menggunakan library **OpenZeppelin** — ERC-721, ReentrancyGuard, Ownable. **85 unit test**, full coverage. Semua verified di Celoscan."

---

## 🔑 KILLER FEATURES — Ringkasan (45 detik)

**[Screen: Landing page atau pitch deck]**

> "Kalau harus pilih 5 killer feature:"

> "**Pertama — 10-Second Deploy.** 3 field, 1 klik. Dari nol ke earning dalam 10 detik. Ga ada platform lain yang bisa begini.
>
> **Kedua — x402 Pay-Per-Call.** HTTP-native payment protocol. Agent langsung monetize dari hari pertama tanpa setup apapun.
>
> **Ketiga — Multi-Model AI dengan Fallback.** 8 model, tier-based routing, auto-fallback. User selalu dapat response.
>
> **Keempat — ERC-8183 Job Escrow.** Bukan cuma chat — agent bisa terima task berbayar lewat trustless escrow on-chain.
>
> **Kelima — EarthPool ReFi.** 15% revenue ke lingkungan, on-chain, transparan. AI yang peduli bumi."

---

## 📈 CLOSING — Traction & CTA (30 detik)

**[Screen: Traction slide pitch deck atau live registry]**

> "Saat ini Bumi Agent sudah:
> - 12 agent live di Celo Mainnet
> - 52+ paid API call processed
> - 7.80 cUSD revenue generated
> - 3 smart contract verified
> - 8 AI model running
> - 16 API endpoint in production
>
> Semuanya live di **bumiagent.one**. Source code open di GitHub.
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

## 🎯 Key Numbers untuk Disebutkan

| Metric | Value |
|--------|-------|
| Waktu deploy agent | 10 detik |
| Field yang diisi | 3 |
| Smart contract | 3 (semua verified) |
| AI model | 8 (5 free + 3 premium) |
| API endpoint | 16 |
| Agent templates | 10 |
| Contract tests | 85 |
| Agent deployed | 12 |
| Paid calls | 52+ |
| Revenue | 7.80 cUSD |
| ReFi contribution | 15% premium revenue |
