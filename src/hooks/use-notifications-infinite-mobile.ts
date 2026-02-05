import { useMemo } from "react";
import { useNotificationsInfinite } from './useNotification';
import { NotificationGetManyFormData } from '@/schemas';
import type { Notification } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for notifications
const MOBILE_NOTIFICATIONS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling notifications
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useNotificationsInfiniteMobile(params?: Partial<NotificationGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_NOTIFICATIONS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useNotificationsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Notification>(infiniteQuery);
}
