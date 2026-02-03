import React, { useCallback, useMemo } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { PpeDelivery } from '@/types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { MyPpeDeliveryTableRowSwipe } from "./my-ppe-delivery-table-row-swipe";
import { formatDate } from '@/utils';
import { extendedColors } from "@/lib/theme/extended-colors";
import { PPE_DELIVERY_STATUS_LABELS, PPE_DELIVERY_STATUS } from '@/constants';
import { BADGE_COLORS, ENTITY_BADGE_CONFIG } from '@/constants/badge-colors';

export interface TableColumn {
  key: string;
  header: string;
  accessor: (delivery: PpeDelivery) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface MyPpeDeliveryTableProps {
  deliveries: PpeDelivery[];
  onDeliveryPress?: (deliveryId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "itemName",
    header: "Item EPI",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (delivery: PpeDelivery) => (
      <View>
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {delivery.item?.name || "-"}
        </ThemedText>
        {delivery.size && (
          <ThemedText style={styles.mutedText} numberOfLines={1}>
            Tam: {delivery.size}
          </ThemedText>
        )}
      </View>
    ),
  },
  {
    key: "quantity",
    header: "Qtd",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (delivery: PpeDelivery) => (
      <View style={styles.centerAlign}>
        <Badge variant="secondary" size="sm">
          <ThemedText style={styles.quantityText}>{delivery.quantity || 1}</ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "deliveryDate",
    header: "Data Entrega",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (delivery: PpeDelivery) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {delivery.actualDeliveryDate
          ? formatDate(new Date(delivery.actualDeliveryDate))
          : delivery.scheduledDate
          ? formatDate(new Date(delivery.scheduledDate))
          : "-"}
      </ThemedText>
    ),
  },
  {
    key: "reviewedBy",
    header: "Responsável",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (delivery: PpeDelivery) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {delivery.reviewedByUser?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (delivery: PpeDelivery) => {
      // Get badge variant from entity config, then get colors
      const variant = ENTITY_BADGE_CONFIG.PPE_DELIVERY[delivery.status as PPE_DELIVERY_STATUS] || "gray";
      const badgeColor = BADGE_COLORS[variant];

      return (
        <Badge
          variant="secondary"
          size="sm"
          style={{ backgroundColor: badgeColor.bg, borderWidth: 0, flexShrink: 0 }}
        >
          <ThemedText
            style={{ color: badgeColor.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}
            numberOfLines={1}
          >
            {PPE_DELIVERY_STATUS_LABELS[delivery.status as PPE_DELIVERY_STATUS] || delivery.status}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "ca",
    header: "CA",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (delivery: PpeDelivery) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {delivery.item?.ppeCA || "-"}
      </ThemedText>
    ),
  },
  {
    key: "validity",
    header: "Validade",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (delivery: PpeDelivery) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {delivery.expirationDate ? formatDate(new Date(delivery.expirationDate)) : "-"}
      </ThemedText>
    ),
  },
];

export const MyPpeDeliveryTable = React.memo<MyPpeDeliveryTableProps>(
  ({
    deliveries,
    onDeliveryPress,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["itemName", "quantity", "deliveryDate", "status"],
  }) => {
    const { colors } = useTheme();
    const { activeRowId: activeRow } = useSwipeRow();

    const allColumns = useMemo(() => createColumnDefinitions(), []);

    const visibleColumns = useMemo(() => {
      return allColumns.filter((col) => visibleColumnKeys.includes(col.key));
    }, [allColumns, visibleColumnKeys]);

    // Column width ratios
    const columnWidthRatios: Record<string, number> = {
      itemName: 2.5,
      quantity: 0.8,
      deliveryDate: 1.5,
      reviewedBy: 1.5,
      status: 1.8, // Increased for longer status labels like "Aguardando Assinatura"
      ca: 1.0,
      validity: 1.2,
    };

    const displayColumns = useMemo(() => {
      const totalRatio = visibleColumns.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);
      return visibleColumns.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [visibleColumns]);

    const totalWidth = useMemo(() => {
      return displayColumns.reduce((sum, col) => sum + col.width, 0);
    }, [displayColumns]);

    const getSortState = useCallback(
      (columnKey: string) => {
        const sortConfig = sortConfigs.find((sc) => sc.columnKey === columnKey);
        if (!sortConfig) return null;
        return sortConfig.direction;
      },
      [sortConfigs]
    );

    const handleHeaderPress = useCallback(
      (columnKey: string) => {
        const column = allColumns.find((col) => col.key === columnKey);
        if (!column?.sortable || !onSort) return;

        const currentState = getSortState(columnKey);
        let newSortConfigs: SortConfig[];

        if (currentState === "asc") {
          newSortConfigs = [{ columnKey, direction: "desc", order: 0 }];
        } else if (currentState === "desc") {
          newSortConfigs = [];
        } else {
          newSortConfigs = [{ columnKey, direction: "asc", order: 0 }];
        }

        onSort(newSortConfigs);
      },
      [allColumns, getSortState, onSort]
    );

    const renderSortIcon = (columnKey: string, sortable: boolean) => {
      if (!sortable) return null;
      const sortState = getSortState(columnKey);

      return (
        <View style={styles.sortIconContainer}>
          {sortState === "asc" && <Icon name="chevron-up" size={14} color={colors.primary} />}
          {sortState === "desc" && <Icon name="chevron-down" size={14} color={colors.primary} />}
          {!sortState && <Icon name="chevron-up" size={14} color={colors.mutedForeground} opacity={0.3} />}
        </View>
      );
    };

    const renderHeader = () => (
      <View style={[styles.headerRow, { backgroundColor: colors.muted + "50", borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={totalWidth > availableWidth}>
          <View style={[styles.headerContent, { width: totalWidth }]}>
            {displayColumns.map((column) => {
              const align = column.align || "left";
              const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

              return (
                <Pressable
                  key={column.key}
                  style={[styles.headerCell, { width: column.width, justifyContent }]}
                  onPress={() => handleHeaderPress(column.key)}
                  disabled={!column.sortable}
                >
                  <View style={styles.headerCellContent}>
                    <ThemedText style={[styles.headerText, { color: colors.foreground }]} numberOfLines={1}>
                      {column.header}
                    </ThemedText>
                    {renderSortIcon(column.key, column.sortable || false)}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );

    const renderRow = ({ item, index }: { item: PpeDelivery; index: number }) => {
      const isEven = index % 2 === 0;

      return (
        <View style={[styles.rowContainer, { opacity: activeRow === item.id ? 0.5 : 1 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={totalWidth > availableWidth}>
            <Pressable
              onPress={() => onDeliveryPress?.(item.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  width: totalWidth,
                  backgroundColor: isEven ? colors.background : colors.muted + "20",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {displayColumns.map((column) => {
                const align = column.align || "left";
                const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

                return (
                  <View key={`${item.id}-${column.key}`} style={[styles.cell, { width: column.width, justifyContent }]}>
                    {column.accessor(item)}
                  </View>
                );
              })}
            </Pressable>
          </ScrollView>
        </View>
      );
    };

    const handleScroll = useCallback(
      (event: any) => {
        if (!onPrefetch) return;

        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 200;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isCloseToBottom) {
          onPrefetch();
        }
      },
      [onPrefetch]
    );

    const renderFooter = () => {
      if (!loadingMore) return null;
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    };

    const renderEmpty = () => {
      if (loading) return null;
      return (
        <View style={styles.emptyContainer}>
          <Icon name="package-x" size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhuma entrega encontrada</ThemedText>
        </View>
      );
    };

    return (
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.7}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          maxToRenderPerBatch={15}
          windowSize={11}
          initialNumToRender={15}
          removeClippedSubviews={true}
        />
      </View>
    );
  }
);

MyPpeDeliveryTable.displayName = "MyPpeDeliveryTable";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerCell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  headerCellContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  headerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  sortIconContainer: {
    marginLeft: spacing.xxs,
  },
  rowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  nameDetails: {
    flex: 1,
  },
  nameText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  positionText: {
    fontSize: fontSize.xs,
    color: extendedColors.neutral[500],
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  mutedText: {
    fontSize: fontSize.xs,
    color: extendedColors.neutral[500],
  },
  centerAlign: {
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
  },
});
