import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getOrders,
  getOrderById,
  createDraftOrder,
  updateOrderStatus
} from '@/services/order.service';
import { OrderDto } from '@galaxy/types';

export function useOrders(params?: Record<string, unknown>, token?: string) {
  return useQuery({
    queryKey: queryKeys.orders.all(params),
    queryFn: () => getOrders(params, token)
  });
}

export function useOrder(id: string, token?: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => getOrderById(id, token),
    enabled: Boolean(id)
  });
}

export function useCreateDraftOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, token }: { payload: Partial<OrderDto>; token?: string }) =>
      createDraftOrder(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, token }: { id: string; status: string; token?: string }) =>
      updateOrderStatus(id, status, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
