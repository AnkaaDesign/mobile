import { useMemo } from "react";
import { useExternalOperationsInfinite } from './useExternalOperation';
import { ExternalOperationGetManyFormData } from '@/schemas';
import type { ExternalOperation } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for external withdrawals
const MOBILE_EXTERNAL_OPERATIONS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling external withdrawals
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useExternalOperationsInfiniteMobile(params?: Partial<ExternalOperationGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_EXTERNAL_OPERATIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useExternalOperationsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<ExternalOperation>(infiniteQuery);
}
