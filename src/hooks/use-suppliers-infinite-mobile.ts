import { useMemo } from "react";
import { useSuppliersInfinite } from './useSupplier';
import { SupplierGetManyFormData } from '@/schemas';
import type { Supplier } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for suppliers
const MOBILE_SUPPLIERS_PAGE_SIZE = 20;

/**
 * Mobile-optimized hook for infinite scrolling suppliers
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useSuppliersInfiniteMobile(params?: Partial<SupplierGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_SUPPLIERS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useSuppliersInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Supplier>(infiniteQuery);
}
