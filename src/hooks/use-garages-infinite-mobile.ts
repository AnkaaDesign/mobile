import { useMemo } from "react";
import { useGaragesInfinite } from './useGarage';
import { GarageGetManyFormData } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for garages
const MOBILE_GARAGES_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling garages
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useGaragesInfiniteMobile(params?: Partial<GarageGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_GARAGES_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useGaragesInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}