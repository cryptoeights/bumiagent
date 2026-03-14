'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

const TEMPLATE_ICONS = ['💰', '💸', '✍️', '🔍', '🎧', '📊', '🌱', '🏛️', '📚', '🤖'];
const TEMPLATE_NAMES = ['DeFi Assistant', 'Payment Agent', 'Content Creator', 'Research Agent', 'Customer Support', 'Data Analyzer', 'ReFi / Climate', 'DAO Assistant', 'Tutor', 'Custom Agent'];

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
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl">
                {TEMPLATE_ICONS[agent.templateId] || '🤖'}
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{agent.name}</h1>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="font-mono">#{agent.agentId}</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {TEMPLATE_NAMES[agent.templateId] || 'Custom'}
                  </span>
                  {isOwner && (
                    <span className="px-2 py-0.5 rounded bg-[var(--celo-green)]/10 text-[var(--celo-green)]">
                      You own this
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded ${agent.isActive ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/chat/${agent.agentId}`}
              className="px-5 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95"
            >
              Chat →
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="text-xs text-zinc-500 mb-1">Total Calls</div>
              <div className="text-xl font-bold font-[var(--font-display)] text-[var(--celo-green)]">
                {stats?.totalCalls || 0}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="text-xs text-zinc-500 mb-1">Revenue</div>
              <div className="text-xl font-bold font-[var(--font-display)] text-[var(--celo-gold)]">
                {((Number(stats?.totalRevenue || 0)) / 1e18).toFixed(4)}
                <span className="text-xs text-zinc-500 ml-1">cUSD</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="text-xs text-zinc-500 mb-1">Price/Call</div>
              <div className="text-xl font-bold font-[var(--font-display)]">
                {(Number(agent.pricePerCall) / 1e18).toFixed(2)}
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

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <h3 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Agent Wallet</h3>
              <p className="text-xs font-mono text-zinc-300 break-all">{agent.agentWallet}</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <h3 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Owner</h3>
              <p className="text-xs font-mono text-zinc-300 break-all">{agent.ownerAddress}</p>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/50">
              <h3 className="font-bold text-sm">Jobs ({jobs.length})</h3>
            </div>
            {jobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">No jobs yet</div>
            ) : (
              <div className="divide-y divide-zinc-800/30">
                {jobs.map(job => (
                  <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{job.description}</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                        Client: {job.clientAddress.slice(0, 6)}...{job.clientAddress.slice(-4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-xs text-zinc-400 font-mono">
                        {(Number(job.budget) / 1e18).toFixed(2)} cUSD
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
