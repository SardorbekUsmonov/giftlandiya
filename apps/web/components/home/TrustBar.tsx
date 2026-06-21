import { getTranslations } from 'next-intl/server';
import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

const ITEMS = [
  { icon: Truck, key: 'delivery' },
  { icon: RotateCcw, key: 'returns' },
  { icon: ShieldCheck, key: 'payment' },
  { icon: Headphones, key: 'support' },
] as const;

export default async function TrustBar() {
  const t = await getTranslations('trustBar');

  return (
    <div className="flex flex-wrap justify-center border-t border-b border-[#E9E9EC] py-[22px]">
      {ITEMS.map(({ icon: Icon, key }) => (
        <div key={key} className="flex items-center gap-2 px-[18px] py-1.5 text-[12.5px] text-gray-500">
          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: '#7C3AED' }} />
          {t(key)}
        </div>
      ))}
    </div>
  );
}
