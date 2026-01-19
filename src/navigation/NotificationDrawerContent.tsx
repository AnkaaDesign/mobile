import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text as RNText,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
const Text = RNText;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/icon";
import {
  IconChevronDown,
  IconCheck,
  IconBell,
  IconBellOff,
} from "@tabler/icons-react-native";
import { impactHaptic, selectionHaptic } from "@/utils/haptics";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePushNotifications } from "@/contexts/push-notifications-context";
import { useNotificationsInfinite, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotification";
import { extendedColors } from "@/lib/theme/extended-colors";
import type { Notification } from "@/types";
import { formatNotificationTime } from "@/utils/notifications/date-utils";
import { NOTIFICATION_TYPE } from "@/constants";
import { parseDeepLink } from "@/lib/deep-linking";
import { useDrawerMode } from "@/contexts/drawer-mode-context";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useDrawerStatus } from "@react-navigation/drawer";

// Spacing constants (matching OriginalMenuDrawer exactly)
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// DEBUG: Flag to enable/disable debug alerts for testing
const DEBUG_NOTIFICATIONS = false;

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

export default function NotificationDrawerContent(props: DrawerContentComponentProps) {
  const { user: authUser } = useAuth();
  const { isDark: isDarkMode } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notification: pushNotification } = usePushNotifications();
  const insets = useSafeAreaInsets();
  const { navigation } = props;
  const drawerStatus = useDrawerStatus();
  const { setDrawerMode } = useDrawerMode();

  // State
  const [showActions, setShowActions] = useState(true);
  const [navigatingItemId, setNavigatingItemId] = useState<string | null>(null);

  // Animation refs
  const dropdownAnimation = React.useRef(new Animated.Value(1)).current;

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
      userIds: authUser?.id ? [authUser.id] : undefined,
      include: {
        seenBy: {
          include: {
            user: true,
          },
        },
      },
    },
    {
      enabled: !!authUser?.id,
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
    const items = data?.pages?.flatMap(page => page.data) || [];
    return items.map(notification => ({
      ...notification,
      isSeenByUser: notification.seenBy?.some((seen: any) => seen.userId === authUser?.id) ?? false,
    }));
  }, [data, authUser?.id]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isSeenByUser).length;
  }, [notifications]);

  // Extract mobile deep link from actionUrl
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
  const handleNotificationPress = useCallback(async (notification: Notification & { isSeenByUser: boolean }) => {
    // INSTANT haptic feedback
    impactHaptic();

    // INSTANT visual feedback
    setNavigatingItemId(notification.id);

    if (authUser?.id && !notification.isSeenByUser) {
      await markAsRead.mutateAsync({ notificationId: notification.id, userId: authUser.id });
    }

    // Close drawer
    navigation.closeDrawer();

    if (DEBUG_NOTIFICATIONS) {
      Alert.alert(
        'Notification Tapped',
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

    // Reset navigating state
    setTimeout(() => setNavigatingItemId(null), 1500);
  }, [authUser?.id, markAsRead, navigation, router, extractMobileUrl]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (authUser?.id && unreadCount > 0) {
      // INSTANT haptic feedback
      impactHaptic();
      await markAllAsRead.mutateAsync(authUser.id);
      refetch();
    }
  }, [authUser?.id, unreadCount, markAllAsRead, refetch]);

  // Toggle actions section
  const toggleShowActions = useCallback(() => {
    selectionHaptic();
    setShowActions((prev) => !prev);
    Animated.timing(dropdownAnimation, {
      toValue: showActions ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showActions, dropdownAnimation]);

  // Render notification item (matching menu item style from OriginalMenuDrawer)
  const renderNotificationItem = useCallback((notification: Notification & { isSeenByUser: boolean }) => {
    const isUnread = !notification.isSeenByUser;
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type, isDarkMode);
    const iconBgColor = getNotificationIconBgColor(notification.type, isDarkMode);
    const isNavigating = navigatingItemId === notification.id;

    const paddingLeft = SPACING.md;
    const marginLeft = SPACING.sm;
    const marginRight = SPACING.sm;

    return (
      <View key={notification.id} style={styles.menuItem}>
        <View
          style={[
            styles.menuItemPressable,
            { marginLeft, marginRight },
            isUnread && {
              backgroundColor: isDarkMode ? "rgba(21, 128, 61, 0.15)" : "rgba(21, 128, 61, 0.1)",
              borderWidth: 1,
              borderColor: isDarkMode ? "rgba(21, 128, 61, 0.4)" : "rgba(21, 128, 61, 0.3)",
            },
          ]}
        >
          <Pressable
            onPress={() => handleNotificationPress(notification)}
            style={({ pressed }) => ({
              flex: 1,
              transform: pressed ? [{ scale: 0.96 }] : isNavigating ? [{ scale: 0.98 }] : [{ scale: 1 }],
              opacity: pressed ? 0.7 : isNavigating ? 0.85 : 1,
              backgroundColor: pressed
                ? (isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)")
                : isNavigating
                  ? (isDarkMode ? "rgba(21, 128, 61, 0.1)" : "rgba(21, 128, 61, 0.08)")
                  : "transparent",
              borderRadius: 8,
            })}
          >
            <View style={styles.menuItemInner}>
              <View style={[styles.menuItemContent, { paddingLeft }]}>
                <View style={[styles.menuItemIcon, { backgroundColor: iconBgColor, borderRadius: 16, width: 32, height: 32 }]}>
                  {isNavigating ? (
                    <ActivityIndicator
                      size="small"
                      color="#15803d"
                      style={{ width: 18, height: 18 }}
                    />
                  ) : (
                    <Icon name={iconName} size={18} color={iconColor} />
                  )}
                </View>
                <View style={styles.notificationTextContainer}>
                  <Text
                    style={[
                      styles.menuItemText,
                      {
                        color: isDarkMode ? "#cccccc" : "#525252",
                        fontWeight: isUnread ? "600" : "500",
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {isNavigating ? "Carregando..." : notification.title}
                  </Text>
                  <Text
                    style={[
                      styles.notificationBody,
                      { color: isDarkMode ? "#d4d4d4" : "#525252" },
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {notification.body}
                  </Text>
                  <Text
                    style={[
                      styles.notificationTimestamp,
                      { color: isDarkMode ? "#8c8c8c" : "#737373" },
                    ]}
                  >
                    {formatNotificationTime(notification.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Unread indicator */}
              {isUnread && !isNavigating && (
                <View style={styles.unreadIndicator}>
                  <View style={styles.unreadDot} />
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    );
  }, [isDarkMode, navigatingItemId, handleNotificationPress]);

  return (
    <View style={[styles.container, { flex: 1, backgroundColor: isDarkMode ? "#212121" : "#fafafa" }]}>
      {/* Header Section - Notification Title & Actions */}
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? Math.max(insets.top, 20) : Math.max(insets.top, 16) }]}>
        <View style={styles.headerContent}>
          <View style={{ width: "100%" }}>
            <Pressable
              onPress={toggleShowActions}
              style={({ pressed }) => [
                {
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  width: "100%",
                  backgroundColor: pressed ? (isDarkMode ? "rgba(21, 128, 61, 0.15)" : "rgba(21, 128, 61, 0.1)") : "transparent",
                  transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                }
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                <View style={styles.notificationAvatar}>
                  <IconBell size={18} color="#fafafa" />
                </View>
                <View
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    marginRight: 8,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isDarkMode ? "#ffffff" : "#171717",
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Notificações
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDarkMode ? "#d4d4d4" : "#525252",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {unreadCount > 0 ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}` : 'Todas lidas'}
                  </Text>
                </View>
                <Animated.View
                  style={{
                    transform: [{
                      rotate: dropdownAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      })
                    }]
                  }}
                >
                  <IconChevronDown size={16} color={isDarkMode ? "#8c8c8c" : "#737373"} />
                </Animated.View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Action Dropdown Menu */}
        {showActions && unreadCount > 0 && (
          <Animated.View style={[
            styles.actionDropdown,
            {
              backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
              borderColor: isDarkMode ? "#404040" : "#e0e0e0",
              opacity: dropdownAnimation,
              transform: [
                {
                  translateY: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
                {
                  scale: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            }
          ]}>
            <Pressable
              onPress={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed && !markAllAsRead.isPending
                    ? (isDarkMode ? "rgba(21, 128, 61, 0.2)" : "rgba(21, 128, 61, 0.15)")
                    : "transparent",
                  transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  opacity: markAllAsRead.isPending ? 0.5 : 1,
                }
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 }}>
                {markAllAsRead.isPending ? (
                  <ActivityIndicator size="small" color="#15803d" style={{ width: 22, height: 22 }} />
                ) : (
                  <IconCheck size={22} color={isDarkMode ? "#22c55e" : "#16a34a"} />
                )}
                <Text style={{ fontSize: 15, fontWeight: "500", marginLeft: 12, color: isDarkMode ? "#22c55e" : "#16a34a" }}>
                  {markAllAsRead.isPending ? "Marcando..." : "Marcar todas como lidas"}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Main notifications area */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loading state */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#15803d" />
            <Text style={[styles.loadingText, { color: isDarkMode ? "#d4d4d4" : "#525252" }]}>
              Carregando...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyContainer}>
            <IconBellOff size={48} color={isDarkMode ? "#525252" : "#a3a3a3"} />
            <Text style={[styles.emptyText, { color: isDarkMode ? "#d4d4d4" : "#525252" }]}>
              Nenhuma notificação
            </Text>
            <Text style={[styles.emptySubtext, { color: isDarkMode ? "#8c8c8c" : "#737373" }]}>
              Você não tem notificações no momento
            </Text>
          </View>
        ) : (
          <>
            {/* Unread Notifications Section */}
            {notifications.filter(n => !n.isSeenByUser).length > 0 && (
              <View style={{ marginBottom: SPACING.xs }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? "#8c8c8c" : "#737373" }]}>
                    NÃO LIDAS
                  </Text>
                </View>
                {notifications.filter(n => !n.isSeenByUser).map((notification) =>
                  renderNotificationItem(notification)
                )}
              </View>
            )}

            {/* Read Notifications Section */}
            {notifications.filter(n => n.isSeenByUser).length > 0 && (
              <View style={{ marginBottom: SPACING.xs }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? "#8c8c8c" : "#737373" }]}>
                    LIDAS
                  </Text>
                </View>
                {notifications.filter(n => n.isSeenByUser).map((notification) =>
                  renderNotificationItem(notification)
                )}
              </View>
            )}

            {/* Load more */}
            {hasNextPage && (
              <Pressable
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                style={({ pressed }) => [
                  styles.loadMoreButton,
                  {
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#ffffff",
                    borderColor: isDarkMode ? "#404040" : "#e0e0e0",
                    opacity: pressed || isFetchingNextPage ? 0.7 : 1,
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }
                ]}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#15803d" />
                ) : (
                  <Text style={[styles.loadMoreText, { color: isDarkMode ? "#d4d4d4" : "#404040" }]}>
                    Carregar mais
                  </Text>
                )}
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Styles (matching OriginalMenuDrawer exactly)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    minHeight: 64,
  },
  headerContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 64,
    justifyContent: "center",
  },
  notificationAvatar: {
    width: 32,
    height: 32,
    backgroundColor: "#15803d",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionDropdown: {
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  menuItem: {
    marginBottom: SPACING.xs,
  },
  menuItemPressable: {
    borderRadius: 8,
    minHeight: 44,
    overflow: "hidden",
  },
  menuItemInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    minHeight: 44,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    marginTop: 2,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  notificationTextContainer: {
    flex: 1,
    gap: 2,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  notificationTimestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  unreadIndicator: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#15803d",
  },
  loadingContainer: {
    padding: SPACING.xl * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.xl * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
  },
  loadMoreButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
