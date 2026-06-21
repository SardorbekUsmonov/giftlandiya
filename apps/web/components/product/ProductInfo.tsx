'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCartStore } from '@/stores/cart';

interface Category {
  nameUz: string;
  nameRu: string;
  slug: string;
}

interface Props {
  id: string;
  nameUz: string;
  nameRu: string;
  price: number;
  comparePrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  occasions: string[];
  forWhom: string[];
  descUz: string;
  descRu?: string;
  images: string[];
  slug: string;
  category?: Category;
}

const GIFT_OPTIONS = [
  { key: 'wrap', icon: '🎁', labelUz: "Sovg'a o'rash", labelRu: 'Подарочная упаковка' },
  { key: 'card', icon: '💌', labelUz: 'Otkritka', labelRu: 'Открытка' },
  { key: 'secret', icon: '🤫', labelUz: 'Yashirin yuborish', labelRu: 'Тайный отправитель' },
] as const;

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-gold text-base">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

export default function ProductInfo({
  id, nameUz, nameRu, price, comparePrice, stock,
  rating, reviewCount, occasions, forWhom, images, slug, category,
}: Props) {
  const router = useRouter();
  const locale = useLocale();
  const add = useCartStore((s) => s.add);
  const [giftOptions, setGiftOptions] = useState<Set<string>>(new Set());

  const name = locale === 'ru' ? nameRu : nameUz;
  const image = images[0] ?? '/placeholder.webp';
  const inStock = stock > 0;

  const discountPct = comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const toggleGift = (key: string) =>
    setGiftOptions((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleAddToCart = () => {
    add({ id, nameUz, nameRu, price, image, qty: 1, slug });
  };

  const handleBuyNow = () => {
    add({ id, nameUz, nameRu, price, image, qty: 1, slug });
    router.push('/checkout');
  };

  const pills = [...(occasions ?? []), ...(forWhom ?? [])];

  return (
    <div className="flex flex-col gap-4">
      {/* Category + occasion pills */}
      <div className="flex flex-wrap gap-1.5">
        {category && (
          <span className="rounded-full border border-brand/30 bg-brand-bg px-3 py-1 text-xs font-medium text-brand-text">
            {locale === 'ru' ? category.nameRu : category.nameUz}
          </span>
        )}
        {pills.slice(0, 4).map((p) => (
          <span key={p} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
            {p}
          </span>
        ))}
      </div>

      {/* Name */}
      <h1 className="text-2xl font-semibold leading-snug text-gray-900">{name}</h1>

      {/* Price row */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
          {price.toLocaleString('uz-UZ')} so&apos;m
        </span>
        {comparePrice && (
          <>
            <span className="text-base text-gray-400 line-through">
              {comparePrice.toLocaleString('uz-UZ')}
            </span>
            {discountPct > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-700">
                -{discountPct}%
              </span>
            )}
          </>
        )}
      </div>

      {/* Rating */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-2">
          <Stars rating={rating} />
          <span className="text-sm text-gray-500">{rating.toFixed(1)}</span>
          <span className="text-sm text-gray-400">·</span>
          <span className="text-sm text-gray-500">{reviewCount} sharh</span>
        </div>
      )}

      {/* Uzum Nasiya */}
      {price >= 100000 && (
        <div className="rounded-xl p-3" style={{ backgroundColor: '#EDE9FE' }}>
          <p className="text-sm font-medium text-brand-text">
            💳 3 oy × {Math.round(price / 3).toLocaleString('uz-UZ')} so&apos;m
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Uzum Nasiya · 0% foiz</p>
        </div>
      )}

      {/* Gift options */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Sovg&apos;a sozlamalari</p>
        <div className="flex flex-wrap gap-2">
          {GIFT_OPTIONS.map(({ key, icon, labelUz, labelRu }) => {
            const active = giftOptions.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleGift(key)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all"
                style={
                  active
                    ? { backgroundColor: '#EDE9FE', borderColor: '#7C3AED', color: '#5B21B6' }
                    : { backgroundColor: 'white', borderColor: '#E5E7EB', color: '#374151' }
                }
              >
                <span>{icon}</span>
                <span>{locale === 'ru' ? labelRu : labelUz}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Delivery info */}
      <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3">
        <div className="flex items-start gap-2 text-sm">
          <span className="text-green-600">✅</span>
          <span className="text-gray-700">Bugun buyurtma → ertaga yetkazish</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <span>📦</span>
          <span className="text-gray-700">
            Toshkent bo&apos;ylab{' '}
            <span className="font-semibold">50,000 so&apos;mdan</span> bepul yetkazish
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#7C3AED' }}
        >
          {inStock ? 'Savatga qo\'shish' : 'Stokda yo\'q'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="w-full rounded-xl py-3 text-base font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#F59E0B', color: '#1C0A00' }}
        >
          Sotib olish
        </button>
      </div>
    </div>
  );
}
