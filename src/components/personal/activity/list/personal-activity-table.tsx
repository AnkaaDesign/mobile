import React, { useCallback, useMemo } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Activity } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDateTime } from "@/utils";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from "@/constants";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (activity: Activity) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface PersonalActivityTableProps {
  activities: Activity[];
  onActivityPress?: (activityId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Format quantity with sign and operation badge
const formatQuantity = (quantity: number, operation: string) => {
  const sign = operation === ACTIVITY_OPERATION.INBOUND ? "+" : "-";
  const absValue = Math.abs(quantity);
  // Check if the number has decimals
  if (absValue % 1 === 0) {
    return `${sign}${absValue}`;
  }
  // Format with 2 decimals
  return `${sign}${absValue.toFixed(2)}`;
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "itemName",
    header: "Item",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <ThemedText style={[styles.cellText, styles.boldText]} numberOfLines={2}>
        {activity.item?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "operation",
    header: "Operação",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => {
      const isInbound = activity.operation === ACTIVITY_OPERATION.INBOUND;
      return (
        <Badge
          variant={isInbound ? "default" : "destructive"}
          size="sm"
          style={{
            backgroundColor: isInbound ? badgeColors.success.background : badgeColors.destructive.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: isInbound ? badgeColors.success.text : badgeColors.destructive.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {isInbound ? "↑ " : "↓ "}
            {ACTIVITY_OPERATION_LABELS[activity.operation] || "-"}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "quantity",
    header: "Quantidade",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => {
      const isInbound = activity.operation === ACTIVITY_OPERATION.INBOUND;
      return (
        <View style={styles.quantityContainer}>
          <Badge
            variant={isInbound ? "default" : "destructive"}
            size="sm"
            style={{
              backgroundColor: isInbound ? badgeColors.success.background : badgeColors.destructive.background,
              borderWidth: 0,
            }}
          >
            <ThemedText
              style={{
                color: isInbound ? badgeColors.success.text : badgeColors.destructive.text,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
              }}
              numberOfLines={1}
            >
              {formatQuantity(activity.quantity, activity.operation)}
            </ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "reason",
    header: "Motivo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <Badge variant="secondary" size="sm">
        <ThemedText style={[styles.cellText, { fontSize: fontSize.xs }]} numberOfLines={1}>
          {activity.reason ? ACTIVITY_REASON_LABELS[activity.reason] : "-"}
        </ThemedText>
      </Badge>
    ),
  },
  {
    key: "createdAt",
    header: "Data",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => {
      if (!activity.createdAt) {
        return <ThemedText style={styles.cellText}>-</ThemedText>;
      }
      const date = new Date(activity.createdAt);
      const day = date.getDate();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return (
        <View>
          <ThemedText style={styles.cellText}>{`${day}/${month}/${year}`}</ThemedText>
          <ThemedText style={[styles.cellText, { opacity: 0.7 }]}>{`${hours}:${minutes}`}</ThemedText>
        </View>
      );
    },
  },
];

export const PersonalActivityTable = React.memo<PersonalActivityTableProps>(
  ({
    activities,
    onActivityPress,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["itemName", "quantity", "createdAt"],
  }) => {
    const { colors, isDark } = useTheme();
    const prefetchTriggeredRef = React.useRef(false);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        itemName: 2.5,
        operation: 1.5,
        quantity: 1.3,
        reason: 2.0,
        createdAt: 1.8,
      };

      // Filter to visible columns
      const visible = allColumns.filter((col) => visibleColumnKeys.includes(col.key));

      // Calculate total ratio
      const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return visible.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns, visibleColumnKeys]);

    // Calculate total table width
    const tableWidth = useMemo(() => {
      return displayColumns.reduce((sum, col) => sum + col.width, 0);
    }, [displayColumns]);

    // Sort handler - Single column sorting only for mobile
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const currentSort = sortConfigs?.[0];

        // If clicking the same column, toggle direction (asc -> desc -> no sort)
        if (currentSort?.columnKey === columnKey) {
          if (currentSort.direction === "asc") {
            // Change to descending
            onSort([{ columnKey, direction: "desc", order: 0 }]);
          } else {
            // Remove sort (back to default)
            onSort([]);
          }
        } else {
          // New column clicked, sort ascending
          onSort([{ columnKey, direction: "asc", order: 0 }]);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((activity: Activity, column: TableColumn) => {
      return column.accessor(activity);
    }, []);

    // Viewability callback for aggressive prefetching
    // Triggers prefetch when user scrolls to 70% of loaded items
    const handleViewableItemsChanged = React.useMemo(
      () => ({
        onViewableItemsChanged: ({ viewableItems }: any) => {
          if (!onPrefetch || prefetchTriggeredRef.current) return;

          const lastViewableIndex = viewableItems[viewableItems.length - 1]?.index;
          if (lastViewableIndex !== undefined && lastViewableIndex !== null) {
            const totalItems = activities.length;
            const viewabilityThreshold = totalItems * 0.7;

            if (lastViewableIndex >= viewabilityThreshold) {
              prefetchTriggeredRef.current = true;
              onPrefetch();
            }
          }
        },
      }),
      [onPrefetch, activities.length],
    );

    const viewabilityConfig = React.useMemo(
      () => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
      }),
      [],
    );

    // Reset prefetch flag when data changes (new page loaded)
    React.useEffect(() => {
      prefetchTriggeredRef.current = false;
    }, [activities.length]);

    // Header component
    const renderHeader = useCallback(
      () => (
        <View style={styles.headerWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.headerContainer,
              {
                backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {displayColumns.map((column) => {
                // Single column sort - check if this column is currently sorted
                const sortConfig = sortConfigs?.[0]?.columnKey === column.key ? sortConfigs[0] : null;

                return (
                  <Pressable
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                  >
                    <View style={styles.headerCellContent}>
                      <ThemedText style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])} numberOfLines={1}>
                        {column.header}
                      </ThemedText>
                      {column.sortable &&
                        (sortConfig ? (
                          sortConfig.direction === "asc" ? (
                            <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                          ) : (
                            <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                          )
                        ) : (
                          <Icon name="arrows-sort" size="sm" color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                        ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, sortConfigs, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Activity; index: number }) => {
        const isEven = index % 2 === 0;

        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.row,
              {
                backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onActivityPress?.(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {displayColumns.map((column) => (
                <View
                  key={column.key}
                  style={StyleSheet.flatten([
                    styles.cell,
                    { width: column.width },
                    column.align === "center" && styles.centerAlign,
                    column.align === "right" && styles.rightAlign,
                  ])}
                >
                  {renderColumnValue(item, column)}
                </View>
              ))}
            </Pressable>
          </ScrollView>
        );
      },
      [
        colors,
        tableWidth,
        displayColumns,
        onActivityPress,
        renderColumnValue,
        isDark,
      ],
    );

    // Loading footer component
    const renderFooter = useCallback(() => {
      if (!loadingMore) return null;

      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando mais...</ThemedText>
        </View>
      );
    }, [loadingMore, colors.primary]);

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Icon name="clipboard" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma atividade encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou aguarde novas atividades</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando atividades...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, borderColor: colors.border }])}>
          {renderHeader()}
          <FlatList
            data={activities}
            renderItem={renderRow}
            keyExtractor={(activity) => activity.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.8}
            scrollEventThrottle={16}
            onViewableItemsChanged={handleViewableItemsChanged.onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={11}
            initialNumToRender={15}
            updateCellsBatchingPeriod={100}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerWrapper: {
    flexDirection: "column",
  },
  headerContainer: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
    color: "#000000",
  },
  headerCellContent: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: spacing.xs,
  },
  flatList: {
    flex: 1,
  },
  row: {},
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 48,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    justifyContent: "center",
    minHeight: 48,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.xs,
  },
  boldText: {
    fontWeight: fontWeight.medium,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});

PersonalActivityTable.displayName = "PersonalActivityTable";
