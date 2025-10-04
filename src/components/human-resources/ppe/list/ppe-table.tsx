import React, { useState, useCallback, useMemo } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Item } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { PPE_TYPE_LABELS } from '../../../../constants';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (item: Item) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface PpeTableProps {
  items: Item[];
  onItemPress?: (itemId: string) => void;
  onItemEdit?: (itemId: string) => void;
  onViewDeliveries?: (itemId: string) => void;
  onViewSchedules?: (itemId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "name",
    header: "Nome",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
        {item.name}
      </ThemedText>
    ),
  },
  {
    key: "ppeType",
    header: "Tipo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <Badge
        variant="secondary"
        size="sm"
        style={{
          backgroundColor: badgeColors.info.background,
          borderWidth: 0,
        }}
      >
        <ThemedText
          style={{
            color: badgeColors.info.text,
            fontSize: fontSize.xs,
            fontWeight: fontWeight.medium,
          }}
        >
          {item.ppeType ? PPE_TYPE_LABELS[item.ppeType] : "-"}
        </ThemedText>
      </Badge>
    ),
  },
  {
    key: "ppeCA",
    header: "CA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.ppeCA || "-"}
      </ThemedText>
    ),
  },
  {
    key: "ppeAutoOrderMonths",
    header: "Validade",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.ppeAutoOrderMonths ? `${item.ppeAutoOrderMonths} meses` : "-"}
      </ThemedText>
    ),
  },
  {
    key: "quantity",
    header: "Estoque",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.quantity || 0}
      </ThemedText>
    ),
  },
  {
    key: "deliveries",
    header: "Entregas",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (item: Item) => (
      <Badge
        variant="secondary"
        size="sm"
        style={{
          backgroundColor: badgeColors.success.background,
          borderWidth: 0,
        }}
      >
        <ThemedText
          style={{
            color: badgeColors.success.text,
            fontSize: fontSize.xs,
            fontWeight: fontWeight.medium,
          }}
        >
          {(item._count?.ppeDeliveries || 0).toString()}
        </ThemedText>
      </Badge>
    ),
  },
];

export const PpeTable = React.memo<PpeTableProps>(
  ({ items, onItemPress, onItemEdit, onViewDeliveries, onViewSchedules, onRefresh, onEndReached, refreshing = false, loading = false, loadingMore = false, sortConfigs = [], onSort }) => {
    const { colors, isDark } = useTheme();
    const [headerHeight, setHeaderHeight] = useState(50);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // All columns are visible for PPE table
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        name: 2.0,
        ppeType: 1.0,
        ppeCA: 0.8,
        ppeAutoOrderMonths: 1.0,
        quantity: 0.8,
        deliveries: 0.8,
      };

      // Calculate total ratio
      const totalRatio = allColumns.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return allColumns.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns]);

    // Calculate total table width
    const tableWidth = useMemo(() => {
      return displayColumns.reduce((sum, col) => sum + col.width, 0);
    }, [displayColumns]);

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
    const renderColumnValue = useCallback((item: Item, column: TableColumn) => {
      return column.accessor(item);
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
      [colors, isDark, tableWidth, displayColumns, sortConfigs, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Item; index: number }) => {
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
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])} onPress={() => onItemPress?.(item.id)} android_ripple={{ color: colors.primary + "20" }}>
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
      [colors, tableWidth, displayColumns, onItemPress, renderColumnValue, isDark],
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
          <Icon name="shield" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum EPI encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos EPIs</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando EPIs...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
          {renderHeader()}
          <FlatList
            data={items}
            renderItem={renderRow}
            keyExtractor={(item) => item.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            scrollEventThrottle={16}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            getItemLayout={(data, index) => ({
              length: 60,
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
  numberText: {
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

PpeTable.displayName = "PpeTable";
