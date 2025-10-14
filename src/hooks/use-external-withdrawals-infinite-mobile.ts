import { useMemo } from "react";
import { useExternalWithdrawalsInfinite } from './';
import { ExternalWithdrawalGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for external withdrawals
const MOBILE_EXTERNAL_WITHDRAWALS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling external withdrawals
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useExternalWithdrawalsInfiniteMobile(params?: Partial<ExternalWithdrawalGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_EXTERNAL_WITHDRAWALS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useExternalWithdrawalsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
