import { useMemo } from "react";
import { useDependentsInfinite } from './useDependent';
import { DependentGetManyFormData } from '@/schemas';
import type { Dependent } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for dependents
const MOBILE_DEPENDENTS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling dependents
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useDependentsInfiniteMobile(params?: Partial<DependentGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_DEPENDENTS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useDependentsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Dependent>(infiniteQuery);
}
