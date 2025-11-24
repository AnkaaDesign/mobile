import { useMemo } from "react";
import { useVacationsInfinite, useMyVacationsInfinite } from './useVacation';
import { VacationGetManyFormData } from '@/schemas';
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

/**
 * Mobile-optimized hook for infinite scrolling of the current user's vacations
 * Uses the /vacations/my-vacations endpoint which filters server-side by user
 */
export function useMyVacationsInfiniteMobile(params?: Partial<VacationGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_VACATIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the my-vacations hook that calls the user-specific endpoint
  const infiniteQuery = useMyVacationsInfinite(queryParams, { enabled: params?.enabled });

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
