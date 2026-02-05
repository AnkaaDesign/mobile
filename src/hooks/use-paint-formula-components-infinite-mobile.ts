import { useMemo } from "react";
import { usePaintFormulaComponentsInfinite } from './usePaintFormulaComponent';
import { PaintFormulaComponentGetManyFormData } from '@/schemas';
import type { PaintFormulaComponent } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for paint formula components
const MOBILE_PAINT_FORMULA_COMPONENTS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling paint formula components
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function usePaintFormulaComponentsInfiniteMobile(params?: Partial<PaintFormulaComponentGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_PAINT_FORMULA_COMPONENTS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = usePaintFormulaComponentsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<PaintFormulaComponent>(infiniteQuery);
}
