import { useMemo } from "react";
import { usePpeDeliveriesInfinite } from './';
import { PpeDeliveryGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for PPE deliveries
const MOBILE_PPE_DELIVERIES_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling PPE deliveries in My Team section
 * Filters by sector and uses smaller page sizes for mobile
 */
export function useTeamPpeDeliveriesInfiniteMobile(
  params?: Partial<PpeDeliveryGetManyFormData> & { enabled?: boolean }
) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_PPE_DELIVERIES_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = usePpeDeliveriesInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
