import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/api-client/axiosClient";
import type { BorrowGetManyFormData } from "@/schemas";
import type { Borrow, BorrowGetManyResponse } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";
import { borrowKeys } from "./queryKeys";
import { BORROW_SELECT_TABLE } from "@/api-client/select-patterns";

// Mobile-optimized page size for borrows
const MOBILE_BORROWS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling user's OWN borrows
 * Automatically filters by current user via /personal/my-loans endpoint
 * Uses select for optimized data fetching (40-60% reduction)
 */
export function useMyBorrowsInfiniteMobile(params?: Partial<BorrowGetManyFormData> & { enabled?: boolean; select?: any }) {
  // Extract select from params if provided (from list config), otherwise use default
  const { select: paramsSelect, enabled, ...restParams } = params || {};

  // Prepare parameters with mobile-optimized page size and select
  const queryParams = useMemo(
    () => ({
      ...restParams,
      limit: MOBILE_BORROWS_PAGE_SIZE,
      // Use select for optimized data fetching
      select: paramsSelect || BORROW_SELECT_TABLE,
    }),
    [restParams, paramsSelect],
  );

  // Use personal endpoint that filters by current user
  const infiniteQuery = useInfiniteQuery({
    queryKey: borrowKeys.list(queryParams),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<BorrowGetManyResponse>("/personal/my-loans", {
        params: {
          ...queryParams,
          page: pageParam,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Apply mobile optimizations
  return useInfiniteMobile<Borrow>(infiniteQuery);
}
