import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/api-client/axiosClient";
import type { ActivityGetManyFormData } from "@/schemas";
import type { ActivityGetManyResponse } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";
import { activityKeys } from "./queryKeys";

// Mobile-optimized page size for activities
const MOBILE_ACTIVITIES_PAGE_SIZE = 25;

// Optimized select for personal activities list
// Only fetch fields actually displayed in PersonalActivityTable
const PERSONAL_ACTIVITY_LIST_SELECT = {
  id: true,
  operation: true,
  quantity: true,
  reason: true,
  createdAt: true,
  // Item - only name is displayed in the table
  item: {
    select: {
      id: true,
      name: true,
    },
  },
};

/**
 * Mobile-optimized hook for infinite scrolling user's OWN activities
 * Automatically filters by current user via /personal/my-activities endpoint
 * Uses select to fetch only fields displayed in PersonalActivityTable
 */
export function useMyActivitiesInfiniteMobile(params?: Partial<ActivityGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size and select
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_ACTIVITIES_PAGE_SIZE,
      // Use optimized select if not provided in params
      select: params?.select || PERSONAL_ACTIVITY_LIST_SELECT,
    }),
    [params],
  );

  // Use personal endpoint that filters by current user
  const infiniteQuery = useInfiniteQuery({
    queryKey: activityKeys.list(queryParams),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<ActivityGetManyResponse>("/personal/my-activities", {
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
    enabled: params?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
