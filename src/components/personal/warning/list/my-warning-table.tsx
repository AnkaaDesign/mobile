import React, { useCallback, useMemo } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Warning } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { MyWarningTableRowSwipe } from "./my-warning-table-row-swipe";
import { formatDateTime } from "@/utils";
import { extendedColors} from "@/lib/theme/extended-colors";
import { WARNING_SEVERITY_LABELS, WARNING_CATEGORY_LABELS } from "@/constants";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (warning: Warning) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface MyWarningTableProps {
  warnings: Warning[];
  onWarningPress?: (warningId: string) => void;
  onWarningEdit?: (warningId: string) => void;
  onWarningDelete?: (warningId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedWarnings?: Set<string>;
  onSelectionChange?: (selectedWarnings: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Badge variant helpers
const getSeverityBadgeVariant = (severity: string) => {
  switch (severity) {
    case "VERBAL":
      return "info";
    case "WRITTEN":
      return "pending";
    case "SUSPENSION":
      return "warning";
    case "FINAL_WARNING":
      return "destructive";
    default:
      return "default";
  }
};

const getCategoryBadgeVariant = (category: string) => {
  switch (category) {
    case "SAFETY":
      return "destructive";
    case "MISCONDUCT":
    case "INSUBORDINATION":
      return "warning";
    case "POLICY_VIOLATION":
    case "ATTENDANCE":
      return "pending";
    case "PERFORMANCE":
    case "BEHAVIOR":
      return "info";
    default:
      return "default";
  }
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "severity",
    header: "Gravidade",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <Badge variant={getSeverityBadgeVariant(warning.severity)} size="sm">
        <ThemedText style={styles.badgeText}>
          {WARNING_SEVERITY_LABELS[warning.severity as keyof typeof WARNING_SEVERITY_LABELS]}
        </ThemedText>
      </Badge>
    ),
  },
  {
    key: "category",
    header: "Categoria",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <Badge variant={getCategoryBadgeVariant(warning.category)} size="sm">
        <ThemedText style={styles.badgeText}>
          {WARNING_CATEGORY_LABELS[warning.category as keyof typeof WARNING_CATEGORY_LABELS]}
        </ThemedText>
      </Badge>
    ),
  },
  {
    key: "reason",
    header: "Motivo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <ThemedText style={styles.cellText} numberOfLines={2}>
        {warning.reason || "-"}
      </ThemedText>
    ),
  },
  {
    key: "description",
    header: "Descrição",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (warning: Warning) => (
      <ThemedText style={styles.cellText} numberOfLines={2}>
        {warning.description || "-"}
      </ThemedText>
    ),
  },
  {
    key: "supervisor",
    header: "Aplicada Por",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (warning: Warning) => {
      const supervisorName = warning.supervisor?.name || "-";
      return (
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {supervisorName}
        </ThemedText>
      );
    },
  },
  {
    key: "followUpDate",
    header: "Data de Acompanhamento",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {warning.followUpDate ? formatDateTime(new Date(warning.followUpDate)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "isActive",
    header: "Status",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <View style={styles.centerAlign}>
        <Badge variant={warning.isActive ? "success" : "secondary"} size="sm">
          <ThemedText style={styles.badgeText}>
            {warning.isActive ? "Ativa" : "Resolvida"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "createdAt",
    header: "Criada Em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {warning.createdAt ? formatDateTime(new Date(warning.createdAt)) : "-"}
      </ThemedText>
    ),
  },
];

export const MyWarningTable = React.memo<MyWarningTableProps>(
  ({
    warnings,
    onWarningPress,
    onWarningEdit,
    onWarningDelete,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedWarnings = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["severity", "category", "reason"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const prefetchTriggeredRef = React.useRef(false);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        severity: 1.2,
        category: 1.2,
        reason: 2.0,
        description: 2.5,
        supervisor: 1.5,
        followUpDate: 1.8,
        isActive: 1.0,
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

    // Handle taps outside of active row to close swipe actions
    const handleContainerPress = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Handle scroll events to close active row
    const handleScroll = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Calculate total table width
    const tableWidth = useMemo(() => {
      let width = displayColumns.reduce((sum, col) => sum + col.width, 0);
      if (showSelection) width += 50; // Add checkbox column width
      return width;
    }, [displayColumns, showSelection]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;

      const allSelected = warnings.every((warning) => selectedWarnings.has(warning.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(warnings.map((warning) => warning.id)));
      }
    }, [warnings, selectedWarnings, onSelectionChange]);

    const handleSelectWarning = useCallback(
      (warningId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedWarnings);
        if (newSelection.has(warningId)) {
          newSelection.delete(warningId);
        } else {
          newSelection.add(warningId);
        }
        onSelectionChange(newSelection);
      },
      [selectedWarnings, onSelectionChange],
    );

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
    const renderColumnValue = useCallback((warning: Warning, column: TableColumn) => {
      return column.accessor(warning);
    }, []);

    // Viewability callback for aggressive prefetching
    // Triggers prefetch when user scrolls to 70% of loaded items
    // Must be stable reference (can't change nullability)
    const handleViewableItemsChanged = React.useMemo(
      () => ({
        onViewableItemsChanged: ({ viewableItems }: any) => {
          if (!onPrefetch || prefetchTriggeredRef.current) return;

          const lastViewableIndex = viewableItems[viewableItems.length - 1]?.index;
          if (lastViewableIndex !== undefined && lastViewableIndex !== null) {
            const totalItems = warnings.length;
            const viewabilityThreshold = totalItems * 0.7;

            if (lastViewableIndex >= viewabilityThreshold) {
              prefetchTriggeredRef.current = true;
              onPrefetch();
            }
          }
        },
      }),
      [onPrefetch, warnings.length],
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
    }, [warnings.length]);

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
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox
                    checked={warnings.length > 0 && warnings.every((warning) => selectedWarnings.has(warning.id))}
                    onCheckedChange={handleSelectAll}
                    disabled={warnings.length === 0}
                  />
                </View>
              )}
              {displayColumns.map((column) => {
                // Single column sort - check if this column is currently sorted
                const sortConfig = sortConfigs?.[0]?.columnKey === column.key ? sortConfigs[0] : null;

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedWarnings, warnings.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Warning; index: number }) => {
        const isSelected = selectedWarnings.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onWarningEdit || onWarningDelete)) {
          return (
            <MyWarningTableRowSwipe
              key={item.id}
              warningId={item.id}
              warningReason={item.reason}
              onEdit={onWarningEdit}
              onDelete={onWarningDelete}
              disabled={showSelection}
            >
              {(_isActive) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                    },
                    isSelected && { backgroundColor: colors.primary + "20" },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onWarningPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectWarning(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectWarning(item.id)} />
                      </View>
                    )}
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
              )}
            </MyWarningTableRowSwipe>
          );
        }

        // Non-swipeable version
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
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onWarningPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectWarning(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectWarning(item.id)} />
                </View>
              )}
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
        showSelection,
        selectedWarnings,
        onWarningPress,
        handleSelectWarning,
        renderColumnValue,
        enableSwipeActions,
        onWarningEdit,
        onWarningDelete,
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
          <Icon name="alert-circle" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma advertência encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Parabéns! Você não possui advertências registradas.</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando advertências...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            data={warnings}
            renderItem={renderRow}
            keyExtractor={(warning) => warning.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.8}
            onScroll={handleScroll}
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
        </Pressable>
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
  },
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 36,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    justifyContent: "center",
    minHeight: 36,
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
  mutedText: {
    fontSize: fontSize.xs,
    opacity: 0.5,
  },
  badgeText: {
    fontSize: fontSize.xs,
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

MyWarningTable.displayName = "MyWarningTable";
