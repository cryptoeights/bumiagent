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
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [skillMd, setSkillMd] = useState('');
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
          description: description.trim(),
          logoUrl: logoUrl.trim(),
          customSystemPrompt: skillMd.trim() || undefined,
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
            <div className="p-8 rounded-2xl border border-[var(--celo-green)]/30 bg-[var(--celo-green)]/5">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold mb-2 text-[var(--celo-green)]">Agent Deployed!</h2>
                <p className="text-sm text-zinc-400"><span className="text-zinc-300">{success.name}</span> is live</p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Agent ID */}
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Agent ID</div>
                  <div className="font-mono text-sm text-zinc-200">#{success.agentId}</div>
                </div>

                {/* Wallet Address */}
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Agent Wallet</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(success.agentWallet)}
                      className="text-[10px] text-[var(--celo-green)] hover:underline"
                    >Copy</button>
                  </div>
                  <div className="font-mono text-xs text-zinc-300 break-all">{success.agentWallet}</div>
                </div>

                {/* Private Key — WARNING */}
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">⚠️ Private Key — Save Now!</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(success.privateKey)}
                      className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
                    >Copy</button>
                  </div>
                  <div className="font-mono text-xs text-red-300/80 break-all select-all">{success.privateKey}</div>
                  <p className="text-[10px] text-red-400/60 mt-2">
                    This is the ONLY time you&apos;ll see this. Save it somewhere safe. You need it to withdraw funds from your agent&apos;s wallet.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push(`/chat/${success.agentId}`)}
                  className="px-6 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all"
                >
                  Chat with Agent →
                </button>
                <button
                  onClick={() => { setSuccess(null); setName(''); setDescription(''); setLogoUrl(''); setSkillMd(''); }}
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

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does your agent do? e.g. A DeFi assistant that helps with Celo yield farming strategies"
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm resize-none"
                />
                <p className="text-[10px] text-zinc-600 mt-1">{description.length}/500</p>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Logo <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    {/* File upload */}
                    <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm cursor-pointer hover:border-[var(--celo-green)]/50 transition-all">
                      <span>📁</span>
                      <span>{logoUrl && logoUrl.startsWith('data:') ? 'Image uploaded ✓' : 'Upload image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 150_000) { setError('Logo must be under 150KB'); return; }
                          const reader = new FileReader();
                          reader.onload = () => setLogoUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {/* Or URL */}
                    <input
                      type="url"
                      value={logoUrl.startsWith('data:') ? '' : logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="Or paste URL: https://example.com/logo.png"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 transition-all text-xs"
                    />
                  </div>
                  {logoUrl && (
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center hover:bg-red-400"
                      >×</button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">PNG, JPG, SVG, WebP · Max 150KB</p>
              </div>

              {/* Skill.md */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Agent Skills <span className="text-zinc-600 font-normal">(optional — skill.md)</span>
                </label>
                <p className="text-xs text-zinc-500 mb-2">
                  Add specialized knowledge, rules, and capabilities. This is appended to the template prompt to make your agent unique.
                </p>
                <textarea
                  value={skillMd}
                  onChange={e => setSkillMd(e.target.value)}
                  placeholder={`# My Agent Skills\n\n## Capabilities\n- Analyze Celo DeFi protocols\n- Calculate APY comparisons\n\n## Rules\n- Always mention risks\n- Use tables for comparisons\n\n## Knowledge\n- Ubeswap: AMM DEX, dual farming\n- Moola: Lending/borrowing platform`}
                  maxLength={10000}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm resize-y font-mono text-xs leading-relaxed"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-[10px] text-zinc-600">Markdown supported. Appended to template system prompt.</p>
                  <p className="text-[10px] text-zinc-600">{skillMd.length}/10,000</p>
                </div>
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

              {/* Tier Info */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Subscription Tier</label>

                {/* Free Tier */}
                <div className="p-4 rounded-xl border-2 border-[var(--celo-green)] bg-[var(--celo-green)]/5 relative">
                  <div className="absolute -top-2.5 left-3 px-2 bg-zinc-950 text-[10px] text-[var(--celo-green)] font-semibold">DEFAULT</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[var(--celo-green)]">🌱 Free Tier</span>
                    <span className="text-xs text-zinc-400">0 cUSD/mo</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1.5">
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-green)]">✓</span> Unlimited free model calls (Step Flash, Gemma)</li>
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-green)]">✓</span> Earn 85% of user payments</li>
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-gold)]">→</span> 15% of revenue goes to EarthPool 🌍</li>
                    <li className="flex items-start gap-2"><span className="text-red-400">✗</span> Premium models (Sonnet): 100% cost to EarthPool</li>
                  </ul>
                </div>

                {/* Premium Tier */}
                <div className="p-4 rounded-xl border border-[var(--celo-gold)]/30 bg-[var(--celo-gold)]/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[var(--celo-gold)]">⚡ Premium Tier</span>
                    <span className="text-xs text-[var(--celo-gold)] font-semibold">5 cUSD one-time</span>
                  </div>
                  <ul className="text-xs text-zinc-400 space-y-1.5">
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-green)]">✓</span> Everything in Free</li>
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-green)]">✓</span> Keep 100% of all revenue</li>
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-green)]">✓</span> Premium models: revenue stays with you</li>
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-green)]">✓</span> 0% EarthPool contribution</li>
                    <li className="flex items-start gap-2"><span className="text-[var(--celo-green)]">✓</span> Priority in registry listings</li>
                  </ul>
                  <p className="text-[10px] text-[var(--celo-gold)]/60 mt-2">Upgrade anytime from your Dashboard after deploying</p>
                </div>

                <p className="text-[10px] text-zinc-600 text-center">
                  All agents start on Free tier. EarthPool funds climate initiatives on Celo 🌍
                </p>
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
