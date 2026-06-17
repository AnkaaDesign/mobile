import { useMemo } from "react";
import { useAdmissionsInfinite } from './useAdmission';
import { AdmissionGetManyFormData } from '@/schemas';
import type { Admission } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for admissions
const MOBILE_ADMISSIONS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling admissions.
 * Uses smaller page sizes and provides flattened data for FlatList.
 */
export function useAdmissionsInfiniteMobile(params?: Partial<AdmissionGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_ADMISSIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useAdmissionsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Admission>(infiniteQuery);
}
