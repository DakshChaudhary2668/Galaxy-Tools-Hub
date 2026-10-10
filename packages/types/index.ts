import { z } from 'zod';
import {
  Roles,
  AdminStatus,
  AccountType,
  ProductType,
  PricingType,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  VerificationStatus,
  ShipmentStatus,
  CartStatus,
  DocumentType,
  InventoryTransactionType,
  StorageBuckets
} from '@galaxy/constants';

// --- API Envelope Types ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    requestId?: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    nextCursor?: string | null;
    hasMore?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]> | string[];
  meta?: {
    requestId?: string;
  };
}

// --- 1. ADMIN USERS (Supabase Auth & RBAC) ---
export const AdminUserSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  status: z.enum([AdminStatus.ACTIVE, AdminStatus.INACTIVE, AdminStatus.SUSPENDED]).default(AdminStatus.ACTIVE),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type AdminUserDto = z.infer<typeof AdminUserSchema>;

// --- 2. PROFILES (Supabase Customer Auth) ---
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  account_type: z.enum([AccountType.CUSTOMER, AccountType.ADMIN]).default(AccountType.CUSTOMER),
  avatar_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type ProfileDto = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = ProfileSchema.pick({
  full_name: true,
  phone: true,
  avatar_url: true
}).partial();
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

// --- 3. USER ADDRESSES ---
export const UserAddressSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  address_label: z.string().nullable().optional(),
  full_name: z.string().min(1),
  phone: z.string().min(1),
  address_line_1: z.string().min(1),
  address_line_2: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().default('India'),
  is_default: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type UserAddressDto = z.infer<typeof UserAddressSchema>;

// --- 4. VENDORS ---
export const VendorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type VendorDto = z.infer<typeof VendorSchema>;

export const CreateVendorSchema = VendorSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateVendorSchema = CreateVendorSchema.partial();

// --- 5. BRANDS ---
export const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type BrandDto = z.infer<typeof BrandSchema>;

export const CreateBrandSchema = BrandSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateBrandSchema = CreateBrandSchema.partial();

// --- 6. CATEGORIES ---
export const CategorySchema = z.object({
  id: z.string().uuid(),
  parent_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type CategoryDto = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = CategorySchema.omit({ id: true, created_at: true, updated_at: true });
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

// --- 7. TAX RATES ---
export const TaxRateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  rate: z.number().min(0),
  hsn_required: z.boolean().default(false),
  effective_from: z.string(),
  effective_to: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional()
});
export type TaxRateDto = z.infer<typeof TaxRateSchema>;

// --- 8. PRODUCTS ---
export const ProductSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  brand_id: z.string().uuid(),
  source_vendor_id: z.string().uuid(),
  parent_product_id: z.string().uuid().nullable().optional(),
  sku: z.string().min(1),
  source_model_no: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  product_type: z.enum([ProductType.PRODUCT, ProductType.ACCESSORY, ProductType.SPARE_PART]).default(ProductType.PRODUCT),
  short_description: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  specifications: z.record(z.unknown()).default({}),
  pricing_type: z.enum([PricingType.FIXED, PricingType.QUOTE_REQUIRED]).default(PricingType.FIXED),
  price: z.number().min(0).nullable().optional(),
  compare_at_price: z.number().min(0).nullable().optional(),
  hsn_code: z.string().min(1),
  tax_rate: z.number().min(0).default(18.00),
  minimum_order_quantity: z.number().int().positive().nullable().optional(),
  weight: z.number().nullable().optional(),
  weight_grams: z.number().int().positive().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  meta_keywords: z.string().nullable().optional(),
  is_purchasable: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  show_on_homepage: z.boolean().default(true),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type ProductDto = z.infer<typeof ProductSchema>;

/** UI view-model extending the backend DTO with display-only fields. */
export type ProductView = Partial<ProductDto> & {
  image?: string;
  image_url?: string;
  images?: any[];
  category?: Pick<CategoryDto, 'id' | 'name' | 'slug'> | null;
  brand?: Pick<BrandDto, 'id' | 'name' | 'slug'> | null;
  statusLabel?: string;
  discount?: number;
  badge?: string;
  currency?: string;
  gstIncluded?: boolean;
  secondaryAction?: string;
  technicalSpecs?: string;
  inventory_quantity?: number;
  compare_at_price?: number | null;
};

