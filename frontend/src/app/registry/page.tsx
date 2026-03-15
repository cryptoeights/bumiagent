'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { TrustBadge } from '@/components/TrustBadge';
import { apiFetch } from '@/lib/api';
import { getTemplate, formatCUSD, shortenAddress, timeAgo } from '@/lib/constants';

interface Agent {
  id: number;
  agentId: number;
  name: string;
  description: string;
  logoUrl: string;
  templateId: number;
  pricePerCall: string;
  ownerAddress: string;
  agentWallet: string;
  isActive: boolean;
  selfVerified: boolean;
  createdAt: string;
}

interface Stats {
  totalCalls: number;
  totalRevenue: string;
}

export default function RegistryPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    apiFetch<{ agents: Agent[] }>('/agents?limit=100')
      .then(async (d) => {
        setAgents(d.agents);
        // Fetch stats for each agent
        const entries = await Promise.all(
          d.agents.map(async (a) => {
            try {
              const s = await apiFetch<Stats>(`/agents/${a.agentId}/stats`);
              return [a.agentId, { totalCalls: s.totalCalls, totalRevenue: s.totalRevenue }] as const;
            } catch {
              return [a.agentId, { totalCalls: 0, totalRevenue: '0' }] as const;
            }
          })
        );
        setStatsMap(Object.fromEntries(entries));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(agents.map(a => getTemplate(a.templateId).category))];

  const filtered = agents.filter(a => {
    const tpl = getTemplate(a.templateId);
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      tpl.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tpl.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="noise-bg grid-bg min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Agent Registry</h1>
              <p className="text-zinc-500 text-sm">{agents.length} agents deployed on Celo</p>
            </div>
            <Link
              href="/deploy"
              className="px-5 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 text-center"
            >
              Deploy Agent +
            </Link>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-[var(--celo-green)]/10 text-[var(--celo-green)] border border-[var(--celo-green)]/30'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Grid */}
          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading agents...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-zinc-500">
                {search || categoryFilter !== 'all' ? 'No agents match your filters' : 'No agents deployed yet'}
              </p>
              <Link href="/deploy" className="text-[var(--celo-green)] text-sm mt-2 inline-block hover:underline">
                Be the first to deploy →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(agent => {
                const tpl = getTemplate(agent.templateId);
                const stats = statsMap[agent.agentId];
                return (
                  <Link
                    key={agent.id}
                    href={`/agent/${agent.agentId}`}
                    className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:border-[var(--celo-green)]/30 hover:bg-zinc-900/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {agent.logoUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={agent.logoUrl} alt={agent.name} className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xl shrink-0">
                            {tpl.icon}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm truncate group-hover:text-[var(--celo-green)] transition-colors">
                            {agent.name}
                          </h3>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            #{agent.agentId} · {tpl.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!agent.selfVerified && <TrustBadge totalCalls={stats?.totalCalls || 0} />}
                        {agent.selfVerified ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--celo-green)]/10 text-[var(--celo-green)] border border-[var(--celo-green)]/20">
                            ✅ Self Verified
                          </span>
                        ) : null}
                        {agent.selfVerified && (stats?.totalCalls || 0) >= 5 && (
                          <TrustBadge totalCalls={stats?.totalCalls || 0} />
                        )}
                      </div>
                    </div>

                    {agent.description && (
                      <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{agent.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-zinc-400 font-mono">{formatCUSD(agent.pricePerCall)} cUSD/call</span>
                      <span className="text-zinc-600">{stats?.totalCalls || 0} calls</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/30">
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {shortenAddress(agent.ownerAddress)}
                      </span>
                      <span className="text-[10px] text-zinc-600">{timeAgo(agent.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
