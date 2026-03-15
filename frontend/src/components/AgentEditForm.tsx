'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Props {
  agent: {
    agentId: number;
    name: string;
    description: string;
    logoUrl: string;
    customSystemPrompt: string;
    ownerAddress: string;
  };
  onSaved: (updated: { name: string; description: string; logoUrl: string; customSystemPrompt: string }) => void;
  onCancel: () => void;
}

export function AgentEditForm({ agent, onSaved, onCancel }: Props) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || '');
  const [logoUrl, setLogoUrl] = useState(agent.logoUrl || '');
  const [skillMd, setSkillMd] = useState(agent.customSystemPrompt || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!name.trim()) return setError('Name is required');
    setSaving(true);
    setError('');

    try {
      await apiFetch(`/agents/${agent.agentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          logoUrl: logoUrl.trim(),
          customSystemPrompt: skillMd.trim(),
          ownerAddress: agent.ownerAddress,
        }),
      });
      onSaved({ name: name.trim(), description: description.trim(), logoUrl: logoUrl.trim(), customSystemPrompt: skillMd.trim() });
    } catch (err: any) {
      setError(err.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 rounded-xl border border-[var(--celo-green)]/20 bg-zinc-900/50 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[var(--celo-green)]">Edit Agent</span>
        <button onClick={onCancel} className="text-zinc-600 hover:text-zinc-400 text-xs">Cancel</button>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={100}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-[var(--celo-green)]/50"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="What does your agent do?"
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-[var(--celo-green)]/50 resize-none"
        />
        <p className="text-[10px] text-zinc-600 mt-0.5">{description.length}/500</p>
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Logo URL</label>
        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-[var(--celo-green)]/50"
          />
          {logoUrl && (
            <div className="w-8 h-8 rounded-lg bg-zinc-700 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>
      </div>

      {/* Skill.md */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Agent Skills (skill.md)</label>
        <textarea
          value={skillMd}
          onChange={e => setSkillMd(e.target.value)}
          maxLength={10000}
          rows={6}
          placeholder="# Capabilities&#10;- Analyze DeFi protocols&#10;&#10;# Rules&#10;- Always mention risks"
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-[var(--celo-green)]/50 resize-y leading-relaxed"
        />
        <p className="text-[10px] text-zinc-600 mt-0.5">{skillMd.length}/10,000 · Appended to template prompt</p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-xs hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
