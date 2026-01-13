import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { View, Pressable, StyleSheet, FlatList, ActivityIndicator, Platform, Dimensions, Linking, Text as RNText, ScrollView, Alert } from 'react-native';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/contexts/push-notifications-context';
import { useNotificationsInfinite, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotification';
import { extendedColors } from '@/lib/theme/extended-colors';
import type { Notification } from '@/types';
import { formatNotificationTime } from '@/utils/notifications/date-utils';
import { NOTIFICATION_TYPE } from '@/constants';
import * as Haptics from 'expo-haptics';
import { parseDeepLink } from '@/lib/deep-linking';

// DEBUG: Flag to enable/disable debug alerts for testing
const DEBUG_NOTIFICATION_POPOVER = true;

const isWeb = Platform.OS === 'web';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POPOVER_WIDTH = SCREEN_WIDTH - 32; // Full width with 16px padding on each side

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
  isLast,
}: {
  notification: Notification;
  onPress: (notification: Notification) => void;
  isDark: boolean;
  colors: any;
  isLast: boolean;
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

  // For web: wrap body in ScrollView for long content
  const renderBody = () => {
    const bodyText = (
      <Text
        variant="small"
        style={[styles.body, { color: colors.mutedForeground }]}
        numberOfLines={isWeb ? undefined : 3}
      >
        {notification.body}
      </Text>
    );

    if (isWeb) {
      return (
        <ScrollView
          style={styles.bodyScrollView}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {bodyText}
        </ScrollView>
      );
    }
    return bodyText;
  };

  return (
    <View style={[
      styles.itemWrapper,
      !isLast && styles.itemSeparator,
    ]}>
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
            borderColor: isUnread
              ? isDark
                ? extendedColors.blue[800]
                : extendedColors.blue[200]
              : colors.border,
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

            {renderBody()}

            <Text variant="xs" style={[styles.timestamp, { color: colors.mutedForeground }]}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Notification popover for the mobile header
 * Shows recent notifications in a dropdown similar to the web version
 */
export function NotificationPopover({ color }: NotificationPopoverProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notification: pushNotification } = usePushNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications with infinite scroll - filtered by current user
  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsInfinite(
    {
      take: 10,
      orderBy: { createdAt: 'desc' },
      userIds: user?.id ? [user.id] : undefined,
      include: {
        seenBy: {
          include: {
            user: true,
          },
        },
      },
    },
    {
      enabled: !!user?.id,
      // Refetch every 30 seconds as fallback for real-time updates
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    }
  );

  // Mutations
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Real-time notification updates - refetch when push notification is received
  useEffect(() => {
    if (pushNotification) {
      console.log('[NotificationPopover] Push notification received, refreshing...');
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetch();
    }
  }, [pushNotification, queryClient, refetch]);

  // Get notifications list from all pages and calculate unread status
  const notifications = useMemo(() => {
    const items = data?.pages?.flatMap(page => page.data) || [];
    // Add isSeenByUser property based on seenBy relation
    return items.map(notification => ({
      ...notification,
      isSeenByUser: notification.seenBy?.some((seen: any) => seen.userId === user?.id) ?? false,
    }));
  }, [data, user?.id]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isSeenByUser).length;
  }, [notifications]);

  /**
   * Extract mobile deep link from actionUrl
   * Handles multiple formats:
   * 1. Direct mobile URL: "ankaadesign://task/123"
   * 2. Embedded JSON: 'http://localhost:5173{"web":"...", "mobile":"ankaadesign://...", "universalLink":"..."}'
   * 3. JSON object with mobile field: {"web":"...", "mobile":"ankaadesign://...", "universalLink":"..."}
   */
  const extractMobileUrl = useCallback((actionUrl: string): string | null => {
    try {
      // If it's already a mobile deep link, return it
      if (actionUrl.startsWith('ankaadesign://')) {
        return actionUrl;
      }

      // Try to find embedded JSON in the URL (API sends malformed data like "http://localhost:5173{...}")
      const jsonStartIndex = actionUrl.indexOf('{');
      if (jsonStartIndex !== -1) {
        const jsonString = actionUrl.substring(jsonStartIndex);
        try {
          const parsed = JSON.parse(jsonString);
          // Check for mobile field
          if (parsed.mobile && typeof parsed.mobile === 'string') {
            return parsed.mobile;
          }
          // Check for universalLink as fallback
          if (parsed.universalLink && typeof parsed.universalLink === 'string') {
            return parsed.universalLink;
          }
        } catch {
          // JSON parse failed, continue to other methods
        }
      }

      // Try parsing the whole string as JSON
      try {
        const parsed = JSON.parse(actionUrl);
        if (parsed.mobile && typeof parsed.mobile === 'string') {
          return parsed.mobile;
        }
        if (parsed.universalLink && typeof parsed.universalLink === 'string') {
          return parsed.universalLink;
        }
      } catch {
        // Not valid JSON
      }

      // Return original URL as fallback
      return actionUrl;
    } catch (error) {
      console.error('[NotificationPopover] Error extracting mobile URL:', error);
      return null;
    }
  }, []);

  // Handle notification press
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Mark as read
    if (user?.id) {
      await markAsRead.mutateAsync({ notificationId: notification.id, userId: user.id });
    }

    // Close popover
    setIsOpen(false);

    if (DEBUG_NOTIFICATION_POPOVER) {
      Alert.alert(
        '🔔 In-App Notification Tapped',
        `Title: ${notification.title}\nActionUrl: ${notification.actionUrl || 'N/A'}`,
        [{ text: 'OK' }]
      );
    }

    // Navigate to notification target if available
    if (notification.actionUrl) {
      // First, try to extract mobile URL from potentially malformed actionUrl
      const mobileUrl = extractMobileUrl(notification.actionUrl);

      if (DEBUG_NOTIFICATION_POPOVER) {
        Alert.alert(
          '🔗 Extracted URL',
          `Original: ${notification.actionUrl.substring(0, 100)}...\nExtracted: ${mobileUrl || 'N/A'}`,
          [{ text: 'OK' }]
        );
      }

      if (mobileUrl) {
        // If it's a web URL (http/https), open in browser
        if (mobileUrl.startsWith('http://') || mobileUrl.startsWith('https://')) {
          if (DEBUG_NOTIFICATION_POPOVER) {
            Alert.alert('🌐 Opening Web URL', mobileUrl);
          }
          Linking.openURL(mobileUrl);
        } else {
          // Use parseDeepLink to properly handle the mobile deep link
          const parsed = parseDeepLink(mobileUrl);

          if (DEBUG_NOTIFICATION_POPOVER) {
            Alert.alert(
              '🚀 NAVIGATING TO',
              `Mobile URL: ${mobileUrl}\nParsed Route: ${parsed.route}\nParams: ${JSON.stringify(parsed.params)}`,
              [{ text: 'GO', onPress: () => {
                if (parsed.route && parsed.route !== '/(tabs)') {
                  router.push(parsed.route as any);
                }
              }}]
            );
          } else {
            if (parsed.route && parsed.route !== '/(tabs)') {
              router.push(parsed.route as any);
            }
          }
        }
      } else {
        // Fallback: try to use actionUrl directly
        if (DEBUG_NOTIFICATION_POPOVER) {
          Alert.alert('⚠️ No Mobile URL Extracted', `Trying direct: ${notification.actionUrl}`);
        }
        router.push(notification.actionUrl as any);
      }
    } else {
      if (DEBUG_NOTIFICATION_POPOVER) {
        Alert.alert('⚠️ No actionUrl', 'This notification has no navigation target');
      }
    }
  }, [user?.id, markAsRead, router, extractMobileUrl]);

  // Handle load more on scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary]);

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


  // Render notification item
  const renderItem = useCallback(({ item, index }: { item: Notification; index: number }) => (
    <PopoverNotificationItem
      notification={item}
      onPress={handleNotificationPress}
      isDark={isDark}
      colors={colors}
      isLast={index === notifications.length - 1}
    />
  ), [handleNotificationPress, isDark, colors, notifications.length]);

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
                <RNText style={styles.notificationBadgeText} numberOfLines={1}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </RNText>
              </View>
            )}
          </View>
        </Pressable>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-auto"
        sideOffset={8}
        style={[
          styles.popoverContent,
          {
            backgroundColor: colors.card,
            width: POPOVER_WIDTH,
            left: 16,
            right: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text variant="base" style={[styles.headerTitle, { color: colors.foreground }]}>
              Notificações
            </Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <RNText style={styles.countBadgeText} numberOfLines={1}>
                  {String(unreadCount)}
                </RNText>
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
              data={notifications}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
            />
          )}
        </View>

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
    top: -6,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
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
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    maxHeight: 400,
    padding: 8,
  },
  list: {
    maxHeight: 400,
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemWrapper: {
    marginBottom: 0,
  },
  itemSeparator: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  itemContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
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
    gap: 4,
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
  bodyScrollView: {
    maxHeight: 80,
  },
  timestamp: {
    marginTop: 4,
    fontSize: 11,
  },
  unreadBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
