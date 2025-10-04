import { useMemo } from "react";
import { useCommissionsInfinite } from './';
import { CommissionQueryFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for commissions
const MOBILE_COMMISSIONS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling commissions
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useCommissionsInfiniteMobile(params?: Partial<CommissionQueryFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_COMMISSIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useCommissionsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
