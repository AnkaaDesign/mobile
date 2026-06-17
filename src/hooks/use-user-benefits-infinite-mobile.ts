import { useMemo } from "react";
import { useUserBenefitsInfinite } from './useUserBenefit';
import { UserBenefitGetManyFormData } from '@/schemas';
import type { UserBenefit } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for user benefit enrollments
const MOBILE_USER_BENEFITS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling user benefit enrollments
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useUserBenefitsInfiniteMobile(params?: Partial<UserBenefitGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_USER_BENEFITS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useUserBenefitsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<UserBenefit>(infiniteQuery);
}
