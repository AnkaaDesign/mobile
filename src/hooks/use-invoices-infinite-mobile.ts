import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getInvoices } from "@/api-client";
import { invoiceKeys } from "./useInvoice";
import type { Invoice } from "@/types/invoice";
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for invoices
const MOBILE_INVOICES_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling invoices
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useInvoicesInfiniteMobile(params?: Record<string, any> & { enabled?: boolean }) {
  const { enabled, ...queryParams } = params || {};

  // Prepare parameters with mobile-optimized page size
  const finalParams = useMemo(
    () => ({
      ...queryParams,
      limit: MOBILE_INVOICES_PAGE_SIZE,
    }),
    [queryParams],
  );

  // Use infinite query
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...invoiceKeys.lists(), finalParams],
    queryFn: ({ pageParam = 1 }) =>
      getInvoices({
        ...finalParams,
        page: pageParam,
      }),
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: enabled ?? true,
  });

  // Apply mobile optimizations
  const result = useInfiniteMobile<Invoice>(infiniteQuery);

  // Rename items to invoices for better semantics
  return {
    ...result,
    invoices: result.items,
  };
}
