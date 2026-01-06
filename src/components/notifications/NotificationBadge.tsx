import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { useUnreadNotificationsCount } from '@/hooks/use-unread-notifications-count';
import { extendedColors } from '@/lib/theme/extended-colors';

interface NotificationBadgeProps {
  /**
   * Maximum number to display before showing "99+"
   * @default 99
   */
  maxCount?: number;
}

/**
 * Badge component that displays the count of unread notifications
 * Automatically fetches and updates the count
 */
export function NotificationBadge({ maxCount = 99 }: NotificationBadgeProps) {
  const { count, isLoading } = useUnreadNotificationsCount();

  // Don't render if loading or no unread notifications
  if (isLoading || count === 0) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View style={styles.container}>
      <Badge variant="red" size="sm">
        <Text style={styles.text}>{displayCount}</Text>
      </Badge>
    </View>
  );
}

/**
 * Minimal badge that shows just a dot for unread notifications
 */
export function NotificationDotBadge() {
  const { count, isLoading } = useUnreadNotificationsCount();

  // Don't render if loading or no unread notifications
  if (isLoading || count === 0) {
    return null;
  }

  return (
    <View style={styles.dotContainer}>
      <View style={[styles.dot, { backgroundColor: extendedColors.red[600] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dotContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
