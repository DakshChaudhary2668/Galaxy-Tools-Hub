// Query key factory — TanStack Query
// Provides stable, typed cache keys for the entire app.
// Usage: queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })

export const queryKeys = {
  health: () => ['health'] as const,

  products: {
    all:    (params?: Record<string, unknown>) => ['products', params] as const,
    detail: (slug: string)                     => ['products', slug] as const,
    images: (id: string)                       => ['products', id, 'images'] as const,
    variants: (id: string)                     => ['products', id, 'variants'] as const,
  },

  categories: {
    all:    () => ['categories'] as const,
    detail: (slug: string) => ['categories', slug] as const,
  },

  brands: {
    all:    () => ['brands'] as const,
    detail: (slug: string) => ['brands', slug] as const,
  },

  vendors: {
    all: () => ['vendors'] as const,
  },

  orders: {
    all:    (params?: Record<string, unknown>) => ['orders', params] as const,
    detail: (id: string)                       => ['orders', id] as const,
  },

  auth: {
    customer: () => ['auth', 'customer'] as const,
    admin:    () => ['auth', 'admin'] as const,
  },
} as const;
