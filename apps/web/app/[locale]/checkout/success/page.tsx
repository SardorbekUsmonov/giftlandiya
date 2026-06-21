'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const COLORS = ['#7C3AED', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#A855F7', '#EC4899'];

interface Piece {
  id: number;
  color: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        left: Math.random() * 100,
        delay: Math.random() * 1.8,
        duration: 2.2 + Math.random() * 1.8,
        size: 6 + Math.random() * 10,
        rotate: Math.random() * 360,
      })),
    );
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white flex flex-col items-center justify-center px-4">
      {/* Confetti pieces */}
      {pieces.map((p) => (
        <div
          key={p.id}
          aria-hidden="true"
          className="pointer-events-none absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animationName: 'confetti-fall',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: 'ease-in',
            animationFillMode: 'both',
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Icon */}
        <div
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg"
          style={{ backgroundColor: '#ECFDF5' }}
        >
          ✅
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Buyurtmangiz qabul qilindi!
        </h1>
        <p className="text-gray-500 mb-4 leading-relaxed">
          Tez orada operator siz bilan bog&apos;lanadi va yetkazib berish vaqtini tasdiqlaydi.
        </p>

        {orderNumber && (
          <div className="mb-6 rounded-xl bg-gray-50 border border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400 mb-1">Buyurtma raqami</p>
            <p className="font-mono font-semibold text-gray-900 text-lg tracking-wider">
              {orderNumber}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          {orderNumber && (
            <Link
              href={`/track/${orderNumber}`}
              className="w-full rounded-xl py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#7C3AED' }}
            >
              Buyurtmani kuzatish
            </Link>
          )}
          <Link
            href="/"
            className="w-full rounded-xl border border-gray-200 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Savollar uchun: <span className="font-medium text-gray-600">+998 71 XXX-XX-XX</span>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-400">Yuklanmoqda...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
