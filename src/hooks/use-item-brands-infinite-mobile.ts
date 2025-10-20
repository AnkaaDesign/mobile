import { useMemo } from "react";
import { useItemBrandsInfinite } from './useItemBrand';
import { ItemBrandGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for brands
const MOBILE_BRANDS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling item brands
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useItemBrandsInfiniteMobile(params?: Partial<ItemBrandGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_BRANDS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useItemBrandsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
