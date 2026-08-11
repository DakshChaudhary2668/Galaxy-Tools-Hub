import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getVariantsByProduct,
  getVariantById,
  getVariantBySku,
  createVariant,
  updateVariant,
  deleteVariant
} from '@/services/variant.service';
import { CreateProductVariantDto, UpdateProductVariantDto } from '@galaxy/types';

export function useVariants(productId?: string) {
  return useQuery({
    queryKey: queryKeys.variants.byProduct(productId || ''),
    queryFn: () => getVariantsByProduct(productId || ''),
    enabled: Boolean(productId)
  });
}

export function useVariant(id: string) {
  return useQuery({
    queryKey: queryKeys.variants.detail(id),
    queryFn: () => getVariantById(id),
    enabled: Boolean(id)
  });
}

export function useVariantBySku(sku: string) {
  return useQuery({
    queryKey: queryKeys.variants.sku(sku),
    queryFn: () => getVariantBySku(sku),
    enabled: Boolean(sku)
  });
}

export function useCreateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload, token }: { productId: string; payload: CreateProductVariantDto; token?: string }) =>
      createVariant(productId, payload, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.byProduct(variables.productId) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, token }: { id: string; payload: UpdateProductVariantDto; token?: string }) =>
      updateVariant(id, payload, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, token }: { id: string; token?: string }) => deleteVariant(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}