const ProductWriteSchema = ProductSchema.omit({ id: true, brand_id: true, created_at: true, updated_at: true }).extend({
  brand_id: z.string().uuid().optional(),
  custom_brand_name: z.string().trim().min(1).max(120).optional(),
  image_url: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional()
});
export const CreateProductSchema = ProductWriteSchema.refine(
  (value) => Boolean(value.brand_id || value.custom_brand_name),
  { message: 'Select a brand or enter a custom brand name', path: ['brand_id'] }
);
export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = ProductWriteSchema.partial();
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

// Optimized Product Card DTO (Listings, Search, Catalog grids)
export const ProductCardSchema = ProductSchema.pick({
  id: true,
  category_id: true,
  brand_id: true,
  sku: true,
  source_model_no: true,
  name: true,
  slug: true,
  product_type: true,
  pricing_type: true,
  price: true,
  compare_at_price: true,
  is_purchasable: true,
  is_featured: true,
  show_on_homepage: true,
  is_active: true
});
export type ProductCardDto = z.infer<typeof ProductCardSchema>;

// Detailed Product DTO (Product Details page - PDP)
export const ProductDetailSchema = ProductSchema.extend({
  category: CategorySchema.optional(),
  brand: BrandSchema.optional(),
  images: z.array(z.unknown()).optional(),
  inventory_quantity: z.number().int().optional()
});
export type ProductDetailDto = z.infer<typeof ProductDetailSchema>;

// Product Query Filter Schema
export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
  search: z.string().trim().max(100).transform((val) => val.replace(/\s+/g, ' ')).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  vendor: z.string().optional(),
  minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  sort: z.enum(['price_asc', 'price_desc', 'latest', 'oldest', 'name_asc', 'name_desc', 'featured']).optional().default('latest'),
  featured: z.string().optional().transform((val) => val === 'true'),
  homepage: z.string().optional().transform((val) => val === 'true'),
  discounted: z.string().optional().transform((val) => val === 'true'),
  active: z.string().optional().transform((val) => (val !== undefined ? val === 'true' : true))
});
export type ProductQueryParams = z.infer<typeof ProductQuerySchema>;

// --- 9. PRODUCT IMAGES ---
export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  storage_path: z.string().min(1),
  public_url: z.string().nullable().optional(),
  alt_text: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  is_primary: z.boolean().default(false),
  created_at: z.string().optional()
});
export type ProductImageDto = z.infer<typeof ProductImageSchema>;

export const CreateProductImageSchema = ProductImageSchema.omit({ id: true, created_at: true });

// --- 10. PRODUCT DOCUMENTS ---
export const ProductDocumentSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  document_type: z.enum([
    DocumentType.DATASHEET,
    DocumentType.MANUAL,
    DocumentType.CERTIFICATE,
    DocumentType.CATALOG,
    DocumentType.OTHER
  ]),
  file_name: z.string().min(1),
  storage_path: z.string().min(1),
  file_size: z.number().int().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  created_at: z.string().optional()
});
export type ProductDocumentDto = z.infer<typeof ProductDocumentSchema>;

// --- 11. INVENTORY ---
export const InventorySchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(0).default(0),
  reserved_quantity: z.number().int().min(0).default(0),
  reorder_level: z.number().int().nullable().optional(),
  updated_at: z.string().optional()
});
export type InventoryDto = z.infer<typeof InventorySchema>;

// --- 12. INVENTORY TRANSACTIONS ---
export const InventoryTransactionSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  transaction_type: z.enum([
    InventoryTransactionType.STOCK_IN,
    InventoryTransactionType.STOCK_OUT,
    InventoryTransactionType.ORDER_RESERVED,
    InventoryTransactionType.ORDER_RELEASED,
    InventoryTransactionType.SALE,
    InventoryTransactionType.RETURN,
    InventoryTransactionType.DAMAGE,
    InventoryTransactionType.ADJUSTMENT
  ]),
  quantity: z.number().int(),
  reference_type: z.string().nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().optional()
});
export type InventoryTransactionDto = z.infer<typeof InventoryTransactionSchema>;

// --- 13. CARTS ---
export const CartSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  session_id: z.string().nullable().optional(),
  status: z.enum([CartStatus.ACTIVE, CartStatus.CONVERTED, CartStatus.ABANDONED]).default(CartStatus.ACTIVE),
  expires_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type CartDto = z.infer<typeof CartSchema>;

