'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import SectionHeader from '@/components/ui/SectionHeader';

interface GiftSet {
  id: string;
  gradient: string;
  titleUz: string;
  titleRu: string;
  slug: string;
}

const GIFT_SETS: GiftSet[] = [
  {
    id: '1',
    gradient: 'linear-gradient(160deg, #581C87, #C084FC)',
    titleUz: "Ayollar uchun to'plam",
    titleRu: 'Набор для женщин',
    slug: 'ayollar-toplam',
  },
  {
    id: '2',
    gradient: 'linear-gradient(160deg, #7C2D12, #F08C3A)',
    titleUz: "Tug'ilgan kun seti",
    titleRu: 'Набор на день рождения',
    slug: 'tugilgan-kun-set',
  },
  {
    id: '3',
    gradient: 'linear-gradient(160deg, #1E3A5F, #5B8DB8)',
    titleUz: 'Yangi uy uchun',
    titleRu: 'Для нового дома',
    slug: 'yangi-uy-set',
  },
  {
    id: '4',
    gradient: 'linear-gradient(160deg, #3D2645, #7C3AED)',
    titleUz: "To'y sovg'asi",
    titleRu: 'Свадебный подарок',
    slug: 'toy-sovgasi',
  },
];

export default function GiftSetsSection() {
  const locale = useLocale();
  const t = useTranslations('giftSets');

  return (
    <section>
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {GIFT_SETS.map((set) => {
          const title = locale === 'ru' ? set.titleRu : set.titleUz;
          return (
            <Link
              key={set.id}
              href={`/product/${set.slug}`}
              className="relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-3xl p-[26px] transition-transform duration-300 hover:scale-[1.008] lg:min-h-[320px]"
              style={{ background: set.gradient }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62), transparent 58%)' }}
              />
              <h3 className="relative z-10 mb-2 max-w-[240px] text-xl font-bold leading-[1.25] text-white">
                {title}
              </h3>
              <span className="relative z-10 text-[12.5px] font-semibold text-white/92">
                {t('viewCollection')} &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
