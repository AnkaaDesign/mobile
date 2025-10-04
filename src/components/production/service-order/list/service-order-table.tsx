import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { ServiceOrder } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from '../../../../utils';
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from '../../../../constants';
import { Badge } from "@/components/ui/badge";

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (serviceOrder: ServiceOrder) => React.ReactNode;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface ServiceOrderTableProps {
  serviceOrders: ServiceOrder[];
  onServiceOrderPress?: (serviceOrderId: string) => void;
  onDelete?: (serviceOrderId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReach?: () => void;
  refreshing?: boolean;
  isLoading?: boolean;
  loadingMore?: boolean;
  error?: Error | null;
  canLoadMore?: boolean;
  showSelection?: boolean;
  selectedServiceOrders?: Set<string>;
  onSelectionChange?: (selectedServiceOrders: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  columns?: TableColumn[];
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
const ALL_COLUMN_DEFINITIONS: Record<string, Omit<TableColumn, "width">> = {
  description: {
    key: "description",
    title: "Descrição",
    align: "left",
    sortable: true,
  },
  status: {
    key: "status",
    title: "Status",
    align: "center",
    sortable: true,
  },
  task: {
    key: "task",
    title: "Tarefa",
    align: "left",
    sortable: false,
  },
  createdAt: {
    key: "createdAt",
    title: "Criado em",
    align: "left",
    sortable: true,
  },
};

const DEFAULT_COLUMN_KEYS = ["description", "status", "task", "createdAt"];

const getStatusBadgeVariant = (status: SERVICE_ORDER_STATUS) => {
  switch (status) {
    case SERVICE_ORDER_STATUS.PENDING:
      return "warning";
    case SERVICE_ORDER_STATUS.IN_PROGRESS:
      return "info";
    case SERVICE_ORDER_STATUS.COMPLETED:
      return "success";
    case SERVICE_ORDER_STATUS.CANCELLED:
      return "destructive";
    default:
      return "secondary";
  }
};

export const ServiceOrderTable = React.memo<ServiceOrderTableProps>(
  ({
    serviceOrders,
    onServiceOrderPress,
    onDelete,
    onRefresh,
    onEndReach,
    refreshing = false,
    isLoading = false,
    loadingMore = false,
    error = null,
    canLoadMore = false,
    showSelection = false,
    selectedServiceOrders = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    columns,
    visibleColumnKeys = DEFAULT_COLUMN_KEYS,
  }) => {
    const { colors, isDark } = useTheme();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Build visible columns based on selection
    const visibleColumns = useMemo(() => {
      if (columns) return columns; // Use provided columns if any

      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        description: 3.0, // Largest - service order description needs more space
        status: 1.0, // Medium - status badge
        task: 2.0, // Medium - task name
        createdAt: 1.2, // Medium - date
      };

      // Calculate total ratio
      const totalRatio = visibleColumnKeys.reduce((sum, key) => sum + (columnWidthRatios[key] || 1), 0);

      // Calculate actual column widths based on available space
      return visibleColumnKeys.map((key) => {
        const definition = ALL_COLUMN_DEFINITIONS[key as keyof typeof ALL_COLUMN_DEFINITIONS];
        const ratio = columnWidthRatios[key] || 1;
        const width = Math.floor((availableWidth * ratio) / totalRatio);

        return {
          ...definition,
          width,
        } as TableColumn;
      });
    }, [visibleColumnKeys, columns, availableWidth]);

    const handleToggleSelection = useCallback(
      (serviceOrderId: string) => {
        if (!onSelectionChange) return;
        const newSelection = new Set(selectedServiceOrders);
        if (newSelection.has(serviceOrderId)) {
          newSelection.delete(serviceOrderId);
        } else {
          newSelection.add(serviceOrderId);
        }
        onSelectionChange(newSelection);
      },
      [selectedServiceOrders, onSelectionChange],
    );

    const handleToggleAll = useCallback(() => {
      if (!onSelectionChange) return;
      if (selectedServiceOrders.size === serviceOrders.length) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(serviceOrders.map(so => so.id)));
      }
    }, [serviceOrders, selectedServiceOrders, onSelectionChange]);

    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingConfig = sortConfigs.find(c => c.columnKey === columnKey);

        if (!existingConfig) {
          // Add new sort
          onSort([...sortConfigs, { columnKey, direction: "asc" }]);
        } else if (existingConfig.direction === "asc") {
          // Change to desc
          onSort(sortConfigs.map(c =>
            c.columnKey === columnKey
              ? { ...c, direction: "desc" }
              : c
          ));
        } else {
          // Remove sort
          onSort(sortConfigs.filter(c => c.columnKey !== columnKey));
        }
      },
      [sortConfigs, onSort],
    );

    const getSortIndicator = useCallback(
      (columnKey: string) => {
        const config = sortConfigs.find(c => c.columnKey === columnKey);
        if (!config) return null;

        const index = sortConfigs.indexOf(config);
        return (
          <View style={styles.sortIndicator}>
            <Icon name={config.direction === "asc" ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
            {sortConfigs.length > 1 && (
              <ThemedText style={StyleSheet.flatten([styles.sortIndex, { color: colors.primary }])}>{index + 1}</ThemedText>
            )}
          </View>
        );
      },
      [sortConfigs, colors],
    );

    const renderColumnContent = useCallback(
      (column: TableColumn, serviceOrder: ServiceOrder) => {
        switch (column.key) {
          case "description":
            return (
              <ThemedText style={styles.cellText} numberOfLines={2} ellipsizeMode="tail">
                {serviceOrder.description}
              </ThemedText>
            );
          case "status":
            if (serviceOrder.status) {
              return (
                <Badge variant={getStatusBadgeVariant(serviceOrder.status)}>
                  {SERVICE_ORDER_STATUS_LABELS[serviceOrder.status]}
                </Badge>
              );
            }
            return <ThemedText style={styles.cellText}>-</ThemedText>;
          case "task":
            return (
              <ThemedText style={styles.cellText} numberOfLines={2} ellipsizeMode="tail">
                {serviceOrder.task?.description || "-"}
              </ThemedText>
            );
          case "createdAt":
            return (
              <ThemedText style={styles.cellText}>
                {formatDate(serviceOrder.createdAt)}
              </ThemedText>
            );
          default:
            if (column.render) {
              return column.render(serviceOrder);
            }
            return <ThemedText style={styles.cellText}>-</ThemedText>;
        }
      },
      [],
    );

    const renderHeader = useCallback(() => {
      return (
        <View
          style={StyleSheet.flatten([styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }])}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
            <View style={styles.header}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.checkboxColumn, { borderRightColor: colors.border }])}>
                  <Checkbox checked={selectedServiceOrders.size === serviceOrders.length && serviceOrders.length > 0} onCheckedChange={handleToggleAll} />
                </View>
              )}
              {visibleColumns.map((column, index) => (
                <TouchableOpacity
                  key={column.key}
                  style={StyleSheet.flatten([
                    styles.headerCell,
                    { width: column.width },
                    index < visibleColumns.length - 1 && { borderRightColor: colors.border, borderRightWidth: 1 },
                  ])}
                  onPress={() => column.sortable && handleSort(column.key)}
                  disabled={!column.sortable}
                >
                  <View style={styles.headerContent}>
                    <ThemedText style={StyleSheet.flatten([styles.headerText, { textAlign: column.align || "left" }])}>
                      {column.title}
                    </ThemedText>
                    {column.sortable && getSortIndicator(column.key)}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }, [visibleColumns, showSelection, selectedServiceOrders, serviceOrders, handleToggleAll, handleSort, getSortIndicator, colors]);

    const renderServiceOrder = useCallback(
      ({ item: serviceOrder }: { item: ServiceOrder }) => {
        const isSelected = selectedServiceOrders.has(serviceOrder.id);

        return (
          <Pressable
            onPress={() => onServiceOrderPress?.(serviceOrder.id)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.7 },
              isSelected && { backgroundColor: colors.accent },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
              <View style={styles.rowContent}>
                {showSelection && (
                  <View style={StyleSheet.flatten([styles.checkboxColumn, { borderRightColor: colors.border }])}>
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggleSelection(serviceOrder.id)} />
                  </View>
                )}
                {visibleColumns.map((column, index) => (
                  <View
                    key={column.key}
                    style={StyleSheet.flatten([
                      styles.cell,
                      { width: column.width },
                      index < visibleColumns.length - 1 && { borderRightColor: colors.border, borderRightWidth: 1 },
                    ])}
                  >
                    {renderColumnContent(column, serviceOrder)}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        );
      },
      [visibleColumns, showSelection, selectedServiceOrders, handleToggleSelection, renderColumnContent, onServiceOrderPress, colors],
    );

    const renderEmpty = useCallback(() => {
      if (isLoading) return null;
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>Nenhuma ordem de serviço encontrada</ThemedText>
        </View>
      );
    }, [isLoading]);

    const renderFooter = useCallback(() => {
      if (loadingMore) {
        return (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        );
      }
      return null;
    }, [loadingMore, colors]);

    // Show loading screen for initial load
    if (isLoading && serviceOrders.length === 0) {
      return <LoadingScreen />;
    }

    // Show error screen if there's an error
    if (error && serviceOrders.length === 0) {
      return (
        <ErrorScreen
          message="Erro ao carregar ordens de serviço"
          detail={error.message}
          onRetry={onRefresh}
        />
      );
    }

    return (
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          ref={flatListRef}
          data={serviceOrders}
          renderItem={renderServiceOrder}
          keyExtractor={(serviceOrder) => serviceOrder.id}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={onEndReach}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  headerCell: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  sortIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortIndex: {
    fontSize: fontSize.xs,
    marginLeft: 2,
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  checkboxColumn: {
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRightWidth: 1,
  },
  cell: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.md,
    opacity: 0.6,
  },
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
});