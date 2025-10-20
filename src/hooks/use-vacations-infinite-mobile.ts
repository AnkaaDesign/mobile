import { useMemo } from "react";
import { useVacationsInfinite } from './useVacation';
import { VacationGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for vacations
const MOBILE_VACATIONS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling vacations
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useVacationsInfiniteMobile(params?: Partial<VacationGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_VACATIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useVacationsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
