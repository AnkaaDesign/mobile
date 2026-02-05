import { useMemo } from "react";
import { useWarningsInfinite } from './useWarning';
import { WarningGetManyFormData } from '@/schemas';
import type { Warning } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for warnings
const MOBILE_WARNINGS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling warnings
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useWarningsInfiniteMobile(params?: Partial<WarningGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_WARNINGS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useWarningsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Warning>(infiniteQuery);
}
