import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ReanimatedSwipeableRow, SwipeAction } from '@/components/ui/reanimated-swipeable-row';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { formatNotificationTime } from '@/utils/notifications/date-utils';
import type { Notification } from '@/types';
import { NOTIFICATION_TYPE } from '@/constants';
import * as Haptics from 'expo-haptics';
import { extendedColors } from '@/lib/theme/extended-colors';

interface NotificationItemProps {
  notification: Notification & { isSeenByUser?: boolean };
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
  onRemindLater?: (notification: Notification) => void;
}

/**
 * Get icon name based on notification type
 */
function getNotificationIcon(type: NOTIFICATION_TYPE): string {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return 'bell';
    case NOTIFICATION_TYPE.TASK:
      return 'clipboard-check';
    case NOTIFICATION_TYPE.ORDER:
      return 'package';
    case NOTIFICATION_TYPE.STOCK:
      return 'warehouse';
    case NOTIFICATION_TYPE.PPE:
      return 'shield';
    default:
      return 'bell';
  }
}

/**
 * Get icon color based on notification type
 */
function getNotificationIconColor(type: NOTIFICATION_TYPE, isDark: boolean): string {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return extendedColors.blue[600];
    case NOTIFICATION_TYPE.TASK:
      return extendedColors.purple[600];
    case NOTIFICATION_TYPE.ORDER:
      return extendedColors.green[600];
    case NOTIFICATION_TYPE.STOCK:
      return extendedColors.orange[600];
    case NOTIFICATION_TYPE.PPE:
      return extendedColors.teal[600];
    default:
      return isDark ? extendedColors.neutral[400] : extendedColors.neutral[600];
  }
}

/**
 * Get background color for icon badge based on notification type
 */
function getNotificationIconBgColor(type: NOTIFICATION_TYPE, isDark: boolean): string {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return isDark ? extendedColors.blue[900] : extendedColors.blue[100];
    case NOTIFICATION_TYPE.TASK:
      return isDark ? extendedColors.purple[900] : extendedColors.purple[100];
    case NOTIFICATION_TYPE.ORDER:
      return isDark ? extendedColors.green[900] : extendedColors.green[100];
    case NOTIFICATION_TYPE.STOCK:
      return isDark ? extendedColors.orange[900] : extendedColors.orange[100];
    case NOTIFICATION_TYPE.PPE:
      return isDark ? extendedColors.teal[900] : extendedColors.teal[100];
    default:
      return isDark ? extendedColors.neutral[800] : extendedColors.neutral[100];
  }
}

export function NotificationItem({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  onRemindLater,
}: NotificationItemProps) {
  const { colors, isDark } = useTheme();
  const isUnread = !notification.isSeenByUser;

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(notification);
  }, [notification, onPress]);

  // Create swipe actions
  const leftActions: SwipeAction[] = [];
  const rightActions: SwipeAction[] = [];

  // Left action: Mark as read (only for unread notifications)
  if (isUnread && onMarkAsRead) {
    leftActions.push({
      key: 'mark-read',
      label: 'Marcar Lida',
      icon: <Icon name="check" size={20} color="#FFFFFF" />,
      backgroundColor: extendedColors.green[600],
      onPress: () => {
        onMarkAsRead(notification);
      },
    });
  }

  // Right actions: Remind later and Delete
  if (onRemindLater) {
    rightActions.push({
      key: 'remind-later',
      label: 'Lembrar',
      icon: <Icon name="clock" size={20} color="#FFFFFF" />,
      backgroundColor: extendedColors.blue[600],
      onPress: () => {
        onRemindLater(notification);
      },
    });
  }

  if (onDelete) {
    rightActions.push({
      key: 'delete',
      label: 'Excluir',
      icon: <Icon name="trash" size={20} color="#FFFFFF" />,
      backgroundColor: extendedColors.red[600],
      onPress: () => {
        onDelete(notification);
      },
    });
  }

  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationIconColor(notification.type, isDark);
  const iconBgColor = getNotificationIconBgColor(notification.type, isDark);

  return (
    <ReanimatedSwipeableRow
      leftActions={leftActions}
      rightActions={rightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: isUnread
              ? isDark
                ? extendedColors.neutral[800]
                : extendedColors.blue[50]
              : colors.card,
            borderBottomColor: colors.border,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.content}>
          {/* Icon Badge */}
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <Icon name={iconName} size={20} color={iconColor} />
          </View>

          {/* Content */}
          <View style={styles.textContent}>
            <View style={styles.headerRow}>
              <Text
                variant="small"
                style={[
                  styles.title,
                  {
                    color: colors.foreground,
                    fontWeight: isUnread ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {isUnread && <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]} />}
            </View>

            <Text
              variant="small"
              style={[styles.body, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {notification.body}
            </Text>

            <Text variant="xs" style={[styles.timestamp, { color: colors.mutedForeground }]}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeableRow>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
  },
  body: {
    lineHeight: 20,
  },
  timestamp: {
    marginTop: 2,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
