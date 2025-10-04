import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView , StyleSheet} from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import type { Truck } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from '../../../../utils';

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (truck: Truck) => React.ReactNode;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface TruckTableProps {
  data?: Truck[];
  isLoading?: boolean;
  error?: any;
  onRefresh?: () => void;
  onItemPress?: (truck: Truck) => void;
  onTruckPress?: (truckId: string) => void;
  onTruckEdit?: (truckId: string) => void;
  onTruckDelete?: (truckId: string) => void;
  onTruckDuplicate?: (truckId: string) => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedTrucks?: Set<string>;
  onSelectionChange?: (selectedTrucks: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  columns?: TableColumn[];
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
const ALL_COLUMN_DEFINITIONS: Record<string, Omit<TableColumn, "width">> = {
  plate: {
    key: "plate",
    title: "Placa",
    align: "left",
    sortable: true,
  },
  model: {
    key: "model",
    title: "Modelo",
    align: "left",
    sortable: true,
  },
  manufacturer: {
    key: "manufacturer",
    title: "Fabricante",
    align: "left",
    sortable: true,
  },
  garage: {
    key: "garage",
    title: "Garagem",
    align: "left",
    sortable: true,
  },
  task: {
    key: "task",
    title: "Tarefa Atual",
    align: "left",
    sortable: true,
  },
};

// Default visible columns for mobile (limited to 3 for better UX)
const DEFAULT_VISIBLE_COLUMNS = ["plate", "model", "manufacturer"];

export function TruckTable({
  data = [],
  isLoading,
  error,
  onRefresh,
  onItemPress,
  onTruckPress,
  onTruckEdit,
  onTruckDelete,
  onTruckDuplicate,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedTrucks = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys = DEFAULT_VISIBLE_COLUMNS,
  enableSwipeActions = false,
}: TruckTableProps) {
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // Build columns based on visible keys
  const columns = useMemo(() => {
    const visibleColumns = visibleColumnKeys
      .map((key) => ALL_COLUMN_DEFINITIONS[key])
      .filter(Boolean);

    // Calculate widths based on available space
    const totalWidth = availableWidth - (showSelection ? 50 : 0); // Reserve space for selection checkbox
    const baseWidth = totalWidth / visibleColumns.length;

    return visibleColumns.map((col, index) => ({
      ...col,
      width: baseWidth,
    })) as TableColumn[];
  }, [visibleColumnKeys, showSelection]);

  // Handle truck press
  const handleTruckPress = useCallback(
    (truck: Truck) => {
      if (onItemPress) {
        onItemPress(truck);
      } else if (onTruckPress) {
        onTruckPress(truck.id);
      }
    },
    [onItemPress, onTruckPress],
  );

  // Handle selection toggle
  const handleSelectionToggle = useCallback(
    (truckId: string) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedTrucks);
      if (newSelection.has(truckId)) {
        newSelection.delete(truckId);
      } else {
        newSelection.add(truckId);
      }
      onSelectionChange(newSelection);
    },
    [selectedTrucks, onSelectionChange],
  );

  // Render cell content
  const renderCell = useCallback(
    (truck: Truck, column: TableColumn) => {
      if (column.render) {
        return column.render(truck);
      }

      switch (column.key) {
        case "plate":
          return truck.plate || "-";
        case "model":
          return truck.model || "-";
        case "manufacturer":
          return truck.manufacturer || "-";
        case "garage":
          return truck.garage?.name || "-";
        case "task":
          return truck.task?.name || "-";
        default:
          return "-";
      }
    },
    [],
  );

  // Render table row
  const renderRow = useCallback(
    ({ item: truck }: { item: Truck }) => {
      const isSelected = selectedTrucks.has(truck.id);

      return (
        <Pressable
          style={[
            styles.tableRow,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
            isSelected && {
              backgroundColor: `${colors.primary}10`,
            },
          ]}
          onPress={() => handleTruckPress(truck)}
        >
          {/* Selection checkbox */}
          {showSelection && (
            <View style={StyleSheet.flatten([styles.cell, { width: 50 }])}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleSelectionToggle(truck.id)}
              />
            </View>
          )}

          {/* Data cells */}
          {columns.map((column) => (
            <View
              key={column.key}
              style={[
                styles.cell,
                { width: column.width },
                column.align === "center" && styles.centerAlign,
                column.align === "right" && styles.rightAlign,
              ]}
            >
              <ThemedText
                style={[
                  styles.cellText,
                  { color: colors.foreground },
                ]}
                numberOfLines={2}
              >
                {renderCell(truck, column)}
              </ThemedText>
            </View>
          ))}
        </Pressable>
      );
    },
    [
      colors,
      columns,
      showSelection,
      selectedTrucks,
      handleTruckPress,
      handleSelectionToggle,
      renderCell,
    ],
  );

  // Render loading footer
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={StyleSheet.flatten([styles.loadingText, { color: colors.mutedForeground }])}>
          Carregando mais caminhões...
        </ThemedText>
      </View>
    );
  }, [loadingMore, colors]);

  // Show loading state
  if (loading && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={StyleSheet.flatten([styles.loadingText, { color: colors.mutedForeground }])}>
          Carregando caminhões...
        </ThemedText>
      </View>
    );
  }

  // Show error state
  if (error && data.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
          Erro ao carregar caminhões
        </ThemedText>
        {onRefresh && (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.retryButton, { borderColor: colors.border }])}
            onPress={onRefresh}
          >
            <ThemedText style={{ color: colors.primary }}>Tentar Novamente</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show empty state
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
          Nenhum caminhão encontrado
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table header */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={StyleSheet.flatten([styles.headerContainer, { backgroundColor: colors.muted }])}
      >
        <View style={styles.headerRow}>
          {/* Selection header */}
          {showSelection && (
            <View style={StyleSheet.flatten([styles.headerCell, { width: 50 }])}>
              <ThemedText style={StyleSheet.flatten([styles.headerText, { color: colors.foreground }])}>
                {/* Could add select all checkbox here */}
              </ThemedText>
            </View>
          )}

          {/* Column headers */}
          {columns.map((column) => (
            <TouchableOpacity
              key={column.key}
              style={[
                styles.headerCell,
                { width: column.width },
                column.align === "center" && styles.centerAlign,
                column.align === "right" && styles.rightAlign,
              ]}
              onPress={() => {
                if (column.sortable && onSort) {
                  const currentSort = sortConfigs.find((s) => s.columnKey === column.key);
                  const newDirection = currentSort?.direction === "asc" ? "desc" : "asc";
                  onSort([{ columnKey: column.key, direction: newDirection }]);
                }
              }}
            >
              <View style={styles.headerContent}>
                <ThemedText
                  style={[
                    styles.headerText,
                    { color: colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {column.title}
                </ThemedText>
                {column.sortable && (
                  <Icon
                    name="chevron-up-down"
                    size={16}
                    color={colors.mutedForeground}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Table data */}
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
  },
  headerCell: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  flatList: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderBottomWidth: 1,
  },
  cell: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    justifyContent: "center",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  errorText: {
    fontSize: fontSize.base,
    textAlign: "center",
  },
  emptyText: {
    fontSize: fontSize.base,
    textAlign: "center",
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});