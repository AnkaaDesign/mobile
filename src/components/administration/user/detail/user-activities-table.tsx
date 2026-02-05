import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Card } from "@/components/ui/card";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconActivity, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { User } from '../../../../types';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { ActivityTable, createColumnDefinitions } from "@/components/inventory/activity/list/activity-table";

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useActivitiesInfiniteMobile } from "@/hooks";

interface UserActivitiesTableProps {
  user: User;
  maxHeight?: number;
}

export function UserActivitiesTable({ user, maxHeight = 500 }: UserActivitiesTableProps) {
  const { colors } = useTheme();
  const { pushWithLoading } = useNavigationLoading();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Use operation, item name, and quantity columns for user detail view
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["operation", "item.name", "quantity", "createdAt"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch activities for this specific user with infinite scroll
  // Use select to fetch only fields displayed in the table
  const {
    items: activities,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useActivitiesInfiniteMobile({
    where: {
      userId: user.id,
    },
    // Use select instead of include for optimized data fetching
    select: {
      id: true,
      operation: true,
      quantity: true,
      reason: true,
      createdAt: true,
      // Item - only name is displayed
      item: {
        select: {
          id: true,
          name: true,
        },
      },
      // User - only name is displayed
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    enabled: !!user.id,
  });

  // Filter activities based on search (client-side for already loaded items)
  const filteredActivities = useMemo(() => {
    if (!debouncedSearch) return activities;

    const lowerSearch = debouncedSearch.toLowerCase();
    return activities.filter((activity: any) =>
      activity.item?.name?.toLowerCase().includes(lowerSearch) ||
      activity.reason?.toLowerCase().includes(lowerSearch)
    );
  }, [activities, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);
    // Note: In React Native, we would use AsyncStorage to persist preferences
  }, []);

  // Get default visible columns (for the user detail view)
  const getDefaultVisibleColumns = useCallback(() => {
    return ["operation", "item.name", "quantity", "createdAt"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleActivityPress = (activityId: string) => {
    pushWithLoading(routeToMobilePath(routes.inventory.activities.details(activityId)));
  };

  // Don't show if no activities and not loading
  if (!isLoading && activities.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconActivity size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Movimentações de Estoque {activities.length > 0 && `(${activities.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar movimentações..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Activity Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando movimentações...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar movimentações.
              </ThemedText>
            </View>
          ) : filteredActivities.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhuma movimentação encontrada para "${searchQuery}".`
                  : "Nenhuma movimentação de estoque realizada por este usuário."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <ActivityTable
                activities={filteredActivities}
                onActivityPress={handleActivityPress}
                enableSwipeActions={false}
                visibleColumnKeys={visibleColumnKeys}
                onEndReached={() => canLoadMore && loadMore()}
                loadingMore={isFetchingNextPage}
              />
            </View>
          )}
        </View>
      </Card>

    <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
      <ColumnVisibilitySlidePanel
        columns={allColumns}
        visibleColumns={new Set(visibleColumnKeys)}
        onVisibilityChange={handleColumnsChange}
        onClose={handleCloseColumns}
        defaultColumns={new Set(getDefaultVisibleColumns())}
      />
    </SlideInPanel>
  </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  tableContainer: {
    minHeight: 200,
    overflow: 'hidden',
    marginHorizontal: -8,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
