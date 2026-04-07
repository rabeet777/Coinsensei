import Link from 'next/link';
import { ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  target?: string;
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-sm rounded-xl',
  lg: 'px-8 py-4 text-base rounded-xl',
};

const variants: Record<Variant, string> = {
  primary: 'btn-primary font-semibold shadow-md',
  outline: 'btn-outline font-semibold',
  ghost:   'text-[--color-text-sec] hover:text-[--color-text-pri] font-medium transition-colors',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
  type = 'button',
  target,
}: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 cursor-pointer select-none ${sizes[size]} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} target={target}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
