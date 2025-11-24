import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/api-client/axiosClient";
import type { ActivityGetManyFormData, ActivityGetManyResponse } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";
import { activityKeys } from "./queryKeys";

// Mobile-optimized page size for activities
const MOBILE_ACTIVITIES_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling user's OWN activities
 * Automatically filters by current user via /personal/my-activities endpoint
 */
export function useMyActivitiesInfiniteMobile(params?: Partial<ActivityGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_ACTIVITIES_PAGE_SIZE,
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
