import { getTrustTier } from '@/lib/constants';

export function TrustBadge({ totalCalls, size = 'sm' }: { totalCalls: number; size?: 'sm' | 'md' }) {
  const tier = getTrustTier(totalCalls);
  
  const sizeClass = size === 'md' 
    ? 'px-2.5 py-1 text-xs gap-1.5' 
    : 'px-1.5 py-0.5 text-[10px] gap-1';

  return (
    <span 
      className={`inline-flex items-center rounded-full font-semibold ${tier.bg} ${sizeClass}`}
      style={{ color: tier.color }}
    >
      <span>{tier.icon}</span>
      <span>{tier.name}</span>
    </span>
  );
}
