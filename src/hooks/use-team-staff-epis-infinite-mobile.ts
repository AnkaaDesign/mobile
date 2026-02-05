import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamStaffEpis } from "@/api-client";
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { PpeDelivery } from "@/types";

// Mobile-optimized page size for team staff EPIs
const MOBILE_TEAM_STAFF_EPIS_PAGE_SIZE = 40;

// Query keys for team staff EPIs
export const teamStaffEpisKeys = {
  all: ["team-staff", "epis"] as const,
  infinite: (params?: any) => [...teamStaffEpisKeys.all, "infinite", params] as const,
};

/**
 * Hook for infinite scrolling team staff EPI deliveries
 * Automatically filters EPI deliveries by the current user's managed sector on the backend
 * Requires team leader privileges
 */
export function useTeamStaffEpisInfinite(
  params?: any,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const { enabled = true } = options || {};

  const query = useInfiniteQuery({
    queryKey: teamStaffEpisKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = {
        ...params,
        page: pageParam,
        limit: params?.limit || MOBILE_TEAM_STAFF_EPIS_PAGE_SIZE,
      };
      return getTeamStaffEpis(queryParams);
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
      queryKey: teamStaffEpisKeys.all,
    });
  };

  return {
    ...query,
    refresh,
  };
}

/**
 * Mobile-optimized hook for infinite scrolling team staff EPI deliveries
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useTeamStaffEpisInfiniteMobile(params?: any) {
  const queryParams = {
    ...params,
    limit: MOBILE_TEAM_STAFF_EPIS_PAGE_SIZE,
  };

  const infiniteQuery = useTeamStaffEpisInfinite(queryParams);
  return useInfiniteMobile<PpeDelivery>(infiniteQuery);
}
