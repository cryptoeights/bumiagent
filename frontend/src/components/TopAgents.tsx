'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const TEMPLATE_ICONS = ['💰', '💸', '✍️', '🔍', '🎧', '📊', '🌱', '🏛️', '📚', '🤖'];

type TopAgent = {
  agentId: number;
  name: string;
  description: string;
  logoUrl: string;
  templateId: number;
  totalCalls: number;
  selfVerified: boolean;
  subscriptionTier: string;
};

export function TopAgents() {
  const [agents, setAgents] = useState<TopAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/agents/top?limit=3')
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-6 border-t border-zinc-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Top Agents</h2>
          <p className="text-center text-zinc-500 mb-12">Most active agents on the platform</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (agents.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <section className="py-20 px-6 border-t border-zinc-800/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Top Agents</h2>
        <p className="text-center text-zinc-500 mb-12">Most active agents on the platform</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {agents.map((agent, i) => {
            const icon = agent.logoUrl
              ? null
              : TEMPLATE_ICONS[agent.templateId] || '🤖';

            return (
              <Link
                key={agent.agentId}
                href={`/agent/${agent.agentId}`}
                className="group relative p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:border-[var(--celo-green)]/40 hover:bg-zinc-900/50 transition-all"
              >
                {/* Rank badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-base">
                  {medals[i]}
                </div>

                {/* Agent avatar */}
                <div className="flex items-center gap-3 mb-4">
                  {agent.logoUrl ? (
                    <img
                      src={agent.logoUrl}
                      alt={agent.name}
                      className="w-12 h-12 rounded-xl object-cover border border-zinc-700/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/80 flex items-center justify-center text-2xl">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate group-hover:text-[var(--celo-green)] transition-colors">
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {agent.selfVerified && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                          verified
                        </span>
                      )}
                      {agent.subscriptionTier === 'premium' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--celo-gold)]/10 text-[var(--celo-gold)] font-mono">
                          premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {agent.description && (
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                    {agent.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-[var(--celo-green)] font-bold font-[var(--font-display)]">
                      {agent.totalCalls.toLocaleString()}
                    </span>
                    <span className="text-zinc-600 text-xs">calls</span>
                  </div>
                  <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    View →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
