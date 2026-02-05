import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  Linking,
  Text as RNText,
  ScrollView,
  Alert,
  Modal,
  Animated,
  BackHandler,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
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
const DRAWER_WIDTH = 280; // Same width as navigation menu drawer

// Consistent spacing system (matching navigation menu)
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

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
    case NOTIFICATION_TYPE.GENERAL:
      return 'bell';
    case NOTIFICATION_TYPE.SERVICE_ORDER:
      return 'tool';
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
    case NOTIFICATION_TYPE.GENERAL:
      return extendedColors.indigo[600];
    case NOTIFICATION_TYPE.SERVICE_ORDER:
      return extendedColors.yellow[700];
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
    case NOTIFICATION_TYPE.GENERAL:
      return isDark ? extendedColors.indigo[900] : extendedColors.indigo[100];
    case NOTIFICATION_TYPE.SERVICE_ORDER:
      return isDark ? extendedColors.yellow[900] : extendedColors.yellow[100];
    case NOTIFICATION_TYPE.PPE:
      return isDark ? extendedColors.teal[900] : extendedColors.teal[100];
    default:
      return isDark ? extendedColors.neutral[800] : extendedColors.neutral[100];
  }
}

/**
 * Notification popover for the mobile header
 * Shows recent notifications in a drawer similar to the navigation menu
 */
