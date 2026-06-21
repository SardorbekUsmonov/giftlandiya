import { Suspense } from 'react';
import HeroSection from '@/components/home/HeroSection';
import GiftbotBanner from '@/components/home/GiftbotBanner';
import CategoryChips from '@/components/home/CategoryChips';
import WhyBento from '@/components/home/WhyBento';
import NewProductsSection from '@/components/home/NewProductsSection';
import GiftSetsSection from '@/components/home/GiftSetsSection';
import Statement from '@/components/home/Statement';
import Testimonials from '@/components/home/Testimonials';
import TrustBar from '@/components/home/TrustBar';
import { ProductCardSkeleton, CategoryChipSkeleton } from '@/components/ui/Skeleton';

async function fetchCategories() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

function NewProductsSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="h-7 w-44 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto py-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <CategoryChipSkeleton key={i} />
      ))}
    </div>
  );
}

function GiftSetsSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="h-7 w-52 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const categories = await fetchCategories();

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <HeroSection />

      {/* All other sections share the hero's container/padding so edges align */}
      <div className="max-w-7xl mx-auto px-5">
        {/* AI Finder */}
        <div className="pb-12 lg:pb-[78px]">
          <GiftbotBanner />
        </div>

        {/* Why Giftlandiya — bento grid */}
        <div className="pb-12 lg:pb-[78px]">
          <WhyBento />
        </div>

        {/* Category chips */}
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryChips categories={categories} />
        </Suspense>

        {/* New products */}
        <div className="pb-12 lg:pb-[78px]">
          <Suspense fallback={<NewProductsSkeleton />}>
            <NewProductsSection />
          </Suspense>
        </div>

        {/* Gift sets / collections */}
        <div className="pb-12 lg:pb-[78px]">
          <Suspense fallback={<GiftSetsSkeleton />}>
            <GiftSetsSection />
          </Suspense>
        </div>
      </div>

      {/* Statement — full-bleed dark section */}
      <Statement />

      <div className="max-w-7xl mx-auto px-5">
        <div className="py-12 lg:py-[78px]">
          <Testimonials />
        </div>

        <TrustBar />
      </div>
    </main>
  );
}
