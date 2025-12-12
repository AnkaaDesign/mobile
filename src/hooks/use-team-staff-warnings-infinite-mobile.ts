import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamStaffWarnings } from "@/api-client";
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for team staff warnings
const MOBILE_TEAM_STAFF_WARNINGS_PAGE_SIZE = 40;

// Query keys for team staff warnings
export const teamStaffWarningsKeys = {
  all: ["team-staff", "warnings"] as const,
  infinite: (params?: any) => [...teamStaffWarningsKeys.all, "infinite", params] as const,
};

/**
 * Hook for infinite scrolling team staff warnings
 * Automatically filters warnings by the current user's managed sector on the backend
 * Requires team leader privileges
 */
export function useTeamStaffWarningsInfinite(
  params?: any,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const { enabled = true } = options || {};

  const query = useInfiniteQuery({
    queryKey: teamStaffWarningsKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = {
        ...params,
        page: pageParam,
        limit: params?.limit || MOBILE_TEAM_STAFF_WARNINGS_PAGE_SIZE,
      };
      return getTeamStaffWarnings(queryParams);
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
      queryKey: teamStaffWarningsKeys.all,
    });
  };

  return {
    ...query,
    refresh,
  };
}

/**
 * Mobile-optimized hook for infinite scrolling team staff warnings
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useTeamStaffWarningsInfiniteMobile(params?: any) {
  const queryParams = {
    ...params,
    limit: MOBILE_TEAM_STAFF_WARNINGS_PAGE_SIZE,
  };

  const infiniteQuery = useTeamStaffWarningsInfinite(queryParams);
  return useInfiniteMobile(infiniteQuery);
}
