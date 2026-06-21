import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import MediaGallery from '@/components/product/MediaGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductTabs from '@/components/product/ProductTabs';
import BoughtTogether from '@/components/product/BoughtTogether';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

interface Product {
  id: string;
  nameUz: string;
  nameRu: string;
  descUz: string;
  descRu?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  reserved: number;
  images: string[];
  videoUrl?: string;
  model3dUrl?: string;
  tags: string[];
  occasions: string[];
  forWhom: string[];
  rating: number;
  reviewCount: number;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  category?: { nameUz: string; nameRu: string; slug: string };
}

async function fetchProduct(slug: string): Promise<Product> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`,
    { next: { revalidate: 60 } },
  );
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await fetchProduct(slug);
    return {
      title: product.nameUz,
      description: product.descUz.slice(0, 155),
      openGraph: {
        images: product.images[0] ? [product.images[0]] : [],
      },
    };
  } catch {
    return { title: 'Mahsulot' };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  const isNew = Date.now() - new Date(product.createdAt).getTime() < 7 * 86400000;
  const inStock = product.stock - (product.reserved ?? 0) > 0;

  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Breadcrumb */}
      <nav className="px-4 py-3 text-xs text-gray-500 flex items-center gap-1.5">
        <a href="/" className="hover:text-brand">Bosh sahifa</a>
        <span>/</span>
        {product.category && (
          <>
            <a href={`/catalog?category=${product.category.slug}`} className="hover:text-brand">
              {product.category.nameUz}
            </a>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 line-clamp-1">{product.nameUz}</span>
      </nav>

      {/* Desktop: side-by-side; Mobile: stacked */}
      <div className="px-4 md:grid md:grid-cols-[55%_45%] md:gap-8 lg:gap-12">
        {/* Gallery */}
        <MediaGallery
          images={product.images}
          videoUrl={product.videoUrl}
          model3dUrl={product.model3dUrl}
          productName={product.nameUz}
          isNew={isNew}
          inStock={inStock}
        />

        {/* Info */}
        <div className="mt-5 md:mt-0">
          <ProductInfo
            id={product.id}
            nameUz={product.nameUz}
            nameRu={product.nameRu}
            price={product.price}
            comparePrice={product.comparePrice}
            stock={product.stock - (product.reserved ?? 0)}
            rating={product.rating}
            reviewCount={product.reviewCount}
            occasions={product.occasions}
            forWhom={product.forWhom}
            descUz={product.descUz}
            descRu={product.descRu}
            images={product.images}
            slug={product.slug}
            category={product.category}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <ProductTabs
          descUz={product.descUz}
          descRu={product.descRu}
          reviewCount={product.reviewCount}
          productSlug={product.slug}
        />
      </div>

      {/* Bought Together */}
      <div className="px-4">
        <Suspense
          fallback={
            <div className="mt-8">
              <div className="h-6 w-36 animate-pulse rounded bg-gray-200 mb-4" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)}
              </div>
            </div>
          }
        >
          <BoughtTogether productId={product.id} />
        </Suspense>
      </div>
    </main>
  );
}
