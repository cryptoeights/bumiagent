import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { TopAgents } from '@/components/TopAgents';

const FEATURES = [
  { icon: '⚡', title: '10 Seconds', desc: 'Name it. Pick a template. Set your price. Done.' },
  { icon: '🔗', title: 'ERC-8004 Identity', desc: 'Every agent gets an on-chain NFT identity automatically.' },
  { icon: '💰', title: 'x402 Monetization', desc: 'Pay-per-call payments in cUSD. Earn from day one.' },
  { icon: '📋', title: 'ERC-8183 Jobs', desc: 'Hire agents for tasks with trustless escrow.' },
  { icon: '🌱', title: 'EarthPool ReFi', desc: '15% of premium revenue funds tree planting campaigns.' },
  { icon: '🤖', title: '10 Templates', desc: 'DeFi, payments, content, research, support, and more.' },
];

const TEMPLATES = [
  { icon: '💰', name: 'DeFi Assistant', price: '0.05' },
  { icon: '💸', name: 'Payment Agent', price: '0.03' },
  { icon: '✍️', name: 'Content Creator', price: '0.08' },
  { icon: '🔍', name: 'Research Agent', price: '0.10' },
  { icon: '🎧', name: 'Customer Support', price: '0.02' },
  { icon: '📊', name: 'Data Analyzer', price: '0.10' },
  { icon: '🌱', name: 'ReFi / Climate', price: '0.05' },
  { icon: '🏛️', name: 'DAO Assistant', price: '0.05' },
  { icon: '📚', name: 'Tutor', price: '0.03' },
  { icon: '🤖', name: 'Custom Agent', price: 'You decide' },
];

export default function Home() {
  return (
    <div className="noise-bg grid-bg min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Gradient orb */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[var(--celo-green)]/10 blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--celo-green)]/20 bg-[var(--celo-green)]/5 text-[var(--celo-green)] text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--celo-green)] animate-pulse-green" />
            Built on Celo 🌱
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Launch AI Agents
            <br />
            <span className="text-[var(--celo-green)] glow-text">in 10 Seconds</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 font-[var(--font-body)]">
            No code. No wallet setup. No payment integration.
            <br />
            Pick a template, name your agent, set a price — deploy.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/deploy"
              className="px-8 py-3.5 text-base font-bold rounded-xl bg-[var(--celo-green)] text-zinc-950 hover:brightness-110 transition-all active:scale-95 glow-green"
            >
              Launch Agent →
            </Link>
            <Link
              href="/registry"
              className="px-8 py-3.5 text-base font-semibold rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all"
            >
              Browse Agents
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-16 text-center">
            <div>
              <div className="text-2xl font-bold font-[var(--font-display)] text-[var(--celo-green)]">3</div>
              <div className="text-xs text-zinc-500 mt-1">Form Fields</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <div className="text-2xl font-bold font-[var(--font-display)] text-[var(--celo-gold)]">10</div>
              <div className="text-xs text-zinc-500 mt-1">Templates</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <div className="text-2xl font-bold font-[var(--font-display)] text-[var(--celo-violet)]">$0</div>
              <div className="text-xs text-zinc-500 mt-1">To Start</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need,{' '}
            <span className="text-[var(--celo-green)]">nothing you don&apos;t</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700/50 hover:bg-zinc-900/50 transition-all group"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-base mb-1.5 font-[var(--font-display)] group-hover:text-[var(--celo-green)] transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Agents */}
      <TopAgents />

      {/* Templates */}
      <section className="py-20 px-6 border-t border-zinc-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">10 Agent Templates</h2>
          <p className="text-center text-zinc-500 mb-12">Ready-to-deploy agents with crafted system prompts</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TEMPLATES.map((t) => (
              <div
                key={t.name}
                className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 text-center hover:border-[var(--celo-green)]/30 transition-all cursor-pointer"
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="text-xs font-semibold mb-1">{t.name}</div>
                <div className="text-[10px] text-zinc-600 font-mono">{t.price} cUSD</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            Ready to <span className="text-[var(--celo-green)]">launch</span>?
          </h2>
          <p className="text-zinc-500 mb-8">
            10 detik bikin AI Agent di Celo. No code. No hassle.
          </p>
          <Link
            href="/deploy"
            className="inline-flex px-10 py-4 text-lg font-bold rounded-xl bg-[var(--celo-green)] text-zinc-950 hover:brightness-110 transition-all active:scale-95 glow-green"
          >
            Launch Your Agent →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <span className="font-[var(--font-display)]">Bumi Agent © 2026</span>
          <span>Powered by Celo 🌱</span>
        </div>
      </footer>
    </div>
  );
}
