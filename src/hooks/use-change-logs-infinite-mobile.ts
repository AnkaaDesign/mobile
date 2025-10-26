import { useMemo } from "react";
import { useChangeLogsInfinite } from './useChangelog';
import { ChangeLogGetManyFormData } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for change logs
const MOBILE_CHANGE_LOGS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling change logs
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useChangeLogsInfiniteMobile(params?: Partial<ChangeLogGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_CHANGE_LOGS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useChangeLogsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
