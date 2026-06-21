'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

const SLUGS = ['qiz-dost', 'yigit', 'ona', 'ota', 'dost', 'oqituvchi'];

export default function GiftbotBanner() {
  const router = useRouter();
  const t = useTranslations('aiFinder');
  const [active, setActive] = useState<string | null>(null);

  const labels = t.raw('chips') as string[];
  const chips = SLUGS.map((slug, i) => ({ slug, label: labels[i] }));

  const handleSelect = (slug: string) => {
    setActive(slug);
    setTimeout(() => {
      router.push(`/gift-advisor?for=${slug}`);
    }, 500);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-[#E9E9EC] px-[22px] py-9 text-center md:px-12 md:py-[52px]"
      style={{ background: 'linear-gradient(165deg, #F5F2FE 0%, #FFFFFF 100%)' }}
    >
      <h2 className="mb-2 text-[23px] font-bold text-gray-900">{t('title')}</h2>
      <p className="mb-6 text-[13.5px] text-gray-500">{t('subtitle')}</p>

      <div className="mb-[18px] flex flex-wrap justify-center gap-[9px]">
        {chips.map((chip) => {
          const isActive = active === chip.slug;
          return (
            <button
              key={chip.slug}
              type="button"
              onClick={() => handleSelect(chip.slug)}
              className="rounded-full border-[1.5px] px-[18px] py-2.5 text-[13px] font-medium transition-all"
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
              {chip.label}
            </button>
          );
        })}
      </div>

      <p
        className="h-4 text-xs font-semibold transition-opacity"
        style={{ color: '#7C3AED', opacity: active ? 1 : 0 }}
      >
        {t('confirmation')}
      </p>
    </motion.section>
  );
}
