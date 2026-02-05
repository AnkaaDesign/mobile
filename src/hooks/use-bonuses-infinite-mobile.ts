import { useMemo } from "react";
import { useBonusesInfinite } from './bonus';
import type { BonusGetManyParams, Bonus } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for bonuses
const MOBILE_BONUSES_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling bonuses
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useBonusesInfiniteMobile(params?: Partial<BonusGetManyParams> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_BONUSES_PAGE_SIZE,
      include: {
        user: {
          include: {
            position: true,
            sector: true,
          },
        },
        bonusDiscounts: true, bonusExtras: true,
        ...params?.include,
      },
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useBonusesInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Bonus>(infiniteQuery);
}
