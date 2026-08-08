export const Roles = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  STAFF: 'Staff'
} as const;
export type Role = (typeof Roles)[keyof typeof Roles];

export const AdminStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended'
} as const;
export type AdminStatusType = (typeof AdminStatus)[keyof typeof AdminStatus];

export const AccountType = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN'
} as const;
export type AccountTypeEnum = (typeof AccountType)[keyof typeof AccountType];

export const ProductType = {
  PRODUCT: 'PRODUCT',
  ACCESSORY: 'ACCESSORY',
  SPARE_PART: 'SPARE_PART'
} as const;
export type ProductTypeEnum = (typeof ProductType)[keyof typeof ProductType];

export const PricingType = {
  FIXED: 'FIXED',
  QUOTE_REQUIRED: 'QUOTE_REQUIRED'
} as const;
export type PricingTypeEnum = (typeof PricingType)[keyof typeof PricingType];

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURNED: 'RETURNED',
  REFUNDED: 'REFUNDED'
} as const;
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED',
  REFUNDED: 'REFUNDED'
} as const;
export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  QR: 'QR',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  COD: 'COD',
  GATEWAY: 'GATEWAY'
} as const;
export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const VerificationStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
} as const;
export type VerificationStatusType = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const ShipmentStatus = {
  PENDING: 'PENDING',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
} as const;
export type ShipmentStatusType = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const CartStatus = {
  ACTIVE: 'ACTIVE',
  CONVERTED: 'CONVERTED',
  ABANDONED: 'ABANDONED'
} as const;
export type CartStatusType = (typeof CartStatus)[keyof typeof CartStatus];

export const DocumentType = {
  DATASHEET: 'DATASHEET',
  MANUAL: 'MANUAL',
  CERTIFICATE: 'CERTIFICATE',
  CATALOG: 'CATALOG',
  OTHER: 'OTHER'
} as const;
export type DocumentTypeEnum = (typeof DocumentType)[keyof typeof DocumentType];

export const InventoryTransactionType = {
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  ORDER_RESERVED: 'ORDER_RESERVED',
  ORDER_RELEASED: 'ORDER_RELEASED',
  SALE: 'SALE',
  RETURN: 'RETURN',
  DAMAGE: 'DAMAGE',
  ADJUSTMENT: 'ADJUSTMENT'
} as const;
export type InventoryTransactionTypeEnum = (typeof InventoryTransactionType)[keyof typeof InventoryTransactionType];

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
  ADMIN_VENDORS: '/admin/vendors',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_INVOICES: '/admin/invoices',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings'
} as const;

export const StorageBuckets = {
  PRODUCT_IMAGES: 'product-images',
  PRODUCT_DOCUMENTS: 'product-documents',
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
