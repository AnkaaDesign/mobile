import { useMemo } from "react";
import { useOrderItemsInfinite } from './useOrderItem';
import { OrderItemGetManyFormData } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for order items
const MOBILE_ORDER_ITEMS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling order items
 * Uses smaller page sizes and provides flattened data for FlatList
 *
 * IMPORTANT: For nested routes (order-specific items), pass orderId in the orderIds array:
 * useOrderItemsInfiniteMobile({ orderIds: [orderId] })
 */
export function useOrderItemsInfiniteMobile(params?: Partial<OrderItemGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_ORDER_ITEMS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useOrderItemsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
