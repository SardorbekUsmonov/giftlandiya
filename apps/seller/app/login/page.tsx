'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/seller/login', { phone, password });
      const { accessToken, seller } = res.data.data;
      setAuth(accessToken, seller);
      router.replace('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Telefon yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl text-4xl shadow-lg"
            style={{ backgroundColor: '#7C3AED' }}
          >
            🎁
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Giftlandiya</h1>
            <p className="mt-1 text-sm" style={{ color: '#9CA3AF' }}>Sotuvchi paneli</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: '#CBD5E1' }}>
              Telefon raqam
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              required
              inputMode="tel"
              className="w-full rounded-2xl border px-4 py-3.5 text-base text-white outline-none transition-colors focus:border-brand"
              style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: '#CBD5E1' }}>
              Parol
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-2xl border px-4 py-3.5 text-base text-white outline-none transition-colors focus:border-brand"
              style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
            />
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: '#2D0A0A', color: '#F87171' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl py-4 text-base font-bold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: '#7C3AED' }}
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
