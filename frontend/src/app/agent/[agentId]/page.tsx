'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/Navbar';
import { TrustBadge } from '@/components/TrustBadge';
import { apiFetch } from '@/lib/api';
import { getTemplate, formatCUSD, shortenAddress, TRUST_TIERS, getTrustTier } from '@/lib/constants';

interface AgentDetail {
  agentId: number;
  name: string;
  templateId: number;
  pricePerCall: string;
  ownerAddress: string;
  agentWallet: string;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  totalCalls: number;
  totalRevenue: string;
  ownerCalls: number;
  paidCalls: number;
}

interface Job {
  id: number;
  status: string;
  description: string;
  budget: string;
  clientAddress: string;
  createdAt: string;
}

export default function AgentScanPage() {
  const params = useParams();
  const agentId = Number(params.agentId);
  const { address } = useAccount();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ agent: AgentDetail }>(`/agents/${agentId}`),
      apiFetch<Stats>(`/agents/${agentId}/stats`),
      apiFetch<{ jobs: Job[] }>(`/agents/${agentId}/jobs`),
    ])
      .then(([a, s, j]) => {
        setAgent(a.agent);
        setStats(s);
        setJobs(j.jobs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agentId]);

  const isOwner = address?.toLowerCase() === agent?.ownerAddress?.toLowerCase();

  if (loading) {
    return (
      <div className="noise-bg min-h-screen">
        <Navbar />
        <div className="pt-32 text-center text-zinc-500">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="noise-bg min-h-screen">
        <Navbar />
        <div className="pt-32 text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-zinc-400">Agent not found</p>
          <Link href="/registry" className="text-[var(--celo-green)] text-sm mt-2 inline-block hover:underline">
            Back to Registry →
          </Link>
        </div>
      </div>
    );
  }

  const tpl = getTemplate(agent.templateId);
  const tier = getTrustTier(stats?.totalCalls || 0);
  const nextTier = TRUST_TIERS.find(t => t.min > (stats?.totalCalls || 0));
  const progress = nextTier
    ? ((stats?.totalCalls || 0) - tier.min) / (nextTier.min - tier.min) * 100
    : 100;

  const statusColors: Record<string, string> = {
    open: 'text-blue-400 bg-blue-400/10',
    funded: 'text-yellow-400 bg-yellow-400/10',
    submitted: 'text-purple-400 bg-purple-400/10',
    completed: 'text-green-400 bg-green-400/10',
    rejected: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="noise-bg grid-bg min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Agent Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: tpl.color + '15', border: `1px solid ${tpl.color}30` }}
              >
                {tpl.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{agent.name}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono">#{agent.agentId}</span>
                  <span className="px-2 py-0.5 rounded text-zinc-400" style={{ backgroundColor: tpl.color + '15', color: tpl.color }}>
                    {tpl.name}
                  </span>
                  <TrustBadge totalCalls={stats?.totalCalls || 0} size="md" />
                  {isOwner && (
                    <span className="px-2 py-0.5 rounded bg-[var(--celo-green)]/10 text-[var(--celo-green)]">
                      You own this
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded ${agent.isActive ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {agent.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/chat/${agent.agentId}`}
                className="px-5 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95"
              >
                Chat →
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="text-xs text-zinc-500 mb-1">Total Calls</div>
              <div className="text-xl font-bold font-[var(--font-display)] text-[var(--celo-green)]">
                {stats?.totalCalls || 0}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="text-xs text-zinc-500 mb-1">Revenue</div>
              <div className="text-xl font-bold font-[var(--font-display)] text-[var(--celo-gold)]">
                {formatCUSD(stats?.totalRevenue || '0')}
                <span className="text-xs text-zinc-500 ml-1">cUSD</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="text-xs text-zinc-500 mb-1">Price/Call</div>
              <div className="text-xl font-bold font-[var(--font-display)]">
                {formatCUSD(agent.pricePerCall)}
                <span className="text-xs text-zinc-500 ml-1">cUSD</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="text-xs text-zinc-500 mb-1">Jobs</div>
              <div className="text-xl font-bold font-[var(--font-display)] text-[var(--celo-violet)]">
                {jobs.length}
              </div>
            </div>
          </div>

          {/* Trust Tier Progress */}
          <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider">Trust Level</h3>
              <span className="text-xs" style={{ color: tier.color }}>
                {tier.icon} {tier.name}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: tier.color }}
              />
            </div>
            {nextTier && (
              <p className="text-[10px] text-zinc-600 mt-1.5">
                {nextTier.min - (stats?.totalCalls || 0)} more calls to reach {nextTier.icon} {nextTier.name}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <h3 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Agent Wallet</h3>
              <p className="text-xs font-mono text-zinc-300 break-all">{agent.agentWallet}</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <h3 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Owner</h3>
              <p className="text-xs font-mono text-zinc-300 break-all">{agent.ownerAddress}</p>
            </div>
          </div>

          {/* Call Breakdown */}
          {(stats?.totalCalls || 0) > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
                <div className="text-xs text-zinc-500 mb-1">Owner Calls (Free)</div>
                <div className="text-lg font-bold font-[var(--font-display)]">{stats?.ownerCalls || 0}</div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
                <div className="text-xs text-zinc-500 mb-1">Paid Calls (x402)</div>
                <div className="text-lg font-bold font-[var(--font-display)] text-[var(--celo-gold)]">{stats?.paidCalls || 0}</div>
              </div>
            </div>
          )}

          {/* Jobs Table */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/50">
              <h3 className="font-bold text-sm">ERC-8183 Jobs ({jobs.length})</h3>
            </div>
            {jobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">No jobs yet</div>
            ) : (
              <div className="divide-y divide-zinc-800/30">
                {jobs.map(job => (
                  <div key={job.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{job.description}</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                        Client: {shortenAddress(job.clientAddress)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-zinc-400 font-mono">
                        {formatCUSD(job.budget)} cUSD
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[job.status] || 'text-zinc-400 bg-zinc-800'}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
