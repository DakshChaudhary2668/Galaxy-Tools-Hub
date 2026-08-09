import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// TODO: implement styling — Titan Industrial button variants from design system
export function Button({ variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  return <button data-variant={variant} data-size={size} {...props}>{children}</button>;
}
