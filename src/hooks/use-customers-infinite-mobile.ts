import { useMemo } from "react";
import { useCustomersInfinite } from './';
import { CustomerGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for customers
const MOBILE_CUSTOMERS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling customers
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useCustomersInfiniteMobile(params?: Partial<CustomerGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_CUSTOMERS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useCustomersInfinite(queryParams);

  // Apply mobile optimizations
  const result = useInfiniteMobile(infiniteQuery);

  // Rename items to customers for better semantics
  return {
    ...result,
    customers: result.items,
  };
}
