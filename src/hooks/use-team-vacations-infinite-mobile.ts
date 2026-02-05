import { useMemo } from "react";
import { useTeamVacationsInfinite } from './useVacation';
import { VacationGetManyFormData } from '@/schemas';
import type { Vacation } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for team vacations
const MOBILE_TEAM_VACATIONS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling team vacations
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useTeamVacationsInfiniteMobile(params?: Partial<VacationGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_TEAM_VACATIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useTeamVacationsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Vacation>(infiniteQuery);
}
