'use client';

import { useEffect, useRef, useState } from 'react';
import MobileShell from '@/components/MobileShell';
import StatusBadge from '@/components/StatusBadge';
import { getAuth } from '@/lib/auth';
import api from '@/lib/api';

interface HomeData {
  todayOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  monthlyTarget: number;
  rank: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    contactName: string;
  }>;
}

interface Toast {
  id: string;
  orderNumber: string;
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m} daq`;
  if (m < 1440) return `${Math.floor(m / 60)} soat`;
  return `${Math.floor(m / 1440)} kun`;
}

function useTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function HomePage() {
  const auth = typeof window !== 'undefined' ? getAuth() : null;
  const sellerName = auth?.seller?.name ?? 'Sotuvchi';
  const time = useTime();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    api.get('/seller/dashboard')
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // WebSocket for live order notifications
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3000';
    const auth = getAuth();
    if (!auth?.accessToken) return;

    try {
      const ws = new WebSocket(`${WS_URL}?token=${auth.accessToken}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { event: string; data?: { orderNumber?: string } };
          if (msg.event === 'order:new') {
            const orderNumber = msg.data?.orderNumber ?? 'Yangi buyurtma';
            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev, { id, orderNumber }]);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
            // Refresh dashboard counts
            api.get('/seller/dashboard').then((r) => setData(r.data.data)).catch(() => null);
          }
        } catch { /* ignore */ }
      };

      return () => ws.close();
    } catch { /* ignore */ }
  }, []);

  const progress = data
    ? Math.min(100, Math.round((data.monthlyRevenue / (data.monthlyTarget || 1)) * 100))
    : 0;

  return (
    <MobileShell>
      {/* Toast notifications */}
      <div className="fixed left-1/2 top-4 z-[100] w-full max-w-[480px] -translate-x-1/2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="mb-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl animate-bounce"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <span className="text-lg">📦</span>
            <span>Yangi buyurtma: <strong>{t.orderNumber}</strong></span>
          </div>
        ))}
      </div>

      <div className="px-4 pt-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Salom, {sellerName}! 👋</h1>
            <p className="mt-0.5 text-sm" style={{ color: '#9CA3AF' }}>{time}</p>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {sellerName.charAt(0).toUpperCase()}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ backgroundColor: '#181C25' }} />
            ))}
          </div>
        ) : data ? (
          <>
            {/* 2×2 KPI grid */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {/* Today orders */}
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: '#1E3A5F' }}>
                  📦
                </div>
                <p className="text-2xl font-bold text-white">{data.todayOrders}</p>
                <p className="mt-0.5 text-xs" style={{ color: '#9CA3AF' }}>Bugungi buyurtmalar</p>
              </div>

              {/* Today revenue */}
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: '#2D1F00' }}>
                  💰
                </div>
                <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>
                  {(data.todayRevenue / 1000).toFixed(0)}K
                </p>
                <p className="mt-0.5 text-xs" style={{ color: '#9CA3AF' }}>Bugungi daromad</p>
              </div>

              {/* Monthly progress */}
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: '#2E1065' }}>
                  📈
                </div>
                <p className="text-2xl font-bold text-white">{progress}%</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full" style={{ backgroundColor: '#2A3040' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, backgroundColor: '#7C3AED' }}
                  />
                </div>
                <p className="mt-1 text-[10px]" style={{ color: '#9CA3AF' }}>
                  {(data.monthlyRevenue / 1000).toFixed(0)}K / {(data.monthlyTarget / 1000).toFixed(0)}K so&apos;m
                </p>
              </div>

              {/* Rank */}
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: '#2D1F00' }}>
                  🏆
                </div>
                <p className="text-2xl font-bold text-white">#{data.rank}</p>
                <p className="mt-0.5 text-xs" style={{ color: '#9CA3AF' }}>Mening o&apos;rnim</p>
              </div>
            </div>

            {/* Recent orders */}
            <div className="mb-4">
              <h2 className="mb-3 text-sm font-semibold text-white">So&apos;nggi buyurtmalar</h2>
              <div className="space-y-2">
                {data.recentOrders.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                    style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{o.orderNumber}</p>
                      <p className="truncate text-sm font-medium text-white" style={{ maxWidth: 160 }}>
                        {o.contactName}
                      </p>
                    </div>
                    <div className="ml-2 flex flex-col items-end gap-1">
                      <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>
                        {o.total.toLocaleString('uz-UZ')}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center py-12" style={{ color: '#9CA3AF' }}>
            Ma&apos;lumot yuklanmadi
          </p>
        )}
      </div>
    </MobileShell>
  );
}
