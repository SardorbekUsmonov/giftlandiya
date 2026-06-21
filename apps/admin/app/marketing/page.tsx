'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
  images?: string[];
  user?: { name?: string; phone: string };
  product?: { nameUz: string; images: string[] };
}

type Tab = 'promos' | 'reviews';
type ReviewFilter = 'pending' | 'approved' | 'all';

// ── Promo form modal ──────────────────────────────────────────────────────────
function PromoModal({
  initial,
  editId,
  onClose,
  onSaved,
}: {
  initial?: Partial<PromoCode>;
  editId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    discountType: initial?.discountType ?? 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: String(initial?.discountValue ?? ''),
    minOrderValue: String(initial?.minOrderValue ?? '0'),
    maxUses: String(initial?.maxUses ?? ''),
    expiresAt: initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '',
    isActive: initial?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    set('code', Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: parseInt(form.discountValue, 10),
      minOrderValue: parseInt(form.minOrderValue, 10) || 0,
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
      expiresAt: form.expiresAt || undefined,
      isActive: form.isActive,
    };
    try {
      if (editId) {
        await api.patch(`/admin/promo-codes/${editId}`, payload);
      } else {
        await api.post('/admin/promo-codes', payload);
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
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {editId ? 'Promo kodni tahrirlash' : 'Yangi promo kod'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Code input */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Kod *</label>
            <div className="flex gap-2">
              <input
                required value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-brand"
              />
              <button type="button" onClick={generateCode}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:border-brand hover:text-brand transition-colors">
                Avtomatik
              </button>
            </div>
          </div>

          {/* Discount type toggle */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Chegirma turi</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['PERCENT', 'FIXED'] as const).map((t) => (
                <button
                  key={t} type="button" onClick={() => set('discountType', t)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.discountType === t ? 'text-white' : 'bg-white text-gray-600'
                  }`}
                  style={form.discountType === t ? { backgroundColor: '#7C3AED' } : undefined}
                >
                  {t === 'PERCENT' ? '%  Foiz' : '💰 Summa'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {form.discountType === 'PERCENT' ? 'Foiz (1-100)' : "Summa (so'm)"} *
              </label>
              <input
                required type="number"
                min={1} max={form.discountType === 'PERCENT' ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => set('discountValue', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Min buyurtma (so&apos;m)</label>
              <input
                type="number" min={0} value={form.minOrderValue}
                onChange={(e) => set('minOrderValue', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Max foydalanish</label>
              <input
                type="number" min={1} placeholder="Cheksiz" value={form.maxUses}
                onChange={(e) => set('maxUses', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Muddat</label>
              <input
                type="date" value={form.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
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

// ── Promo codes tab ───────────────────────────────────────────────────────────
function PromoCodesTab() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PromoCode | null>(null);

  const fetchPromos = useCallback(() => {
    setLoading(true);
    api.get('/admin/promo-codes?limit=100')
      .then((r) => setPromos(r.data.data ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const deactivate = async (id: string) => {
    await api.delete(`/admin/promo-codes/${id}`);
    fetchPromos();
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: '#7C3AED' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yangi promo kod
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              {['Kod', 'Turi', 'Qiymat', 'Min buyurtma', 'Foydalanish', 'Muddat', 'Faol', 'Amallar'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : promos.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">Promo kod yo&apos;q</td></tr>
            ) : (
              promos.map((p) => {
                const expired = p.expiresAt && new Date(p.expiresAt) < new Date();
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">{p.code}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={p.discountType === 'PERCENT'
                          ? { backgroundColor: '#EDE9FE', color: '#5B21B6' }
                          : { backgroundColor: '#FEF9C3', color: '#92400E' }
                        }
                      >
                        {p.discountType === 'PERCENT' ? '%' : 'So\'m'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {p.discountType === 'PERCENT' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString('uz-UZ')} so'm`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.minOrderValue > 0 ? `${p.minOrderValue.toLocaleString('uz-UZ')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.usedCount}{p.maxUses ? `/${p.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      {p.expiresAt ? (
                        <span className={`text-xs ${expired ? 'text-red-500' : 'text-gray-500'}`}>
                          {new Date(p.expiresAt).toLocaleDateString('uz-UZ')}
                          {expired && ' (Tugagan)'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block h-2 w-2 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setEditTarget(p); setShowModal(true); }}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-brand hover:text-brand transition-colors"
                        >
                          Tahrir
                        </button>
                        {p.isActive && (
                          <button
                            onClick={() => deactivate(p.id)}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            O&apos;chir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PromoModal
          editId={editTarget?.id}
          initial={editTarget ?? undefined}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={fetchPromos}
        />
      )}
    </>
  );
}

// ── Reviews tab ───────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter>('pending');

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const params = filter !== 'all' ? `?isApproved=${filter === 'approved'}` : '';
    api.get(`/admin/reviews${params}`)
      .then((r) => setReviews(r.data.data ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const approve = async (id: string) => {
    await api.post(`/admin/reviews/approve/${id}`);
    fetchReviews();
  };

  const remove = async (id: string) => {
    await api.delete(`/admin/reviews/${id}`);
    fetchReviews();
  };

  const FILTER_LABELS: Record<ReviewFilter, string> = {
    pending: 'Tasdiqlanmagan', approved: 'Tasdiqlangan', all: 'Barchasi',
  };

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-3 flex gap-1 rounded-xl border border-gray-200 p-1 bg-white w-fit">
        {(Object.entries(FILTER_LABELS) as [ReviewFilter, string][]).map(([k, label]) => (
          <button
            key={k} onClick={() => setFilter(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === k ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
            style={filter === k ? { backgroundColor: '#7C3AED' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center text-gray-400 shadow-sm">
          Sharh yo&apos;q
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                {/* Product image */}
                {r.product?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.product.images[0]} alt={r.product.nameUz}
                    className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: '#EDE9FE' }}>🎁</div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="truncate text-sm font-medium text-gray-900">{r.product?.nameUz}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {/* Stars */}
                        <span className="text-sm" style={{ color: '#F59E0B' }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                        <span className="text-xs text-gray-500">{r.user?.name ?? r.user?.phone}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {!r.isApproved && (
                        <button
                          onClick={() => approve(r.id)}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-white transition-colors"
                          style={{ backgroundColor: '#10B981' }}
                        >
                          Tasdiqlash
                        </button>
                      )}
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        O&apos;chirish
                      </button>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{r.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>('promos');

  return (
    <AdminLayout>
      <h1 className="mb-5 text-xl font-semibold text-gray-900">Marketing</h1>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-gray-200">
        {([['promos', 'Promo Kodlar'], ['reviews', 'Sharhlar']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t} onClick={() => setTab(t)}
            className={`pb-3 pr-8 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 text-brand' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={tab === t ? { borderColor: '#7C3AED', marginBottom: -1 } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'promos' ? <PromoCodesTab /> : <ReviewsTab />}
    </AdminLayout>
  );
}
