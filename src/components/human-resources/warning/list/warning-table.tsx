import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import type { Warning } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (warning: Warning) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface WarningTableProps {
  warnings: Warning[];
  onWarningPress?: (warningId: string) => void;
  onWarningEdit?: (warningId: string) => void;
  onWarningDelete?: (warningId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
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

// Define all available columns with their renderers
const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "collaborator",
    header: "Colaborador",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
        {warning.collaborator?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "category",
    header: "Categoria",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => {
      const categoryLabel = WARNING_CATEGORY_LABELS[warning.category as keyof typeof WARNING_CATEGORY_LABELS] || warning.category;
      return (
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {categoryLabel}
        </ThemedText>
      );
    },
  },
  {
    key: "severity",
    header: "Gravidade",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => {
      const severityLabel = WARNING_SEVERITY_LABELS[warning.severity as keyof typeof WARNING_SEVERITY_LABELS] || warning.severity;
      const severityColor = getSeverityColor(warning.severity);

      return (
        <View style={styles.centerAlign}>
          <Badge
            variant="secondary"
            size="sm"
            style={{
              backgroundColor: severityColor.background,
              borderWidth: 0,
            }}
          >
            <ThemedText
              style={{
                color: severityColor.text,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {severityLabel}
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
    accessor: (warning: Warning) => (
      <ThemedText style={styles.cellText} numberOfLines={2}>
        {warning.reason}
      </ThemedText>
    ),
  },
  {
    key: "followUpDate",
    header: "Acompanhamento",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.dateText])} numberOfLines={1}>
        {warning.followUpDate ? formatDate(warning.followUpDate) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "Emitida em",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (warning: Warning) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.dateText])} numberOfLines={1}>
        {formatDate(warning.createdAt)}
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
        <Badge
          variant={warning.isActive ? "default" : "secondary"}
          size="sm"
          style={{
            backgroundColor: warning.isActive ? badgeColors.success.background : badgeColors.muted.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: warning.isActive ? badgeColors.success.text : badgeColors.muted.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {warning.isActive ? "Ativa" : "Resolvida"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
];

// Helper function to get severity colors
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "VERBAL":
      return { background: badgeColors.info.background, text: badgeColors.info.text };
    case "WRITTEN":
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case "SUSPENSION":
      return { background: "rgba(255, 152, 0, 0.15)", text: "#ff9800" }; // orange-500
    case "FINAL_WARNING":
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

export const WarningTable = React.memo<WarningTableProps>(
  ({
    warnings,
    onWarningPress,
    onWarningEdit,
    onWarningDelete,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedWarnings = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["collaborator", "category", "severity", "createdAt"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        collaborator: 2.0,
        category: 1.5,
        severity: 1.2,
        reason: 2.5,
        followUpDate: 1.3,
        createdAt: 1.3,
        isActive: 1.0,
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

    // Sort handler
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingIndex = sortConfigs?.findIndex((config) => config.columnKey === columnKey) ?? -1;

        if (existingIndex !== -1) {
          // Column already sorted, toggle direction or remove
          const newConfigs = [...(sortConfigs || [])];
          if (newConfigs[existingIndex].direction === "asc") {
            newConfigs[existingIndex].direction = "desc";
          } else {
            // Remove from sorts
            newConfigs.splice(existingIndex, 1);
          }
          onSort(newConfigs);
        } else {
          // Add new sort as primary (at the beginning)
          const newConfigs = [{ columnKey, direction: "asc" as const }, ...(sortConfigs || [])];
          // Limit to 3 sorts max
          if (newConfigs.length > 3) {
            newConfigs.pop();
          }
          onSort(newConfigs);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((warning: Warning, column: TableColumn) => {
      return column.accessor(warning);
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
                backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox checked={warnings.length > 0 && warnings.every((warning) => selectedWarnings.has(warning.id))} onCheckedChange={handleSelectAll} disabled={warnings.length === 0} />
                </View>
              )}
              {displayColumns.map((column) => {
                const sortIndex = sortConfigs?.findIndex((config) => config.columnKey === column.key) ?? -1;
                const sortConfig = sortIndex !== -1 ? sortConfigs[sortIndex] : null;

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    onLongPress={() => {
                      if (column.sortable && sortConfig) {
                        // Remove this specific sort
                        const newSorts = sortConfigs.filter((config) => config.columnKey !== column.key);
                        onSort?.(newSorts);
                      }
                    }}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <ThemedText style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])} numberOfLines={1}>
                        {column.header}
                      </ThemedText>
                      {column.sortable &&
                        (sortConfig ? (
                          <View style={styles.sortIconContainer}>
                            {sortConfig.direction === "asc" ? (
                              <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                            ) : (
                              <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                            )}
                            {sortConfigs.length > 1 && (
                              <ThemedText style={StyleSheet.flatten([styles.sortOrder, { color: isDark ? extendedColors.neutral[300] : extendedColors.neutral[700] }])}>{sortIndex + 1}</ThemedText>
                            )}
                          </View>
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

        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.row,
              {
                backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
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
                  style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}
                >
                  {renderColumnValue(item, column)}
                </View>
              ))}
            </Pressable>
          </ScrollView>
        );
      },
      [colors, tableWidth, displayColumns, showSelection, selectedWarnings, onWarningPress, handleSelectWarning, renderColumnValue, isDark],
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
          <ThemedText style={styles.loadingText}>Carregando advertências...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={warnings}
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
            getItemLayout={(data, index) => ({
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
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerWrapper: {
    marginTop: 12,
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
    minHeight: 56,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 56,
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
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  sortOrder: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    marginLeft: 2,
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
    minHeight: 60,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    minHeight: 60,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  dateText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.sm,
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

WarningTable.displayName = "WarningTable";
