'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',        icon: '🏠', label: 'Bosh sahifa' },
  { href: '/orders',  icon: '📦', label: 'Buyurtmalar' },
  { href: '/stats',   icon: '📊', label: 'Statistika' },
  { href: '/profile', icon: '👤', label: 'Profil' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-center border-t pb-safe"
      style={{ backgroundColor: '#0F1117', borderColor: '#2A3040' }}
    >
      {NAV.map(({ href, icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
            style={{ minHeight: 56 }}
          >
            <span
              className="flex h-10 w-14 items-center justify-center rounded-xl text-xl transition-colors"
              style={active ? { backgroundColor: '#EDE9FE' } : undefined}
            >
              {icon}
            </span>
            <span
              className="text-[10px] font-medium transition-colors"
              style={{ color: active ? '#7C3AED' : '#9CA3AF' }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
