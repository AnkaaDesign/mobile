import { useMemo } from "react";
import { useHolidaysInfinite } from './useHoliday';
import { HolidayGetManyFormData } from '@/schemas';
import type { Holiday } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for holidays
const MOBILE_HOLIDAYS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling holidays
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useHolidaysInfiniteMobile(params?: Partial<HolidayGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_HOLIDAYS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useHolidaysInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Holiday>(infiniteQuery);
}
