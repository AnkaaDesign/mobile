import { useMemo } from "react";
import { useItemCategoriesInfinite } from './useItemCategory';
import { ItemCategoryGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for categories
const MOBILE_CATEGORIES_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling item categories
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useItemCategoriesInfiniteMobile(params?: Partial<ItemCategoryGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_CATEGORIES_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useItemCategoriesInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
