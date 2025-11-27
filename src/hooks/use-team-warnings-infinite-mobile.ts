import { useMemo } from "react";
import { useTeamWarningsInfinite } from './useWarning';
import { WarningGetManyFormData } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for team warnings
const MOBILE_TEAM_WARNINGS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling team warnings
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useTeamWarningsInfiniteMobile(params?: Partial<WarningGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_TEAM_WARNINGS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useTeamWarningsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
