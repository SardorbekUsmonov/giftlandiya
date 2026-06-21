'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

const RevenueChart = dynamic(() => import('@/components/analytics/RevenueChart'), { ssr: false });
const PaymentPieChart = dynamic(() => import('@/components/analytics/PaymentPieChart'), { ssr: false });

type DateRange = 'today' | 'week' | 'month' | 'custom';

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Bugun', week: 'Shu hafta', month: 'Shu oy', custom: 'Maxsus',
};

const PAYMENT_COLORS: Record<string, string> = {
  PAYME: '#00B9F1', CLICK: '#01CDEF', UZUM: '#6366F1', CASH: '#10B981',
};

interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  newCustomers: number;
  avgOrderValue: number;
  weeklyRevenue: Array<{ date: string; revenue: number }>;
  recentOrders: Array<{ id: string; orderNumber: string; status: string; total: number; createdAt: string }>;
  topProducts: Array<{ productId: string; nameUz: string; revenue: number }>;
  funnelData?: { visitors: number; cart: number; checkout: number; delivered: number };
  topCategories?: Array<{ name: string; revenue: number }>;
  paymentBreakdown?: Array<{ method: string; revenue: number }>;
  utmSources?: Array<{ source: string; orders: number; revenue: number; conversion: number }>;
}

function getRangeDates(range: DateRange, custom: { from: string; to: string }) {
  const now = new Date();
  if (range === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    return { from: s.toISOString(), to: now.toISOString() };
  }
  if (range === 'week') {
    const s = new Date(now); s.setDate(now.getDate() - 7); s.setHours(0, 0, 0, 0);
    return { from: s.toISOString(), to: now.toISOString() };
  }
  if (range === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: s.toISOString(), to: now.toISOString() };
  }
  return { from: new Date(custom.from).toISOString(), to: new Date(custom.to + 'T23:59:59').toISOString() };
}

function FunnelBar({ label, count, pct, max }: { label: string; count: number; pct: number; max: number }) {
  const widthPct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex-1">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <div className="h-8 w-full overflow-hidden rounded-xl" style={{ backgroundColor: '#F3F4F6' }}>
        <div
          className="flex h-full items-center pl-3 transition-all"
          style={{ width: `${widthPct}%`, backgroundColor: '#7C3AED', minWidth: 40 }}
        >
          <span className="text-xs font-bold text-white">{count.toLocaleString()}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-400">{pct}%</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('week');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(() => {
    if (range === 'custom' && (!custom.from || !custom.to)) return;
    setLoading(true);
    const dates = getRangeDates(range, custom);
    const params = new URLSearchParams({ from: dates.from, to: dates.to });
    api.get(`/admin/analytics/dashboard?${params}`)
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [range, custom]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const rows = [
        ['Sana', 'Daromad'],
        ...data.weeklyRevenue.map((d) => [d.date, String(d.revenue)]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${range}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const funnel = data?.funnelData ?? { visitors: 0, cart: 0, checkout: 0, delivered: 0 };
  const funnelMax = funnel.visitors || 1;
  const funnelSteps = [
    { label: 'Tashrif', count: funnel.visitors, pct: 100 },
    { label: 'Savat', count: funnel.cart, pct: funnelMax > 0 ? Math.round((funnel.cart / funnelMax) * 100) : 0 },
    { label: 'Checkout', count: funnel.checkout, pct: funnelMax > 0 ? Math.round((funnel.checkout / funnelMax) * 100) : 0 },
    { label: 'Yetkazildi', count: funnel.delivered, pct: funnelMax > 0 ? Math.round((funnel.delivered / funnelMax) * 100) : 0 },
  ];

  const paymentData = (data?.paymentBreakdown ?? []).map((p) => ({
    name: p.method,
    value: p.revenue,
    color: PAYMENT_COLORS[p.method] ?? '#9CA3AF',
  }));

  const maxCatRevenue = Math.max(...(data?.topCategories ?? []).map((c) => c.revenue), 1);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-xl font-semibold text-gray-900">Analitika</h1>

        {/* Date range tabs */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                range === r ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              style={range === r ? { backgroundColor: '#7C3AED' } : undefined}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Custom range */}
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={custom.from} onChange={(e) => setCustom((p) => ({ ...p, from: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand" />
            <span className="text-gray-400">—</span>
            <input type="date" value={custom.to} onChange={(e) => setCustom((p) => ({ ...p, to: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand" />
          </div>
        )}

        <button
          onClick={exportCSV} disabled={exporting || !data}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
        >
          ⬇️ CSV export
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200" />)}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Revenue trend */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Daromad trendi</h2>
              <p className="text-sm font-bold" style={{ color: '#7C3AED' }}>
                {data.todayRevenue.toLocaleString('uz-UZ')} so&apos;m
              </p>
            </div>
            <RevenueChart data={data.weeklyRevenue} />
          </div>

          {/* Conversion funnel */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Konversiya funnel</h2>
            <div className="flex gap-3">
              {funnelSteps.map((s, i) => (
                <FunnelBar key={i} label={s.label} count={s.count} pct={s.pct} max={funnelMax} />
              ))}
            </div>
          </div>

          {/* Top categories + payment methods */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top categories */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">Top kategoriyalar</h2>
              <div className="space-y-3">
                {(data.topCategories ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">Ma&apos;lumot yo&apos;q</p>
                ) : (
                  (data.topCategories ?? []).map((c) => (
                    <div key={c.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-gray-700">{c.name}</span>
                        <span className="font-medium" style={{ color: '#F59E0B' }}>
                          {c.revenue.toLocaleString('uz-UZ')}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round((c.revenue / maxCatRevenue) * 100)}%`, backgroundColor: '#7C3AED' }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-semibold text-gray-900">To&apos;lov usullari</h2>
              {paymentData.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Ma&apos;lumot yo&apos;q</p>
              ) : (
                <PaymentPieChart data={paymentData} />
              )}
            </div>
          </div>

          {/* UTM sources */}
          {(data.utmSources ?? []).length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-900">UTM manbalar</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                    {['Manba', 'Buyurtmalar', 'Daromad', 'Konversiya'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.utmSources ?? []).map((u) => (
                    <tr key={u.source} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{u.source || '(direct)'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{u.orders}</td>
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#F59E0B' }}>
                        {u.revenue.toLocaleString('uz-UZ')} so&apos;m
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{u.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">Ma&apos;lumot yuklanmadi</p>
      )}
    </AdminLayout>
  );
}
