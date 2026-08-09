// TODO: implement with TanStack Query
// import { useQuery } from '@tanstack/react-query';
// import { queryKeys } from '@/lib/queryKeys';
// import { getProducts } from '@/services/product.service';

export function useProducts(_params?: Record<string, unknown>) {
  // TODO: return useQuery({ queryKey: queryKeys.products.all(params), queryFn: () => getProducts(params) });
}

export function useProduct(_slug: string) {
  // TODO: return useQuery({ queryKey: queryKeys.products.detail(slug), queryFn: () => getProductBySlug(slug) });
}
