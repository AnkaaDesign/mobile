import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { User } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { UserTableRowSwipe } from "./user-table-row-swipe";
import { formatCPF, formatBrazilianPhone, formatDate, formatDateTime } from '../../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import { USER_STATUS } from '../../../../constants';
import { getUserStatusBadgeText } from '../../../../utils/user';
import { getBadgeVariant } from '../../../../constants/badge-colors';
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (user: User) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface UserTableProps {
  users: User[];
  onUserPress?: (userId: string) => void;
  onUserEdit?: (userId: string) => void;
  onUserDelete?: (userId: string) => void;
  onUserView?: (userId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedUsers?: Set<string>;
  onSelectionChange?: (selectedUsers: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Badge variant color mapping helper for mobile
const getBadgeStyleFromVariant = (variant: string) => {
  switch (variant) {
    case "success":
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case "pending":
      return { background: badgeColors.pending.background, text: badgeColors.pending.text }; // amber-600
    case "warning":
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case "destructive":
      return { background: badgeColors.destructive.background, text: badgeColors.destructive.text }; // red-700
    case "error":
      return { background: badgeColors.error.background, text: badgeColors.error.text }; // red-700
    case "muted":
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
    default:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
  }
};

// Define all available columns with their renderers
const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "avatar",
    header: "",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (user: User) => (
      <View style={styles.avatarContainer}>
        <Avatar label={user.name} uri={user.avatar || undefined} size="sm" />
      </View>
    ),
  },
  {
    key: "name",
    header: "Nome",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={1} ellipsizeMode="tail">
        {user.name}
      </ThemedText>
    ),
  },
  {
    key: "email",
    header: "Email",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.email}
      </ThemedText>
    ),
  },
  {
    key: "phone",
    header: "Telefone",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.phone ? formatBrazilianPhone(user.phone) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "position.hierarchy",
    header: "Cargo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <View style={styles.badgeContainer}>
        {user.position ? (
          <Badge variant="secondary" size="sm" style={StyleSheet.flatten([styles.positionBadge, { backgroundColor: badgeColors.info.background }])}>
            <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: badgeColors.info.text }])}>{user.position.name}</ThemedText>
          </Badge>
        ) : (
          <ThemedText style={styles.cellText}>-</ThemedText>
        )}
      </View>
    ),
  },
  {
    key: "sector.name",
    header: "Setor",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.sector?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "managedSector.name",
    header: "Setor Gerenciado",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.managedSector?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => {
      const variant = getBadgeVariant(user.status, "USER");
      const statusColors = getBadgeStyleFromVariant(variant);
      return (
        <Badge variant="secondary" size="sm" style={{ backgroundColor: statusColors.background, borderWidth: 0 }}>
          <ThemedText style={{ color: statusColors.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
            {getUserStatusBadgeText(user)}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "verified",
    header: "Verificado",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <View style={styles.centerAlign}>
        {user.verified ? (
          <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.success.background, borderWidth: 0 }}>
            <ThemedText style={{ color: badgeColors.success.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>Sim</ThemedText>
          </Badge>
        ) : (
          <Badge variant="secondary" size="sm" style={{ backgroundColor: badgeColors.muted.background, borderWidth: 0 }}>
            <ThemedText style={{ color: badgeColors.muted.text, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>Não</ThemedText>
          </Badge>
        )}
      </View>
    ),
  },
  {
    key: "lastLoginAt",
    header: "Último Login",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.lastLoginAt ? formatDateTime(new Date(user.lastLoginAt)) : "Nunca"}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "Data de Criação",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.createdAt ? formatDateTime(new Date(user.createdAt)) : "-"}
      </ThemedText>
    ),
  },
];

// Export the default visible columns
export const DEFAULT_VISIBLE_COLUMNS = new Set(["name", "email", "position.hierarchy", "sector.name", "status"]);

export const UserTable = React.memo<UserTableProps>(
  ({
    users,
    onUserPress,
    onUserEdit,
    onUserDelete,
    onUserView,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedUsers = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["avatar", "name", "email", "position.hierarchy", "sector.name", "status"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        avatar: 0.6,
        name: 2.0,
        email: 1.8,
        phone: 1.3,
        "position.hierarchy": 1.5,
        "sector.name": 1.3,
        "managedSector.name": 1.5,
        status: 1.8,
        verified: 1.1,
        lastLoginAt: 1.6,
        createdAt: 1.6,
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

      const allSelected = users.every((user) => selectedUsers.has(user.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(users.map((user) => user.id)));
      }
    }, [users, selectedUsers, onSelectionChange]);

    const handleSelectUser = useCallback(
      (userId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedUsers);
        if (newSelection.has(userId)) {
          newSelection.delete(userId);
        } else {
          newSelection.add(userId);
        }
        onSelectionChange(newSelection);
      },
      [selectedUsers, onSelectionChange],
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
          const newConfigs = [{ columnKey: columnKey, direction: "asc" as const, order: 0 }, ...(sortConfigs || [])];
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
    const renderColumnValue = useCallback((user: User, column: TableColumn) => {
      return column.accessor(user);
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
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox checked={users.length > 0 && users.every((user) => selectedUsers.has(user.id))} onCheckedChange={handleSelectAll} disabled={users.length === 0} />
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
                            {sortConfig.direction === "asc" ? <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} /> : <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />}
                            {sortConfigs.length > 1 && <ThemedText style={StyleSheet.flatten([styles.sortOrder, { color: isDark ? extendedColors.neutral[300] : extendedColors.neutral[700] }])}>{sortIndex + 1}</ThemedText>}
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedUsers, users.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item: user, index }: { item: User; index: number }) => {
        const isSelected = selectedUsers.has(user.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onUserEdit || onUserDelete || onUserView)) {
          return (
            <UserTableRowSwipe key={user.id} userId={user.id} userName={user.name} onEdit={onUserEdit} onDelete={onUserDelete} onView={onUserView} disabled={showSelection}>
              {(isActive) => (
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
                    onPress={() => onUserPress?.(user.id)}
                    onLongPress={() => showSelection && handleSelectUser(user.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectUser(user.id)} />
                      </View>
                    )}
                    {displayColumns.map((column) => (
                      <View key={column.key} style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}>
                        {renderColumnValue(user, column)}
                      </View>
                    ))}
                  </Pressable>
                </ScrollView>
              )}
            </UserTableRowSwipe>
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
              onPress={() => onUserPress?.(user.id)}
              onLongPress={() => showSelection && handleSelectUser(user.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectUser(user.id)} />
                </View>
              )}
              {displayColumns.map((column) => (
                <View key={column.key} style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}>
                  {renderColumnValue(user, column)}
                </View>
              ))}
            </Pressable>
          </ScrollView>
        );
      },
      [colors, tableWidth, displayColumns, showSelection, selectedUsers, onUserPress, handleSelectUser, renderColumnValue, enableSwipeActions, onUserEdit, onUserDelete, onUserView, activeRowId, closeActiveRow, isDark],
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
          <Icon name="users-group" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum usuário encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos usuários</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando usuários...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={users}
            renderItem={renderRow}
            keyExtractor={(user) => user.id}
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
            getItemLayout={(data, index) => ({
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
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  positionBadge: {
    borderWidth: 0,
  },
  sectorBadge: {
    borderWidth: 1,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
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

UserTable.displayName = "UserTable";
