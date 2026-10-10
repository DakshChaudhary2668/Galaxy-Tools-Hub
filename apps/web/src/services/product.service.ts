import { apiClient } from './api';
import {
  ProductDto,
  ProductView,
  ProductDetailDto,
  ProductImageDto,
  CreateProductDto,
  UpdateProductDto,
  ProductImageSignedUploadRequestDto,
  ProductImageCompleteRequestDto
} from '@galaxy/types';


export interface AdminProductsResponse {
  data: Array<ProductDto & ProductView>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function getProducts(params?: Record<string, unknown>, token?: string): Promise<AdminProductsResponse> {
  const queryObj: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryObj[key] = String(val);
      }
    });
  }
  const qs = Object.keys(queryObj).length > 0 ? '?' + new URLSearchParams(queryObj).toString() : '';
  return apiClient.get<AdminProductsResponse>(`/products${qs}`, { token });
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDto | null> {
  try {
    const res = await apiClient.get<{ data: ProductDetailDto }>(`/products/${slug}`);
    return res?.data || null;
  } catch (error) {
    console.error(`[getProductBySlug] Error fetching product ${slug}:`, error);
    return null;
  }
}

export async function getProductById(id: string): Promise<ProductDetailDto | null> {
  try {
    const res = await apiClient.get<{ data: ProductDetailDto }>(`/products/${id}`);
    return res?.data || null;
  } catch (error) {
    console.error(`[getProductById] Error fetching product ${id}:`, error);
    return null;
  }
}

export async function createProduct(payload: Partial<CreateProductDto> & { stock?: number; lowStockThreshold?: number; image_url?: string }, token?: string): Promise<ProductDto> {
  const res = await apiClient.post<{ data: ProductDto }>('/products/admin', payload, { token });
  return res.data;
}

export async function updateProduct(id: string, payload: Partial<UpdateProductDto> & { stock?: number; lowStockThreshold?: number; image_url?: string }, token?: string): Promise<ProductDto> {
  const res = await apiClient.put<{ data: ProductDto }>(`/products/admin/${id}`, payload, { token });
  return res.data;
}

export async function deleteProduct(id: string, token?: string): Promise<{ data: { id: string; action: string }; message: string }> {
  return apiClient.delete<{ data: { id: string; action: string }; message: string }>(`/products/admin/${id}`, { token });
}

export async function getProductImages(id: string): Promise<ProductImageDto[]> {
  const res = await apiClient.get<{ data: ProductImageDto[] }>(`/products/${id}/images`);
  return res?.data || [];
}

export interface ProductImageUploadUrlResponse {
  signedUrl: string;
  path: string;
  token: string;
  publicUrl: string;
}

export async function getProductImageUploadUrl(
  payload: ProductImageSignedUploadRequestDto,
  token?: string
): Promise<ProductImageUploadUrlResponse> {
  const res = await apiClient.post<{ data: ProductImageUploadUrlResponse }>(
    '/storage/product-image-upload-url',
    payload,
    { token }
  );
  return res.data;
}

export async function completeProductImage(
  productId: string,
  payload: ProductImageCompleteRequestDto,
  token?: string
): Promise<ProductImageDto> {
  const res = await apiClient.post<{ data: ProductImageDto }>(
    `/products/admin/${productId}/images/complete`,
    payload,
    { token }
  );
  return res.data;
}

export async function deleteProductPrimaryImage(
  productId: string,
  token?: string
): Promise<{ data: { productId: string }; message: string }> {
  return apiClient.delete<{ data: { productId: string }; message: string }>(
    `/products/admin/${productId}/images/primary`,
    { token }
  );
}

export async function deleteProductImage(productId: string, imageId: string, token?: string): Promise<void> {
  await apiClient.delete(`/products/admin/${productId}/images/${imageId}`, { token });
}

export async function setPrimaryProductImage(productId: string, imageId: string, token?: string): Promise<ProductImageDto> {
  const res = await apiClient.put<{ data: ProductImageDto }>(
    `/products/admin/${productId}/images/${imageId}/primary`,
    {},
    { token }
  );
  return res.data;
}
