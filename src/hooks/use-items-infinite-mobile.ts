import { useMemo } from "react";
import { useItemsInfinite } from './';
import { ItemGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for items
const MOBILE_ITEMS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling items
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useItemsInfiniteMobile(params?: Partial<ItemGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_ITEMS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useItemsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
