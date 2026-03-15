'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { apiFetch } from '@/lib/api';

interface DailyData {
  date: string;
  count: number;
  revenue: string;
  freeCount: number;
  premiumCount: number;
}

interface ModelData {
  model: string;
  tier: string;
  count: number;
}

interface AnalyticsData {
  dailyCalls: DailyData[];
  modelUsage: ModelData[];
}

const COLORS = [
  '#35D07F', // celo green
  '#FBCC5C', // celo gold
  '#6366F1', // celo violet
  '#3B82F6', // blue
  '#EC4899', // pink
  '#F97316', // orange
  '#14B8A6', // teal
  '#8B5CF6', // purple
];

function formatRevenue(wei: string): number {
  return Number(BigInt(wei)) / 1e18;
}

function shortDate(d: string): string {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Shorten long model slug for display
function shortModel(slug: string): string {
  const parts = slug.split('/');
  const name = parts[parts.length - 1];
  // Remove :free suffix, truncate
  return name.replace(':free', '').replace(':online', ' +Web').slice(0, 20);
}

interface Props {
  agentId: number;
}

export function AgentAnalytics({ agentId }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AnalyticsData & { agentId: number }>(`/agents/${agentId}/analytics`)
      .then(d => setData({ dailyCalls: d.dailyCalls, modelUsage: d.modelUsage }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6">
        <div className="text-xs text-zinc-600 animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (!data) return null;

  const totalCalls = data.dailyCalls.reduce((s, d) => s + d.count, 0);
  if (totalCalls === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Analytics</h3>
        <p className="text-sm text-zinc-600">No call data yet — analytics will appear after the first chat.</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.dailyCalls.map(d => ({
    date: shortDate(d.date),
    fullDate: d.date,
    calls: d.count,
    revenue: formatRevenue(d.revenue),
    free: d.freeCount,
    premium: d.premiumCount,
  }));

  // Only show last 14 days if > 14 to keep readable
  const displayData = chartData.length > 14 ? chartData.slice(-14) : chartData;

  // Pie data for model usage
  const pieData = data.modelUsage.map(m => ({
    name: shortModel(m.model),
    value: m.count,
    tier: m.tier,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.name === 'revenue' ? `${p.value.toFixed(4)} cUSD` : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wider">Analytics (Last 30 Days)</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Call Trends */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs text-zinc-400 font-semibold">Call Trends</h4>
            <span className="text-[10px] text-zinc-600">{totalCalls} total</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="calls" stroke="#35D07F" strokeWidth={2} dot={false} name="calls" />
                <Line type="monotone" dataKey="free" stroke="#3B82F6" strokeWidth={1} dot={false} name="free" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="premium" stroke="#FBCC5C" strokeWidth={1} dot={false} name="premium" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Over Time */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs text-zinc-400 font-semibold">Revenue</h4>
            <span className="text-[10px] text-zinc-600">
              {displayData.reduce((s, d) => s + d.revenue, 0).toFixed(4)} cUSD
            </span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBCC5C" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FBCC5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="revenue" stroke="#FBCC5C" fill="url(#revenueGrad)" strokeWidth={2} name="revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Usage Breakdown */}
      {pieData.length > 0 && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
          <h4 className="text-xs text-zinc-400 font-semibold mb-3">Model Usage</h4>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={30} outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-lg">
                          <p className="text-zinc-200">{d.name}</p>
                          <p className="text-zinc-400">{d.value} calls · {d.tier}</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-zinc-300 flex-1 truncate">{d.name}</span>
                  <span className="text-zinc-500 tabular-nums">{d.value}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    d.tier === 'premium' ? 'bg-[var(--celo-gold)]/10 text-[var(--celo-gold)]' : 'bg-zinc-800 text-zinc-500'
                  }`}>{d.tier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
