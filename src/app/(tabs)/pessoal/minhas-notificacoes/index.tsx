import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList, IconCheck, IconSettings } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotificationsInfiniteMobile } from "@/hooks/use-notifications-infinite-mobile";
import { useNotificationMutations, useAuth } from "@/hooks";

import { ThemedView, ErrorScreen, EmptyState, ListActionButton, SearchBar, Card, ThemedText, Badge } from "@/components/ui";
import { NotificationTable, createColumnDefinitions } from "@/components/personal/notification/list/notification-table";
import { NotificationFilterTags } from "@/components/personal/notification/list/notification-filter-tags";
import { NotificationColumnDrawerContent } from "@/components/personal/notification/list/notification-column-drawer-content";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useTheme } from "@/lib/theme";

// Hooks
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel component
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { NOTIFICATION_TYPE, NOTIFICATION_IMPORTANCE } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { seenNotificationService } from "@/api-client/notification";

export default function MyNotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Tab state (All, Unread, Read)
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  // Filter state
  const [filters, setFilters] = useState<{
    types?: string[];
    importance?: string[];
    unreadOnly?: boolean;
    dateRange?: { start?: Date; end?: Date };
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false,
  );

  const { visibleColumns, setVisibleColumns } = useColumnVisibility(
    "myNotifications",
    ["title", "type", "createdAt"],
    ["title", "message", "type", "importance", "createdAt", "sentAt"],
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {
      // User ID filter is handled by API endpoint
    };

    if (filters.types?.length) {
      where.type = { in: filters.types };
    }

    if (filters.importance?.length) {
      where.importance = { in: filters.importance };
    }

    // Handle read/unread based on tab
    if (activeTab === "unread") {
      where.unread = true;
    } else if (activeTab === "read") {
      where.unread = false;
    }

    if (filters.dateRange?.start || filters.dateRange?.end) {
      where.createdAt = {};
      if (filters.dateRange.start) {
        where.createdAt.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        where.createdAt.lte = filters.dateRange.end;
      }
    }

    return where;
  }, [filters, activeTab]);

  const queryParams = useMemo(
    () => ({
      orderBy: buildOrderBy(
        {
          title: "title",
          type: "type",
          importance: "importanceOrder",
          createdAt: "createdAt",
          sentAt: "sentAt",
        },
        { createdAt: "desc" },
      ),
      ...(searchText ? { searchingFor: searchText } : {}),
      where: buildWhereClause(),
      include: {
        seenBy: true, // Include seen status for current user
      },
    }),
    [searchText, buildWhereClause, buildOrderBy],
  );

  const {
    items: notifications,
    isLoading,
    error,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
    prefetchNext,
    shouldPrefetch,
  } = useNotificationsInfiniteMobile(queryParams);

  const { delete: deleteNotification } = useNotificationMutations();

  // Calculate stats
  const stats = useMemo(() => {
    const unreadCount = notifications.filter((n) => n.seenBy && !n.seenBy.some((s) => s.userId === user?.id)).length;
    const readCount = notifications.length - unreadCount;

    return {
      total: totalCount || notifications.length,
      unread: unreadCount,
      read: readCount,
    };
  }, [notifications, totalCount, user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleNotificationPress = useCallback(
    (notificationId: string) => {
      // Mark as read when opening
      if (user?.id) {
        seenNotificationService.createSeenNotification({ notificationId, userId: user.id }).catch(console.error);
      }
      router.push(`/pessoal/minhas-notificacoes/detalhes/${notificationId}` as any);
    },
    [router, user?.id],
  );

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      if (user?.id) {
        await seenNotificationService.createSeenNotification({ notificationId, userId: user.id });
        await refresh();
      }
    },
    [user?.id, refresh],
  );

  const handleMarkAsUnread = useCallback(
    async (notificationId: string) => {
      if (user?.id) {
        // Find and delete the seen notification record
        const notification = notifications.find((n) => n.id === notificationId);
        const seenRecord = notification?.seenBy?.find((s) => s.userId === user.id);
        if (seenRecord) {
          await seenNotificationService.deleteSeenNotification(seenRecord.id);
          await refresh();
        }
      }
    },
    [user?.id, notifications, refresh],
  );

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      await deleteNotification(notificationId);
      if (selectedNotifications.has(notificationId)) {
        const newSelection = new Set(selectedNotifications);
        newSelection.delete(notificationId);
        setSelectedNotifications(newSelection);
      }
    },
    [deleteNotification, selectedNotifications],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (user?.id) {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((n) => !n.seenBy?.some((s) => s.userId === user.id));

      for (const notification of unreadNotifications) {
        await seenNotificationService.createSeenNotification({
          notificationId: notification.id,
          userId: user.id,
        });
      }

      await refresh();
    }
  }, [user?.id, notifications, refresh]);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedNotifications(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedNotifications(new Set());
    setShowSelection(false);
    setActiveTab("all");
  }, []);

  const handleColumnsChange = useCallback(
    (newColumns: Set<string>) => {
      setVisibleColumns(newColumns);
    },
    [setVisibleColumns],
  );

  const handleOpenFilters = useCallback(() => {
    setIsColumnPanelOpen(false);
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsFilterPanelOpen(false);
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleOpenConfig = useCallback(() => {
    router.push("/pessoal/minhas-notificacoes/configuracoes" as any);
  }, [router]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(user?.id), [user?.id]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.types?.length) count++;
    if (filters.importance?.length) count++;
    if (filters.unreadOnly) count++;
    if (filters.dateRange?.start) count++;
    if (filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load
  const isInitialLoad = isLoading && notifications.length === 0;

  if (isInitialLoad) {
    return <LoadingScreen />;
  }

  if (error && notifications.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar notificações" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasNotifications = Array.isArray(notifications) && notifications.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>{stats.unread}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Não lidas</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.mutedForeground }]}>{stats.read}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Lidas</ThemedText>
            </View>
          </View>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("all")}
          >
            <ThemedText style={[styles.tabText, activeTab === "all" && { color: colors.primary, fontWeight: fontWeight.semibold }]}>
              Todas
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "unread" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("unread")}
          >
            <ThemedText style={[styles.tabText, activeTab === "unread" && { color: colors.primary, fontWeight: fontWeight.semibold }]}>
              Não lidas
            </ThemedText>
            {stats.unread > 0 && (
              <Badge variant="primary" size="sm" style={styles.tabBadge}>
                <ThemedText style={styles.tabBadgeText}>{stats.unread}</ThemedText>
              </Badge>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "read" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("read")}
          >
            <ThemedText style={[styles.tabText, activeTab === "read" && { color: colors.primary, fontWeight: fontWeight.semibold }]}>Lidas</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Search and Actions */}
        <View style={styles.searchContainer}>
          <SearchBar
            ref={searchInputRef}
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar notificações..."
            style={styles.searchBar}
            debounceMs={300}
            loading={isRefetching && !isFetchingNextPage}
          />
          <View style={styles.buttonContainer}>
            {stats.unread > 0 && (
              <ListActionButton icon={<IconCheck size={20} color={colors.foreground} />} onPress={handleMarkAllAsRead} tooltip="Marcar todas como lidas" />
            )}
            <ListActionButton icon={<IconSettings size={20} color={colors.foreground} />} onPress={handleOpenConfig} tooltip="Configurações" />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumns.size}
              badgeVariant="primary"
            />
            <ListActionButton
              icon={<IconFilter size={20} color={colors.foreground} />}
              onPress={handleOpenFilters}
              badgeCount={activeFiltersCount}
              badgeVariant="destructive"
              showBadge={activeFiltersCount > 0}
            />
          </View>
        </View>

        {/* Filter tags */}
        <NotificationFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={setFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasNotifications ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <NotificationTable
              notifications={notifications}
              onNotificationPress={handleNotificationPress}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
              onDeleteNotification={handleDeleteNotification}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              onPrefetch={shouldPrefetch ? prefetchNext : undefined}
              refreshing={refreshing || isRefetching}
              loading={false}
              loadingMore={isFetchingNextPage}
              showSelection={showSelection}
              selectedNotifications={selectedNotifications}
              onSelectionChange={handleSelectionChange}
              sortConfigs={sortConfigs}
              onSort={(configs) => {
                if (configs.length === 0) {
                  handleSort("createdAt");
                } else {
                  handleSort(configs[0].columnKey);
                }
              }}
              visibleColumnKeys={Array.from(visibleColumns) as string[]}
              enableSwipeActions={true}
              currentUserId={user?.id}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "bell"}
              title={searchText ? "Nenhuma notificação encontrada" : "Nenhuma notificação"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Você não possui notificações no momento"}
            />
          </View>
        )}

        {/* Items count */}
        {hasNotifications && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
      </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <NotificationColumnDrawerContent
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
          onClose={handleCloseColumns}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    margin: spacing.sm,
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  tabText: {
    fontSize: fontSize.sm,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
  },
  tabBadgeText: {
    fontSize: 10,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
