import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  SectionList,
  RefreshControl,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useNotificationsInfiniteMobile } from '@/hooks/use-notifications-infinite-mobile';
import { useMarkAsRead, useMarkAllAsRead, useNotificationMutations } from '@/hooks/useNotification';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import { groupNotificationsByDate, NotificationSection } from '@/utils/notifications/date-utils';
import type { Notification } from '@/types';
import * as Haptics from 'expo-haptics';
import { extendedColors } from '@/lib/theme/extended-colors';

export default function NotificationCenterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // State
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications
  const {
    items,
    isLoading,
    isRefetching,
    hasNextPage,
    loadMore,
    isFetchingNextPage,
    refetch,
  } = useNotificationsInfiniteMobile({
    enabled: !!user?.id,
    // Filter to show notifications for current user or global notifications
    userId: user?.id,
  });
  const flatNotifications = (items ?? []) as Notification[];

  // Mutations
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const { deleteMutation } = useNotificationMutations();

  // Add seen status to notifications
  const notificationsWithSeen = useMemo(() => {
    return flatNotifications.map((notification) => ({
      ...notification,
      isSeenByUser: notification.seenBy?.some((seen) => seen.userId === user?.id) ?? false,
    }));
  }, [flatNotifications, user?.id]);

  // Group notifications by date
  const sections = useMemo(() => {
    return groupNotificationsByDate(notificationsWithSeen);
  }, [notificationsWithSeen]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notificationsWithSeen.filter((n) => !n.isSeenByUser).length;
  }, [notificationsWithSeen]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isRefetching) {
      loadMore();
    }
  }, [hasNextPage, isFetchingNextPage, isRefetching, loadMore]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read if unread
      if (!notification.isSeenByUser && user?.id) {
        markAsReadMutation.mutate({
          notificationId: notification.id,
          userId: user.id,
        });
      }

      // Navigate to action URL if available
      if (notification.actionUrl) {
        router.push(notification.actionUrl as any);
      }
    },
    [user?.id, markAsReadMutation, router]
  );

  const handleMarkAsRead = useCallback(
    (notification: Notification) => {
      if (user?.id) {
        markAsReadMutation.mutate({
          notificationId: notification.id,
          userId: user.id,
        });
      }
    },
    [user?.id, markAsReadMutation]
  );

  const handleDelete = useCallback(
    (notification: Notification) => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      deleteMutation.mutate(notification.id);
    },
    [deleteMutation]
  );

  const handleRemindLater = useCallback(
    (notification: Notification) => {
      // TODO: Implement remind later functionality
      // This could create a scheduled notification or mark it for later
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log('Remind later:', notification.id);
    },
    []
  );

  const handleMarkAllAsRead = useCallback(() => {
    if (user?.id && unreadCount > 0) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      markAllAsReadMutation.mutate(user.id);
    }
  }, [user?.id, unreadCount, markAllAsReadMutation]);

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationSection<typeof notificationsWithSeen[0]> }) => (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Text variant="small" style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {section.title}
        </Text>
      </View>
    ),
    [colors]
  );

  // Render notification item
  const renderItem = useCallback(
    ({ item }: { item: typeof notificationsWithSeen[0] }) => (
      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        onRemindLater={handleRemindLater}
      />
    ),
    [handleNotificationPress, handleMarkAsRead, handleDelete, handleRemindLater]
  );

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <EmptyState
        icon="bell-off"
        iconColor={colors.mutedForeground}
        title="Nenhuma notificação"
        description="Você está em dia! Não há notificações no momento."
      />
    );
  }, [isLoading, colors]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notificações',
          headerRight: () =>
            unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onPress={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                Marcar Todas Lidas
              </Button>
            ) : null,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : undefined}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
