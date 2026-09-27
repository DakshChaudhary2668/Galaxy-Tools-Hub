import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getProducts, getProductById, AdminProductsResponse } from '@/services/product.service';

export function useProducts(params?: Record<string, unknown>, options?: { enabled?: boolean; staleTime?: number }) {
  return useQuery<AdminProductsResponse, Error>({
    queryKey: queryKeys.products.all(params),
    queryFn: () => getProducts(params),
    staleTime: 0,
    ...options
  });
}

export function useProduct(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => getProductById(id),
    enabled: Boolean(id) && (options?.enabled !== false),
  });
}
