import { useMemo } from "react";
import { usePaintProductionsInfinite } from './usePaintProduction';
import { PaintProductionGetManyFormData } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for paint productions
const MOBILE_PAINT_PRODUCTIONS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling paint productions
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function usePaintProductionsInfiniteMobile(params?: Partial<PaintProductionGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_PAINT_PRODUCTIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = usePaintProductionsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
