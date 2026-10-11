import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getVendors } from '@/services/vendor.service';

export function useVendors() {
  return useQuery({ queryKey: queryKeys.vendors.all(), queryFn: getVendors });
}
