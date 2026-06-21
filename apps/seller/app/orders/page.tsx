'use client';

import { useEffect, useState, useCallback } from 'react';
import MobileShell from '@/components/MobileShell';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

interface OrderItem {
  id: string;
  qty: number;
  price: number;
  product?: { nameUz: string; images: string[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  contactName: string;
  contactPhone: string;
  address: string;
  district?: string;
  isGift?: boolean;
  giftMessage?: string;
  secretSender?: boolean;
  items?: OrderItem[];
}

const STATUS_NEXT: Record<string, { label: string; nextStatus: string; bg: string; text: string }> = {
  NEW:        { label: '✓ Qabul qildim',      nextStatus: 'CONFIRMED',  bg: '#10B981', text: '#FFFFFF' },
  CONFIRMED:  { label: '📦 Qadoqlayman',       nextStatus: 'PACKING',    bg: '#7C3AED', text: '#FFFFFF' },
  PACKING:    { label: '🚚 Kuryerga berdim',   nextStatus: 'ON_COURIER', bg: '#F59E0B', text: '#1C0A00' },
  ON_COURIER: { label: '✓ Topshirdim',         nextStatus: 'DELIVERED',  bg: '#10B981', text: '#FFFFFF' },
  DELIVERED:  { label: '✅ Yetkazildi',         nextStatus: '',           bg: '#1F2937', text: '#9CA3AF' },
};

const TABS = [
  { key: 'new',    label: 'Yangi',      statuses: ['NEW'] },
  { key: 'active', label: 'Jarayonda',  statuses: ['CONFIRMED', 'PACKING', 'ON_COURIER'] },
  { key: 'all',    label: 'Barchasi',   statuses: [] },
] as const;

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m} daq`;
  if (m < 1440) return `${Math.floor(m / 60)} soat`;
  return `${Math.floor(m / 1440)} kun`;
}

function mapsUrl(address: string, district?: string) {
  const q = encodeURIComponent([address, district].filter(Boolean).join(', '));
  return `https://maps.google.com/maps?q=${q}`;
}

function OrderDetail({ order: initial, onBack, onStatusChange }: {
  order: Order;
  onBack: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const btn = STATUS_NEXT[order.status];

  const advance = async () => {
    if (!btn?.nextStatus) return;
    setBusy(true);
    // Optimistic update
    const newStatus = btn.nextStatus;
    setOrder((prev) => ({ ...prev, status: newStatus }));
    onStatusChange(order.id, newStatus);
    try {
      await api.patch(`/seller/orders/${order.id}/status`, { status: newStatus });
    } catch {
      // Revert on failure
      setOrder((prev) => ({ ...prev, status: order.status }));
      onStatusChange(order.id, order.status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh', backgroundColor: '#0F1117' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 pt-safe"
        style={{ backgroundColor: '#181C25', borderBottom: '1px solid #2A3040' }}
      >
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: '#2A3040' }}
        >
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <p className="font-mono text-sm" style={{ color: '#9CA3AF' }}>{order.orderNumber}</p>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4 space-y-4">
        {/* Customer */}
        <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>Mijoz</p>
          <p className="text-base font-semibold text-white">{order.contactName}</p>
          <a
            href={`tel:${order.contactPhone}`}
            className="flex items-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ color: '#60A5FA' }}
          >
            📞 {order.contactPhone}
          </a>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0">📍</span>
            <div>
              <p className="text-sm text-white">{order.address}{order.district ? `, ${order.district}` : ''}</p>
              <a
                href={mapsUrl(order.address, order.district)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-xs font-medium"
                style={{ color: '#7C3AED' }}
              >
                Xaritada ko&apos;r →
              </a>
            </div>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>Mahsulotlar</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.product?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0]}
                    alt={item.product.nameUz}
                    className="h-10 w-10 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: '#2E1065' }}>
                    🎁
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{item.product?.nameUz}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {item.qty} × {item.price.toLocaleString('uz-UZ')} so&apos;m
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                  {(item.qty * item.price).toLocaleString('uz-UZ')}
                </p>
              </div>
            ))}
            <div className="border-t pt-3" style={{ borderColor: '#2A3040' }}>
              <div className="flex justify-between">
                <span className="text-sm text-white">Jami</span>
                <span className="text-base font-bold" style={{ color: '#F59E0B' }}>
                  {order.total.toLocaleString('uz-UZ')} so&apos;m
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Gift section */}
        {order.isGift && (
          <div className="rounded-2xl border p-4" style={{ backgroundColor: '#1E1B4B', borderColor: '#3730A3' }}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#818CF8' }}>Sovg&apos;a</p>
            {order.giftMessage && (
              <p className="text-sm text-white">🎁 &quot;{order.giftMessage}&quot;</p>
            )}
            {order.secretSender && (
              <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#A5B4FC' }}>
                🤫 <span>Yashirin yuboruvchi — ismingiz yashirin saqlanadi</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action button */}
      {btn && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 px-4 pb-6" style={{ backgroundColor: '#0F1117' }}>
          <button
            onClick={advance}
            disabled={busy || !btn.nextStatus}
            className="w-full rounded-2xl py-4 text-lg font-bold transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: btn.bg, color: btn.text }}
          >
            {busy ? '...' : btn.label}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'new' | 'active' | 'all'>('new');
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(() => {
    api.get('/seller/orders?limit=100')
      .then((r) => setOrders(r.data.data ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const filtered = orders.filter((o) => {
    const tabCfg = TABS.find((t) => t.key === tab)!;
    if (tabCfg.statuses.length === 0) return true;
    return tabCfg.statuses.includes(o.status as never);
  });

  if (selected) {
    return (
      <OrderDetail
        order={selected}
        onBack={() => setSelected(null)}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <MobileShell>
      <div className="px-4 pt-5">
        <h1 className="mb-4 text-xl font-semibold text-white">Buyurtmalar</h1>

        {/* Tabs */}
        <div className="mb-4 flex border-b" style={{ borderColor: '#2A3040' }}>
          {TABS.map(({ key, label, statuses }) => {
            const count = statuses.length
              ? orders.filter((o) => statuses.includes(o.status as never)).length
              : orders.length;
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 pb-3 pr-5 text-sm font-medium transition-colors"
                style={active
                  ? { borderBottom: '2px solid #7C3AED', color: '#7C3AED', marginBottom: -1 }
                  : { color: '#9CA3AF' }
                }
              >
                {label}
                {count > 0 && (
                  <span
                    className="rounded-full px-1.5 text-xs"
                    style={active
                      ? { backgroundColor: '#EDE9FE', color: '#7C3AED' }
                      : { backgroundColor: '#1F2937', color: '#9CA3AF' }
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Order list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: '#181C25' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="mt-3 text-sm" style={{ color: '#9CA3AF' }}>Buyurtma yo&apos;q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className="w-full rounded-2xl border p-4 text-left transition-all active:scale-95"
                style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm" style={{ color: '#9CA3AF' }}>{o.orderNumber}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1.5 truncate text-base font-medium text-white">{o.contactName}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: '#F59E0B' }}>
                    {o.total.toLocaleString('uz-UZ')} so&apos;m
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{timeAgo(o.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
