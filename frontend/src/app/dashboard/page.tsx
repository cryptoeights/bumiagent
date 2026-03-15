'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { celo } from 'wagmi/chains';
import { Navbar } from '@/components/Navbar';
import { ConnectButton } from '@/components/ConnectButton';
import { TrustBadge } from '@/components/TrustBadge';
import { SelfVerification } from '@/components/SelfVerification';
import { AgentEditForm } from '@/components/AgentEditForm';
import { apiFetch } from '@/lib/api';
import { getTemplate, formatCUSD } from '@/lib/constants';
import { CUSD_ADDRESS, ERC20_ABI } from '@/lib/contracts';

// EarthPool address — premium subscription fees go here
const EARTH_POOL_ADDRESS = '0x0000000000000000000000000000000000000000' as const; // TODO: set real pool address
const PREMIUM_PRICE = BigInt('5000000000000000000'); // 5 cUSD

interface AgentService {
  name: string;
  description?: string;
  price: string;
}

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
  customSystemPrompt: string;
  services: AgentService[];
  isActive: boolean;
  selfVerified: boolean;
  subscriptionTier: string;
  createdAt: string;
}

interface Stats {
  totalCalls: number;
  totalRevenue: string;
  totalEarthPool: string;
  totalOwnerShare: string;
  ownerCalls: number;
  paidCalls: number;
  freeModelCalls: number;
  premiumModelCalls: number;
  subscriptionTier: string;
}

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [upgradingId, setUpgradingId] = useState<number | null>(null);

  const { writeContract, data: txHash, reset: resetTx } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    apiFetch<{ agents: Agent[] }>('/agents?limit=100')
      .then(async (d) => {
        const owned = d.agents.filter(a => a.ownerAddress === address.toLowerCase());
        setAgents(owned);

        const statsEntries = await Promise.all(
          owned.map(async (a) => {
            try {
              const s = await apiFetch<Stats>(`/agents/${a.agentId}/stats`);
              return [a.agentId, s] as const;
            } catch {
              return [a.agentId, { totalCalls: 0, totalRevenue: '0', ownerCalls: 0, paidCalls: 0 }] as const;
            }
          })
        );
        setStatsMap(Object.fromEntries(statsEntries));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  // Handle premium upgrade TX confirmation
  useEffect(() => {
    if (txConfirmed && txHash && upgradingId && address) {
      apiFetch(`/agents/${upgradingId}/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ callerAddress: address, txHash }),
      }).then(() => {
        setAgents(prev => prev.map(a =>
          a.agentId === upgradingId ? { ...a, subscriptionTier: 'premium' } : a
        ));
        setUpgradingId(null);
        resetTx();
      }).catch(() => { setUpgradingId(null); resetTx(); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txConfirmed, txHash]);

  function handleUpgrade(agentId: number, agentWallet: string) {
    if (!address) return;
    if (chainId !== celo.id) { switchChain({ chainId: celo.id }); return; }
    setUpgradingId(agentId);
    writeContract({
      address: CUSD_ADDRESS, abi: ERC20_ABI, functionName: 'transfer',
      args: [agentWallet as `0x${string}`, PREMIUM_PRICE], chain: celo,
    });
  }

  const totalRevenue = Object.values(statsMap).reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
  const totalCalls = Object.values(statsMap).reduce((sum, s) => sum + (s.totalCalls || 0), 0);
  const totalEarthPool = Object.values(statsMap).reduce((sum, s) => sum + Number(s.totalEarthPool || 0), 0);
  const totalOwnerEarned = Object.values(statsMap).reduce((sum, s) => sum + Number(s.totalOwnerShare || 0), 0);

  return (
    <div className="noise-bg grid-bg min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-zinc-500 text-sm">
                {isConnected ? `Manage your ${agents.length} agent${agents.length !== 1 ? 's' : ''}` : 'Connect wallet to view your agents'}
              </p>
            </div>
            {isConnected && (
              <Link
                href="/deploy"
                className="px-5 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 text-center"
              >
                Deploy New +
              </Link>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔐</div>
              <p className="text-zinc-400 mb-6">Connect your wallet to access your dashboard</p>
              <ConnectButton />
            </div>
          ) : loading ? (
            <div className="text-center py-20 text-zinc-500">Loading dashboard...</div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
                  <div className="text-xs text-zinc-500 mb-1">Agents</div>
                  <div className="text-2xl font-bold font-[var(--font-display)] text-[var(--celo-green)]">
                    {agents.length}
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1">{agents[0]?.subscriptionTier === 'premium' ? '⚡ Premium' : '🌱 Free'} tier</div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
                  <div className="text-xs text-zinc-500 mb-1">Your Earnings</div>
                  <div className="text-2xl font-bold font-[var(--font-display)] text-[var(--celo-gold)]">
                    {formatCUSD(totalOwnerEarned.toString())}
                    <span className="text-xs text-zinc-500 ml-1">cUSD</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1">of {formatCUSD(totalRevenue.toString())} total</div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
                  <div className="text-xs text-zinc-500 mb-1">Total Calls</div>
                  <div className="text-2xl font-bold font-[var(--font-display)] text-[var(--celo-violet)]">
                    {totalCalls}
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
                  <div className="text-xs text-zinc-500 mb-1">🌍 EarthPool</div>
                  <div className="text-2xl font-bold font-[var(--font-display)] text-emerald-400">
                    {formatCUSD(totalEarthPool.toString())}
                    <span className="text-xs text-zinc-500 ml-1">cUSD</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1">Climate contribution</div>
                </div>
              </div>

              {/* Agent list */}
              {agents.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
                  <div className="text-4xl mb-4">🚀</div>
                  <p className="text-zinc-400 mb-2">You haven&apos;t deployed any agents yet</p>
                  <Link href="/deploy" className="text-[var(--celo-green)] text-sm hover:underline">
                    Deploy your first agent →
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-800/50">
                    <h3 className="font-bold text-sm">Your Agents</h3>
                  </div>
                  <div className="divide-y divide-zinc-800/30">
                    {agents.map(agent => {
                      const s = statsMap[agent.agentId];
                      const tpl = getTemplate(agent.templateId);
                      return (
                        <div key={agent.id} className="px-5 py-4 space-y-3 hover:bg-zinc-800/10 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Logo or template icon */}
                            {agent.logoUrl ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={agent.logoUrl} alt={agent.name} className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                            ) : (
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                                style={{ backgroundColor: tpl.color + '15' }}
                              >
                                {tpl.icon}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link href={`/agent/${agent.agentId}`} className="font-semibold text-sm hover:text-[var(--celo-green)] transition-colors truncate">
                                  {agent.name}
                                </Link>
                                <TrustBadge totalCalls={s?.totalCalls || 0} />
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  agent.subscriptionTier === 'premium'
                                    ? 'bg-[var(--celo-gold)]/10 text-[var(--celo-gold)] border border-[var(--celo-gold)]/20'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {agent.subscriptionTier === 'premium' ? '⚡ Premium' : '🌱 Free'}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-600 font-mono">
                                #{agent.agentId} · {tpl.name} · {formatCUSD(agent.pricePerCall)} cUSD/call
                                {agent.services && (agent.services as AgentService[]).length > 0 && (
                                  <span className="text-[var(--celo-violet)]"> · {(agent.services as AgentService[]).length} services</span>
                                )}
                              </div>
                              {agent.description && (
                                <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-xs">{agent.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right hidden md:block">
                              <div className="text-xs text-zinc-400">{s?.totalCalls || 0} calls</div>
                              <div className="text-[10px] text-zinc-600 font-mono">{formatCUSD(s?.totalOwnerShare || '0')} cUSD earned</div>
                              {Number(s?.totalEarthPool || 0) > 0 && (
                                <div className="text-[10px] text-emerald-600 font-mono">🌍 {formatCUSD(s?.totalEarthPool || '0')} to EarthPool</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {agent.subscriptionTier !== 'premium' && (
                                <button
                                  onClick={() => handleUpgrade(agent.agentId, agent.agentWallet)}
                                  disabled={upgradingId === agent.agentId}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--celo-gold)]/10 text-[var(--celo-gold)] border border-[var(--celo-gold)]/30 hover:bg-[var(--celo-gold)]/20 transition-all disabled:opacity-50"
                                >
                                  {upgradingId === agent.agentId ? 'Upgrading...' : '⚡ Upgrade 5 cUSD'}
                                </button>
                              )}
                              <button
                                onClick={() => setEditingId(editingId === agent.agentId ? null : agent.agentId)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-300 hover:border-[var(--celo-green)]/50 hover:text-[var(--celo-green)] transition-all"
                              >
                                Edit
                              </button>
                              <Link
                                href={`/chat/${agent.agentId}`}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all"
                              >
                                Chat
                              </Link>
                              <Link
                                href={`/agent/${agent.agentId}`}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all"
                              >
                                Scan
                              </Link>
                            </div>
                          </div>
                          </div>

                          {/* Inline edit form */}
                          {editingId === agent.agentId && (
                            <AgentEditForm
                              agent={agent}
                              onSaved={(updated) => {
                                setAgents(prev => prev.map(a =>
                                  a.agentId === agent.agentId ? { ...a, ...updated } : a
                                ));
                                setEditingId(null);
                              }}
                              onCancel={() => setEditingId(null)}
                            />
                          )}

                          {/* Self Verification inline */}
                          <SelfVerification
                            agentId={agent.agentId}
                            agentWallet={agent.agentWallet}
                            ownerAddress={agent.ownerAddress}
                            initialVerified={agent.selfVerified}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