// --- 14. CART ITEMS ---
export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cart_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  unit_price: z.number().min(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type CartItemDto = z.infer<typeof CartItemSchema>;

// --- 15. WISHLISTS & ITEMS ---
export const WishlistSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type WishlistDto = z.infer<typeof WishlistSchema>;

export const WishlistItemSchema = z.object({
  id: z.string().uuid(),
  wishlist_id: z.string().uuid(),
  product_id: z.string().uuid(),
  created_at: z.string().optional()
});
export type WishlistItemDto = z.infer<typeof WishlistItemSchema>;

// --- 16. ORDERS & ORDER ITEMS ---
export const OrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string().min(1),
  user_id: z.string().uuid(),
  status: z.enum([
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.PACKED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURN_REQUESTED,
    OrderStatus.RETURNED,
    OrderStatus.REFUNDED
  ]).default(OrderStatus.PENDING),
  payment_status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.UNDER_REVIEW,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.REJECTED,
    PaymentStatus.REFUNDED
  ]).default(PaymentStatus.PENDING),
  subtotal: z.number().min(0),
  discount_amount: z.number().min(0).default(0.00),
  tax_amount: z.number().min(0),
  shipping_amount: z.number().min(0).default(0.00),
  total_amount: z.number().min(0),
  currency: z.string().default('INR'),
  coupon_id: z.string().uuid().nullable().optional(),
  customer_notes: z.string().nullable().optional(),
  admin_notes: z.string().nullable().optional(),
  placed_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type OrderDto = z.infer<typeof OrderSchema>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  product_id: z.string().uuid().nullable().optional(),
  product_name: z.string().min(1),
  sku: z.string().min(1),
  source_model_no: z.string().nullable().optional(),
  hsn_code: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
  discount_amount: z.number().min(0).default(0.00),
  tax_rate: z.number(),
  tax_amount: z.number().min(0),
  total_amount: z.number().min(0),
  created_at: z.string().optional()
});
export type OrderItemDto = z.infer<typeof OrderItemSchema>;

// --- 17. ORDER ADDRESSES ---
export const OrderAddressSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  address_type: z.enum(['SHIPPING', 'BILLING']),
  full_name: z.string().min(1),
  phone: z.string().min(1),
  address_line_1: z.string().min(1),
  address_line_2: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().default('India')
});
export type OrderAddressDto = z.infer<typeof OrderAddressSchema>;

// --- 18. PAYMENTS & VERIFICATIONS ---
export const PaymentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  payment_method: z.enum([
    PaymentMethod.QR,
    PaymentMethod.UPI,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.COD,
    PaymentMethod.GATEWAY
  ]),
  status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.UNDER_REVIEW,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.REJECTED,
    PaymentStatus.REFUNDED
  ]).default(PaymentStatus.PENDING),
  amount: z.number().min(0),
  currency: z.string().default('INR'),
  transaction_id: z.string().nullable().optional(),
  gateway_reference: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type PaymentDto = z.infer<typeof PaymentSchema>;

export const CheckoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive()
});
export type CheckoutItemDto = z.infer<typeof CheckoutItemSchema>;

export const CheckoutRequestSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'Cart is empty'),
  contact: z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    phone: z.string().trim().min(1)
  }),
  shipping: z.object({
    fullName: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    addressLine1: z.string().trim().min(1),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    pincode: z.string().trim().min(1)
  })
});
export type CheckoutRequestDto = z.infer<typeof CheckoutRequestSchema>;

export const RazorpayVerificationRequestSchema = z.object({
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_order_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().regex(/^[a-fA-F0-9]{64}$/, 'Invalid Razorpay signature'),
  orderId: z.string().uuid().optional()
});
export type RazorpayVerificationRequestDto = z.infer<typeof RazorpayVerificationRequestSchema>;

export const PaymentVerificationSchema = z.object({
  id: z.string().uuid(),
  payment_id: z.string().uuid(),
  utr_number: z.string().min(1),
  submitted_amount: z.number().min(0),
  screenshot_path: z.string().nullable().optional(),
  status: z.enum([
    VerificationStatus.PENDING,
    VerificationStatus.UNDER_REVIEW,
    VerificationStatus.VERIFIED,
    VerificationStatus.REJECTED
  ]).default(VerificationStatus.PENDING),
  rejection_reason: z.string().nullable().optional(),
  verified_by: z.string().uuid().nullable().optional(),
  verified_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type PaymentVerificationDto = z.infer<typeof PaymentVerificationSchema>;

// --- 19. SHIPMENTS ---
export const ShipmentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  courier_name: z.string().nullable().optional(),
  tracking_number: z.string().nullable().optional(),
  status: z.enum([
    ShipmentStatus.PENDING,
    ShipmentStatus.PACKED,
    ShipmentStatus.SHIPPED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED
  ]).default(ShipmentStatus.PENDING),
  shipped_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});
