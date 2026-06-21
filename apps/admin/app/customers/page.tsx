'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import api from '@/lib/api';

interface Customer {
  id: string;
  name?: string;
  phone: string;
  segment?: 'VIP' | 'REGULAR' | 'NEW' | 'AT_RISK';
  _count?: { orders: number };
  ltv?: number;
  lastOrderAt?: string;
}

interface CustomerDetail extends Customer {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  addresses: Array<{ street: string; district?: string; city?: string }>;
}

const SEGMENT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  VIP:     { label: 'VIP',      bg: '#FEF9C3', text: '#854D0E' },
  REGULAR: { label: 'Doimiy',   bg: '#DBEAFE', text: '#1D4ED8' },
  NEW:     { label: 'Yangi',    bg: '#D1FAE5', text: '#065F46' },
  AT_RISK: { label: 'Xavfli',   bg: '#FEE2E2', text: '#991B1B' },
};

function SegmentBadge({ segment }: { segment?: string }) {
  if (!segment) return null;
  const cfg = SEGMENT_CONFIG[segment] ?? { label: segment, bg: '#F3F4F6', text: '#374151' };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m} daq`;
  if (m < 1440) return `${Math.floor(m / 60)} soat`;
  return `${Math.floor(m / 1440)} kun`;
}

function CustomerSlideOver({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [tab, setTab] = useState<'orders' | 'addresses'>('orders');

  useEffect(() => {
    api.get(`/admin/customers/${customerId}`)
      .then((r) => setCustomer(r.data.data))
      .catch(() => null);
  }, [customerId]);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    setInsight('');
    try {
      const r = await api.get(`/admin/customers/${customerId}/insight`);
      setInsight(r.data.data?.insight ?? '');
    } catch {
      setInsight('AI tahlil mavjud emas');
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="font-semibold text-gray-900">
              {customer?.name ?? customer?.phone ?? '...'}
            </p>
            {customer?.phone && customer?.name && (
              <p className="text-sm text-gray-500">{customer.phone}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!customer ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px border-b border-gray-100 bg-gray-100">
              {[
                { label: 'Buyurtmalar', value: customer._count?.orders ?? 0 },
                { label: 'LTV', value: `${((customer.ltv ?? 0) / 1000).toFixed(0)}K` },
                { label: 'Segment', value: <SegmentBadge segment={customer.segment} /> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            {/* AI Insight */}
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">AI Tahlil</p>
                <button
                  onClick={fetchInsight}
                  disabled={loadingInsight}
                  className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-60"
                >
                  {loadingInsight ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                  ) : '✨'}
                  {loadingInsight ? 'Tahlil...' : 'Tahlil qil'}
                </button>
              </div>
              {insight ? (
                <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Mijoz xatti-harakatlarini AI tahlil qilish uchun yuqoridagi tugmani bosing
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(['orders', 'addresses'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    tab === t
                      ? 'border-b-2 text-brand'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={tab === t ? { borderColor: '#7C3AED' } : undefined}
                >
                  {t === 'orders' ? `Buyurtmalar (${customer.orders?.length ?? 0})` : 'Manzillar'}
                </button>
              ))}
            </div>

            <div className="flex-1 px-5 py-4">
              {tab === 'orders' ? (
                <div className="space-y-2">
                  {customer.orders?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Buyurtma yo&apos;q</p>
                  )}
                  {customer.orders?.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                      <div>
                        <p className="font-mono text-xs text-gray-500">{o.orderNumber}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                          {o.total.toLocaleString('uz-UZ')}
                        </p>
                        <p className="text-xs text-gray-400">{timeAgo(o.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {customer.addresses?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Manzil yo&apos;q</p>
                  )}
                  {customer.addresses?.map((a, i) => (
                    <div key={i} className="rounded-xl bg-gray-50 px-3 py-2.5">
                      <p className="text-sm text-gray-800">{a.street}</p>
                      {(a.district || a.city) && (
                        <p className="text-xs text-gray-400">{[a.district, a.city].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    api.get(`/admin/customers?${params}`)
      .then((r) => {
        setCustomers(r.data.data ?? []);
        setTotal(r.data.meta?.total ?? 0);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const pages = Math.ceil(total / 20);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Mijozlar <span className="text-gray-400 font-normal text-base">({total})</span>
        </h1>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <svg
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Mijoz</th>
                <th className="px-4 py-3 text-left font-medium">Segment</th>
                <th className="px-4 py-3 text-left font-medium">Buyurtmalar</th>
                <th className="px-4 py-3 text-left font-medium">LTV</th>
                <th className="px-4 py-3 text-left font-medium">So&apos;nggi buyurtma</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    Mijoz topilmadi
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <SegmentBadge segment={c.segment} />
                    </td>
                    <td className="px-4 py-3 text-gray-800">{c._count?.orders ?? 0}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#F59E0B' }}>
                      {(c.ltv ?? 0).toLocaleString('uz-UZ')} so&apos;m
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.lastOrderAt ? timeAgo(c.lastOrderAt) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} / {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Oldingi
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Keyingi →
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <CustomerSlideOver customerId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </AdminLayout>
  );
}
