import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { IconBuilding, IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
import type { Garage } from "../../../../types";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { ReanimatedSwipeableRow, type SwipeAction } from "@/components/ui/reanimated-swipeable-row";
import { formatDateTime } from "@/utils";
import type { SortConfig } from "@/lib/sort-utils";

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
  flex?: number; // Use flex instead of width for dynamic sizing
  sortable?: boolean;
  render: (garage: Garage) => React.ReactNode;
}

export function createColumnDefinitions(): ColumnDefinition[] {
  return [
    {
      key: "name",
      label: "Nome",
      sortable: true,
      flex: 2, // 40% equivalent (2 out of 5 total flex)
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
      flex: 1.5, // 30% equivalent (1.5 out of 5 total flex)
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
      flex: 1.5, // 30% equivalent (1.5 out of 5 total flex)
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

  const renderGarageItem = ({ item: garage }: { item: Garage }) => {
    const leftActions: SwipeAction[] = [
      {
        key: "view",
        icon: <IconEye size={20} color="#fff" />,
        backgroundColor: colors.primary,
        onPress: () => onGaragePress(garage.id),
        label: "Ver",
        closeOnPress: true,
      },
    ];

    const rightActions: SwipeAction[] = [
      {
        key: "edit",
        icon: <IconEdit size={20} color="#fff" />,
        backgroundColor: "#3b82f6",
        onPress: () => onGarageEdit(garage.id),
        label: "Editar",
        closeOnPress: true,
      },
      {
        key: "delete",
        icon: <IconTrash size={20} color="#fff" />,
        backgroundColor: "#ef4444",
        onPress: () => onGarageDelete(garage.id),
        label: "Excluir",
        closeOnPress: true,
      },
    ];

    const content = (
      <Pressable
        style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        onPress={() => onGaragePress(garage.id)}
      >
        <View style={styles.rowContent}>
          {visibleColumns.map((column) => (
            <View key={column.key} style={[styles.cell, column.flex ? { flex: column.flex } : undefined]}>
              {column.render(garage)}
            </View>
          ))}
        </View>
      </Pressable>
    );

    if (enableSwipeActions) {
      return (
        <ReanimatedSwipeableRow
          key={garage.id}
          leftActions={leftActions}
          rightActions={rightActions}
          containerStyle={styles.swipeContainer}
        >
          {content}
        </ReanimatedSwipeableRow>
      );
    }

    return <View key={garage.id}>{content}</View>;
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Nenhuma garagem encontrada
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
        {visibleColumns.map((column) => (
          <View key={column.key} style={[styles.headerCell, column.flex ? { flex: column.flex } : undefined]}>
            <Text style={styles.headerText}>{column.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={garages}
        renderItem={renderGarageItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        style={styles.list}
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
  list: {
    flex: 1,
  },
  swipeContainer: {
    overflow: "hidden",
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
