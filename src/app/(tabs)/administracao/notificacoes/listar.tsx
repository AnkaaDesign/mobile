import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotificationMutations } from '../../../../hooks';
import { useNotificationsInfiniteMobile } from "@/hooks";
import type { NotificationGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { NotificationTable } from "@/components/administration/notification/list/notification-table";
import type { SortConfig } from "@/components/administration/notification/list/notification-table";

import { NotificationFilterTags } from "@/components/administration/notification/list/notification-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { NotificationListSkeleton } from "@/components/administration/notification/skeleton/notification-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { NotificationFilterDrawerContent } from "@/components/administration/notification/list/notification-filter-drawer-content";
import { createColumnDefinitions } from "@/components/administration/notification/list/notification-table";

export default function NotificationListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<NotificationGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "sentAt", direction: "desc" }]);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["title", "importance", "type", "sentAt"]);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { sentAt: "desc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "title":
          return { title: config.direction };
        case "importance":
          return { importance: config.direction };
        case "type":
          return { type: config.direction };
        case "sentAt":
          return { sentAt: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { sentAt: "desc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "title":
          return { title: config.direction };
        case "importance":
          return { importance: config.direction };
        case "type":
          return { type: config.direction };
        case "sentAt":
          return { sentAt: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { sentAt: "desc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      seenBy: true,
    },
  };

  const { items: notifications, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useNotificationsInfiniteMobile(queryParams);
  const { delete: deleteNotification } = useNotificationMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateNotification = () => {
    router.push(routeToMobilePath(routes.administration.notifications.create) as any);
  };

  const handleNotificationPress = (notificationId: string) => {
    router.push(routeToMobilePath(routes.administration.notifications.details(notificationId)) as any);
  };

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      await deleteNotification(notificationId);
      // Clear selection if the deleted notification was selected
      if (selectedNotifications.has(notificationId)) {
        const newSelection = new Set(selectedNotifications);
        newSelection.delete(notificationId);
        setSelectedNotifications(newSelection);
      }
    },
    [deleteNotification, selectedNotifications],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedNotifications(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<NotificationGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedNotifications(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Get visibleColumns as Set for panel
  const visibleColumns = useMemo(() => new Set(visibleColumnKeys), [visibleColumnKeys]);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  const handleOpenFilters = useCallback(() => {
    setIsColumnPanelOpen(false); // Close column panel if open
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsFilterPanelOpen(false); // Close filter panel if open
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  if (isLoading && !isRefetching) {
    return <NotificationListSkeleton />;
  }

  if (error) {
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
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar notificações..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={handleOpenColumns}
            badgeCount={visibleColumnKeys.length}
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

      {/* Individual filter tags */}
      <NotificationFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
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
            onNotificationDelete={handleDeleteNotification}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedNotifications={selectedNotifications}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={handleSort}
            visibleColumnKeys={visibleColumnKeys}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "bell-off"}
            title={searchText ? "Nenhuma notificação encontrada" : "Nenhuma notificação cadastrada"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando sua primeira notificação"}
            actionLabel={searchText ? undefined : "Cadastrar Notificação"}
            onAction={searchText ? undefined : handleCreateNotification}
          />
        </View>
      )}

      {/* Items count */}
      {hasNotifications && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasNotifications && <FAB icon="plus" onPress={handleCreateNotification} />}
    </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <NotificationFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <GenericColumnDrawerContent
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
