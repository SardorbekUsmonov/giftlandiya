'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const NAV = [
  { href: '/',             icon: '📊', label: 'Dashboard' },
  { href: '/orders',       icon: '📦', label: 'Buyurtmalar' },
  { href: '/products',     icon: '🛍️', label: 'Mahsulotlar' },
  { href: '/categories',   icon: '📁', label: 'Kategoriyalar' },
  { href: '/customers',    icon: '👥', label: 'Mijozlar' },
  { href: '/sellers',      icon: '🏪', label: 'Sotuvchilar' },
  { href: '/analytics',    icon: '📈', label: 'Analitika' },
  { href: '/marketing',    icon: '🎯', label: 'Marketing' },
  { href: '/settings',     icon: '⚙️', label: 'Sozlamalar' },
] as const;

function getBreadcrumb(path: string) {
  const item = NAV.find((n) => (n.href === '/' ? path === '/' : path.startsWith(n.href)));
  return item?.label ?? 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = localStorage.getItem('admin-auth');
    if (!auth) router.replace('/login');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    document.cookie = 'admin-token=; max-age=0; path=/';
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col"
        style={{ backgroundColor: '#7C3AED' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="text-2xl">🎁</span>
          <span className="text-xl font-bold text-white">Giftlandiya</span>
        </div>

        <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
          Admin Panel
        </p>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
          {NAV.map(({ href, icon, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-white/20 font-medium text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mx-3 mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>🚪</span>
          Chiqish
        </button>
      </aside>

      {/* Main area */}
      <div className="ml-60 flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <p className="text-sm text-gray-500">{getBreadcrumb(pathname)}</p>
          <div className="flex items-center gap-3">
            <button className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: '#7C3AED' }}
            >
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
