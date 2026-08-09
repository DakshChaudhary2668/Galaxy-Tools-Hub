import type { HTMLAttributes } from 'react';

// TODO: implement styling — surface-container-high bg, shimmer animation
export function Skeleton({ style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden role="presentation" style={style} {...props} />;
}
