import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector, IconPaperclip } from "@tabler/icons-react-native";
import type { Observation } from "@/types";
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate, formatRelativeTime } from "@/utils";
import { extendedColors } from "@/lib/theme/extended-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface ObservationColumn {
  key: string;
  header: string;
  accessor: (observation: Observation) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}


export interface ObservationTableProps {
  observations: Observation[];
  onObservationPress?: (observationId: string) => void;
  onObservationEdit?: (observationId: string) => void;
  onObservationDelete?: (observationId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedObservations?: Set<string>;
  onSelectionChange?: (selectedObservations: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Default visible columns
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "task.name",
    "description",
    "createdAt"
  ]);
}

// Define all available columns with their renderers
export const createColumnDefinitions = (): ObservationColumn[] => [
  {
    key: "task.name",
    header: "TAREFA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (observation: Observation) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
        {observation.task?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "description",
    header: "DESCRIÇÃO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (observation: Observation) => (
      <ThemedText style={styles.cellText} numberOfLines={2}>
        {observation.description}
      </ThemedText>
    ),
  },
  {
    key: "filesCount",
    header: "ARQUIVOS",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (observation: Observation) =>
      observation.files && observation.files.length > 0 ? (
        <View style={styles.filesContainer}>
          <IconPaperclip size={16} color={extendedColors.neutral[600]} />
          <ThemedText style={styles.cellText}>
            {observation.files.length}
          </ThemedText>
        </View>
      ) : (
        <ThemedText style={StyleSheet.flatten([styles.cellText, styles.mutedText])}>-</ThemedText>
      ),
  },
  {
    key: "createdAt",
    header: "CRIADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (observation: Observation) => (
      <View>
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {formatDate(observation.createdAt)}
        </ThemedText>
        <ThemedText style={StyleSheet.flatten([styles.cellText, styles.mutedText, styles.smallText])} numberOfLines={1}>
          {formatRelativeTime(observation.createdAt)}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "updatedAt",
    header: "ATUALIZADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (observation: Observation) => (
      <View>
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {formatDate(observation.updatedAt)}
        </ThemedText>
        <ThemedText style={StyleSheet.flatten([styles.cellText, styles.mutedText, styles.smallText])} numberOfLines={1}>
          {formatRelativeTime(observation.updatedAt)}
        </ThemedText>
      </View>
    ),
  },
];

export const ObservationTable = React.memo<ObservationTableProps>(
  ({
    observations,
    onObservationPress,
    // onObservationEdit removed
    // onObservationDelete removed
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedObservations = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    enableSwipeActions: _enableSwipeActions = true,
    visibleColumnKeys,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    // headerHeight removed as unused
    const flatListRef = useRef<FlatList>(null);

    // Column visibility - use prop if provided, otherwise use default
    const visibleColumns = useMemo(() => {
      if (visibleColumnKeys && visibleColumnKeys.length > 0) {
        return new Set(visibleColumnKeys);
      }
      return getDefaultVisibleColumns();
    }, [visibleColumnKeys]);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        "task.name": 2.0,
        description: 2.5,
        filesCount: 1.0,
        createdAt: 1.5,
        updatedAt: 1.5,
      };

      // Filter to visible columns
      const visible = allColumns.filter((col) => visibleColumns.has(col.key));

      // Calculate total ratio
      const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return visible.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns, visibleColumns]);

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

      const allSelected = observations.every((observation) => selectedObservations.has(observation.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(observations.map((observation) => observation.id)));
      }
    }, [observations, selectedObservations, onSelectionChange]);

    const handleSelectObservation = useCallback(
      (observationId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedObservations);
        if (newSelection.has(observationId)) {
          newSelection.delete(observationId);
        } else {
          newSelection.add(observationId);
        }
        onSelectionChange(newSelection);
      },
      [selectedObservations, onSelectionChange],
    );

    // Sort handler - non-cumulative (only one sort at a time)
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingConfig = sortConfigs?.find((config) => config.columnKey === columnKey);

        if (existingConfig) {
          // Column already sorted, toggle direction or remove
          if (existingConfig.direction === "asc") {
            // Toggle to descending
            onSort([{ columnKey, direction: "desc" as const }]);
          } else {
            // Remove sort (back to no sort)
            onSort([]);
          }
        } else {
          // Set new sort (replacing any existing sort)
          onSort([{ columnKey, direction: "asc" as const }]);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((observation: Observation, column: ObservationColumn) => {
      return column.accessor(observation);
    }, []);

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
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox
                    checked={observations.length > 0 && observations.every((observation) => selectedObservations.has(observation.id))}
                    onCheckedChange={handleSelectAll}
                    disabled={observations.length === 0}
                  />
                </View>
              )}
              {displayColumns.map((column) => {
                const sortConfig = sortConfigs?.find((config) => config.columnKey === column.key);

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <View style={styles.headerTextContainer}>
                        <ThemedText
                          style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {column.header}
                        </ThemedText>
                      </View>
                      {column.sortable && (
                        <View style={styles.sortIconWrapper}>
                          {sortConfig ? (
                            <View style={styles.sortIconContainer}>
                              {sortConfig.direction === "asc" ? (
                                <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              ) : (
                                <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              )}
                            </View>
                          ) : (
                            <IconSelector size={16} color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedObservations, observations.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Observation; index: number }) => {
        const isSelected = selectedObservations.has(item.id);
        const isEven = index % 2 === 0;

        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.row,
              {
                backgroundColor: isEven ? colors.background : colors.card,
                borderBottomColor: "rgba(0,0,0,0.05)",
              },
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onObservationPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectObservation(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectObservation(item.id)} />
                </View>
              )}
              {displayColumns.map((column) => (
                <View
                  key={column.key}
                  style={StyleSheet.flatten([
                    styles.cell,
                    { width: column.width },
                    column.align === "center" && styles.centerAlign,
                    column.align === "right" && styles.rightAlign
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
        selectedObservations,
        onObservationPress,
        handleSelectObservation,
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
          <Icon name="alert-circle" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma observação encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando observações...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: "transparent", borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={observations}
            renderItem={renderRow}
            keyExtractor={(item) => item.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            getItemLayout={(_data, index) => ({
              length: 60, // Fixed row height
              offset: 60 * index,
              index,
            })}
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
    backgroundColor: "transparent",
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
    borderBottomWidth: 2,
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
    gap: 4,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  sortIconWrapper: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 16,
  },
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
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
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  mutedText: {
    opacity: 0.6,
  },
  smallText: {
    fontSize: fontSize.xs - 1,
  },
  filesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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

ObservationTable.displayName = "ObservationTable";
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
