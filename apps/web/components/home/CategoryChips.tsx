'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LayoutGrid } from 'lucide-react';

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  slug: string;
}

const ALL_ID = '__all__';

export default function CategoryChips({ categories }: { categories: Category[] }) {
  const locale = useLocale();
  const [active, setActive] = useState<string>(ALL_ID);

  const chips = [
    { id: ALL_ID, nameUz: 'Barchasi', nameRu: 'Все', slug: '' },
    ...categories,
  ];

  return (
    <div className="flex gap-[9px] overflow-x-auto py-4 scrollbar-hide">
      {chips.map((cat) => {
        const isActive = active === cat.id;
        const href = cat.id === ALL_ID ? '/catalog' : `/catalog?category=${cat.slug}`;
        return (
          <Link
            key={cat.id}
            href={href}
            onClick={() => setActive(cat.id)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-[18px] py-2.5 text-[13px] font-medium transition-all"
            style={
              isActive
                ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED', color: '#fff', transform: 'scale(1.04)' }
                : { backgroundColor: '#fff', borderColor: '#E9E9EC', color: '#111827' }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#7C3AED';
                e.currentTarget.style.color = '#7C3AED';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#E9E9EC';
                e.currentTarget.style.color = '#111827';
              }
            }}
          >
            {cat.id === ALL_ID && <LayoutGrid className="h-3.5 w-3.5" />}
            {locale === 'ru' ? cat.nameRu : cat.nameUz}
          </Link>
        );
      })}
    </div>
  );
}