export function NotificationPopover({ color }: NotificationPopoverProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notification: pushNotification } = usePushNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Animation values
  const translateX = useSharedValue(SCREEN_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const startX = useSharedValue(0);

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
      take: 20,
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
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    }
  );

  // Mutations
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Real-time notification updates
  useEffect(() => {
    if (pushNotification) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetch();
    }
  }, [pushNotification, queryClient, refetch]);

  // Get notifications list from all pages
  const notifications = useMemo(() => {
    const items = data?.pages?.flatMap((page) => {
      // Handle both array format and { data: Notification[] } format
      if (Array.isArray(page)) {
        return page as Notification[];
      }
      return (page as { data: Notification[] }).data || [];
    }) || [];
    return items.map((notification: Notification) => ({
      ...notification,
      isSeenByUser: notification.seenBy?.some((seen: any) => seen.userId === user?.id) ?? false,
    }));
  }, [data, user?.id]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n: Notification & { isSeenByUser: boolean }) => !n.isSeenByUser).length;
  }, [notifications]);

  // Handle scroll to detect when near bottom for infinite scroll
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Start loading when 100px from bottom
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // Handle drawer open/close animations
  const openDrawer = useCallback(() => {
    setIsModalVisible(true);
    backdropOpacity.value = withTiming(1, { duration: 250 });
    translateX.value = withSpring(0, {
      damping: 35,
      stiffness: 400,
      mass: 0.7,
    });
  }, [backdropOpacity, translateX]);

  const closeDrawer = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateX.value = withSpring(DRAWER_WIDTH, {
      damping: 35,
      stiffness: 400,
      mass: 0.7,
    });
    setTimeout(() => setIsModalVisible(false), 250);
  }, [backdropOpacity, translateX]);

  useEffect(() => {
    if (isOpen) {
      openDrawer();
    } else {
      if (isModalVisible) {
        closeDrawer();
      }
    }
  }, [isOpen, isModalVisible, openDrawer, closeDrawer]);

  // Android back button handling
  useEffect(() => {
    if (Platform.OS === 'android' && isOpen) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        setIsOpen(false);
        return true;
      });
      return () => backHandler.remove();
    }
  }, [isOpen]);

  // Gesture handling for swipe to close
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      // Only allow swiping to the right (to close)
      if (event.translationX > 0) {
        translateX.value = Math.min(startX.value + event.translationX, DRAWER_WIDTH);
      }
    })
    .onEnd((event) => {
      const threshold = DRAWER_WIDTH * 0.3;
      const shouldClose = translateX.value > threshold || event.velocityX > 500;

      if (shouldClose) {
        runOnJS(setIsOpen)(false);
      } else {
        translateX.value = withSpring(0, {
          damping: 30,
          stiffness: 300,
          mass: 0.8,
        });
      }
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.5,
  }));

  /**
   * Extract mobile deep link from actionUrl
   */
  const extractMobileUrl = useCallback((actionUrl: string): string | null => {
    try {
      if (actionUrl.startsWith('ankaadesign://')) {
        return actionUrl;
      }

      const jsonStartIndex = actionUrl.indexOf('{');
      if (jsonStartIndex !== -1) {
        const jsonString = actionUrl.substring(jsonStartIndex);
        try {
          const parsed = JSON.parse(jsonString);
          if (parsed.mobile && typeof parsed.mobile === 'string') {
            return parsed.mobile;
          }
          if (parsed.universalLink && typeof parsed.universalLink === 'string') {
            return parsed.universalLink;
          }
        } catch {
          // JSON parse failed
        }
      }

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

      return actionUrl;
    } catch (error) {
      return null;
    }
  }, []);

  // Handle notification press
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (user?.id) {
      await markAsRead.mutateAsync({ notificationId: notification.id, userId: user.id });
    }

    setIsOpen(false);

    if (DEBUG_NOTIFICATION_POPOVER) {
      Alert.alert(
        '🔔 In-App Notification Tapped',
        `Title: ${notification.title}\nActionUrl: ${notification.actionUrl || 'N/A'}`,
        [{ text: 'OK' }]
      );
    }

    if (notification.actionUrl) {
      const mobileUrl = extractMobileUrl(notification.actionUrl);

      if (mobileUrl) {
        if (mobileUrl.startsWith('http://') || mobileUrl.startsWith('https://')) {
          Linking.openURL(mobileUrl);
        } else {
          const parsed = parseDeepLink(mobileUrl);
          if (parsed.route && parsed.route !== '/(tabs)') {
            router.push(parsed.route as any);
          }
        }
      }
    }
  }, [user?.id, markAsRead, router, extractMobileUrl]);

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

  const handleOpenDrawer = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsOpen(true);
  }, []);

  // Render notification item (matching navigation menu style)
  const renderNotificationItem = useCallback((notification: Notification, index: number) => {
    const isUnread = !notification.isSeenByUser;
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type, isDark);
    const iconBgColor = getNotificationIconBgColor(notification.type, isDark);
    const isLast = index === notifications.length - 1;

    return (
      <View key={notification.id} style={styles.notificationItem}>
        <Pressable
          onPress={() => handleNotificationPress(notification)}
          style={({ pressed }) => [
            styles.notificationItemPressable,
            {
              marginLeft: SPACING.sm,
              marginRight: SPACING.sm,
            },
            isUnread && {
              backgroundColor: isDark ? 'rgba(21, 128, 61, 0.15)' : 'rgba(21, 128, 61, 0.1)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(21, 128, 61, 0.4)' : 'rgba(21, 128, 61, 0.3)',
            },
            pressed && {
              backgroundColor: isDark ? 'rgba(21, 128, 61, 0.2)' : 'rgba(21, 128, 61, 0.15)',
              transform: [{ scale: 0.96 }],
              opacity: 0.7,
            },
          ]}
        >
          <View style={[styles.notificationItemContent, { paddingLeft: SPACING.md }]}>
            <View style={styles.notificationItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Icon name={iconName} size={18} color={iconColor} />
              </View>
              <View style={styles.textContent}>
                <RNText
                  style={[
                    styles.notificationTitle,
                    {
                      color: isDark ? '#cccccc' : '#525252',
                      fontWeight: isUnread ? '600' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {notification.title}
                </RNText>
                <RNText
                  style={[
                    styles.notificationBody,
                    { color: isDark ? '#d4d4d4' : '#525252' },
                  ]}
                  numberOfLines={2}
                >
                  {notification.body}
                </RNText>
                <RNText
                  style={[
                    styles.notificationTimestamp,
                    { color: isDark ? '#8c8c8c' : '#737373' },
                  ]}
                >
                  {formatNotificationTime(notification.createdAt)}
                </RNText>
              </View>
            </View>
            <View style={styles.notificationItemRight}>
              {isUnread && (
                <View style={styles.unreadDot} />
              )}
            </View>
          </View>
        </Pressable>
      </View>
    );
  }, [isDark, notifications.length, handleNotificationPress]);

  return (
    <>
      {/* Trigger Button */}
      <Pressable
        onPress={handleOpenDrawer}
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

      {/* Notification Drawer */}
      {isModalVisible && (
        <Modal visible={isModalVisible} transparent statusBarTranslucent onRequestClose={() => setIsOpen(false)}>
          <GestureHandlerRootView style={styles.modalContainer}>
            <View style={styles.drawerContainer}>
              {/* Backdrop */}
              <ReanimatedAnimated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={styles.backdropPress} onPress={() => setIsOpen(false)} />
              </ReanimatedAnimated.View>

              {/* Drawer Content */}
              <GestureDetector gesture={panGesture}>
                <ReanimatedAnimated.View
                  style={[
                    styles.drawer,
                    {
                      width: DRAWER_WIDTH,
                      backgroundColor: isDark ? '#212121' : '#fafafa',
                    },
                    drawerStyle,
                  ]}
                >
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + SPACING.lg }}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={400}
                  >
                    {/* Top padding for safe area */}
                    <View style={{ height: insets.top }} />

                    {/* Header section (like user section in nav menu) */}
                    <View style={[styles.headerSection, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                          <Icon name="bell" size="lg" variant="muted" />
                          <View style={styles.headerInfo}>
                            <RNText style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#171717' }]}>
                              Notificações
                            </RNText>
                            {unreadCount > 0 && (
                              <RNText style={[styles.headerSubtitle, { color: isDark ? '#d4d4d4' : '#525252' }]}>
                                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                              </RNText>
                            )}
                          </View>
                        </View>
                        <Pressable
                          onPress={() => setIsOpen(false)}
                          style={({ pressed }) => [
                            styles.closeButton,
                            pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon name="x" size={20} color={isDark ? '#8c8c8c' : '#737373'} />
                        </Pressable>
                      </View>

                      {/* Mark all as read button (like user menu dropdown) */}
                      {unreadCount > 0 && (
                        <View style={[styles.actionMenu, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff', borderColor: isDark ? '#404040' : '#e0e0e0', borderWidth: 1 }]}>
                          <Pressable
                            onPress={handleMarkAllAsRead}
                            disabled={markAllAsRead.isPending}
                            style={({ pressed }) => [
                              styles.actionMenuItem,
                              pressed && {
                                backgroundColor: isDark ? 'rgba(21, 128, 61, 0.2)' : 'rgba(21, 128, 61, 0.15)',
                                transform: [{ scale: 0.97 }],
                              },
                            ]}
                          >
                            {markAllAsRead.isPending ? (
                              <ActivityIndicator size="small" color="#15803d" style={{ width: 16, height: 16 }} />
                            ) : (
                              <Icon name="check" size="sm" variant="muted" />
                            )}
                            <RNText style={[styles.actionMenuText, { color: isDark ? '#d4d4d4' : '#404040' }]}>
                              {markAllAsRead.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
                            </RNText>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Notifications section */}
                    <View style={styles.section}>
                      <RNText style={[styles.sectionTitle, { color: isDark ? '#8c8c8c' : '#737373' }]}>
                        {unreadCount > 0 ? 'NÃO LIDAS' : 'NOTIFICAÇÕES'}
                      </RNText>

                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#15803d" />
                          <RNText style={[styles.loadingText, { color: isDark ? '#d4d4d4' : '#525252' }]}>
                            Carregando...
                          </RNText>
                        </View>
                      ) : notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                          <Icon name="bell-off" size={32} color={isDark ? '#8c8c8c' : '#737373'} />
                          <RNText style={[styles.emptyText, { color: isDark ? '#d4d4d4' : '#525252' }]}>
                            Nenhuma notificação
                          </RNText>
                        </View>
                      ) : (
                        <>
                          {/* Unread notifications */}
                          {notifications.filter((n: Notification & { isSeenByUser: boolean }) => !n.isSeenByUser).map((notification: Notification & { isSeenByUser: boolean }, index: number) =>
                            renderNotificationItem(notification, index)
                          )}

                          {/* Read notifications section */}
                          {notifications.filter((n: Notification & { isSeenByUser: boolean }) => n.isSeenByUser).length > 0 && (
                            <>
                              <RNText style={[styles.sectionTitle, { color: isDark ? '#8c8c8c' : '#737373', marginTop: SPACING.lg }]}>
                                LIDAS
                              </RNText>
                              {notifications.filter((n: Notification & { isSeenByUser: boolean }) => n.isSeenByUser).map((notification: Notification & { isSeenByUser: boolean }, index: number) =>
                                renderNotificationItem(notification, index)
                              )}
                            </>
                          )}

                          {/* Loading indicator for infinite scroll */}
                          {isFetchingNextPage && (
                            <View style={styles.loadingMoreContainer}>
                              <ActivityIndicator size="small" color="#15803d" />
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </ScrollView>
                </ReanimatedAnimated.View>
              </GestureDetector>
            </View>
          </GestureHandlerRootView>
        </Modal>
      )}
    </>
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
    top: -3,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 11,
  },
  // Modal & Drawer styles
  modalContainer: {
    flex: 1,
  },
  drawerContainer: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  backdropPress: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  // Header section (like userSection in nav menu)
  headerSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  // Action menu (like userMenu in nav menu)
  actionMenu: {
    marginTop: SPACING.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  actionMenuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Section (like nav menu sections)
  section: {
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  // Notification items (like menuItem in nav menu)
  notificationItem: {
    marginBottom: 2,
  },
  notificationItemPressable: {
    borderRadius: 6,
    overflow: 'hidden',
    minHeight: 40,
  },
  notificationItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    minHeight: 40,
  },
  notificationItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  notificationTitle: {
    fontSize: 14,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTimestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  notificationItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803d',
  },
  // Loading & Empty states
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  loadingMoreContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
