import { getTranslations } from 'next-intl/server';
import { Star } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

const META = [
  { quoteKey: 'quote1', name: 'Aziza K.', city: 'Toshkent', gradient: 'linear-gradient(150deg, #7C3AED, #A78BFA)' },
  { quoteKey: 'quote2', name: 'Sardor M.', city: 'Samarqand', gradient: 'linear-gradient(150deg, #7C2D12, #F08C3A)' },
  { quoteKey: 'quote3', name: 'Malika R.', city: 'Buxoro', gradient: 'linear-gradient(150deg, #1E3A5F, #5B8DB8)' },
] as const;

export default async function Testimonials() {
  const t = await getTranslations('testimonials');

  return (
    <section>
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {META.map((item) => (
          <div key={item.name} className="rounded-2xl border border-gray-100 p-6">
            <div className="mb-3.5 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" fill="#F59E0B" stroke="#F59E0B" />
              ))}
            </div>
            <p className="mb-5 text-sm leading-relaxed text-gray-700">&ldquo;{t(item.quoteKey)}&rdquo;</p>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 flex-shrink-0 rounded-full" style={{ background: item.gradient }} />
              <div>
                <p className="text-sm font-bold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
