'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  images: string[];
  user?: { name?: string };
  createdAt: string;
}

interface Props {
  descUz: string;
  descRu?: string;
  reviewCount: number;
  productSlug: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold text-sm">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Bugun';
  if (days === 1) return 'Kecha';
  if (days < 30) return `${days} kun oldin`;
  const months = Math.floor(days / 30);
  return `${months} oy oldin`;
}

export default function ProductTabs({ descUz, descRu, reviewCount, productSlug }: Props) {
  const locale = useLocale();
  const [tab, setTab] = useState<'desc' | 'reviews' | 'qa'>('desc');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => {
    if (tab === 'reviews' && !reviewsLoaded) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productSlug}/reviews`)
        .then((r) => r.json())
        .then((json) => {
          setReviews(json.data ?? []);
          setReviewsLoaded(true);
        })
        .catch(() => setReviewsLoaded(true));
    }
  }, [tab, reviewsLoaded, productSlug]);

  const desc = locale === 'ru' ? (descRu ?? descUz) : descUz;

  const TABS = [
    { key: 'desc', label: 'Tavsif' },
    { key: 'reviews', label: `Sharhlar (${reviewCount})` },
    { key: 'qa', label: 'Savol-Javob' },
  ] as const;

  return (
    <div className="mt-8">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {tab === 'desc' && (
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: desc.replace(/\n/g, '<br />') }}
          />
        )}

        {tab === 'reviews' && (
          <div className="space-y-4">
            {!reviewsLoaded ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 w-24 rounded bg-gray-200 mb-2" />
                    <div className="h-3 w-full rounded bg-gray-100 mb-1" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500">Hali sharhlar yo&apos;q</p>
                <p className="text-sm text-gray-400 mt-1">Birinchi sharh qoldiring!</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-brand-bg flex items-center justify-center text-xs font-semibold text-brand-text">
                        {r.user?.name?.[0]?.toUpperCase() ?? 'A'}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {r.user?.name ?? 'Anonim'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  <Stars rating={r.rating} />
                  {r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'qa' && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">❓</div>
            <p className="text-gray-500">Savol-Javob bo&apos;limi</p>
            <p className="text-sm text-gray-400 mt-1">Tez orada...</p>
          </div>
        )}
      </div>
    </div>
  );
}
