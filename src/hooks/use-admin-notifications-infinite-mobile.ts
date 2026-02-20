import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAdminNotifications, type AdminNotificationListFilters } from "@/api-client/notification-admin";
import type { Notification } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";

const MOBILE_PAGE_SIZE = 25;

const adminNotificationKeys = {
  all: ["admin-notifications"] as const,
  list: (filters?: AdminNotificationListFilters) =>
    filters
      ? (["admin-notifications", "list", filters] as const)
      : (["admin-notifications", "list"] as const),
};

/**
 * Mobile-optimized hook for infinite scrolling admin notifications.
 * Uses GET /admin/notifications which returns all notifications system-wide
 * (not filtered by the current user).
 */
export function useAdminNotificationsInfiniteMobile(
  params?: Partial<AdminNotificationListFilters> & { enabled?: boolean }
) {
  const { enabled = true, ...filters } = params || {};

  const queryParams = useMemo(
    () => {
      const { orderBy, ...rest } = filters;

      // The generic useSort hook produces orderBy as an object (e.g., { sentAt: 'desc' }),
      // but the API expects flat params: orderBy=sentAt&order=desc
      let flatOrderBy: string | undefined;
      let flatOrder: string | undefined;
      if (orderBy && typeof orderBy === 'object') {
        const key = Object.keys(orderBy)[0];
        flatOrderBy = key;
        flatOrder = (orderBy as Record<string, string>)[key];
      } else if (typeof orderBy === 'string') {
        flatOrderBy = orderBy;
      }

      return {
        ...rest,
        ...(flatOrderBy ? { orderBy: flatOrderBy } : {}),
        ...(flatOrder ? { order: flatOrder } : {}),
        limit: MOBILE_PAGE_SIZE,
      };
    },
    [filters]
  );

  const infiniteQuery = useInfiniteQuery({
    queryKey: adminNotificationKeys.list(queryParams),
    queryFn: ({ pageParam = 1 }) =>
      getAdminNotifications({ ...queryParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });

  return useInfiniteMobile<Notification>(infiniteQuery);
}
