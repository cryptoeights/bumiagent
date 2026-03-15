'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '@/lib/api';

interface Props {
  agentId: number;
  agentWallet: string;
  ownerAddress: string;
  initialVerified?: boolean;
}

type Stage = 'idle' | 'loading' | 'scan' | 'completed' | 'error';

export function SelfVerification({ agentId, agentWallet, ownerAddress, initialVerified }: Props) {
  const [verified, setVerified] = useState<boolean | null>(initialVerified ?? null);
  const [stage, setStage] = useState<Stage>('idle');
  const [deepLink, setDeepLink] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [error, setError] = useState('');
  const [selfAgentId, setSelfAgentId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check current verification status on mount (if not provided)
  useEffect(() => {
    if (initialVerified !== undefined) {
      setVerified(initialVerified);
      return;
    }
    apiFetch<{ verified: boolean; selfAgentId?: number }>(`/self/verify/${agentId}`)
      .then(d => {
        setVerified(d.verified);
        if (d.selfAgentId) setSelfAgentId(d.selfAgentId);
      })
      .catch(() => setVerified(false));
  }, [agentId, initialVerified]);

  // Cleanup polling
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function startVerification() {
    setStage('loading');
    setError('');

    try {
      const data = await apiFetch<{
        sessionToken: string;
        deepLink: string;
        agentAddress: string;
      }>('/self/register', {
        method: 'POST',
        body: JSON.stringify({ humanAddress: ownerAddress, agentWallet, celospawnAgentId: agentId }),
      });

      setSessionToken(data.sessionToken);
      setDeepLink(data.deepLink);
      setStage('scan');

      // Poll status every 3s — pass agentId so backend saves on completion
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiFetch<{ stage: string; agentId?: number }>(
            `/self/status?token=${encodeURIComponent(data.sessionToken)}&agentId=${agentId}`
          );
          if (status.stage === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            if (status.agentId) setSelfAgentId(status.agentId);
            setStage('completed');
            setVerified(true);
          }
        } catch {}
      }, 3000);

      // Timeout after 10 min
      setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
      }, 600_000);

    } catch (err: any) {
      setError(err.error || 'Failed to start verification');
      setStage('error');
    }
  }

  // Loading
  if (verified === null) {
    return (
      <div className="p-3 rounded-lg border border-zinc-800/30 bg-zinc-900/20">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="w-3 h-3 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
          Checking Self verification...
        </div>
      </div>
    );
  }

  // Verified
  if (verified && stage !== 'scan') {
    return (
      <div className="p-4 rounded-xl border border-[var(--celo-green)]/30 bg-[var(--celo-green)]/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--celo-green)]/20 flex items-center justify-center text-sm">✅</div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-[var(--celo-green)]">Self Verified</div>
            <p className="text-[10px] text-zinc-500">Proof-of-human verified via Self Protocol on Celo</p>
          </div>
          {selfAgentId && (
            <a
              href={`https://app.ai.self.xyz/agents`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[var(--celo-green)] hover:underline"
            >
              View on Self →
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">🛡️</div>
        <div>
          <div className="font-semibold text-sm">Self Agent ID</div>
          <p className="text-[10px] text-zinc-500">Verify your identity behind this agent</p>
        </div>
      </div>

      {/* Idle */}
      {stage === 'idle' && (
        <div>
          <p className="text-xs text-zinc-500 mb-3">
            Scan your passport with the Self app to prove a real human operates this agent. Verified agents earn higher trust.
          </p>
          <button
            onClick={startVerification}
            className="px-4 py-2 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-xs hover:brightness-110 transition-all active:scale-95"
          >
            Verify with Self →
          </button>
        </div>
      )}

      {/* Loading */}
      {stage === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
          <div className="w-3 h-3 border-2 border-[var(--celo-green)] border-t-transparent rounded-full animate-spin" />
          Creating verification session...
        </div>
      )}

      {/* QR scan */}
      {stage === 'scan' && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 space-y-1.5">
            <p className="text-xs text-zinc-300"><span className="text-[var(--celo-green)] font-semibold">1.</span> Open the <strong>Self app</strong> on your phone</p>
            <p className="text-xs text-zinc-300"><span className="text-[var(--celo-green)] font-semibold">2.</span> Scan the QR code below</p>
            <p className="text-xs text-zinc-300"><span className="text-[var(--celo-green)] font-semibold">3.</span> Follow the passport verification flow</p>
          </div>

          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG
                value={deepLink}
                size={220}
                level="L"
                includeMargin
              />
            </div>
          </div>

          <div className="text-center">
            <a href={deepLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--celo-green)] hover:underline">
              📱 Or tap here if on mobile
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-[var(--celo-gold)]">
            <div className="w-3 h-3 border-2 border-[var(--celo-gold)] border-t-transparent rounded-full animate-spin" />
            Waiting for verification...
          </div>

          <div className="text-center pt-1 border-t border-zinc-800/30">
            <p className="text-[10px] text-zinc-600 mb-1">Don&apos;t have the Self app?</p>
            <a href="https://self.xyz" target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-zinc-500 hover:text-zinc-300">
              Download Self → self.xyz
            </a>
          </div>

          <button
            onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setStage('idle'); }}
            className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Completed */}
      {stage === 'completed' && (
        <div className="flex items-center gap-2 text-sm text-[var(--celo-green)] py-2">
          ✅ Verification complete! Your agent is now Self verified.
        </div>
      )}

      {/* Error */}
      {stage === 'error' && (
        <div className="space-y-2 py-2">
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => { setStage('idle'); setError(''); }}
            className="text-xs text-zinc-500 hover:text-zinc-300">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
