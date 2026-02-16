import React, { useCallback, useMemo } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { OrderSchedule } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { OrderScheduleTableRowSwipe } from "./order-schedule-table-row-swipe";
import { formatDateTime } from "@/utils";
import { SCHEDULE_FREQUENCY_LABELS } from "@/constants";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (schedule: OrderSchedule) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface OrderScheduleTableProps {
  schedules: OrderSchedule[];
  onSchedulePress?: (scheduleId: string) => void;
  onScheduleEdit?: (scheduleId: string) => void;
  onScheduleDelete?: (scheduleId: string) => void;
  onScheduleToggleActive?: (scheduleId: string, currentActive: boolean) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedSchedules?: Set<string>;
  onSelectionChange?: (selectedSchedules: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "frequency",
    header: "Frequência",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (schedule: OrderSchedule) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {SCHEDULE_FREQUENCY_LABELS[schedule.frequency] || schedule.frequency}
      </ThemedText>
    ),
  },
  {
    key: "specificDate",
    header: "Data Agendada",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (schedule: OrderSchedule) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {schedule.specificDate ? formatDateTime(schedule.specificDate) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "isActive",
    header: "Status",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (schedule: OrderSchedule) => (
      <Badge
        variant={schedule.isActive ? "success" : "secondary"}
        style={styles.statusBadge}
      >
        <ThemedText style={styles.badgeText}>
          {schedule.isActive ? "Ativo" : "Inativo"}
        </ThemedText>
      </Badge>
    ),
  },
  {
    key: "createdAt",
    header: "Criado em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (schedule: OrderSchedule) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {formatDateTime(schedule.createdAt)}
      </ThemedText>
    ),
  },
];

export function OrderScheduleTable({
  schedules = [],
  onSchedulePress,
  onScheduleEdit,
  onScheduleDelete,
  // onScheduleToggleActive removed
  onRefresh,
  onEndReached,
  refreshing = false,
  loading: _loading = false,
  loadingMore = false,
  showSelection = false,
  selectedSchedules = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys = ["supplier", "frequency", "specificDate", "isActive"],
  enableSwipeActions = true,
}: OrderScheduleTableProps) {
  const { colors } = useTheme();
  const { activeRowId: openRowId, setActiveRowId: setOpenRowId } = useSwipeRow();

  // All column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Filter columns based on visible column keys
  const visibleColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumnKeys.includes(col.key));
  }, [allColumns, visibleColumnKeys]);

  // Calculate column widths dynamically based on visible columns
  const columnsWithWidths = useMemo(() => {
    const totalColumns = visibleColumns.length;
    const baseWidth = availableWidth / totalColumns;
    return visibleColumns.map((col) => ({
      ...col,
      width: baseWidth,
    }));
  }, [visibleColumns, availableWidth]);

  const handleToggleSelection = useCallback(
    (scheduleId: string) => {
      const newSelection = new Set(selectedSchedules);
      if (newSelection.has(scheduleId)) {
        newSelection.delete(scheduleId);
      } else {
        newSelection.add(scheduleId);
      }
      onSelectionChange?.(newSelection);
    },
    [selectedSchedules, onSelectionChange],
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSort) return;

      // Find current sort config for this column
      const currentSort = sortConfigs.find((s) => s.columnKey === columnKey);

      let newConfigs: SortConfig[];
      if (!currentSort) {
        // Add new sort
        newConfigs = [{ columnKey, direction: "asc" }];
      } else if (currentSort.direction === "asc") {
        // Toggle to desc
        newConfigs = [{ columnKey, direction: "desc" }];
      } else {
        // Remove sort
        newConfigs = [];
      }

      onSort(newConfigs);
    },
    [sortConfigs, onSort],
  );

  const renderHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {showSelection && (
        <View style={styles.checkboxCell}>
          <Checkbox
            checked={schedules.length > 0 && schedules.every((s) => selectedSchedules.has(s.id))}
            onCheckedChange={(checked) => {
              const newSelection = checked ? new Set(schedules.map((s) => s.id)) : new Set<string>();
              onSelectionChange?.(newSelection);
            }}
          />
        </View>
      )}
      {columnsWithWidths.map((column) => {
        const sortConfig = sortConfigs.find((s) => s.columnKey === column.key);
        return (
          <TouchableOpacity
            key={column.key}
            style={[styles.headerCell, { width: column.width }]}
            onPress={() => column.sortable && handleSort(column.key)}
            disabled={!column.sortable}
          >
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerText} numberOfLines={1}>
                {column.header}
              </ThemedText>
              {column.sortable && sortConfig && (
                <Icon
                  name={sortConfig.direction === "asc" ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.foreground}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderRow = useCallback(
    ({ item: schedule }: { item: OrderSchedule }) => {
      const isSelected = selectedSchedules.has(schedule.id);

      const rowContent = (
        <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {showSelection && (
            <View style={styles.checkboxCell}>
              <Checkbox checked={isSelected} onCheckedChange={() => handleToggleSelection(schedule.id)} />
            </View>
          )}
          {columnsWithWidths.map((column) => (
            <View key={column.key} style={[styles.cell, { width: column.width }]}>
              {column.accessor(schedule)}
            </View>
          ))}
        </View>
      );

      if (enableSwipeActions) {
        return (
          <OrderScheduleTableRowSwipe
            scheduleId={schedule.id}
            onEdit={() => onScheduleEdit?.(schedule.id)}
            onDelete={() => onScheduleDelete?.(schedule.id)}
            onPress={() => onSchedulePress?.(schedule.id)}
            isOpen={openRowId === schedule.id}
            onOpenChange={(open) => setOpenRowId(open ? schedule.id : null)}
          >
            {rowContent}
          </OrderScheduleTableRowSwipe>
        );
      }

      return (
        <Pressable onPress={() => onSchedulePress?.(schedule.id)}>
          {rowContent}
        </Pressable>
      );
    },
    [
      columnsWithWidths,
      colors,
      showSelection,
      selectedSchedules,
      enableSwipeActions,
      openRowId,
      onSchedulePress,
      onScheduleEdit,
      onScheduleDelete,
      handleToggleSelection,
      setOpenRowId,
    ],
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.footerText}>Carregando mais...</ThemedText>
      </View>
    );
  };

  return (
    <FlatList
      data={schedules}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
      stickyHeaderIndices={[0]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  checkboxCell: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "center",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
});
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
