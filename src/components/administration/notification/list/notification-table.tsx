import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";

import type { Notification } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { NotificationTableRowSwipe } from "./notification-table-row-swipe";
import { NOTIFICATION_IMPORTANCE, NOTIFICATION_IMPORTANCE_LABELS, NOTIFICATION_TYPE_LABELS } from "@/constants";
import { formatRelativeTime } from "@/utils";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (notification: Notification) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface NotificationTableProps {
  notifications: Notification[];
  onNotificationPress?: (notificationId: string) => void;
  onNotificationDelete?: (notificationId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedNotifications?: Set<string>;
  onSelectionChange?: (selectedNotifications: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Helper function to get importance badge color
const getImportanceBadgeColor = (importance: NOTIFICATION_IMPORTANCE) => {
  switch (importance) {
    case NOTIFICATION_IMPORTANCE.LOW:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
    case NOTIFICATION_IMPORTANCE.NORMAL:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
    case NOTIFICATION_IMPORTANCE.HIGH:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case NOTIFICATION_IMPORTANCE.URGENT:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

// Define all available columns with their renderers
const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "title",
    header: "Título",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.titleText])} numberOfLines={2}>
        {notification.title}
      </ThemedText>
    ),
  },
  {
    key: "importance",
    header: "Importância",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => {
      const colors = getImportanceBadgeColor(notification.importance);
      return (
        <View style={styles.centerAlign}>
          <Badge
            variant="secondary"
            size="sm"
            style={{
              backgroundColor: colors.background,
              borderWidth: 0,
            }}
          >
            <ThemedText
              style={{
                color: colors.text,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {NOTIFICATION_IMPORTANCE_LABELS[notification.importance]}
            </ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "type",
    header: "Tipo",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => (
      <View style={styles.centerAlign}>
        <Badge variant="secondary" size="sm">
          <ThemedText style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
            {NOTIFICATION_TYPE_LABELS[notification.type]}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "sentAt",
    header: "Enviado em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {notification.sentAt ? formatRelativeTime(notification.sentAt) : "Não enviado"}
      </ThemedText>
    ),
  },
  {
    key: "recipients",
    header: "Destinatários",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (notification: Notification) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {notification.seenBy?.length || 0}
      </ThemedText>
    ),
  },
];

export const NotificationTable = React.memo<NotificationTableProps>(
  ({
    notifications,
    onNotificationPress,
    onNotificationDelete,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedNotifications = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["title", "importance", "type", "sentAt"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [_headerHeight, _setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        title: 2.5,
        importance: 1.2,
        type: 1.0,
        sentAt: 1.5,
        recipients: 1.0,
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

      const allSelected = notifications.every((notification) => selectedNotifications.has(notification.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(notifications.map((notification) => notification.id)));
      }
    }, [notifications, selectedNotifications, onSelectionChange]);

    const handleSelectNotification = useCallback(
      (notificationId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedNotifications);
        if (newSelection.has(notificationId)) {
          newSelection.delete(notificationId);
        } else {
          newSelection.add(notificationId);
        }
        onSelectionChange(newSelection);
      },
      [selectedNotifications, onSelectionChange],
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
    const renderColumnValue = useCallback((notification: Notification, column: TableColumn) => {
      return column.accessor(notification);
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
            onLayout={(event) => _setHeaderHeight(event.nativeEvent.layout.height)}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox checked={notifications.length > 0 && notifications.every((notification) => selectedNotifications.has(notification.id))} onCheckedChange={handleSelectAll} disabled={notifications.length === 0} />
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedNotifications, notifications.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Notification; index: number }) => {
        const isSelected = selectedNotifications.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && onNotificationDelete) {
          return (
            <NotificationTableRowSwipe key={item.id} notificationId={item.id} notificationTitle={item.title} onDelete={onNotificationDelete} disabled={showSelection}>
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
                  onPress={() => onNotificationPress?.(item.id)}
                  onLongPress={() => showSelection && handleSelectNotification(item.id)}
                  android_ripple={{ color: colors.primary + "20" }}
                >
                  {showSelection && (
                    <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleSelectNotification(item.id)} />
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
            </NotificationTableRowSwipe>
          );
        }

        // Non-swipeable version
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
              onPress={() => onNotificationPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectNotification(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectNotification(item.id)} />
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
      [
        colors,
        tableWidth,
        displayColumns,
        showSelection,
        selectedNotifications,
        onNotificationPress,
        handleSelectNotification,
        renderColumnValue,
        enableSwipeActions,
        onNotificationDelete,
        activeRowId,
        closeActiveRow,
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
          <Icon name="bell-off" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma notificação encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novas notificações</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando notificações...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={notifications}
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
              length: 36, // Fixed row height
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
  titleText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
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

NotificationTable.displayName = "NotificationTable";
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
