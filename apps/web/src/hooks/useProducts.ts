import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getProducts } from '@/services/product.service';

export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.products.all(params),
    queryFn: () => getProducts(params)
  });
}
