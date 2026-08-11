import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getBrands, getBrandBySlug } from '@/services/brand.service';

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: getBrands
  });
}

export function useBrand(slug: string) {
  return useQuery({
    queryKey: queryKeys.brands.detail(slug),
    queryFn: () => getBrandBySlug(slug),
    enabled: Boolean(slug)
  });
}
