import React, { useCallback, useMemo } from "react";
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
import { formatDate, formatDateTime } from "@/utils";
import { extendedColors} from "@/lib/theme/extended-colors";
import { NOTIFICATION_TYPE, NOTIFICATION_IMPORTANCE } from "@/constants";
import {
  IconBell,
  IconBellRinging,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconPackage,
  IconCalendar,
  IconAlertCircle,
  IconSettings
} from "@tabler/icons-react-native";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (notification: Notification) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface NotificationTableProps {
  notifications: Notification[];
  onNotificationPress?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAsUnread?: (notificationId: string) => void;
  onDeleteNotification?: (notificationId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
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
  currentUserId?: string;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Helper to get notification type icon
const getNotificationTypeIcon = (type: string, size: number = 16, color: string) => {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return <IconSettings size={size} color={color} />;
    case NOTIFICATION_TYPE.PRODUCTION:
      return <IconCheck size={size} color={color} />;
    case NOTIFICATION_TYPE.STOCK:
      return <IconPackage size={size} color={color} />;
    case NOTIFICATION_TYPE.USER:
      return <IconSettings size={size} color={color} />;
    case NOTIFICATION_TYPE.GENERAL:
      return <IconBell size={size} color={color} />;
    default:
      return <IconBell size={size} color={color} />;
  }
};

// Helper to get importance badge variant
const getImportanceBadgeVariant = (importance: string) => {
  switch (importance) {
    case NOTIFICATION_IMPORTANCE.URGENT:
      return "destructive";
    case NOTIFICATION_IMPORTANCE.HIGH:
      return "warning";
    case NOTIFICATION_IMPORTANCE.NORMAL:
      return "default";
    case NOTIFICATION_IMPORTANCE.LOW:
      return "secondary";
    default:
      return "secondary";
  }
};

// Helper to get notification type label
const getNotificationTypeLabel = (type: string): string => {
  switch (type) {
    case NOTIFICATION_TYPE.SYSTEM:
      return "Sistema";
    case NOTIFICATION_TYPE.PRODUCTION:
      return "Produção";
    case NOTIFICATION_TYPE.STOCK:
      return "Estoque";
    case NOTIFICATION_TYPE.USER:
      return "Usuário";
    case NOTIFICATION_TYPE.GENERAL:
      return "Geral";
    default:
      return type;
  }
};

// Helper to check if notification is unread
const isUnread = (notification: Notification, currentUserId?: string): boolean => {
  if (!currentUserId) return false;

  // Check if seenBy array includes the current user
  if (notification.seenBy && Array.isArray(notification.seenBy)) {
    return !notification.seenBy.some(seen => seen.userId === currentUserId);
  }

  // Fallback to isSeenByUser if available
  return !notification.isSeenByUser;
};

// Define all available columns with their renderers
export const createColumnDefinitions = (currentUserId?: string): TableColumn[] => [
  {
    key: "title",
    header: "Título",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => {
      const unread = isUnread(notification, currentUserId);
      return (
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            {unread && <View style={styles.unreadDot} />}
            <ThemedText
              style={[
                styles.titleText,
                unread && styles.unreadText
              ]}
              numberOfLines={2}
            >
              {notification.title}
            </ThemedText>
          </View>
        </View>
      );
    },
  },
  {
    key: "message",
    header: "Mensagem",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (notification: Notification) => (
      <ThemedText style={styles.messageText} numberOfLines={2}>
        {notification.body}
      </ThemedText>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => {
      const { colors } = useTheme();
      return (
        <View style={styles.typeContainer}>
          {getNotificationTypeIcon(notification.type, 16, colors.mutedForeground)}
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {getNotificationTypeLabel(notification.type)}
          </ThemedText>
        </View>
      );
    },
  },
  {
    key: "importance",
    header: "Importância",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => {
      if (notification.importance === NOTIFICATION_IMPORTANCE.NORMAL || notification.importance === NOTIFICATION_IMPORTANCE.LOW) {
        return null; // Don't show badge for normal/low importance
      }

      const label = notification.importance === NOTIFICATION_IMPORTANCE.URGENT ? "Urgente" : "Alto";
      return (
        <View style={styles.centerAlign}>
          <Badge variant={getImportanceBadgeVariant(notification.importance)} size="sm">
            <ThemedText style={styles.badgeText}>{label}</ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "createdAt",
    header: "Data",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {notification.createdAt ? formatDate(new Date(notification.createdAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "sentAt",
    header: "Enviado",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (notification: Notification) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {notification.sentAt ? formatDateTime(new Date(notification.sentAt)) : "Agendado"}
      </ThemedText>
    ),
  },
];

export const NotificationTable = React.memo<NotificationTableProps>(
  ({
    notifications,
    onNotificationPress,
    onMarkAsRead,
    onMarkAsUnread,
    onDeleteNotification,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedNotifications = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["title", "type", "createdAt"],
    enableSwipeActions = true,
    currentUserId,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const prefetchTriggeredRef = React.useRef(false);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(currentUserId), [currentUserId]);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        title: 3.0,
        message: 2.5,
        type: 1.2,
        importance: 1.2,
        createdAt: 1.3,
        sentAt: 1.5,
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

    // Sort handler - Single column sorting only for mobile
    const handleColumnSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const currentSort = sortConfigs.find((config) => config.columnKey === columnKey);

        if (!currentSort) {
          // No sort on this column, add ascending
          onSort([{ columnKey, direction: "asc", order: 0 }]);
        } else if (currentSort.direction === "asc") {
          // Currently asc, change to desc
          onSort([{ columnKey, direction: "desc", order: 0 }]);
        } else {
          // Currently desc, clear sort
          onSort([]);
        }
      },
      [sortConfigs, onSort],
    );

    // Render table header
    const renderHeader = useCallback(() => {
      const allSelected = notifications.length > 0 && notifications.every((notification) => selectedNotifications.has(notification.id));
      const someSelected = !allSelected && Array.from(selectedNotifications).some((id) => notifications.find((n) => n.id === id));

      return (
        <View style={[styles.headerRow, { backgroundColor: colors.muted }]}>
          {showSelection && (
            <View style={[styles.checkboxCell, { borderBottomColor: colors.border }]}>
              <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} indeterminate={someSelected} />
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={tableWidth > availableWidth}>
            <View style={[styles.headerInner, { minWidth: tableWidth - (showSelection ? 50 : 0) }]}>
              {displayColumns.map((column) => {
                const sortConfig = sortConfigs.find((config) => config.columnKey === column.key);
                const isSorted = !!sortConfig;
                const sortDirection = sortConfig?.direction;

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={[styles.headerCell, { width: column.width, borderBottomColor: colors.border }]}
                    onPress={() => column.sortable && handleColumnSort(column.key)}
                    disabled={!column.sortable}
                  >
                    <View style={styles.headerContent}>
                      <ThemedText style={[styles.headerText, { color: colors.mutedForeground }]}>{column.header}</ThemedText>
                      {column.sortable && (
                        <View style={styles.sortIndicator}>
                          {isSorted && sortDirection === "asc" && <Icon name="chevron-up" size={14} color={colors.primary} />}
                          {isSorted && sortDirection === "desc" && <Icon name="chevron-down" size={14} color={colors.primary} />}
                          {!isSorted && <Icon name="chevrons-up-down" size={14} color={colors.mutedForeground} />}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      );
    }, [showSelection, displayColumns, sortConfigs, tableWidth, availableWidth, colors, notifications, selectedNotifications, handleSelectAll, handleColumnSort]);

    // Render individual row
    const renderRow = useCallback(
      ({ item, index }: { item: Notification; index: number }) => {
        const isSelected = selectedNotifications.has(item.id);
        const isEven = index % 2 === 0;
        const unread = isUnread(item, currentUserId);

        // Render row content
        const rowContent = (
          <View style={[styles.row, isEven ? { backgroundColor: colors.background } : { backgroundColor: colors.muted + "30" }, unread && styles.unreadRow]}>
            {showSelection && (
              <View style={styles.checkboxCell}>
                <Checkbox checked={isSelected} onCheckedChange={() => handleSelectNotification(item.id)} />
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={tableWidth > availableWidth}>
              <Pressable
                style={[styles.rowInner, { minWidth: tableWidth - (showSelection ? 50 : 0) }]}
                onPress={() => {
                  closeActiveRow();
                  onNotificationPress?.(item.id);
                }}
              >
                {displayColumns.map((column) => (
                  <View
                    key={column.key}
                    style={[
                      styles.cell,
                      { width: column.width },
                      column.align === "center" && styles.centerAlign,
                      column.align === "right" && styles.rightAlign,
                    ]}
                  >
                    {column.accessor(item)}
                  </View>
                ))}
              </Pressable>
            </ScrollView>
          </View>
        );

        // If swipe actions enabled, wrap in swipe component
        if (enableSwipeActions && (onMarkAsRead || onMarkAsUnread || onDeleteNotification)) {
          const showMarkAsRead = unread && onMarkAsRead;
          const showMarkAsUnread = !unread && onMarkAsUnread;

          return (
            <NotificationTableRowSwipe
              notificationId={item.id}
              notificationTitle={item.title}
              onMarkAsRead={showMarkAsRead ? onMarkAsRead : undefined}
              onMarkAsUnread={showMarkAsUnread ? onMarkAsUnread : undefined}
              onDelete={onDeleteNotification}
              disabled={showSelection}
            >
              {(_isActive) => rowContent}
            </NotificationTableRowSwipe>
          );
        }

        return rowContent;
      },
      [
        displayColumns,
        showSelection,
        selectedNotifications,
        tableWidth,
        availableWidth,
        colors,
        currentUserId,
        enableSwipeActions,
        onNotificationPress,
        onMarkAsRead,
        onMarkAsUnread,
        onDeleteNotification,
        closeActiveRow,
        handleSelectNotification,
      ],
    );

    // Handle end reached with prefetch
    const handleEndReached = useCallback(() => {
      if (onEndReached && !loading && !loadingMore && !prefetchTriggeredRef.current) {
        onEndReached();
      }
    }, [onEndReached, loading, loadingMore]);

    // Reset prefetch trigger on data change
    React.useEffect(() => {
      prefetchTriggeredRef.current = false;
    }, [notifications]);

    // Handle scroll for prefetch
    const handleViewableItemsChanged = useCallback(
      ({ viewableItems }: any) => {
        if (!onPrefetch || loadingMore || loading || prefetchTriggeredRef.current) return;

        const visibleCount = viewableItems.length;
        const threshold = Math.ceil(notifications.length * 0.7);

        if (visibleCount > 0 && notifications.length > 0) {
          const lastVisibleIndex = viewableItems[viewableItems.length - 1]?.index || 0;
          if (lastVisibleIndex >= threshold) {
            prefetchTriggeredRef.current = true;
            onPrefetch();
          }
        }
      },
      [onPrefetch, notifications.length, loadingMore, loading],
    );

    const viewabilityConfig = React.useRef({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100,
    }).current;

    // Render footer with loading indicator
    const renderFooter = useCallback(() => {
      if (!loadingMore) return null;
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.footerText, { color: colors.mutedForeground }]}>Carregando mais...</ThemedText>
        </View>
      );
    }, [loadingMore, colors]);

    // Render empty state
    const renderEmpty = useCallback(() => {
      if (loading) return null;
      return (
        <View style={styles.emptyContainer}>
          <Icon name="bell-off" size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhuma notificação encontrada</ThemedText>
        </View>
      );
    }, [loading, colors]);

    return (
      <Pressable style={styles.container} onPress={handleContainerPress}>
        <FlatList
          data={notifications}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} /> : undefined}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          windowSize={11}
          initialNumToRender={20}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
  },
  headerInner: {
    flexDirection: "row",
  },
  headerCell: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
  },
  sortIndicator: {
    marginLeft: spacing.xxs,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    minHeight: 60,
  },
  unreadRow: {
    borderLeftWidth: 3,
    borderLeftColor: extendedColors.blue[500],
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cell: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: extendedColors.blue[500],
  },
  titleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  unreadText: {
    fontWeight: fontWeight.bold,
  },
  messageText: {
    fontSize: fontSize.xs,
    color: extendedColors.neutral[600],
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.sm,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
  },
});
