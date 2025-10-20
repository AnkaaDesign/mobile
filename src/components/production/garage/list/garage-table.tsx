import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { IconBuilding, IconChevronDown, IconChevronUp, IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
import { Garage } from "../../../../types";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { SwipeableList, SwipeableListItem, SwipeAction } from "@/components/ui/swipeable-list";
import { formatDateTime } from "@/utils";

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

export interface GarageTableProps {
  garages: Garage[];
  onGaragePress: (garageId: string) => void;
  onGarageEdit: (garageId: string) => void;
  onGarageDelete: (garageId: string) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedGarages?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

interface ColumnDefinition {
  key: string;
  label: string;
  width?: number | string;
  sortable?: boolean;
  render: (garage: Garage) => React.ReactNode;
}

export function createColumnDefinitions(): ColumnDefinition[] {
  return [
    {
      key: "name",
      label: "Nome",
      sortable: true,
      width: "40%",
      render: (garage: Garage) => (
        <View style={styles.nameCell}>
          <View style={styles.iconContainer}>
            <IconBuilding size={16} color="#6366f1" />
          </View>
          <View style={styles.nameTextContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {garage.name}
            </Text>
            <Text style={styles.subtitleText} numberOfLines={1}>
              {garage.lanes?.length || 0} faixas
            </Text>
          </View>
        </View>
      ),
    },
    {
      key: "dimensions",
      label: "Dimensões",
      sortable: false,
      width: "30%",
      render: (garage: Garage) => (
        <View>
          <Text style={styles.cellText} numberOfLines={1}>
            {garage.width}m × {garage.length}m
          </Text>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {(garage.width * garage.length).toFixed(2)} m²
          </Text>
        </View>
      ),
    },
    {
      key: "createdAt",
      label: "Criado em",
      sortable: true,
      width: "30%",
      render: (garage: Garage) => (
        <Text style={styles.cellText} numberOfLines={1}>
          {formatDateTime(garage.createdAt)}
        </Text>
      ),
    },
  ];
}

export function GarageTable({
  garages,
  onGaragePress,
  onGarageEdit,
  onGarageDelete,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  visibleColumnKeys = ["name", "dimensions", "createdAt"],
  enableSwipeActions = true,
}: GarageTableProps) {
  const { colors } = useTheme();

  const allColumns = useMemo(() => createColumnDefinitions(), []);

  const visibleColumns = useMemo(() => {
    return allColumns.filter((col) => visibleColumnKeys.includes(col.key));
  }, [allColumns, visibleColumnKeys]);

  const renderGarageItem = (garage: Garage) => {
    const leftActions: SwipeAction[] = [
      {
        icon: <IconEye size={20} color="#fff" />,
        backgroundColor: colors.primary,
        onPress: () => onGaragePress(garage.id),
        label: "Ver",
      },
    ];

    const rightActions: SwipeAction[] = [
      {
        icon: <IconEdit size={20} color="#fff" />,
        backgroundColor: "#3b82f6",
        onPress: () => onGarageEdit(garage.id),
        label: "Editar",
      },
      {
        icon: <IconTrash size={20} color="#fff" />,
        backgroundColor: "#ef4444",
        onPress: () => onGarageDelete(garage.id),
        label: "Excluir",
      },
    ];

    const content = (
      <Pressable
        style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        onPress={() => onGaragePress(garage.id)}
      >
        <View style={styles.rowContent}>
          {visibleColumns.map((column) => (
            <View key={column.key} style={[styles.cell, { width: column.width }]}>
              {column.render(garage)}
            </View>
          ))}
        </View>
      </Pressable>
    );

    if (enableSwipeActions) {
      return (
        <SwipeableListItem key={garage.id} leftActions={leftActions} rightActions={rightActions}>
          {content}
        </SwipeableListItem>
      );
    }

    return <View key={garage.id}>{content}</View>;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
        {visibleColumns.map((column) => (
          <View key={column.key} style={[styles.headerCell, { width: column.width }]}>
            <Text style={styles.headerText}>{column.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      <SwipeableList
        data={garages}
        renderItem={({ item }) => renderGarageItem(item)}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        loading={loading}
        loadingMore={loadingMore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCell: {
    paddingRight: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    opacity: 0.7,
  },
  row: {
    borderBottomWidth: 1,
    minHeight: 64,
  },
  rowContent: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cell: {
    paddingRight: 8,
    justifyContent: "center",
  },
  nameCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  nameTextContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cellText: {
    fontSize: 14,
  },
  subtitleText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
