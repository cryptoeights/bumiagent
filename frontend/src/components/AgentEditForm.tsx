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

      {/* Logo */}
      <div>
        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Logo</label>
        <div className="flex gap-2 items-start">
          <div className="flex-1 space-y-1.5">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs cursor-pointer hover:border-[var(--celo-green)]/50 transition-all">
              <span>📁</span>
              <span>{logoUrl && logoUrl.startsWith('data:') ? 'Uploaded ✓' : 'Upload image'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file || file.size > 150_000) return;
                  const reader = new FileReader();
                  reader.onload = () => setLogoUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <input
              type="url"
              value={logoUrl.startsWith('data:') ? '' : logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="Or paste URL"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] focus:outline-none focus:border-[var(--celo-green)]/50"
            />
          </div>
          {logoUrl && (
            <div className="w-10 h-10 rounded-lg bg-zinc-700 overflow-hidden shrink-0 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <button type="button" onClick={() => setLogoUrl('')}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center">×</button>
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
