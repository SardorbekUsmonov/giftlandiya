'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, type Variants } from 'framer-motion';
import { Sparkles, LayoutGrid, Check } from 'lucide-react';

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function HeroSection() {
  const t = useTranslations('hero');

  return (
    <section className="relative overflow-hidden pt-12 pb-14 lg:pt-[72px] lg:pb-[90px]">
      <div className="max-w-7xl mx-auto px-5">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16"
        >
          {/* Left — copy */}
          <div className="lg:flex-[1.1]">
            <motion.div
              variants={item}
              className="mb-[18px] inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: '#7C3AED' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
              {t('tag')}
            </motion.div>

            <motion.h1
              variants={item}
              className="mb-4 text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-gray-900 lg:text-[52px]"
            >
              <span className="block">{t('headline1')}</span>
              <span className="block">{t('headline2')}</span>
              <span className="block">{t('headline3')}</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mb-7 max-w-[420px] text-[15.5px] leading-[1.6] text-gray-500 lg:text-[17px]"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/gift-advisor"
                className="inline-flex items-center gap-2 rounded-full px-[26px] py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:brightness-[1.07]"
                style={{ backgroundColor: '#F59E0B', color: '#1C0A00', boxShadow: '0 10px 28px -10px rgba(245,158,11,0.6)' }}
              >
                <Sparkles className="h-4 w-4" />
                {t('ctaPrimary')}
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#E9E9EC] px-[26px] py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                <LayoutGrid className="h-4 w-4" />
                {t('ctaSecondary')}
              </Link>
            </motion.div>
          </div>

          {/* Right — image placeholder */}
          <motion.div variants={item} className="relative lg:flex-1">
            <div
              className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl"
              style={{ background: 'linear-gradient(150deg, #1E1531 0%, #7C3AED 55%, #C4B5FD 100%)' }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: 'radial-gradient(circle at 75% 18%, rgba(255,255,255,0.22), transparent 55%)' }}
              />
              <p className="absolute bottom-[18px] left-[18px] text-xs text-white/85">
                N&deg; 014 &middot; Mehmonxona to&apos;plami
              </p>
            </div>

            {/* Floating glass card */}
            <div
              className="absolute bottom-[-16px] left-[14px] flex min-w-[180px] items-center gap-3 rounded-2xl border px-5 py-3.5 backdrop-blur-[18px]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderColor: 'rgba(255,255,255,0.25)',
                boxShadow: '0 16px 36px -16px rgba(0,0,0,0.4)',
              }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
              >
                <Check className="h-[15px] w-[15px] text-white" />
              </div>
              <div className="whitespace-nowrap">
                <b className="block text-[13px] text-white">50,000+</b>
                <span className="text-[10.5px] text-white/75">{t('statLabel')}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
