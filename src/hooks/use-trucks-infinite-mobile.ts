import { useMemo } from "react";
import { useTrucksInfinite } from './useTruck';
import { TruckGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for trucks
const MOBILE_TRUCKS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling trucks
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useTrucksInfiniteMobile(params?: Partial<TruckGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_TRUCKS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useTrucksInfinite(queryParams);

  // Apply mobile optimizations
  const mobileOptimizedQuery = useInfiniteMobile(infiniteQuery as any);

  // Return with trucks alias for the data
  return {
    ...mobileOptimizedQuery,
    trucks: mobileOptimizedQuery.items,
  };
}