import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  link?: string;
  linkText?: string;
}

export default function SectionHeader({ title, subtitle, link, linkText }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-1.5 mb-7 md:flex-row md:items-baseline md:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-[-0.01em] md:text-[28px]">{title}</h2>
        {subtitle && <p className="text-[13.5px] text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {link && linkText && (
        <Link
          href={link}
          className="group flex items-center gap-[5px] text-[13px] font-semibold whitespace-nowrap hover:gap-2 transition-all duration-200"
          style={{ color: '#7C3AED' }}
        >
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
