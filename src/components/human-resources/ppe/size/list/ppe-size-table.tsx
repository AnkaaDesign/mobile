import React, { useCallback, useMemo } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { PpeSize } from '../../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SHIRT_SIZE_LABELS, PANTS_SIZE_LABELS, BOOT_SIZE_LABELS } from "@/constants";
import { extendedColors } from "@/lib/theme/extended-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (size: PpeSize) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}


interface PpeSizeTableProps {
  ppeSizes: PpeSize[];
  onSizePress?: (sizeId: string) => void;
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
    key: "employee",
    header: "Funcionário",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (size: PpeSize) => (
      <View>
        <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={1}>
          {size.user?.name || "Sem nome"}
        </ThemedText>
        {size.user?.cpf && (
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.subtitleText])} numberOfLines={1}>
            CPF: {size.user.cpf}
          </ThemedText>
        )}
      </View>
    ),
  },
  {
    key: "shirts",
    header: "Camisa",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (size: PpeSize) => (
      <View style={styles.centerAlign}>
        {size.shirts ? (
          <Badge variant="info" size="sm">
            {SHIRT_SIZE_LABELS[size.shirts] || size.shirts}
          </Badge>
        ) : (
          <Icon name="minus" size="sm" variant="muted" />
        )}
      </View>
    ),
  },
  {
    key: "pants",
    header: "Calça",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (size: PpeSize) => (
      <View style={styles.centerAlign}>
        {size.pants ? (
          <Badge variant="info" size="sm">
            {PANTS_SIZE_LABELS[size.pants] || size.pants}
          </Badge>
        ) : (
          <Icon name="minus" size="sm" variant="muted" />
        )}
      </View>
    ),
  },
  {
    key: "boots",
    header: "Calçado",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (size: PpeSize) => (
      <View style={styles.centerAlign}>
        {size.boots ? (
          <Badge variant="info" size="sm">
            {BOOT_SIZE_LABELS[size.boots] || size.boots}
          </Badge>
        ) : (
          <Icon name="minus" size="sm" variant="muted" />
        )}
      </View>
    ),
  },
  {
    key: "completeness",
    header: "Status",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (size: PpeSize) => {
      const hasAllSizes = size.shirts && size.pants && size.boots;
      const missingCount = [size.shirts, size.pants, size.boots].filter((s) => !s).length;

      return (
        <View style={styles.centerAlign}>
          {hasAllSizes ? (
            <Badge variant="success" size="sm">Completo</Badge>
          ) : (
            <Badge variant="warning" size="sm">
              {missingCount} faltando
            </Badge>
          )}
        </View>
      );
    },
  },
];

export const PpeSizeTable = React.memo<PpeSizeTableProps>(({ ppeSizes, onSizePress, onRefresh, onEndReached, refreshing = false, loading = false, loadingMore = false, sortConfigs = [], onSort }) => {
  const { colors, isDark } = useTheme();

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Build visible columns with dynamic widths (all columns visible)
  const displayColumns = useMemo(() => {
    // Define width ratios for each column type
    const columnWidthRatios: Record<string, number> = {
      employee: 2.5,
      shirts: 1.0,
      pants: 1.0,
      boots: 1.0,
      completeness: 1.2,
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
  const renderColumnValue = useCallback((size: PpeSize, column: TableColumn) => {
    return column.accessor(size);
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
                            <ThemedText style={StyleSheet.flatten([styles.sortOrder, { color: isDark ? extendedColors.neutral[300] : extendedColors.neutral[700] }])}>
                              {sortIndex + 1}
                            </ThemedText>
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
    ({ item, index }: { item: PpeSize; index: number }) => {
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
          <Pressable style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])} onPress={() => onSizePress?.(item.id)} android_ripple={{ color: colors.primary + "20" }}>
            {displayColumns.map((column) => (
              <View key={column.key} style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}>
                {renderColumnValue(item, column)}
              </View>
            ))}
          </Pressable>
        </ScrollView>
      );
    },
    [colors, tableWidth, displayColumns, onSizePress, renderColumnValue, isDark],
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
        <Icon name="ruler" size="xl" variant="muted" />
        <ThemedText style={styles.emptyTitle}>Nenhum tamanho encontrado</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Nenhum registro de tamanho de EPI cadastrado</ThemedText>
      </View>
    ),
    [],
  );

  // Main loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando tamanhos...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {renderHeader()}
        <FlatList
          data={ppeSizes}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          getItemLayout={(_data, index) => ({
            length: 36,
            offset: 36 * index,
            index,
          })}
          style={styles.flatList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </Pressable>
    </View>
  );
});

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
    minHeight: 40, // Reduced to match smaller fonts
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 40, // Reduced to match smaller fonts
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
    minHeight: 36, // Reduced to match smaller fonts
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6, // Reduced padding
    justifyContent: "center",
    minHeight: 36, // Reduced to match smaller fonts
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.xs, // Match serial number size
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs, // Match serial number size
  },
  subtitleText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginTop: 2,
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

PpeSizeTable.displayName = "PpeSizeTable";
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
