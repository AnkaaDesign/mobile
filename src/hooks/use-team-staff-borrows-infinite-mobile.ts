import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamStaffBorrows } from "@/api-client";
import { useInfiniteMobile } from "./use-infinite-mobile";

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
 */
export function useTeamStaffBorrowsInfinite(
  params?: any,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const { enabled = true } = options || {};

  const query = useInfiniteQuery({
    queryKey: teamStaffBorrowsKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = {
        ...params,
        page: pageParam,
        limit: params?.limit || MOBILE_TEAM_STAFF_BORROWS_PAGE_SIZE,
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
 */
export function useTeamStaffBorrowsInfiniteMobile(params?: any) {
  const queryParams = {
    ...params,
    limit: MOBILE_TEAM_STAFF_BORROWS_PAGE_SIZE,
  };

  const infiniteQuery = useTeamStaffBorrowsInfinite(queryParams);
  return useInfiniteMobile(infiniteQuery);
}
