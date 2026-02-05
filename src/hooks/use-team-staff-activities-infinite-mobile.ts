import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamStaffActivities } from "@/api-client";
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { Activity } from "@/types";

// Mobile-optimized page size for team staff activities
const MOBILE_TEAM_STAFF_ACTIVITIES_PAGE_SIZE = 40;

// Optimized select for team staff activities list
// Only fetch fields actually displayed in TeamActivityTable
const TEAM_STAFF_ACTIVITY_LIST_SELECT = {
  id: true,
  operation: true,
  quantity: true,
  reason: true,
  createdAt: true,
  // Item - only code and name are displayed
  item: {
    select: {
      id: true,
      name: true,
      uniCode: true,
    },
  },
  // User - only name is displayed
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};

// Query keys for team staff activities
export const teamStaffActivitiesKeys = {
  all: ["team-staff", "activities"] as const,
  infinite: (params?: any) => [...teamStaffActivitiesKeys.all, "infinite", params] as const,
};

/**
 * Hook for infinite scrolling team staff activities
 * Automatically filters activities by the current user's managed sector on the backend
 * Requires team leader privileges
 * Uses select to fetch only fields displayed in TeamActivityTable
 */
export function useTeamStaffActivitiesInfinite(
  params?: any,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const { enabled = true } = options || {};

  const query = useInfiniteQuery({
    queryKey: teamStaffActivitiesKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = {
        ...params,
        page: pageParam,
        limit: params?.limit || MOBILE_TEAM_STAFF_ACTIVITIES_PAGE_SIZE,
        // Use optimized select if not provided in params
        select: params?.select || TEAM_STAFF_ACTIVITY_LIST_SELECT,
      };
      return getTeamStaffActivities(queryParams);
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
      queryKey: teamStaffActivitiesKeys.all,
    });
  };

  return {
    ...query,
    refresh,
  };
}

/**
 * Mobile-optimized hook for infinite scrolling team staff activities
 * Uses smaller page sizes and provides flattened data for FlatList
 * Uses select to fetch only fields displayed in TeamActivityTable
 */
export function useTeamStaffActivitiesInfiniteMobile(params?: any) {
  const queryParams = {
    ...params,
    limit: MOBILE_TEAM_STAFF_ACTIVITIES_PAGE_SIZE,
    // Note: select is applied in useTeamStaffActivitiesInfinite
  };

  const infiniteQuery = useTeamStaffActivitiesInfinite(queryParams);
  return useInfiniteMobile<Activity>(infiniteQuery);
}
