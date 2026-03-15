'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';

interface Props {
  agentId: number;
  agentWallet: string;
  ownerAddress: string;
}

type Stage = 'idle' | 'loading' | 'scan' | 'polling' | 'completed' | 'error';

export function SelfVerification({ agentId, agentWallet, ownerAddress }: Props) {
  const [verificationStatus, setVerificationStatus] = useState<{ verified: boolean; loading: boolean }>({ verified: false, loading: true });
  const [stage, setStage] = useState<Stage>('idle');
  const [deepLink, setDeepLink] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Check current verification status
  useEffect(() => {
    apiFetch<{ verified: boolean }>(`/self/verify/${agentId}`)
      .then(data => setVerificationStatus({ verified: data.verified, loading: false }))
      .catch(() => setVerificationStatus({ verified: false, loading: false }));
  }, [agentId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function startVerification() {
    setStage('loading'); setError('');

    try {
      const data = await apiFetch<{ sessionToken: string; deepLink: string }>('/self/register', {
        method: 'POST',
        body: JSON.stringify({ humanAddress: ownerAddress, agentWallet }),
      });

      setSessionToken(data.sessionToken);
      setDeepLink(data.deepLink);
      setStage('scan');

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiFetch<{ stage: string; agentId?: number }>(`/self/status?token=${data.sessionToken}`);
          if (status.stage === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setStage('completed');
            setVerificationStatus({ verified: true, loading: false });
          }
        } catch {}
      }, 3000);

      // Stop polling after 10 minutes
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          if (stage === 'scan') {
            setStage('error');
            setError('Verification timed out. Please try again.');
          }
        }
      }, 600000);
    } catch (err: any) {
      setError(err.error || 'Failed to start verification');
      setStage('error');
    }
  }

  if (verificationStatus.loading) {
    return <div className="text-xs text-zinc-500">Checking verification...</div>;
  }

  if (verificationStatus.verified) {
    return (
      <div className="p-4 rounded-xl border border-[var(--celo-green)]/30 bg-[var(--celo-green)]/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">✅</span>
          <span className="font-semibold text-sm text-[var(--celo-green)]">Self Verified Agent</span>
        </div>
        <p className="text-xs text-zinc-400">
          This agent has been verified via Self Protocol — proof-of-human backed identity on Celo.
        </p>
        <a
          href={`https://app.ai.self.xyz/agents/register`}
          target="_blank"
          rel="noopener"
          className="text-[10px] text-[var(--celo-green)] hover:underline mt-2 inline-block"
        >
          View on Self Protocol →
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🛡️</span>
        <span className="font-semibold text-sm">Verify with Self Agent ID</span>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        Verify your agent with a proof-of-human passport scan. Verified agents get a trust badge and higher visibility.
      </p>

      {stage === 'idle' && (
        <button
          onClick={startVerification}
          className="px-4 py-2 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-xs hover:brightness-110 transition-all active:scale-95"
        >
          Start Verification →
        </button>
      )}

      {stage === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="w-3 h-3 border-2 border-[var(--celo-green)] border-t-transparent rounded-full animate-spin" />
          Starting verification session...
        </div>
      )}

      {stage === 'scan' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <p className="text-xs text-zinc-300 mb-2">
              <span className="font-semibold">Step 1:</span> Open the Self app on your phone
            </p>
            <p className="text-xs text-zinc-300 mb-2">
              <span className="font-semibold">Step 2:</span> Scan the QR code or tap the link below
            </p>
            <p className="text-xs text-zinc-300">
              <span className="font-semibold">Step 3:</span> Complete the passport verification
            </p>
          </div>

          <a
            href={deepLink}
            target="_blank"
            rel="noopener"
            className="block w-full px-4 py-2.5 rounded-lg bg-[var(--celo-green)] text-zinc-950 font-semibold text-xs text-center hover:brightness-110 transition-all"
          >
            Open Self App →
          </a>

          <div className="text-[10px] text-zinc-600 font-mono break-all p-2 rounded bg-zinc-900/50">
            {deepLink}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--celo-gold)]">
            <div className="w-3 h-3 border-2 border-[var(--celo-gold)] border-t-transparent rounded-full animate-spin" />
            Waiting for verification...
          </div>
        </div>
      )}

      {stage === 'completed' && (
        <div className="flex items-center gap-2 text-sm text-[var(--celo-green)]">
          ✅ Verification complete! Your agent is now Self verified.
        </div>
      )}

      {stage === 'error' && (
        <div className="space-y-2">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => { setStage('idle'); setError(''); }}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
