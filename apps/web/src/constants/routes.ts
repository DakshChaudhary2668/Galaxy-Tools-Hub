// All app routes as constants — avoids string typos and makes refactors single-point.
export const ROUTES = {
  home:       '/',
  products:   '/products',
  product:    (slug: string) => `/products/${slug}`,
  categories: '/categories',
  brands:     '/brands',
  cart:       '/cart',

  checkout: {
    index:        '/checkout',
    payment:      '/checkout/payment',
    confirmation: (orderId: string) => `/checkout/confirmation/${orderId}`,
  },

  admin: {
    dashboard:  '/admin/dashboard',
    products:   '/admin/products',
    categories: '/admin/categories',
    brands:     '/admin/brands',
    orders:     '/admin/orders',
    vendors:    '/admin/vendors',
    verify:     (taskId: string) => `/admin/verify/${taskId}`,
  },

  auth: {
    signIn: '/sign-in',
    signUp: '/sign-up',
  },
} as const;
