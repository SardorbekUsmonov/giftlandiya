'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Props {
  data: Array<{ date: string; revenue: number }>;
}

function fmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function StatsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A3040" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 10, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toLocaleString('uz-UZ')} so'm`, 'Daromad']}
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            backgroundColor: '#181C25',
            border: '1px solid #2A3040',
            color: '#F8FAFC',
          }}
          cursor={{ fill: '#2E1065' }}
        />
        <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
