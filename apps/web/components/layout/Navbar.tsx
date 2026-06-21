'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Gift, Search, Heart, ShoppingCart, User, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { routing } from '@/i18n/routing';

const LOCALE_LABELS: Record<string, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const count = useCartStore((s) => s.count());
  const localeMenuRef = useRef<HTMLDivElement>(null);

  const localePath = `/${locale}`;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : '/catalog');
    setMobileSearchOpen(false);
  };

  const switchLocale = (nextLocale: string) => {
    setLocaleMenuOpen(false);
    const segments = pathname.split('/');
    segments[1] = nextLocale;
    const queryString = searchParams.toString();
    router.push(segments.join('/') + (queryString ? `?${queryString}` : ''));
  };

  useEffect(() => {
    if (!localeMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(e.target as Node)) {
        setLocaleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [localeMenuOpen]);

  const iconBtn =
    'relative flex h-[38px] w-[38px] items-center justify-center rounded-full text-gray-900 transition-colors duration-200 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]';

  return (
    <header
      className="sticky top-0 z-[100] border-b border-[#E9E9EC] backdrop-blur-[18px] backdrop-saturate-150"
      style={{ backgroundColor: 'rgba(250,250,250,0.78)' }}
    >
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center gap-3.5 py-3.5">
          {/* Logo */}
          <Link
            href={localePath}
            className="flex flex-shrink-0 items-center gap-[7px] text-[17px] font-bold tracking-[-0.01em]"
            style={{ color: '#7C3AED' }}
          >
            <Gift className="h-5 w-5" strokeWidth={1.8} />
            Giftlandiya
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="relative hidden md:flex flex-1 max-w-[480px]">
            <Search className="pointer-events-none absolute left-[14px] top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Sovg'a, g'oya yoki ilhom izlang..."
              className="w-full rounded-full border border-[#E9E9EC] bg-white py-[11px] pl-10 pr-4 text-[13.5px] text-gray-900 outline-none transition-shadow placeholder:text-[#9CA3AF] focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#7C3AED]/[0.16]"
            />
          </form>

          {/* Actions */}
          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Qidirish"
              className={`${iconBtn} md:hidden`}
            >
              <Search className="h-[19px] w-[19px]" />
            </button>

            {/* Locale switcher */}
            <div className="relative" ref={localeMenuRef}>
              <button
                type="button"
                onClick={() => setLocaleMenuOpen((v) => !v)}
                aria-label="Tilni tanlash"
                className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                {locale.toUpperCase()}
                <ChevronDown className="h-3 w-3" />
              </button>

              {localeMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-36 rounded-2xl border border-[#E9E9EC] bg-white p-1.5 shadow-lg">
                  {routing.locales.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => switchLocale(l)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                      style={l === locale ? { color: '#7C3AED', fontWeight: 600 } : { color: '#111827' }}
                    >
                      {LOCALE_LABELS[l] ?? l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" aria-label="Sevimlilar" className={iconBtn}>
              <Heart className="h-[19px] w-[19px]" />
            </button>

            <Link href="/cart" aria-label="Savat" className={iconBtn}>
              <ShoppingCart className="h-[19px] w-[19px]" />
              {count > 0 && (
                <span
                  className="absolute top-[5px] right-[6px] h-[7px] w-[7px] rounded-full"
                  style={{ backgroundColor: '#F59E0B' }}
                />
              )}
            </Link>

            <Link href="/login" aria-label="Kirish" className={iconBtn}>
              <User className="h-[19px] w-[19px]" strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        {/* Mobile search — toggled */}
        {mobileSearchOpen && (
          <form onSubmit={handleSearch} className="relative md:hidden pb-3.5">
            <Search className="pointer-events-none absolute left-[14px] top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#9CA3AF]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Sovg'a, g'oya yoki ilhom izlang..."
              className="w-full rounded-full border border-[#E9E9EC] bg-white py-[11px] pl-10 pr-4 text-[13.5px] text-gray-900 outline-none placeholder:text-[#9CA3AF] focus:border-[#7C3AED]"
            />
          </form>
        )}
      </div>
    </header>
  );
}
