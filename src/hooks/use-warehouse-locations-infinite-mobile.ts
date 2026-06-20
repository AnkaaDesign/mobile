import { useMemo } from "react";
import { useWarehouseLocationsInfinite } from "./useWarehouseLocation";
import { WarehouseLocationGetManyFormData } from "@/schemas";
import type { WarehouseLocation } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for warehouse locations
const MOBILE_WAREHOUSE_LOCATIONS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling warehouse locations
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useWarehouseLocationsInfiniteMobile(params?: Partial<WarehouseLocationGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_WAREHOUSE_LOCATIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useWarehouseLocationsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<WarehouseLocation>(infiniteQuery);
}
