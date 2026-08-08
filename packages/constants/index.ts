export const Roles = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  STAFF: 'Staff'
} as const;
export type Role = (typeof Roles)[keyof typeof Roles];

export const OrderStatus = {
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_VERIFIED: 'Payment Verified',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
} as const;
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected'
} as const;
export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const Routes = {
  HOME: '/',
  CATEGORIES: '/categories',
  BRANDS: '/brands',
  PRODUCTS: '/products',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ABOUT: '/about',
  CONTACT: '/contact',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_BRANDS: '/admin/brands',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_INVOICES: '/admin/invoices',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings'
} as const;

export const StorageBuckets = {
  PRODUCT_IMAGES: 'product-images',
  BRAND_LOGOS: 'brand-logos',
  PAYMENT_PROOFS: 'payment-proofs',
  INVOICES: 'invoices'
} as const;

export const PaginationDefaults = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

export const SystemMessages = {
  UNAUTHORIZED: 'Unauthorized access. Valid authentication token required.',
  FORBIDDEN: 'Forbidden. Insufficient permissions for this action.',
  NOT_FOUND: 'Requested resource not found.',
  INTERNAL_ERROR: 'An unexpected internal server error occurred.',
  VALIDATION_ERROR: 'Request validation failed.'
} as const;
