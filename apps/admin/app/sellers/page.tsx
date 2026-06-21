'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Seller {
  id: string;
  shopName?: string;
  description?: string;
  monthlyTarget: number;
  commissionRate: number;
  isActive: boolean;
  monthlySales?: number;
  user: { id: string; name?: string; phone: string; email?: string };
}

interface SellerStats {
  todayOrders: number;
  todaySales: number;
  monthlySales: number;
  monthlyOrders: number;
  rank: number;
  recentOrders?: Array<{
    id: string; orderNumber: string; status: string; total: number; createdAt: string;
  }>;
}

// ── Seller form modal ─────────────────────────────────────────────────────────
function SellerModal({
  seller,
  onClose,
  onSaved,
}: {
  seller?: Seller;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!seller;
  const [form, setForm] = useState({
    name: seller?.user.name ?? '',
    phone: seller?.user.phone ?? '',
    password: '',
    shopName: seller?.shopName ?? '',
    description: seller?.description ?? '',
    monthlyTarget: String(seller?.monthlyTarget ?? 0),
    commissionRate: String(Math.round((seller?.commissionRate ?? 0.1) * 100)),
    isActive: seller?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.patch(`/admin/sellers/${seller.id}`, {
          shopName: form.shopName || undefined,
          description: form.description || undefined,
          monthlyTarget: parseInt(form.monthlyTarget, 10),
          commissionRate: parseInt(form.commissionRate, 10) / 100,
          isActive: form.isActive,
        });
      } else {
        await api.post('/sellers/register', {
          name: form.name,
          phone: form.phone,
          password: form.password,
          shopName: form.shopName || undefined,
          description: form.description || undefined,
          monthlyTarget: parseInt(form.monthlyTarget, 10),
          commissionRate: parseInt(form.commissionRate, 10) / 100,
        });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Xato yuz berdi');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Sotuvchini tahrirlash' : 'Yangi sotuvchi'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Ism *</label>
                  <input required value={form.name} onChange={(e) => set('name', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Telefon *</label>
                  <input required value={form.phone} onChange={(e) => set('phone', e.target.value)}
                    placeholder="+998901234567"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Parol *</label>
                <input required type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Do&apos;kon nomi</label>
            <input value={form.shopName} onChange={(e) => set('shopName', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Tavsif</label>
            <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Oylik maqsad (so&apos;m)</label>
              <input type="number" min={0} value={form.monthlyTarget} onChange={(e) => set('monthlyTarget', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Komissiya (%)</label>
              <div className="relative">
                <input type="number" min={0} max={100} value={form.commissionRate}
                  onChange={(e) => set('commissionRate', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-8 text-sm outline-none focus:border-brand" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
            <span className="text-sm text-gray-700">Faol</span>
            <button
              type="button" onClick={() => set('isActive', !form.isActive)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: form.isActive ? '#7C3AED' : '#D1D5DB' }}
            >
              <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                style={{ transform: form.isActive ? 'translateX(18px)' : 'translateX(2px)' }} />
            </button>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              Bekor
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#7C3AED' }}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Seller stats slide-over ───────────────────────────────────────────────────
function SellerSlideOver({ seller, onClose }: { seller: Seller; onClose: () => void }) {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    api.get(`/admin/sellers/${seller.id}/stats`).then((r) => setStats(r.data.data)).catch(() => null);
  }, [seller.id]);

  const resetPassword = async () => {
    if (!newPwd) return;
    setResetting(true);
    try {
      await api.post(`/admin/sellers/${seller.id}/reset-password`, { newPassword: newPwd });
      setResetDone(true);
      setNewPwd('');
    } catch { /* ignore */ }
    finally { setResetting(false); }
  };

  const statCards = stats ? [
    { label: "Bugungi buyurtmalar", value: stats.todayOrders },
    { label: "Bugungi daromad", value: `${stats.todaySales.toLocaleString('uz-UZ')} so'm` },
    { label: "Oylik daromad", value: `${stats.monthlySales.toLocaleString('uz-UZ')} so'm` },
    { label: "Reyting o'rni", value: `#${stats.rank}` },
  ] : [];

  function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${m} daq`;
    if (m < 1440) return `${Math.floor(m / 60)} soat`;
    return `${Math.floor(m / 1440)} kun`;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="font-semibold text-gray-900">{seller.user.name ?? seller.shopName}</p>
            <p className="text-sm text-gray-500">{seller.user.phone}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Stats grid */}
          {stats ? (
            <div className="grid grid-cols-2 gap-3">
              {statCards.map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          )}

          {/* Recent orders */}
          {stats?.recentOrders && stats.recentOrders.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">So&apos;nggi buyurtmalar</p>
              <div className="space-y-1.5">
                {stats.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <p className="font-mono text-xs text-gray-600">{o.orderNumber}</p>
                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: '#F59E0B' }}>
                        {o.total.toLocaleString('uz-UZ')}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(o.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset password */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Parolni tiklash</p>
            {resetDone ? (
              <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">✓ Parol muvaffaqiyatli tiklandi</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password" placeholder="Yangi parol" value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <button
                  onClick={resetPassword} disabled={!newPwd || resetting}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  {resetting ? '...' : 'Tiklash'}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Seller | null>(null);
  const [statsTarget, setStatsTarget] = useState<Seller | null>(null);

  const fetchSellers = useCallback(() => {
    setLoading(true);
    api.get('/admin/sellers?limit=100')
      .then((r) => { setSellers(r.data.data ?? []); setTotal(r.data.meta?.total ?? 0); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const toggleActive = async (seller: Seller) => {
    setTogglingId(seller.id);
    try {
      await api.patch(`/admin/sellers/${seller.id}`, { isActive: !seller.isActive });
      setSellers((prev) => prev.map((s) => s.id === seller.id ? { ...s, isActive: !s.isActive } : s));
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Sotuvchilar <span className="font-normal text-gray-400 text-base">({total})</span>
        </h1>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#7C3AED' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yangi sotuvchi
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                {['Sotuvchi', 'Do\'kon', 'Oylik maqsad', 'Komissiya', 'Faol', 'Amallar'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">Sotuvchi yo&apos;q</td>
                </tr>
              ) : (
                sellers.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.user.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{s.user.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.shopName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-800">
                      {s.monthlyTarget.toLocaleString('uz-UZ')} so&apos;m
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {Math.round(s.commissionRate * 100)}%
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(s)}
                        disabled={togglingId === s.id}
                        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                        style={{ backgroundColor: s.isActive ? '#7C3AED' : '#D1D5DB' }}
                      >
                        <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                          style={{ transform: s.isActive ? 'translateX(18px)' : 'translateX(2px)' }} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setEditTarget(s); setShowModal(true); }}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-brand hover:text-brand transition-colors"
                        >
                          Tahrir
                        </button>
                        <button
                          onClick={() => setStatsTarget(s)}
                          className="rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                          style={{ borderColor: '#EDE9FE', color: '#7C3AED' }}
                        >
                          📊 Statistika
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SellerModal
          seller={editTarget ?? undefined}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={fetchSellers}
        />
      )}

      {statsTarget && (
        <SellerSlideOver seller={statsTarget} onClose={() => setStatsTarget(null)} />
      )}
    </AdminLayout>
  );
}
