'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Star, ShoppingCart } from 'lucide-react';
import { useCartStore, CartItem } from '@/stores/cart';

interface ProductCardProps {
  id: string;
  nameUz: string;
  nameRu: string;
  price: number;
  comparePrice?: number;
  images: string[];
  slug: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isNew?: boolean;
}

export default function ProductCard({
  id, nameUz, nameRu, price, comparePrice, images, slug,
  rating, reviewCount, stock, isNew,
}: ProductCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('product');
  const add = useCartStore((s) => s.add);

  const name = locale === 'ru' ? nameRu : nameUz;
  const image = images[0] ?? '/placeholder.webp';
  const discountPct = comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;
  const badge = isNew ? 'Yangi' : discountPct > 0 ? `-${discountPct}%` : stock > 0 && stock <= 3 ? 'Tugayapti' : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const item: CartItem = { id, nameUz, nameRu, price, image, qty: 1, slug };
    add(item);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/product/${slug}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/product/${slug}`)}
      className="group cursor-pointer"
    >
      {/* Photo */}
      <div className="relative mb-[11px] aspect-square overflow-hidden rounded-[18px] bg-gray-50">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center"
          loading="lazy"
        />

        {badge && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-white/94 px-[9px] py-1 text-[10px] font-semibold text-gray-900">
            {badge}
          </span>
        )}

        <button
          onClick={handleAddToCart}
          aria-label={t('addToCart')}
          title={t('addToCart')}
          className="absolute bottom-2.5 right-2.5 flex h-[34px] w-[34px] translate-y-[6px] items-center justify-center rounded-full bg-white opacity-0 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.25)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingCart className="h-[15px] w-[15px]" style={{ color: '#7C3AED' }} />
        </button>
      </div>

      {/* Info */}
      <p className="mb-1 line-clamp-2 text-[13.5px] font-medium text-gray-900">{name}</p>

      <p className="text-[14.5px] font-bold text-gray-900">
        {price.toLocaleString('uz-UZ')} so&apos;m
        {comparePrice && (
          <span className="ml-1 text-[11px] font-normal text-[#9CA3AF] line-through">
            {comparePrice.toLocaleString('uz-UZ')}
          </span>
        )}
      </p>

      {reviewCount > 0 && (
        <div className="mt-[3px] flex items-center gap-1 text-[11px] text-[#9CA3AF]">
          <Star className="h-[11px] w-[11px]" fill="#9CA3AF" stroke="#9CA3AF" />
          {rating} &middot; {reviewCount} {t('reviews')}
        </div>
      )}

      <button
        onClick={handleAddToCart}
        className="mt-2.5 w-full rounded-[10px] py-[9px] text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#7C3AED' }}
      >
        {t('addToCart')}
      </button>
    </motion.div>
  );
}
