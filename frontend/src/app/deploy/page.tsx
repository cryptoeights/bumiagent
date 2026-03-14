'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Template {
  id: number;
  name: string;
  description: string;
  suggestedPrice: string;
  icon: string;
}

export default function DeployPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(0);
  const [pricePerCall, setPricePerCall] = useState('50000000000000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    apiFetch<{ templates: Template[] }>('/templates').then(d => setTemplates(d.templates));
  }, []);

  const selectedTemplate = templates.find(t => t.id === templateId);

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return setError('Connect your wallet first');
    if (!name.trim()) return setError('Agent name is required');

    setLoading(true);
    setError('');

    try {
      const result = await apiFetch<{ success: boolean; agent: any }>('/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          templateId,
          pricePerCall,
          ownerAddress: address,
        }),
      });

      setSuccess(result.agent);
    } catch (err: any) {
      setError(err.error || 'Failed to deploy agent');
    } finally {
      setLoading(false);
    }
  }

  // Price in cUSD (human readable)
  const priceInCUSD = (Number(pricePerCall) / 1e18).toFixed(2);

  return (
    <div className="noise-bg grid-bg min-h-screen">
      <Navbar />

      <div className="pt-24 pb-20 px-6">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Launch Your Agent</h1>
            <p className="text-zinc-500 text-sm">3 fields. 10 seconds. That&apos;s it.</p>
          </div>

          {success ? (
            /* Success state */
            <div className="p-8 rounded-2xl border border-[var(--celo-green)]/30 bg-[var(--celo-green)]/5 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold mb-2 text-[var(--celo-green)]">Agent Deployed!</h2>
              <div className="space-y-2 text-sm text-zinc-400 mb-6">
                <p><span className="text-zinc-300">{success.name}</span> is live</p>
                <p className="font-mono text-xs break-all">Wallet: {success.agentWallet}</p>
                <p className="font-mono text-xs">ID: #{success.agentId}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push(`/chat/${success.agentId}`)}
                  className="px-6 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all"
                >
                  Chat with Agent →
                </button>
                <button
                  onClick={() => { setSuccess(null); setName(''); }}
                  className="px-6 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800/50 transition-all"
                >
                  Deploy Another
                </button>
              </div>
            </div>
          ) : (
            /* Deploy form */
            <form onSubmit={handleDeploy} className="space-y-5">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Agent Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. CeloHelper, MyDeFiBot"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm"
                />
              </div>

              {/* Template */}
              <div>
                <label className="block text-sm font-semibold mb-2">Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTemplateId(t.id);
                        setPricePerCall(t.suggestedPrice);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all text-xs ${
                        templateId === t.id
                          ? 'border-[var(--celo-green)]/50 bg-[var(--celo-green)]/5'
                          : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <div className="font-semibold mt-1">{t.name}</div>
                      <div className="text-zinc-500 text-[10px] mt-0.5">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Price per Call
                  <span className="text-zinc-500 font-normal ml-2">({priceInCUSD} cUSD)</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="10000000000000000"
                    max="1000000000000000000"
                    step="10000000000000000"
                    value={pricePerCall}
                    onChange={e => setPricePerCall(e.target.value)}
                    className="w-full accent-[var(--celo-green)]"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                    <span>0.01 cUSD</span>
                    <span>1.00 cUSD</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isConnected}
                className="w-full py-3.5 rounded-xl bg-[var(--celo-green)] text-zinc-950 font-bold text-sm hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed glow-green"
              >
                {loading ? 'Deploying...' : !isConnected ? 'Connect Wallet to Deploy' : 'Deploy Agent 🚀'}
              </button>

              {!isConnected && (
                <p className="text-center text-xs text-zinc-600">
                  Connect your wallet to deploy an agent on Celo
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
