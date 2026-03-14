// Agent template metadata (mirrors backend/src/data/templates.ts)
export const TEMPLATES = [
  { id: 0, name: 'DeFi Assistant', icon: '💰', category: 'Finance', color: '#35D07F' },
  { id: 1, name: 'Payment Agent', icon: '💸', category: 'Finance', color: '#FBCC5C' },
  { id: 2, name: 'Content Creator', icon: '✍️', category: 'Creative', color: '#F97316' },
  { id: 3, name: 'Research Agent', icon: '🔍', category: 'Research', color: '#3B82F6' },
  { id: 4, name: 'Customer Support', icon: '🎧', category: 'Support', color: '#8B5CF6' },
  { id: 5, name: 'Data Analyzer', icon: '📊', category: 'Research', color: '#06B6D4' },
  { id: 6, name: 'ReFi / Climate', icon: '🌱', category: 'ReFi', color: '#22C55E' },
  { id: 7, name: 'DAO Assistant', icon: '🏛️', category: 'Governance', color: '#A855F7' },
  { id: 8, name: 'Tutor / Education', icon: '📚', category: 'Education', color: '#EC4899' },
  { id: 9, name: 'Custom Agent', icon: '🤖', category: 'Custom', color: '#6B7280' },
];

// Trust tiers based on call count (Self Protocol / on-chain verification)
export const TRUST_TIERS = [
  { name: 'Unverified', min: 0, icon: '⬜', color: '#6B7280', bg: 'bg-zinc-700/20' },
  { name: 'Bronze', min: 5, icon: '🥉', color: '#CD7F32', bg: 'bg-amber-900/20' },
  { name: 'Silver', min: 25, icon: '🥈', color: '#C0C0C0', bg: 'bg-zinc-400/20' },
  { name: 'Gold', min: 100, icon: '🥇', color: '#FFD700', bg: 'bg-yellow-500/20' },
  { name: 'Verified ✓', min: 500, icon: '✅', color: '#35D07F', bg: 'bg-emerald-500/20' },
];

export function getTrustTier(totalCalls: number) {
  for (let i = TRUST_TIERS.length - 1; i >= 0; i--) {
    if (totalCalls >= TRUST_TIERS[i].min) return TRUST_TIERS[i];
  }
  return TRUST_TIERS[0];
}

export function getTemplate(id: number) {
  return TEMPLATES[id] || TEMPLATES[9];
}

export function formatCUSD(wei: string | number): string {
  return (Number(wei) / 1e18).toFixed(2);
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
