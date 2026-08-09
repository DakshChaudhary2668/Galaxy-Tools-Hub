// Titan Industrial design token aliases for use in TypeScript logic.
// For SCSS usage, use CSS custom properties (var(--token-name)) from _tokens.scss.
export const COLORS = {
  primary:            '#000000',
  onPrimary:          '#ffffff',
  secondaryContainer: '#fcd400', // golden CTA
  secondaryFixed:     '#ffe16d', // golden hover
  error:              '#ba1a1a',
  outlineVariant:     '#c4c7c7',
  surface:            '#f9f9fb',
  onSurface:          '#1a1c1d',
} as const;

export const BREAKPOINTS = {
  mobile:  768,   // < 768px — 4-col grid, 16px margin
  tablet:  1279,  // 768–1279px — 8-col grid, 24px margin
  desktop: 1280,  // ≥ 1280px — 12-col grid, 40px margin
} as const;
