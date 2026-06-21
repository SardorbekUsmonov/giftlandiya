'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Star } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cell = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function WhyBento() {
  const t = useTranslations('whyBento');

  return (
    <section>
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-1 gap-3.5 md:grid-cols-4 md:grid-rows-[110px_110px_110px]"
      >
        {/* AI feature — tall tile, content anchored to bottom */}
        <motion.div
          variants={cell}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-[220px] flex-col justify-end rounded-[18px] p-6 text-white md:col-span-2 md:row-span-3"
          style={{ background: 'linear-gradient(150deg, #1A1428 0%, #7C3AED 100%)' }}
        >
          <div
            className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Sparkles className="h-[19px] w-[19px]" />
          </div>
          <h3 className="mb-1.5 text-[19px] font-bold">{t('feature')}</h3>
          <p className="text-[12.5px] leading-[1.6] text-white/78">{t('featureDesc')}</p>
        </motion.div>

        {/* Coming soon — wide tile, fills the remaining 2x2 to avoid grid gaps */}
        <motion.div
          variants={cell}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
          className="flex min-h-[160px] flex-col justify-center gap-3 rounded-[18px] border border-[#E9E9EC] bg-white p-6 md:col-span-2 md:row-span-2"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]"
              style={{ backgroundColor: 'rgba(124,58,237,0.12)' }}
            >
              <Gift className="h-4 w-4" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{t('comingSoon')}</h4>
              <p className="mt-0.5 text-[11.5px] text-gray-500">{t('comingSoonDesc')}</p>
            </div>
          </div>
        </motion.div>

        {/* Stat */}
        <motion.div
          variants={cell}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center rounded-[18px] border border-[#E9E9EC] bg-white py-[22px] text-center md:col-span-1 md:row-span-1"
        >
          <b className="text-2xl font-bold" style={{ color: '#7C3AED' }}>
            {t('responseTime')}
          </b>
          <span className="text-[11px] text-gray-500">{t('aiTime')}</span>
        </motion.div>

        {/* Stat */}
        <motion.div
          variants={cell}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center rounded-[18px] border border-[#E9E9EC] bg-white py-[22px] text-center md:col-span-1 md:row-span-1"
        >
          <b className="flex items-center gap-1 text-2xl font-bold" style={{ color: '#7C3AED' }}>
            4.9
            <Star className="h-4 w-4" fill="#7C3AED" stroke="#7C3AED" />
          </b>
          <span className="text-[11px] text-gray-500">{t('rating')}</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
