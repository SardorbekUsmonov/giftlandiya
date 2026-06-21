'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import { getAuth, clearAuth } from '@/lib/auth';
import api from '@/lib/api';

interface ProfileData {
  totalOrders: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  joinedAt: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-lg" style={{ color: s <= Math.round(rating) ? '#F59E0B' : '#2A3040' }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const auth = typeof window !== 'undefined' ? getAuth() : null;
  const seller = auth?.seller;
  const name = seller?.user?.name ?? seller?.shopName ?? 'Sotuvchi';
  const phone = seller?.user?.phone ?? '';
  const shopName = seller?.shopName ?? '';
  const initials = name.slice(0, 2).toUpperCase();

  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    api.get('/seller/profile/stats')
      .then((r) => setData(r.data.data))
      .catch(() => null);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  return (
    <MobileShell>
      <div className="px-4 pt-5 pb-6">
        {/* Avatar + info */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {initials}
          </div>
          <h1 className="text-xl font-bold text-white">{name}</h1>
          {shopName && shopName !== name && (
            <p className="mt-0.5 text-sm" style={{ color: '#A78BFA' }}>{shopName}</p>
          )}
          {phone && (
            <p className="mt-1 text-sm" style={{ color: '#9CA3AF' }}>{phone}</p>
          )}
        </div>

        {/* Stats */}
        {data && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Buyurtmalar', value: data.totalOrders, suffix: '' },
                { label: 'Daromad', value: `${(data.totalRevenue / 1000).toFixed(0)}K`, suffix: '' },
                { label: 'Reyting', value: data.rating.toFixed(1), suffix: '' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl border p-3 text-center"
                  style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
                >
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: '#9CA3AF' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Rating stars */}
            <div
              className="mb-4 flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
            >
              <div>
                <p className="text-sm font-medium text-white">Mijozlar baholashi</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{data.reviewCount} sharh asosida</p>
              </div>
              <Stars rating={data.rating} />
            </div>
          </>
        )}

        {/* Menu items */}
        <div className="mb-6 rounded-2xl border overflow-hidden" style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}>
          {[
            { icon: '📋', label: 'Mening buyurtmalarim', href: '/orders' },
            { icon: '📊', label: 'Hisobotlarim', href: '/stats' },
          ].map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:opacity-80 active:opacity-60"
              style={i > 0 ? { borderTop: '1px solid #2A3040' } : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-white">{item.label}</span>
              <svg className="h-4 w-4" style={{ color: '#64748B' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border py-4 text-sm font-semibold transition-colors active:opacity-70"
          style={{ borderColor: '#EF4444', color: '#EF4444', backgroundColor: 'transparent' }}
        >
          🚪 Chiqish
        </button>
      </div>
    </MobileShell>
  );
}
