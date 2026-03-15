'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '@/lib/api';

interface Props {
  agentId: number;
  agentWallet: string;
  ownerAddress: string;
}

type Stage = 'idle' | 'loading' | 'scan' | 'completed' | 'error';

export function SelfVerification({ agentId, agentWallet, ownerAddress }: Props) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [qrData, setQrData] = useState<object | null>(null);
  const [deepLink, setDeepLink] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check current verification status
  useEffect(() => {
    apiFetch<{ verified: boolean }>(`/self/verify/${agentId}`)
      .then(d => setVerified(d.verified))
      .catch(() => setVerified(false));
  }, [agentId]);

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
        qrData: object;
      }>('/self/register', {
        method: 'POST',
        body: JSON.stringify({ humanAddress: ownerAddress, agentWallet }),
      });

      setSessionToken(data.sessionToken);
      setDeepLink(data.deepLink);
      setQrData(data.qrData);
      setStage('scan');

      // Poll status every 3s
      pollRef.current = setInterval(async () => {
        try {
          const status = await apiFetch<{ stage: string }>(`/self/status?token=${encodeURIComponent(data.sessionToken)}`);
          if (status.stage === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
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

  // Loading state
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

  // Already verified
  if (verified) {
    return (
      <div className="p-4 rounded-xl border border-[var(--celo-green)]/30 bg-[var(--celo-green)]/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--celo-green)]/20 flex items-center justify-center text-sm">✅</div>
          <div>
            <div className="font-semibold text-sm text-[var(--celo-green)]">Self Verified</div>
            <p className="text-[10px] text-zinc-500">Proof-of-human verified via Self Protocol on Celo</p>
          </div>
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

      {/* Idle — show start button */}
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

      {/* QR Code scan stage */}
      {stage === 'scan' && qrData && (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 space-y-1.5">
            <p className="text-xs text-zinc-300"><span className="text-[var(--celo-green)] font-semibold">1.</span> Open the <strong>Self app</strong> on your phone</p>
            <p className="text-xs text-zinc-300"><span className="text-[var(--celo-green)] font-semibold">2.</span> Scan the QR code below</p>
            <p className="text-xs text-zinc-300"><span className="text-[var(--celo-green)] font-semibold">3.</span> Follow the passport verification flow</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG
                value={JSON.stringify(qrData)}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Mobile fallback link */}
          <div className="text-center">
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--celo-green)] hover:underline"
            >
              📱 Or tap here if on mobile
            </a>
          </div>

          {/* Polling indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--celo-gold)]">
            <div className="w-3 h-3 border-2 border-[var(--celo-gold)] border-t-transparent rounded-full animate-spin" />
            Waiting for verification...
          </div>

          {/* Don't have Self app? */}
          <div className="text-center pt-1 border-t border-zinc-800/30">
            <p className="text-[10px] text-zinc-600 mb-1">Don&apos;t have the Self app?</p>
            <a
              href="https://self.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              Download Self → self.xyz
            </a>
          </div>

          {/* Cancel */}
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setStage('idle');
              setQrData(null);
            }}
            className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
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
