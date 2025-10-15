import { useMemo } from "react";
import { useAirbrushingsInfinite } from './useAirbrushing';
import { AirbrushingGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for airbrushings
const MOBILE_AIRBRUSHINGS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling airbrushings
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useAirbrushingsInfiniteMobile(params?: Partial<AirbrushingGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_AIRBRUSHINGS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useAirbrushingsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}