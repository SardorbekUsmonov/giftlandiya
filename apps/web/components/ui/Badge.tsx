import { cn } from '@/lib/utils';

const variants = {
  purple: 'bg-[#EDE9FE] text-[#5B21B6]',
  gold:   'bg-[#FEF3C7] text-[#92400E]',
  green:  'bg-[#D1FAE5] text-[#065F46]',
  red:    'bg-[#FEE2E2] text-[#991B1B]',
  gray:   'bg-gray-100 text-gray-600',
  blue:   'bg-[#DBEAFE] text-[#1D4ED8]',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
};

interface BadgeProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'gray', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
