import { useMemo } from "react";
import { useOrdersInfinite } from './useOrder';
import { OrderGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for orders
const MOBILE_ORDERS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling orders
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useOrdersInfiniteMobile(params?: Partial<OrderGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_ORDERS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useOrdersInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}