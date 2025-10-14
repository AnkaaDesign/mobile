import { useMemo } from "react";
import { useCutsInfinite } from './';
import { CutGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for cuts
const MOBILE_CUTS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling cuts in My Team section
 * Filters by sector and uses smaller page sizes for mobile
 */
export function useTeamCutsInfiniteMobile(
  params?: Partial<CutGetManyFormData> & { enabled?: boolean }
) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_CUTS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useCutsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
