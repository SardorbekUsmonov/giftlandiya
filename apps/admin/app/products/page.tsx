'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Product {
  id: string;
  nameUz: string;
  sku?: string;
  price: number;
  stock: number;
  reserved: number;
  isActive: boolean;
  images: string[];
  category?: { nameUz: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    api.get(`/admin/products?${params}`)
      .then((r) => {
        setProducts(r.data.data ?? []);
        setTotal(r.data.meta?.total ?? 0);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleActive = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}`, { isActive: !product.isActive });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  const pages = Math.ceil(total / 20);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Mahsulotlar <span className="text-gray-400 font-normal text-base">({total})</span>
        </h1>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#7C3AED' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yangi mahsulot
        </Link>
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
          placeholder="Nom, SKU bo'yicha qidirish..."
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
                <th className="px-4 py-3 text-left font-medium">Mahsulot</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-left font-medium">Narx</th>
                <th className="px-4 py-3 text-left font-medium">Ombor</th>
                <th className="px-4 py-3 text-center font-medium">Faol</th>
                <th className="px-4 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-xl bg-gray-200" />
                        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Mahsulot topilmadi
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const available = p.stock - p.reserved;
                  const lowStock = available <= 5;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0]}
                              alt={p.nameUz}
                              className="h-10 w-10 flex-shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                              style={{ backgroundColor: '#EDE9FE' }}
                            >
                              🎁
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 max-w-[200px]">{p.nameUz}</p>
                            {p.category && (
                              <p className="truncate text-xs text-gray-400">{p.category.nameUz}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {p.price.toLocaleString('uz-UZ')} so&apos;m
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-medium ${lowStock ? 'text-red-600' : 'text-gray-800'}`}
                        >
                          {available}
                        </span>
                        {lowStock && (
                          <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
                            !
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={togglingId === p.id}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                          style={{ backgroundColor: p.isActive ? '#7C3AED' : '#D1D5DB' }}
                        >
                          <span
                            className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                            style={{ transform: p.isActive ? 'translateX(18px)' : 'translateX(2px)' }}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-brand hover:text-brand transition-colors"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                          </svg>
                          Tahrirlash
                        </Link>
                      </td>
                    </tr>
                  );
                })
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
    </AdminLayout>
  );
}
