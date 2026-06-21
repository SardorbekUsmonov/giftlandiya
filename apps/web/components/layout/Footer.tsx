import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Gift } from 'lucide-react';

export default async function Footer() {
  const t = await getTranslations('footer');

  const cols = [
    {
      title: t('katalogHeader'),
      links: [
        { label: t('allProducts'), href: '/catalog' },
        { label: t('giftSets'), href: '/catalog?category=gift-sets' },
        { label: t('souvenirs'), href: '/catalog?category=suvenirlar' },
        { label: t('homeDecor'), href: '/catalog?category=dekor' },
        { label: t('newArrivals'), href: '/catalog?sort=newest' },
      ],
    },
    {
      title: t('mijozlarHeader'),
      links: [
        { label: t('orderTracking'), href: '/track' },
        { label: t('returnPolicy'), href: '/returns' },
        { label: t('deliveryInfo'), href: '/delivery' },
        { label: t('faq'), href: '/faq' },
      ],
    },
    {
      title: t('kontaktHeader'),
      links: [
        { label: '+998 90 123 45 67', href: 'tel:+998901234567' },
        { label: 'info@giftlandiya.uz', href: 'mailto:info@giftlandiya.uz' },
        { label: 'Telegram', href: 'https://t.me/giftlandiya' },
        { label: 'Instagram', href: 'https://instagram.com/giftlandiya' },
      ],
    },
  ];

  return (
    <footer className="mt-2 text-white" style={{ backgroundColor: '#0B0B0E' }}>
      <div className="max-w-7xl mx-auto px-5 pt-12 pb-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link href="/" className="mb-[10px] flex items-center gap-[7px] text-white">
              <Gift className="h-5 w-5" strokeWidth={1.8} />
              <span className="font-bold text-[17px] tracking-[-0.01em]">Giftlandiya</span>
            </Link>
            <p className="max-w-[280px] text-[12.5px] leading-[1.7]" style={{ color: '#71717A' }}>
              {t('description')}
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-[13px] text-[12.5px] font-semibold text-white">{col.title}</h4>
              <div className="flex flex-col">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="mb-[9px] text-[12.5px] text-[#A1A1AA] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-9 flex flex-col gap-2 border-t pt-5 text-[11.5px] text-[#52525B] md:flex-row md:items-center md:justify-between"
          style={{ borderColor: '#1F1F23' }}
        >
          <span>{t('copyright', { year: new Date().getFullYear() })}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-white">
              {t('privacyPolicy')}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
