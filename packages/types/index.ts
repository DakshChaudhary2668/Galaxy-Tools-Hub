import { z } from 'zod';
import { Roles, OrderStatus, PaymentStatus } from '@galaxy/constants';

// --- API Envelope Types ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    requestId: string;
    nextCursor?: string | null;
    hasMore?: boolean;
    totalCount?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]> | string[];
  meta: {
    requestId: string;
  };
}

// --- User Schema ---
export const UserSchema = z.object({
  id: z.string().uuid(),
  clerk_user_id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum([Roles.OWNER, Roles.MANAGER, Roles.STAFF]),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
  created_at: z.string().datetime().optional()
});
export type UserDto = z.infer<typeof UserSchema>;

// --- Brand Schema ---
export const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  logo_url: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  active: z.boolean().default(true),
  created_at: z.string().datetime().optional()
});
export type BrandDto = z.infer<typeof BrandSchema>;

// --- Category Schema ---
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  parent_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  active: z.boolean().default(true),
  created_at: z.string().datetime().optional()
});
export type CategoryDto = z.infer<typeof CategorySchema>;

// --- Product Schema ---
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().min(1),
  brand_id: z.string().uuid(),
  category_id: z.string().uuid(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative().optional(),
  hsn_code: z.string().min(1),
  gst_percentage: z.number().min(0).max(100).default(18),
  weight: z.number().nonnegative().optional(),
  dimensions: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  created_at: z.string().datetime().optional()
});
export type ProductDto = z.infer<typeof ProductSchema>;

// --- Inventory Schema ---
export const InventorySchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  reserved_stock: z.number().int().nonnegative().default(0),
  available_stock: z.number().int().nonnegative(),
  updated_at: z.string().datetime().optional()
});
export type InventoryDto = z.infer<typeof InventorySchema>;

// --- Order Schema ---
export const OrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  customer_id: z.string().uuid(),
  total_amount: z.number().nonnegative(),
  tax_amount: z.number().nonnegative(),
  discount_amount: z.number().nonnegative().default(0),
  payment_status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.SUBMITTED,
    PaymentStatus.VERIFIED,
    PaymentStatus.REJECTED
  ]),
  order_status: z.enum([
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PAYMENT_VERIFIED,
    OrderStatus.CONFIRMED,
    OrderStatus.PACKED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED
  ]),
  shipping_partner: z.string().nullable().optional(),
  tracking_number: z.string().nullable().optional(),
  estimated_delivery: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime().optional()
});
export type OrderDto = z.infer<typeof OrderSchema>;

// --- Storage Signed URL Request ---
export const SignedUrlRequestSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1)
});
export type SignedUrlRequestDto = z.infer<typeof SignedUrlRequestSchema>;
