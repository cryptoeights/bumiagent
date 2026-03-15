'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { celo } from 'wagmi/chains';
import { Navbar } from '@/components/Navbar';
import { TrustBadge } from '@/components/TrustBadge';
import { apiFetch } from '@/lib/api';
import { CUSD_ADDRESS, ERC20_ABI } from '@/lib/contracts';
import { getTemplate, formatCUSD, shortenAddress, TRUST_TIERS, getTrustTier } from '@/lib/constants';

interface AgentService {
  name: string;
  description?: string;
  price: string; // wei
}

interface AgentDetail {
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
  subscriptionTier: string;
  services: AgentService[];
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
  jobId: number;
  agentId: number;
  status: string;
  description: string;
  budget: string;
  clientAddress: string;
  resultText: string | null;
  deliverableIpfsCid: string | null;
  fundTxHash: string | null;
  payoutTxHash: string | null;
  createdAt: string;
  fundedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
}

const CELOSCAN = 'https://celoscan.io/tx/';

export default function AgentScanPage() {
  const params = useParams();
  const agentId = Number(params.agentId);
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Create job form
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [jobBudget, setJobBudget] = useState('1');
  const [selectedService, setSelectedService] = useState<AgentService | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobError, setJobError] = useState('');
  const [jobSuccess, setJobSuccess] = useState('');

  // Job actions
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Expanded job
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  // TX for funding jobs
  const [pendingFundJob, setPendingFundJob] = useState<{jobId: number; budget: string; agentWallet: string} | null>(null);
  const { writeContract, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Poll while any job is "funded" (agent processing)
  useEffect(() => {
    const hasPending = jobs.some(j => j.status === 'funded');
    if (!hasPending) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  async function loadData() {
    try {
      const [a, s, j] = await Promise.all([
        apiFetch<{ agent: AgentDetail }>(`/agents/${agentId}`),
        apiFetch<Stats>(`/agents/${agentId}/stats`),
        apiFetch<{ jobs: Job[] }>(`/agents/${agentId}/jobs`),
      ]);
      setAgent(a.agent);
      setStats(s);
      setJobs(j.jobs);
    } catch {}
    setLoading(false);
  }

  // Fund TX confirmed
  useEffect(() => {
    if (txConfirmed && txHash && pendingFundJob && address) {
      apiFetch(`/jobs/${pendingFundJob.jobId}/fund`, {
        method: 'POST',
        body: JSON.stringify({ callerAddress: address, txHash }),
      }).then(() => {
        setJobSuccess(`Job #${pendingFundJob.jobId} funded!`);
        setPendingFundJob(null);
        setActionLoading(null);
        resetTx();
        loadData();
      }).catch(() => {
        setJobError('Fund confirmation failed');
        setPendingFundJob(null);
        setActionLoading(null);
        resetTx();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txConfirmed, txHash]);

  useEffect(() => {
    if (txError && pendingFundJob) {
      setJobError('Transaction cancelled');
      setPendingFundJob(null);
      setActionLoading(null);
      resetTx();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txError]);

  const isOwner = address?.toLowerCase() === agent?.ownerAddress?.toLowerCase();

  async function handleCreateJob() {
    if (!address || !agent) return;
    const hasServices = agent.services && agent.services.length > 0;
    
    if (hasServices && !selectedService) return setJobError('Select a service');
    if (!jobDesc.trim()) return setJobError('Description is required');
    
    let budgetWei: string;
    if (selectedService) {
      budgetWei = selectedService.price;
    } else {
      const budgetFloat = parseFloat(jobBudget);
      if (isNaN(budgetFloat) || budgetFloat <= 0) return setJobError('Budget must be > 0');
      budgetWei = BigInt(Math.round(budgetFloat * 1e18)).toString();
    }

    if (chainId !== celo.id) { switchChain({ chainId: celo.id }); return; }

    setCreatingJob(true);
    setJobError('');
    setJobSuccess('');

    try {
      const res = await apiFetch<{ success: boolean; job: Job }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          agentId: agent.agentId,
          clientAddress: address,
          description: selectedService
            ? `[${selectedService.name}] ${jobDesc.trim()}`
            : jobDesc.trim(),
          budget: budgetWei,
        }),
      });

      setJobSuccess(`Job #${res.job.jobId} created! Fund it to start.`);
      setJobDesc('');
      setJobBudget('1');
      setSelectedService(null);
      setShowCreateJob(false);
      loadData();
    } catch (err: any) {
      setJobError(err.error || 'Failed to create job');
    } finally {
      setCreatingJob(false);
    }
  }

  async function handleFundJob(job: Job) {
    if (!address || !agent) return;
    if (chainId !== celo.id) { switchChain({ chainId: celo.id }); return; }

    setActionLoading(job.jobId);
    setJobError('');
    setJobSuccess('');

    setPendingFundJob({ jobId: job.jobId, budget: job.budget, agentWallet: agent.agentWallet });
    writeContract({
      address: CUSD_ADDRESS, abi: ERC20_ABI, functionName: 'transfer',
      args: [agent.agentWallet as `0x${string}`, BigInt(job.budget)], chain: celo,
    });
  }

  async function handleJobAction(jobId: number, action: 'complete' | 'reject') {
    if (!address) return;
    setActionLoading(jobId);
    setJobError('');
    setJobSuccess('');

    try {
      await apiFetch(`/jobs/${jobId}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ callerAddress: address }),
      });
      setJobSuccess(`Job #${jobId} ${action === 'complete' ? 'completed' : 'rejected'}!`);
      loadData();
    } catch (err: any) {
      setJobError(err.error || `Failed to ${action} job`);
    } finally {
      setActionLoading(null);
    }
  }

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
    expired: 'text-zinc-500 bg-zinc-800',
  };

  const statusIcons: Record<string, string> = {
    open: '📋', funded: '💰', submitted: '📝', completed: '✅', rejected: '❌', expired: '⏰',
  };

  function canFund(job: Job) { return job.status === 'open' && address?.toLowerCase() === job.clientAddress.toLowerCase(); }
  function canComplete(job: Job) { return job.status === 'submitted' && address?.toLowerCase() === job.clientAddress.toLowerCase(); }
  function canReject(job: Job) { return ['open', 'funded', 'submitted'].includes(job.status) && address?.toLowerCase() === job.clientAddress.toLowerCase(); }

  return (
    <div className="noise-bg grid-bg min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Agent Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              {agent.logoUrl ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={agent.logoUrl} alt={agent.name} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              ) : (
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ backgroundColor: tpl.color + '15', border: `1px solid ${tpl.color}30` }}
                >
                  {tpl.icon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1">{agent.name}</h1>
                {agent.description && (
                  <p className="text-sm text-zinc-400 mb-2">{agent.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono">#{agent.agentId}</span>
                  <span className="px-2 py-0.5 rounded text-zinc-400" style={{ backgroundColor: tpl.color + '15', color: tpl.color }}>
                    {tpl.name}
                  </span>
                  {!agent.selfVerified && <TrustBadge totalCalls={stats?.totalCalls || 0} size="md" />}
                  {agent.selfVerified && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--celo-green)]/10 text-[var(--celo-green)] border border-[var(--celo-green)]/20">
                      ✅ Self Verified
                    </span>
                  )}
                  {agent.selfVerified && (stats?.totalCalls || 0) >= 5 && (
                    <TrustBadge totalCalls={stats?.totalCalls || 0} size="md" />
                  )}
                  {agent.subscriptionTier === 'premium' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--celo-gold)]/10 text-[var(--celo-gold)] border border-[var(--celo-gold)]/20">
                      ⚡ Premium
                    </span>
                  )}
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

          {/* Agent Services */}
          {agent.services && (agent.services as AgentService[]).length > 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-zinc-800/50">
                <h3 className="font-bold text-sm">Services & Pricing</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(agent.services as AgentService[]).map((svc, i) => (
                  <div key={i} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-zinc-200">{svc.name}</span>
                      <span className="text-sm font-mono font-bold text-[var(--celo-gold)] shrink-0 ml-2">
                        {formatCUSD(svc.price)} cUSD
                      </span>
                    </div>
                    {svc.description && (
                      <p className="text-xs text-zinc-500">{svc.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {jobSuccess && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {jobSuccess}
            </div>
          )}
          {jobError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {jobError}
            </div>
          )}

          {/* ERC-8183 Jobs Section */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/50 flex items-center justify-between">
              <h3 className="font-bold text-sm">ERC-8183 Jobs ({jobs.length})</h3>
              {address && !isOwner && (
                <button
                  onClick={() => { setShowCreateJob(!showCreateJob); setJobError(''); setJobSuccess(''); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--celo-violet)] text-white hover:brightness-110 transition-all"
                >
                  {showCreateJob ? 'Cancel' : '+ Create Job'}
                </button>
              )}
            </div>

            {/* Create Job Form */}
            {showCreateJob && (
              <div className="px-5 py-4 border-b border-zinc-800/50 bg-zinc-900/50">
                <div className="space-y-3">
                  {/* Service Selection */}
                  {agent.services && agent.services.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                        Select Service
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(agent.services as AgentService[]).map((svc, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedService(selectedService?.name === svc.name ? null : svc)}
                            className={`text-left p-3 rounded-lg border-2 transition-all ${
                              selectedService?.name === svc.name
                                ? 'border-[var(--celo-violet)] bg-[var(--celo-violet)]/10'
                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-semibold text-zinc-200">{svc.name}</span>
                              <span className="text-xs font-mono text-[var(--celo-gold)] shrink-0 ml-2">
                                {formatCUSD(svc.price)} cUSD
                              </span>
                            </div>
                            {svc.description && (
                              <p className="text-[10px] text-zinc-500">{svc.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                      {agent.services && agent.services.length > 0 ? 'Additional Details' : 'Job Description'}
                    </label>
                    <textarea
                      value={jobDesc}
                      onChange={e => setJobDesc(e.target.value)}
                      placeholder={agent.services && agent.services.length > 0
                        ? "Add any specific instructions or details..."
                        : "Describe what you want the agent to do..."}
                      rows={3}
                      maxLength={5000}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-violet)]/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 items-end">
                    {/* Custom budget only if no services defined */}
                    {(!agent.services || agent.services.length === 0) && (
                      <div className="flex-1">
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                          Budget (cUSD)
                        </label>
                        <input
                          type="number"
                          value={jobBudget}
                          onChange={e => setJobBudget(e.target.value)}
                          min="0.01"
                          step="0.1"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-[var(--celo-violet)]/50"
                        />
                      </div>
                    )}
                    {selectedService && (
                      <div className="flex-1 px-3 py-2 rounded-lg bg-[var(--celo-gold)]/10 border border-[var(--celo-gold)]/20">
                        <span className="text-[10px] text-zinc-500">Price:</span>{' '}
                        <span className="text-sm font-bold text-[var(--celo-gold)]">{formatCUSD(selectedService.price)} cUSD</span>
                      </div>
                    )}
                    <button
                      onClick={handleCreateJob}
                      disabled={creatingJob}
                      className="px-5 py-2 rounded-lg text-sm font-semibold bg-[var(--celo-violet)] text-white hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
                    >
                      {creatingJob ? 'Creating...' : 'Submit Job'}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    Create → Fund with cUSD → Agent works → Review deliverable → Accept or Reject
                  </p>
                </div>
              </div>
            )}

            {/* Jobs List */}
            {jobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                <p>No jobs yet</p>
                {!isOwner && address && (
                  <p className="text-[10px] mt-1">Create a job to delegate async tasks to this agent</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/30">
                {jobs.map(job => {
                  const isExpanded = expandedJobId === job.jobId;
                  const isClient = address?.toLowerCase() === job.clientAddress.toLowerCase();

                  return (
                    <div key={job.id}>
                      {/* Job Row */}
                      <button
                        onClick={() => setExpandedJobId(isExpanded ? null : job.jobId)}
                        className="w-full text-left px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-800/20 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-mono text-zinc-600">#{job.jobId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[job.status] || 'text-zinc-400 bg-zinc-800'}`}>
                              {statusIcons[job.status] || '•'} {job.status}
                            </span>
                            {isClient && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-zinc-800 text-zinc-500">YOUR JOB</span>
                            )}
                          </div>
                          <p className="text-sm truncate text-zinc-300">{job.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-[var(--celo-gold)] font-mono font-semibold">
                            {formatCUSD(job.budget)} cUSD
                          </span>
                          <span className="text-zinc-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="px-5 pb-4 bg-zinc-900/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                            <div>
                              <span className="text-zinc-600">Client:</span>{' '}
                              <span className="font-mono text-zinc-400">{shortenAddress(job.clientAddress)}</span>
                            </div>
                            <div>
                              <span className="text-zinc-600">Created:</span>{' '}
                              <span className="text-zinc-400">{new Date(job.createdAt).toLocaleString()}</span>
                            </div>
                            {job.fundedAt && (
                              <div>
                                <span className="text-zinc-600">Funded:</span>{' '}
                                <span className="text-zinc-400">{new Date(job.fundedAt).toLocaleString()}</span>
                              </div>
                            )}
                            {job.submittedAt && (
                              <div>
                                <span className="text-zinc-600">Submitted:</span>{' '}
                                <span className="text-zinc-400">{new Date(job.submittedAt).toLocaleString()}</span>
                              </div>
                            )}
                            {job.completedAt && (
                              <div>
                                <span className="text-zinc-600">Completed:</span>{' '}
                                <span className="text-zinc-400">{new Date(job.completedAt).toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Payment TX Link */}
                          {job.fundTxHash && (
                            <div className="mb-3">
                              <a href={`${CELOSCAN}${job.fundTxHash}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-[var(--celo-green)]/10 text-[var(--celo-green)] border border-[var(--celo-green)]/20 hover:bg-[var(--celo-green)]/20 transition-all">
                                🔗 Payment TX · {job.fundTxHash.slice(0, 10)}...{job.fundTxHash.slice(-6)} ↗
                              </a>
                            </div>
                          )}

                          {/* Full description */}
                          <div className="mb-3">
                            <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Description</div>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{job.description}</p>
                          </div>

                          {/* Deliverable */}
                          {job.deliverableIpfsCid && (
                            <div className="mb-3">
                              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Deliverable</div>
                              <div className="px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                <p className="text-[10px] font-mono text-zinc-500 mb-1">
                                  IPFS: {job.deliverableIpfsCid}
                                </p>
                                {job.resultText && (
                                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{job.resultText}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* State machine visual */}
                          <div className="mb-3">
                            <div className="flex items-center gap-1 text-[10px]">
                              {['open', 'funded', 'submitted', 'completed'].map((s, i) => (
                                <div key={s} className="flex items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded ${
                                    job.status === s
                                      ? statusColors[s]
                                      : (['open', 'funded', 'submitted', 'completed'].indexOf(job.status) > i || job.status === 'completed')
                                      ? 'text-green-600 bg-green-600/5'
                                      : 'text-zinc-700 bg-zinc-800/50'
                                  }`}>
                                    {s}
                                  </span>
                                  {i < 3 && <span className="text-zinc-700">→</span>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            {job.status === 'funded' && (
                              <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">
                                🤖 Agent is working on this...
                              </span>
                            )}
                            {canFund(job) && (
                              <button
                                onClick={() => handleFundJob(job)}
                                disabled={actionLoading === job.jobId}
                                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--celo-gold)] text-zinc-950 hover:brightness-110 transition-all disabled:opacity-50"
                              >
                                {actionLoading === job.jobId ? 'Confirming...' : `💰 Fund ${formatCUSD(job.budget)} cUSD`}
                              </button>
                            )}
                            {canComplete(job) && (
                              <button
                                onClick={() => handleJobAction(job.jobId, 'complete')}
                                disabled={actionLoading === job.jobId}
                                className="px-4 py-2 rounded-lg text-xs font-semibold bg-green-500 text-zinc-950 hover:brightness-110 transition-all disabled:opacity-50"
                              >
                                {actionLoading === job.jobId ? 'Processing...' : '✅ Accept & Pay'}
                              </button>
                            )}
                            {canReject(job) && (
                              <button
                                onClick={() => handleJobAction(job.jobId, 'reject')}
                                disabled={actionLoading === job.jobId}
                                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all disabled:opacity-50"
                              >
                                {actionLoading === job.jobId ? 'Processing...' : '❌ Reject'}
                              </button>
                            )}
                            {job.status === 'completed' && (
                              <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400">
                                ✅ Completed — {formatCUSD((BigInt(job.budget) * BigInt(95) / BigInt(100)).toString())} cUSD paid out
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
