import { useNotifications } from './useNotification';
import { useAuth } from './useAuth';

/**
 * Unread notifications count, used in the header bell.
 *
 * Two perf-relevant choices here:
 *   1. `select` runs inside React Query and produces a primitive count, so
 *      consumers re-render only when the integer changes — not whenever the
 *      underlying notifications array reference changes (e.g. after a refetch
 *      that returned the same logical data).
 *   2. We cap fetched payload at 30 records. The badge displays "99+" anyway,
 *      and on the server side `seenBy` includes are expensive to hydrate.
 */
export function useUnreadNotificationsCount() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: count = 0, isLoading } = useNotifications(
    {
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        seenBy: true,
      },
    },
    {
      enabled: !!userId,
      // Keep the badge responsive without thrashing on every focus.
      staleTime: 1000 * 60, // 1 minute
      // Avoid serving stale-and-forgotten data once the hook unmounts.
      gcTime: 1000 * 60 * 10,
      select: (response: any) => {
        if (!userId || !response?.data) return 0;
        return response.data.reduce((acc: number, n: any) => {
          const seen = n.seenBy?.some((s: any) => s.userId === userId);
          return seen ? acc : acc + 1;
        }, 0);
      },
    } as any,
  );

  return {
    count: typeof count === 'number' ? count : 0,
    isLoading,
  };
}
