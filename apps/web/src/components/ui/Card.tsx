import type { HTMLAttributes } from 'react';

// TODO: implement styling — 1px outline-variant border, 4px radius, no shadow (L1 elevation)
export function Card({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}
