'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-5xl">😔</div>
      <h2 className="text-xl font-semibold text-gray-800">Xatolik yuz berdi</h2>
      <p className="text-gray-500 text-center text-sm max-w-xs">
        Sahifani yuklashda muammo bo&apos;ldi. Iltimos, qayta urinib ko&apos;ring.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl text-white font-semibold"
        style={{ backgroundColor: '#7C3AED' }}
      >
        Qayta urinish
      </button>
    </div>
  );
}
