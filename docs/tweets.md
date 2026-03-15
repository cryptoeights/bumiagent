# Bumi Agent — Long-Form Tweet

---

```
I spent 2 weeks building something that saves you 2-4 weeks.

Let me explain.

Right now, if you want to deploy a single AI agent that earns money on blockchain, you need:

→ Wallet infrastructure (key generation, encryption, signing)
→ Payment integration (on-chain flows, stablecoin handling)
→ On-chain identity (NFT registration, metadata, URIs)
→ Escrow contracts (state machines, fund locking)
→ Monitoring dashboard (analytics, revenue tracking)

That's 2-4 weeks of engineering. Minimum.

And it locks out 99% of potential creators who aren't Solidity devs.

So I built Bumi Agent.

It takes 10 seconds.

3 fields: Name, Template, Price.
1 button: Deploy.

That's it. Your AI agent is live on Celo, earning cUSD, with on-chain identity — before your coffee gets cold.

Here's what happens behind that 1 click:

• Wallet auto-generated with AES-256-GCM encryption
• Agent registered as NFT via ERC-8004
• Payment endpoint configured via x402 protocol
• Agent runtime deployed with your chosen template
• Revenue starts flowing in cUSD from call #1

No Solidity. No wallet setup. No payment gateway.

But the real magic is what powers the agents:

8 AI models with intelligent routing:
- Free tier: Claude 4.6 Sonnet, DeepSeek R1, Gemini Flash, Llama 4 Scout, Mistral Medium
- Premium: GPT-4o, Gemini 2.5 Pro, Claude 4 Opus

If one model fails? Auto-fallback to the next. Zero downtime. Users always get a response.

And agents don't just chat — they work.

ERC-8183 job escrow lets clients post paid tasks:
Client funds escrow → Agent delivers → Client approves → Funds release.

Fully trustless. On-chain. With Celoscan links for every transaction.

The part I'm most proud of: EarthPool 🌱

15% of premium revenue automatically goes to an on-chain ReFi treasury that funds environmental campaigns on Celo.

AI growth funding climate action. No greenwashing — every cent is trackable on-chain.

The numbers so far:

→ 12 agents deployed on Celo Mainnet
→ 52+ paid API calls processed
→ 7.80 cUSD revenue generated
→ 3 smart contracts verified on Celoscan
→ 8 AI models running
→ 85 contract tests passing
→ 16 API endpoints in production
→ 10 agent templates ready

The full stack:

Frontend: Next.js 16 + Tailwind v4 + Recharts → Vercel
Backend: Hono + Drizzle + PostgreSQL + Redis → Railway
Blockchain: Solidity 0.8.25 + Foundry + OpenZeppelin → Celo Mainnet

Everything is live. Everything is open source.

🌐 bumiagent.one
📦 github.com/cryptoeights/bumiagent
📊 bumiagent.one/deck.html

Bumi Agent — AI agents for everyone.

Built with 🌱 on @Celo
```
