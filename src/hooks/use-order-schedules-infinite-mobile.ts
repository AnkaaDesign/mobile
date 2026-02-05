import { useMemo } from "react";
import { useOrderSchedulesInfinite } from './useOrderSchedule';
import { OrderScheduleGetManyFormData } from '@/schemas';
import type { OrderSchedule } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for order schedules
const MOBILE_ORDER_SCHEDULES_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling order schedules
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useOrderSchedulesInfiniteMobile(params?: Partial<OrderScheduleGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_ORDER_SCHEDULES_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useOrderSchedulesInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<OrderSchedule>(infiniteQuery);
}
