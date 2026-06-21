'use client';

import { useState } from 'react';
import Image from 'next/image';
import VideoPlayer from './VideoPlayer';

interface MediaItem {
  type: 'image' | 'video' | '360';
  src: string;
}

interface Props {
  images: string[];
  videoUrl?: string;
  model3dUrl?: string;
  productName: string;
  isNew?: boolean;
  inStock: boolean;
}

export default function MediaGallery({ images, videoUrl, model3dUrl, productName, isNew, inStock }: Props) {
  const items: MediaItem[] = [
    ...images.map((src) => ({ type: 'image' as const, src })),
    ...(videoUrl ? [{ type: 'video' as const, src: videoUrl }] : []),
    ...(model3dUrl ? [{ type: '360' as const, src: model3dUrl }] : []),
  ];

  const [idx, setIdx] = useState(0);
  const [wishlist, setWishlist] = useState(false);

  const cur = items[idx] ?? { type: 'image', src: '/placeholder.webp' };
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);

  const has360 = items.some((m) => m.type === '360');

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: productName, url: window.location.href }).catch(() => null);
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => null);
    }
  };

  return (
    <div className="flex gap-3">
      {/* Vertical thumbnail strip — desktop only */}
      {items.length > 1 && (
        <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === idx ? 'border-brand ring-2 ring-brand ring-offset-1' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {item.type === 'image' && (
                <Image src={item.src} alt={`${productName} ${i + 1}`} fill className="object-cover" />
              )}
              {item.type === 'video' && (
                <div className="relative h-full w-full bg-gray-900 flex items-center justify-center">
                  {images[0] && <Image src={images[0]} alt="video thumb" fill className="object-cover opacity-50" />}
                  <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                    <svg className="ml-0.5 h-3 w-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <span className="absolute bottom-1 right-1 rounded bg-gold px-1 text-[10px] font-bold text-gray-900">
                    Video
                  </span>
                </div>
              )}
              {item.type === '360' && (
                <div className="h-full w-full bg-brand-bg flex flex-col items-center justify-center gap-0.5">
                  <svg className="h-6 w-6 text-brand" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-[10px] font-bold text-brand">360°</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main display */}
      <div className="relative flex-1">
        {/* Container */}
        <div className="relative overflow-hidden rounded-xl bg-gray-50" style={{ aspectRatio: '4/3' }}>
          {cur.type === 'image' && (
            <Image
              src={cur.src}
              alt={productName}
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-contain"
              priority
            />
          )}
          {cur.type === 'video' && <VideoPlayer src={cur.src} />}
          {cur.type === '360' && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg">
                  <svg className="h-8 w-8 text-brand" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700">360° Ko&apos;rish</p>
                <p className="text-sm text-gray-400 mt-1">Tez orada...</p>
              </div>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {isNew && (
              <span className="rounded-full bg-brand-bg px-2 py-0.5 text-xs font-semibold text-brand-text">
                Yangi
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {inStock ? 'Stokda' : 'Tugadi'}
            </span>
          </div>

          {/* Top-right actions */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              onClick={() => setWishlist(!wishlist)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
              aria-label="Sevimlilarga qo'shish"
            >
              <svg
                className={`h-5 w-5 ${wishlist ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`}
                stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
            <button
              onClick={share}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
              aria-label="Ulashish"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          </div>

          {/* Bottom-right: 360 view button */}
          {has360 && cur.type !== '360' && (
            <button
              onClick={() => setIdx(items.findIndex((m) => m.type === '360'))}
              className="absolute bottom-3 right-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: '#7C3AED' }}
            >
              360° Ko&apos;r
            </button>
          )}

          {/* Nav arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
              >
                <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
              >
                <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Dot indicators */}
          {items.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? 'w-4 bg-brand' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile horizontal thumbnails */}
        {items.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:hidden">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === idx ? 'border-brand' : 'border-gray-200'
                }`}
              >
                {item.type === 'image' && (
                  <Image src={item.src} alt={`thumb ${i}`} fill className="object-cover" />
                )}
                {item.type === 'video' && (
                  <div className="flex h-full w-full items-center justify-center bg-gray-900">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                )}
                {item.type === '360' && (
                  <div className="flex h-full w-full items-center justify-center bg-brand-bg text-[10px] font-bold text-brand">
                    360°
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
