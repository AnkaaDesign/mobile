import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamStaffBorrows } from "@/api-client";
import { useInfiniteMobile } from "./use-infinite-mobile";
import { BORROW_SELECT_TABLE } from "@/api-client/select-patterns";

// Mobile-optimized page size for team staff borrows
const MOBILE_TEAM_STAFF_BORROWS_PAGE_SIZE = 40;

// Query keys for team staff borrows
export const teamStaffBorrowsKeys = {
  all: ["team-staff", "borrows"] as const,
  infinite: (params?: any) => [...teamStaffBorrowsKeys.all, "infinite", params] as const,
};

/**
 * Hook for infinite scrolling team staff borrows
 * Automatically filters borrows by the current user's managed sector on the backend
 * Requires team leader privileges
 * Uses select for optimized data fetching (40-60% reduction)
 */
export function useTeamStaffBorrowsInfinite(
  params?: any,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const { enabled = true } = options || {};

  // Extract select from params if provided, otherwise use default
  const { select: paramsSelect, ...restParams } = params || {};

  const query = useInfiniteQuery({
    queryKey: teamStaffBorrowsKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = {
        ...restParams,
        page: pageParam,
        limit: params?.limit || MOBILE_TEAM_STAFF_BORROWS_PAGE_SIZE,
        // Use select for optimized data fetching
        select: paramsSelect || BORROW_SELECT_TABLE,
      };
      return getTeamStaffBorrows(queryParams);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled,
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: teamStaffBorrowsKeys.all,
    });
  };

  return {
    ...query,
    refresh,
  };
}

/**
 * Mobile-optimized hook for infinite scrolling team staff borrows
 * Uses smaller page sizes and provides flattened data for FlatList
 * Uses select for optimized data fetching (40-60% reduction)
 */
export function useTeamStaffBorrowsInfiniteMobile(params?: any) {
  // Extract select from params if provided
  const { select: paramsSelect, ...restParams } = params || {};

  const queryParams = {
    ...restParams,
    limit: MOBILE_TEAM_STAFF_BORROWS_PAGE_SIZE,
    // Pass select through if provided
    select: paramsSelect || BORROW_SELECT_TABLE,
  };

  const infiniteQuery = useTeamStaffBorrowsInfinite(queryParams);
  return useInfiniteMobile(infiniteQuery);
}
