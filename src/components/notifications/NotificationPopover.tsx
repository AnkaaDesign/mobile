import React, { useCallback, useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, FlatList, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotification';
import { extendedColors } from '@/lib/theme/extended-colors';
import type { Notification } from '@/types';
import { formatNotificationTime } from '@/utils/notifications/date-utils';
import { NOTIFICATION_TYPE } from '@/constants';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POPOVER_WIDTH = Math.min(SCREEN_WIDTH - 32, 360);

interface NotificationPopoverProps {
  color: string;
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
    case NOTIFICATION_TYPE.USER:
      return 'user';
    case NOTIFICATION_TYPE.MAINTENANCE:
      return 'tool';
    case NOTIFICATION_TYPE.PPE:
      return 'shield';
    case NOTIFICATION_TYPE.FINANCIAL:
      return 'currency-dollar';
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
    case NOTIFICATION_TYPE.USER:
      return extendedColors.indigo[600];
    case NOTIFICATION_TYPE.MAINTENANCE:
      return extendedColors.yellow[700];
    case NOTIFICATION_TYPE.PPE:
      return extendedColors.teal[600];
    case NOTIFICATION_TYPE.FINANCIAL:
      return extendedColors.emerald[600];
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
    case NOTIFICATION_TYPE.USER:
      return isDark ? extendedColors.indigo[900] : extendedColors.indigo[100];
    case NOTIFICATION_TYPE.MAINTENANCE:
      return isDark ? extendedColors.yellow[900] : extendedColors.yellow[100];
    case NOTIFICATION_TYPE.PPE:
      return isDark ? extendedColors.teal[900] : extendedColors.teal[100];
    case NOTIFICATION_TYPE.FINANCIAL:
      return isDark ? extendedColors.emerald[900] : extendedColors.emerald[100];
    default:
      return isDark ? extendedColors.neutral[800] : extendedColors.neutral[100];
  }
}

/**
 * Notification item component for the popover
 */
function PopoverNotificationItem({
  notification,
  onPress,
  isDark,
  colors,
}: {
  notification: Notification;
  onPress: (notification: Notification) => void;
  isDark: boolean;
  colors: any;
}) {
  const isUnread = !notification.isSeenByUser;
  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationIconColor(notification.type, isDark);
  const iconBgColor = getNotificationIconBgColor(notification.type, isDark);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(notification);
  }, [notification, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.itemContainer,
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
      <View style={styles.itemContent}>
        {/* Icon Badge */}
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Icon name={iconName} size={18} color={iconColor} />
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
  );
}

/**
 * Notification popover for the mobile header
 * Shows recent notifications in a dropdown similar to the web version
 */
export function NotificationPopover({ color }: NotificationPopoverProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread notifications
  const { data, isLoading, refetch } = useUnreadNotifications({
    userId: user?.id || '',
    enabled: !!user?.id,
  });

  // Mutations
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Get notifications list
  const notifications = useMemo(() => {
    return data?.data || [];
  }, [data]);

  const unreadCount = notifications.length;

  // Handle notification press
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Mark as read
    if (user?.id) {
      await markAsRead.mutateAsync({ notificationId: notification.id, userId: user.id });
    }

    // Close popover
    setIsOpen(false);

    // Navigate to notification target if available
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('http://') || notification.actionUrl.startsWith('https://')) {
        // For external URLs, use Linking
        const { Linking } = require('react-native');
        Linking.openURL(notification.actionUrl);
      } else {
        // For internal routes
        router.push(notification.actionUrl as any);
      }
    }
  }, [user?.id, markAsRead, router]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (user?.id && unreadCount > 0) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await markAllAsRead.mutateAsync(user.id);
      refetch();
    }
  }, [user?.id, unreadCount, markAllAsRead, refetch]);

  // Handle view all
  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    router.push('/pessoal/minhas-notificacoes' as any);
  }, [router]);

  // Render notification item
  const renderItem = useCallback(({ item }: { item: Notification }) => (
    <PopoverNotificationItem
      notification={item}
      onPress={handleNotificationPress}
      isDark={isDark}
      colors={colors}
    />
  ), [handleNotificationPress, isDark, colors]);

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Pressable
          style={({ pressed }) => [
            styles.triggerButton,
            pressed && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View>
            <Icon name="bell" size="md" color={color} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 border-0"
        align="end"
        sideOffset={8}
        style={[styles.popoverContent, { backgroundColor: colors.card, width: POPOVER_WIDTH }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text variant="base" style={[styles.headerTitle, { color: colors.foreground }]}>
              Notificações
            </Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <Icon name="check" size={14} color={colors.primary} />
              <Text variant="small" style={{ color: colors.primary, marginLeft: 4 }}>
                Marcar todas
              </Text>
            </Button>
          )}
        </View>

        {/* Content */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text variant="small" style={{ color: colors.mutedForeground, marginTop: 8 }}>
                Carregando...
              </Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="bell-off" size={32} color={colors.mutedForeground} />
              <Text variant="small" style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Nenhuma notificação
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications.slice(0, 5)}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              style={styles.list}
            />
          )}
        </View>

        {/* Footer */}
        {notifications.length > 0 && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleViewAll}
              style={styles.viewAllButton}
            >
              <Text variant="small" style={{ color: colors.primary }}>
                Ver todas as notificações
              </Text>
            </Button>
          </View>
        )}
      </PopoverContent>
    </Popover>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fafafa',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  popoverContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    maxHeight: 320,
  },
  list: {
    maxHeight: 320,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
  },
  footer: {
    borderTopWidth: 1,
    padding: 8,
  },
  viewAllButton: {
    width: '100%',
    justifyContent: 'center',
  },
  itemContainer: {
    borderBottomWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 13,
  },
  body: {
    lineHeight: 18,
    fontSize: 12,
  },
  timestamp: {
    marginTop: 2,
    fontSize: 11,
  },
  unreadBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
