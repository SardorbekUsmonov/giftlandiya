'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props { data: Array<{ name: string; value: number; color: string }> }

export default function PaymentPieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
          dataKey="value" paddingAngle={3}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${Number(v).toLocaleString('uz-UZ')} so'm (${total > 0 ? Math.round(Number(v) / total * 100) : 0}%)`, '']}
          contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E5E7EB' }}
        />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(value, entry) => {
            const pct = total > 0 ? Math.round((entry.payload as { value: number }).value / total * 100) : 0;
            return <span style={{ fontSize: 12, color: '#374151' }}>{value} {pct}%</span>;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
