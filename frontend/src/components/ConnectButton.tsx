'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Prevent hydration mismatch — render nothing until client-side
  if (!mounted) {
    return (
      <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--celo-green)] text-zinc-950">
        Connect Wallet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--celo-green)] text-zinc-950 hover:brightness-110 transition-all active:scale-95"
    >
      Connect Wallet
    </button>
  );
}
