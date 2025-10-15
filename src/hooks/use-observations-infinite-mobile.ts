import { useMemo } from "react";
import { useObservationsInfinite } from './useObservation';
import { ObservationGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for observations
const MOBILE_OBSERVATIONS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling observations
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useObservationsInfiniteMobile(params?: Partial<ObservationGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_OBSERVATIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useObservationsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}