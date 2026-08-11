import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getCategories, getCategoryBySlug } from '@/services/category.service';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: getCategories
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => getCategoryBySlug(slug),
    enabled: Boolean(slug)
  });
}
