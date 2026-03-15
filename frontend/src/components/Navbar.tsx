'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from './ConnectButton';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Bumi Agent" width={32} height={32} className="w-8 h-8" />
          <span className="font-[var(--font-display)] font-bold text-lg tracking-tight">
            Bumi Agent
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/deploy" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Deploy
          </Link>
          <Link href="/registry" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Registry
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Dashboard
          </Link>
          <a href="/deck.html" target="_blank" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Deck
          </a>
          <ConnectButton />
        </div>

        {/* Mobile: connect + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <ConnectButton />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            <Link href="/deploy" onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all">
              Deploy
            </Link>
            <Link href="/registry" onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all">
              Registry
            </Link>
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all">
              Dashboard
            </Link>
            <a href="/deck.html" target="_blank" onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all">
              Deck
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
