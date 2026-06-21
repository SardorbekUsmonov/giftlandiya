'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import api from '@/lib/api';

const WeeklyChart = dynamic(() => import('@/components/dashboard/WeeklyChart'), { ssr: false });

interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  newCustomers: number;
  avgOrderValue: number;
  weeklyRevenue: Array<{ date: string; revenue: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user?: { name?: string; phone: string };
  }>;
  topProducts: Array<{ productId: string; nameUz: string; slug: string; revenue: number }>;
  stockAlerts: Array<{ id: string; nameUz: string; available: number }>;
}

const KPI_CARDS = [
  { key: 'todayRevenue',   icon: '💰', label: "Bugungi daromad",   money: true },
  { key: 'todayOrders',    icon: '📦', label: "Bugungi buyurtmalar", money: false },
  { key: 'newCustomers',   icon: '👤', label: "Yangi mijozlar",    money: false },
  { key: 'avgOrderValue',  icon: '📊', label: "O'rtacha buyurtma", money: true },
] as const;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} daq.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat`;
  return `${Math.floor(h / 24)} kun`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics/dashboard')
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-gray-500">Ma&apos;lumot yuklanmadi</p>
      ) : (
        <div>
          {/* Stock alerts */}
          {data.stockAlerts.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {data.stockAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  ⚠️ <span className="font-medium">{a.nameUz}</span> — {a.available} ta qoldi
                </div>
              ))}
            </div>
          )}

          {/* KPI cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {KPI_CARDS.map(({ key, icon, label, money }) => {
              const value = data[key] as number;
              return (
                <div key={key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-xl"
                    style={{ backgroundColor: '#EDE9FE' }}
                  >
                    {icon}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {money ? value.toLocaleString('uz-UZ') : value.toLocaleString()}
                  </p>
                  {money && <p className="text-xs text-gray-400">so&apos;m</p>}
                  <p className="mt-1 text-sm text-gray-500">{label}</p>
                </div>
              );
            })}
          </div>

          {/* Weekly chart */}
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Haftalik daromad</h2>
            <WeeklyChart data={data.weeklyRevenue} />
          </div>

          {/* Orders + top products */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            {/* Recent orders */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">So&apos;nggi buyurtmalar</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="pb-2 text-left font-medium">Raqam</th>
                      <th className="pb-2 text-left font-medium">Mijoz</th>
                      <th className="pb-2 text-right font-medium">Summa</th>
                      <th className="pb-2 text-center font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 font-mono text-xs text-gray-600">{o.orderNumber}</td>
                        <td className="py-2.5 text-gray-800">
                          {o.user?.name ?? o.user?.phone ?? '—'}
                        </td>
                        <td className="py-2.5 text-right font-medium" style={{ color: '#F59E0B' }}>
                          {o.total.toLocaleString('uz-UZ')}
                        </td>
                        <td className="py-2.5 text-center">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-2.5 text-right text-xs text-gray-400">
                          {timeAgo(o.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Top products */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Top mahsulotlar</h2>
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {i + 1}
                      </span>
                      <p className="flex-1 truncate text-sm text-gray-800">{p.nameUz}</p>
                      <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                        {p.revenue.toLocaleString('uz-UZ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seller leaderboard placeholder */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Sotuvchilar reytingi</h2>
                <p className="text-sm text-gray-400 text-center py-4">Yaqinda...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
