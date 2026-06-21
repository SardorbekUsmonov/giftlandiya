'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import api from '@/lib/api';

const KANBAN_COLS = [
  { status: 'NEW',        label: 'Yangi',          color: '#6B7280' },
  { status: 'CONFIRMED',  label: 'Tasdiqlandi',    color: '#2563EB' },
  { status: 'PACKING',    label: 'Qadoqlanmoqda',  color: '#D97706' },
  { status: 'READY',      label: 'Tayyor',         color: '#7C3AED' },
  { status: 'ON_COURIER', label: 'Kuryerda',       color: '#EA580C' },
  { status: 'DELIVERED',  label: 'Yetkazildi',     color: '#059669' },
] as const;

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  contactName: string;
  contactPhone: string;
  address: string;
  district?: string;
  createdAt: string;
  user?: { name?: string; phone: string };
  items?: Array<{
    id: string;
    qty: number;
    price: number;
    product?: { nameUz: string; images: string[] };
  }>;
}

interface Seller {
  id: string;
  shopName?: string;
  user?: { name?: string };
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m} daq`;
  if (m < 1440) return `${Math.floor(m / 60)} soat`;
  return `${Math.floor(m / 1440)} kun`;
}

function SlideOver({
  order,
  onClose,
  onRefresh,
}: {
  order: Order;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerId, setSellerId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelMode, setCancelMode] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/sellers').then((r) => setSellers(r.data.data ?? [])).catch(() => null);
  }, []);

  const assign = async () => {
    if (!sellerId) return;
    setBusy(true);
    try {
      await api.patch(`/admin/orders/${order.id}/assign`, { sellerId });
      onRefresh();
      onClose();
    } catch { /* ignore */ }
    finally { setBusy(false); }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/orders/${order.id}/cancel`, { reason: cancelReason });
      onRefresh();
      onClose();
    } catch { /* ignore */ }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
            <StatusBadge status={order.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Customer */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Mijoz</p>
            <p className="text-sm font-medium text-gray-900">{order.contactName}</p>
            <p className="text-sm text-gray-500">{order.contactPhone}</p>
            <p className="text-sm text-gray-500">{order.address}{order.district ? `, ${order.district}` : ''}</p>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Mahsulotlar</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
                    {item.product?.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.images[0]}
                        alt={item.product.nameUz}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-gray-800">{item.product?.nameUz}</p>
                      <p className="text-xs text-gray-400">{item.qty} × {item.price.toLocaleString('uz-UZ')} so&apos;m</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Jami</span>
            <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>
              {order.total.toLocaleString('uz-UZ')} so&apos;m
            </span>
          </div>

          {/* Assign seller */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Sotuvchi biriktirish</p>
            <div className="flex gap-2">
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">Sotuvchi tanlang</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopName ?? s.user?.name ?? s.id}
                  </option>
                ))}
              </select>
              <button
                onClick={assign}
                disabled={!sellerId || busy}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#7C3AED' }}
              >
                Biriktir
              </button>
            </div>
          </div>

          {/* Cancel */}
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <div>
              {!cancelMode ? (
                <button
                  onClick={() => setCancelMode(true)}
                  className="w-full rounded-xl border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Buyurtmani bekor qilish
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    placeholder="Bekor qilish sababi..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={cancel}
                      disabled={busy}
                      className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Bekor qil
                    </button>
                    <button
                      onClick={() => setCancelMode(false)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600"
                    >
                      Qaytish
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/admin/orders?limit=200')
      .then((r) => setOrders(r.data.data ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const byStatus = (status: string) => orders.filter((o) => o.status === status);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Buyurtmalar</h1>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(['kanban', 'table'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === v ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'kanban' ? '📋 Kanban' : '📊 Jadval'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4">
          {KANBAN_COLS.map((c) => (
            <div key={c.status} className="h-64 w-60 flex-shrink-0 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLS.map(({ status, label, color }) => {
            const col = byStatus(status);
            return (
              <div key={status} className="flex w-60 flex-shrink-0 flex-col">
                {/* Column header */}
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm border border-gray-100">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {col.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {col.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => setSelected(o)}
                      className="cursor-pointer rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <p className="font-mono text-xs text-gray-400">{o.orderNumber}</p>
                      <p className="mt-1 text-sm font-medium text-gray-800 truncate">
                        {o.contactName}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                          {o.total.toLocaleString('uz-UZ')}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(o.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                {['Raqam', 'Mijoz', 'Summa', 'Status', 'Vaqt'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-800">{o.contactName}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#F59E0B' }}>
                    {o.total.toLocaleString('uz-UZ')} so&apos;m
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <SlideOver order={selected} onClose={() => setSelected(null)} onRefresh={fetchOrders} />
      )}
    </AdminLayout>
  );
}
