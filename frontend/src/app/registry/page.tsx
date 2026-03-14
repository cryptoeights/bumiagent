'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

const TEMPLATE_ICONS = ['💰', '💸', '✍️', '🔍', '🎧', '📊', '🌱', '🏛️', '📚', '🤖'];
const TEMPLATE_NAMES = ['DeFi', 'Payments', 'Content', 'Research', 'Support', 'Data', 'ReFi', 'DAO', 'Tutor', 'Custom'];

interface Agent {
  id: number;
  agentId: number;
  name: string;
  templateId: number;
  pricePerCall: string;
  ownerAddress: string;
  agentWallet: string;
  isActive: boolean;
  createdAt: string;
}

export default function RegistryPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<{ agents: Agent[] }>('/agents?limit=100')
      .then(d => setAgents(d.agents))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    TEMPLATE_NAMES[a.templateId]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="noise-bg grid-bg min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Agent Registry</h1>
              <p className="text-zinc-500 text-sm">{agents.length} agents deployed on Celo</p>
            </div>
            <Link
              href="/deploy"
              className="px-5 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95"
            >
              Deploy Agent +
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents by name or type..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm"
            />
          </div>

          {/* Agent Grid */}
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading agents...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-zinc-500">
                {search ? 'No agents found matching your search' : 'No agents deployed yet'}
              </p>
              <Link href="/deploy" className="text-[var(--celo-green)] text-sm mt-2 inline-block hover:underline">
                Be the first to deploy →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(agent => (
                <Link
                  key={agent.id}
                  href={`/agent/${agent.agentId}`}
                  className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:border-[var(--celo-green)]/30 hover:bg-zinc-900/50 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xl shrink-0">
                      {TEMPLATE_ICONS[agent.templateId] || '🤖'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate group-hover:text-[var(--celo-green)] transition-colors">
                        {agent.name}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        #{agent.agentId} · {TEMPLATE_NAMES[agent.templateId] || 'Custom'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      {(Number(agent.pricePerCall) / 1e18).toFixed(2)} cUSD/call
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      agent.isActive 
                        ? 'bg-[var(--celo-green)]/10 text-[var(--celo-green)]' 
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/30 text-[10px] text-zinc-600 font-mono truncate">
                    Owner: {agent.ownerAddress.slice(0, 6)}...{agent.ownerAddress.slice(-4)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
