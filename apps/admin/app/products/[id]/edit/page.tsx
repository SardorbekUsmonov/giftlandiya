'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import ProductForm from '@/components/products/ProductForm';
import api from '@/lib/api';

interface Category { id: string; nameUz: string }
interface Product {
  id: string; nameUz: string; nameRu: string;
  descriptionUz: string; descriptionRu: string;
  price: number; comparePrice?: number; sku?: string; stock: number;
  categoryId?: string; images: string[]; isActive: boolean; isGiftable: boolean;
  tags?: string[];
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/products/${id}`),
      api.get('/categories?limit=100'),
    ])
      .then(([p, c]) => {
        setProduct(p.data.data);
        setCategories(c.data.data ?? []);
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFoundFlag(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (notFoundFlag) return <div className="p-8 text-gray-500">Mahsulot topilmadi</div>;

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </AdminLayout>
    );
  }

  if (!product) return null;

  const initialData = {
    nameUz: product.nameUz,
    nameRu: product.nameRu ?? '',
    descriptionUz: product.descriptionUz ?? '',
    descriptionRu: product.descriptionRu ?? '',
    price: String(product.price),
    comparePrice: product.comparePrice ? String(product.comparePrice) : '',
    sku: product.sku ?? '',
    stock: String(product.stock),
    categoryId: product.categoryId ?? '',
    images: product.images ?? [],
    isActive: product.isActive,
    isGiftable: product.isGiftable,
    tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
  };

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
        <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">{product.nameUz}</h1>
      </div>
      <ProductForm productId={id} initialData={initialData} categories={categories} />
    </AdminLayout>
  );
}
