import { useMemo } from 'react';
import { useUnreadNotifications } from './useNotification';
import { useAuth } from './useAuth';

/**
 * Hook to get the count of unread notifications for the current user
 * Returns the count and loading state
 */
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  const { data, isLoading } = useUnreadNotifications({
    userId: user?.id || '',
    enabled: !!user?.id,
  });

  const count = useMemo(() => {
    return data?.data?.length || 0;
  }, [data]);

  return {
    count,
    isLoading,
  };
}
