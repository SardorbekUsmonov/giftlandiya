'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import ProductForm from '@/components/products/ProductForm';
import api from '@/lib/api';

interface Category { id: string; nameUz: string }

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get('/categories?limit=100').then((r) => setCategories(r.data.data ?? [])).catch(() => null);
  }, []);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/products"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Yangi mahsulot</h1>
      </div>
      <ProductForm categories={categories} />
    </AdminLayout>
  );
}
