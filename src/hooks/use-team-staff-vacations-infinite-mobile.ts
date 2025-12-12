import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamStaffVacations } from "@/api-client";
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for team staff vacations
const MOBILE_TEAM_STAFF_VACATIONS_PAGE_SIZE = 25;

// Query keys for team staff vacations
export const teamStaffVacationsKeys = {
  all: ["team-staff", "vacations"] as const,
  infinite: (params?: any) => [...teamStaffVacationsKeys.all, "infinite", params] as const,
};

/**
 * Hook for infinite scrolling team staff vacations
 * Automatically filters vacations by the current user's managed sector on the backend
 * Requires team leader privileges
 */
export function useTeamStaffVacationsInfinite(
  params?: any,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const { enabled = true } = options || {};

  const query = useInfiniteQuery({
    queryKey: teamStaffVacationsKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = {
        ...params,
        page: pageParam,
        limit: params?.limit || MOBILE_TEAM_STAFF_VACATIONS_PAGE_SIZE,
      };
      return getTeamStaffVacations(queryParams);
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
      queryKey: teamStaffVacationsKeys.all,
    });
  };

  return {
    ...query,
    refresh,
  };
}

/**
 * Mobile-optimized hook for infinite scrolling team staff vacations
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useTeamStaffVacationsInfiniteMobile(params?: any) {
  const queryParams = {
    ...params,
    limit: MOBILE_TEAM_STAFF_VACATIONS_PAGE_SIZE,
  };

  const infiniteQuery = useTeamStaffVacationsInfinite(queryParams);
  return useInfiniteMobile(infiniteQuery);
}
