'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import MobileShell from '@/components/MobileShell';
import api from '@/lib/api';

const StatsChart = dynamic(() => import('@/components/StatsChart'), { ssr: false });

interface StatsData {
  dailyRevenue: Array<{ date: string; revenue: number }>;
  monthlyRevenue: number;
  monthlyTarget: number;
  totalOrders: number;
  baseSalary: number;
  commissionRate: number;
  rank: number;
  leaderboard: Array<{ id: string; name: string; revenue: number; isMe: boolean }>;
}

function RingProgress({ percent }: { percent: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        {/* Background ring */}
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke="#2A3040"
          strokeWidth="10"
        />
        {/* Progress ring */}
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
        />
        {/* Center text */}
        <text x="64" y="64" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="22" fontWeight="700">
          {percent}%
        </text>
      </svg>
      <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>Oylik maqsad</p>
    </div>
  );
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/stats')
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const progress = data
    ? Math.min(100, Math.round((data.monthlyRevenue / (data.monthlyTarget || 1)) * 100))
    : 0;
  const commission = data ? Math.round(data.monthlyRevenue * data.commissionRate) : 0;
  const totalEarning = data ? data.baseSalary + commission : 0;

  return (
    <MobileShell>
      <div className="px-4 pt-5">
        <h1 className="mb-4 text-xl font-semibold text-white">Statistika</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl" style={{ backgroundColor: '#181C25' }} />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Bar chart — last 7 days */}
            <div className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}>
              <p className="mb-3 text-sm font-semibold text-white">Oxirgi 7 kun</p>
              <StatsChart data={data.dailyRevenue} />
            </div>

            {/* Ring + bonus side by side */}
            <div className="mb-4 flex gap-3">
              {/* Ring */}
              <div
                className="flex flex-1 flex-col items-center justify-center rounded-2xl border py-5"
                style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
              >
                <RingProgress percent={progress} />
                <p className="mt-2 text-center text-xs" style={{ color: '#9CA3AF' }}>
                  {(data.monthlyRevenue / 1000).toFixed(0)}K / {(data.monthlyTarget / 1000).toFixed(0)}K so&apos;m
                </p>
              </div>

              {/* Bonus calculation */}
              <div
                className="flex flex-1 flex-col justify-center rounded-2xl border p-4 space-y-2"
                style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}
              >
                <p className="text-xs font-semibold" style={{ color: '#64748B' }}>HISOB-KITOB</p>
                <div>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Asosiy maosh</p>
                  <p className="text-sm font-semibold text-white">
                    {data.baseSalary.toLocaleString('uz-UZ')} so&apos;m
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Komissiya {Math.round(data.commissionRate * 100)}%
                  </p>
                  <p className="text-sm font-semibold text-white">
                    +{commission.toLocaleString('uz-UZ')} so&apos;m
                  </p>
                </div>
                <div className="border-t pt-2" style={{ borderColor: '#2A3040' }}>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Jami</p>
                  <p className="text-base font-bold" style={{ color: '#F59E0B' }}>
                    {totalEarning.toLocaleString('uz-UZ')} so&apos;m
                  </p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="mb-4 rounded-2xl border overflow-hidden" style={{ backgroundColor: '#181C25', borderColor: '#2A3040' }}>
              <p className="border-b px-4 py-3 text-sm font-semibold text-white" style={{ borderColor: '#2A3040' }}>
                Reyting 🏆
              </p>
              {data.leaderboard.map((seller, i) => (
                <div
                  key={seller.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={seller.isMe
                    ? { backgroundColor: '#EDE9FE', borderLeft: '4px solid #7C3AED' }
                    : { borderBottom: '1px solid #2A3040' }
                  }
                >
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={seller.isMe
                      ? { backgroundColor: '#7C3AED', color: '#FFFFFF' }
                      : { backgroundColor: '#2A3040', color: '#9CA3AF' }
                    }
                  >
                    {i + 1}
                  </span>
                  <p
                    className="flex-1 truncate text-sm font-medium"
                    style={{ color: seller.isMe ? '#5B21B6' : '#F8FAFC' }}
                  >
                    {seller.name} {seller.isMe && '(Men)'}
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: seller.isMe ? '#5B21B6' : '#F59E0B' }}
                  >
                    {(seller.revenue / 1000).toFixed(0)}K
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-sm" style={{ color: '#9CA3AF' }}>
            Ma&apos;lumot yuklanmadi
          </p>
        )}
      </div>
    </MobileShell>
  );
}