export type ShipmentDto = z.infer<typeof ShipmentSchema>;

// --- 20. STORAGE SIGNED URL REQUEST ---
export const SignedUrlRequestSchema = z.object({
  bucket: z.enum([
    StorageBuckets.PRODUCT_IMAGES,
    StorageBuckets.PRODUCT_DOCUMENTS,
    StorageBuckets.BRAND_LOGOS,
    StorageBuckets.PAYMENT_PROOFS,
    StorageBuckets.INVOICES
  ]),
  path: z
    .string()
    .trim()
    .min(1)
    .max(1024)
    .refine(
      (path) =>
        !path.startsWith('/') &&
        !path.includes('\\') &&
        !/[\u0000-\u001F\u007F]/.test(path) &&
        path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..'),
      'Storage path must be a safe relative object path'
    )
});
export type SignedUrlRequestDto = z.infer<typeof SignedUrlRequestSchema>;

// --- 21. PRODUCT IMAGE SIGNED UPLOAD & COMPLETION (SPRINT 3) ---
export const ProductImageSignedUploadRequestSchema = z.object({
  product_id: z.string().uuid({ message: 'Invalid product ID format' }),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, and WebP images are allowed' })
  }),
  file_size: z
    .number()
    .int()
    .positive({ message: 'File size must be positive' })
    .max(5 * 1024 * 1024, { message: 'File size must not exceed 5 MB' }),
  extension: z.enum(['jpg', 'jpeg', 'png', 'webp'], {
    errorMap: () => ({ message: 'Extension must be jpg, jpeg, png, or webp' })
  })
}).refine(
  (data) => {
    if (data.mime_type === 'image/jpeg') return data.extension === 'jpg' || data.extension === 'jpeg';
    if (data.mime_type === 'image/png') return data.extension === 'png';
    if (data.mime_type === 'image/webp') return data.extension === 'webp';
    return false;
  },
  {
    message: 'File extension does not match MIME type',
    path: ['extension']
  }
);
export type ProductImageSignedUploadRequestDto = z.infer<typeof ProductImageSignedUploadRequestSchema>;

export const ProductImageCompleteRequestSchema = z.object({
  storage_path: z
    .string()
    .trim()
    .min(1)
    .max(1024)
    .regex(/^products\/[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$/, {
      message: 'Storage path must match format: products/{productId}/{uuid}.{ext}'
    }),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
  alt_text: z.string().max(255).optional()
});
export type ProductImageCompleteRequestDto = z.infer<typeof ProductImageCompleteRequestSchema>;

// --- 22. COUPONS (ADMIN FOUNDATION; REDEMPTION IS NOT ENABLED) ---
const CouponBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().trim().min(1).max(50),
  description: z.string().max(500).nullable().optional(),
  discount_type: z.enum(['PERCENTAGE', 'FIXED']),
  discount_value: z.number().positive(),
  minimum_order_amount: z.number().min(0).nullable().optional(),
  maximum_discount_amount: z.number().min(0).nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  usage_count: z.number().int().min(0).default(0),
  starts_at: z.string().datetime().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

type CouponValidationFields = Pick<
  z.infer<typeof CouponBaseSchema>,
  'discount_type' | 'discount_value' | 'maximum_discount_amount' | 'starts_at' | 'expires_at'
>;

const validateCoupon = (coupon: CouponValidationFields, ctx: z.RefinementCtx) => {
  if (coupon.discount_type === 'PERCENTAGE' && coupon.discount_value > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discount_value'], message: 'Percentage discount cannot exceed 100' });
  }
  if (coupon.discount_type === 'FIXED' && coupon.maximum_discount_amount != null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['maximum_discount_amount'], message: 'Maximum discount only applies to percentage coupons' });
  }
  if (coupon.starts_at && coupon.expires_at && new Date(coupon.starts_at) >= new Date(coupon.expires_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['expires_at'], message: 'Expiry must be after the start date' });
  }
};

export const CouponSchema = CouponBaseSchema.superRefine(validateCoupon);
export type CouponDto = z.infer<typeof CouponSchema>;

export const CreateCouponSchema = CouponBaseSchema.omit({
  id: true,
  usage_count: true,
  created_at: true,
  updated_at: true
}).superRefine(validateCoupon);
export type CreateCouponDto = z.infer<typeof CreateCouponSchema>;

export const UpdateCouponSchema = CouponBaseSchema.omit({
  id: true,
  usage_count: true,
  created_at: true,
  updated_at: true
}).partial();
export type UpdateCouponDto = z.infer<typeof UpdateCouponSchema>;
