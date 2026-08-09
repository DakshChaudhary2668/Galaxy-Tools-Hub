import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// TODO: implement styling — 2px radius, label-caps font, status colors
export function Badge({ variant = 'default', children, ...props }: BadgeProps) {
  return <span data-variant={variant} {...props}>{children}</span>;
}
