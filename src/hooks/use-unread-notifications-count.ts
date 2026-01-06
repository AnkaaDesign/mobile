import { useMemo } from 'react';
import { useNotifications } from './useNotification';
import { useAuth } from './useAuth';

/**
 * Hook to get the count of unread notifications for the current user
 * Uses the same approach as web - fetches notifications with seenBy and calculates client-side
 */
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  const { data, isLoading } = useNotifications({
    take: 50, // Fetch enough to get accurate count
    orderBy: { createdAt: 'desc' },
    include: {
      seenBy: true,
    },
  });

  const count = useMemo(() => {
    if (!user?.id || !data?.data) return 0;

    // Count notifications that haven't been seen by the current user
    return data.data.filter(notification =>
      !notification.seenBy?.some((seen: any) => seen.userId === user.id)
    ).length;
  }, [data, user?.id]);

  return {
    count,
    isLoading,
  };
}
