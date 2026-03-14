'use client';

import Link from 'next/link';
import { ConnectButton } from './ConnectButton';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--celo-green)] flex items-center justify-center">
            <span className="text-zinc-950 font-bold text-sm font-[var(--font-display)]">CS</span>
          </div>
          <span className="font-[var(--font-display)] font-bold text-lg tracking-tight">
            CeloSpawn
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/deploy" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Deploy
          </Link>
          <Link href="/registry" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Registry
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Dashboard
          </Link>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
