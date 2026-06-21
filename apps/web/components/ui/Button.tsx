'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-purple-500/25 active:scale-95 transition-all',
  gold:
    'bg-[#F59E0B] hover:bg-[#D97706] text-[#1C0A00] shadow-lg shadow-amber-500/25 active:scale-95 transition-all',
  outline:
    'border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#EDE9FE] transition-all active:scale-95',
  'outline-white':
    'border-2 border-white/40 text-white hover:bg-white/10 transition-all active:scale-95',
  ghost: 'text-[#7C3AED] hover:bg-[#EDE9FE] transition-all',
  danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white transition-all active:scale-95',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
export default Button;
