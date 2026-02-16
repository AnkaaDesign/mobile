import React, { useCallback, useMemo } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet, Image } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { User } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { TeamMemberTableRowSwipe } from "./team-member-table-row-swipe";
import { formatBrazilianPhone, formatDate } from "@/utils";
import { getFileUrl } from '@/utils/file-utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import { USER_STATUS } from "@/constants";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (user: User) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface TeamMemberTableProps {
  members: User[];
  onMemberPress?: (userId: string) => void;
  onMemberEdit?: (userId: string) => void;
  onMemberDelete?: (userId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedMembers?: Set<string>;
  onSelectionChange?: (selectedMembers: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case USER_STATUS.EXPERIENCE_PERIOD_1:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case USER_STATUS.EXPERIENCE_PERIOD_2:
      return { background: badgeColors.warning.background, text: badgeColors.warning.text };
    case USER_STATUS.EFFECTED:
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case USER_STATUS.DISMISSED:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  switch (status) {
    case USER_STATUS.EXPERIENCE_PERIOD_1:
      return "Experiência 1";
    case USER_STATUS.EXPERIENCE_PERIOD_2:
      return "Experiência 2";
    case USER_STATUS.EFFECTED:
      return "Efetivado";
    case USER_STATUS.DISMISSED:
      return "Desligado";
    default:
      return status;
  }
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "name",
    header: "Nome",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <View style={styles.nameContainer}>
        {user.avatar?.id ? (
          <Image
            source={{ uri: getFileUrl(user.avatar!) }}
            style={[styles.avatarImage, { borderColor: extendedColors.neutral[300] }]}
            onError={(_e) => {
              console.log('Failed to load avatar for user:', user.name);
            }}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: extendedColors.neutral[200] }]}>
            <ThemedText style={[styles.avatarText, { color: extendedColors.neutral[600] }]}>
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </ThemedText>
          </View>
        )}
        <ThemedText style={styles.nameText} numberOfLines={1}>
          {user.name}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "position",
    header: "Cargo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.position?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "sector",
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
    key: "email",
    header: "E-mail",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={[styles.cellText, user.email && styles.emailText]} numberOfLines={1}>
        {user.email || "-"}
      </ThemedText>
    ),
  },
  {
    key: "phone",
    header: "Telefone",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (user: User) => {
      if (user.phone) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {formatBrazilianPhone(user.phone)}
          </ThemedText>
        );
      }
      return (
        <ThemedText style={styles.mutedText} numberOfLines={1}>
          -
        </ThemedText>
      );
    },
  },
  {
    key: "exp1StartAt",
    header: "Data de Admissão",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (user: User) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {user.exp1StartAt ? formatDate(new Date(user.exp1StartAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (user: User) => {
      const statusColor = getStatusColor(user.status);
      return (
        <View style={styles.centerAlign}>
          <Badge
            variant="secondary"
            size="sm"
            style={{
              backgroundColor: statusColor.background,
              borderWidth: 0,
            }}
          >
            <ThemedText
              style={{
                color: statusColor.text,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {getStatusLabel(user.status)}
            </ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "tasksCount",
    header: "Tarefas",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (user: User) => {
      const count = user._count?.tasks || 0;
      return (
        <View style={styles.centerAlign}>
          <Badge
            variant={count > 0 ? "default" : "secondary"}
            size="sm"
            style={{
              backgroundColor: count > 0 ? badgeColors.info.background : badgeColors.muted.background,
              borderWidth: 0,
            }}
          >
            <ThemedText
              style={{
                color: count > 0 ? badgeColors.info.text : badgeColors.muted.text,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {count}
            </ThemedText>
          </Badge>
        </View>
      );
    },
  },
];

export const TeamMemberTable = React.memo<TeamMemberTableProps>(
  ({
    members,
    onMemberPress,
    onMemberEdit,
    onMemberDelete,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedMembers = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["name", "position"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const prefetchTriggeredRef = React.useRef(false);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        name: 2.5,
        position: 1.5,
        sector: 1.5,
        email: 2.0,
        phone: 1.5,
        exp1StartAt: 1.5,
        status: 1.2,
        tasksCount: 0.8,
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

      const allSelected = members.every((member) => selectedMembers.has(member.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(members.map((member) => member.id)));
      }
    }, [members, selectedMembers, onSelectionChange]);

    const handleSelectMember = useCallback(
      (memberId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedMembers);
        if (newSelection.has(memberId)) {
          newSelection.delete(memberId);
        } else {
          newSelection.add(memberId);
        }
        onSelectionChange(newSelection);
      },
      [selectedMembers, onSelectionChange],
    );

    // Sort handler - Single column sorting only for mobile
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const currentSort = sortConfigs?.[0];

        // If clicking the same column, toggle direction (asc -> desc -> no sort)
        if (currentSort?.columnKey === columnKey) {
          if (currentSort.direction === "asc") {
            // Change to descending
            onSort([{ columnKey, direction: "desc", order: 0 }]);
          } else {
            // Remove sort (back to default)
            onSort([]);
          }
        } else {
          // New column clicked, sort ascending
          onSort([{ columnKey, direction: "asc", order: 0 }]);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((member: User, column: TableColumn) => {
      return column.accessor(member);
    }, []);

    // Viewability callback for aggressive prefetching
    // Triggers prefetch when user scrolls to 70% of loaded items
    // Must be stable reference (can't change nullability)
    const handleViewableItemsChanged = React.useMemo(
      () => ({
        onViewableItemsChanged: ({ viewableItems }: any) => {
          if (!onPrefetch || prefetchTriggeredRef.current) return;

          const lastViewableIndex = viewableItems[viewableItems.length - 1]?.index;
          if (lastViewableIndex !== undefined && lastViewableIndex !== null) {
            const totalItems = members.length;
            const viewabilityThreshold = totalItems * 0.7;

            if (lastViewableIndex >= viewabilityThreshold) {
              prefetchTriggeredRef.current = true;
              onPrefetch();
            }
          }
        },
      }),
      [onPrefetch, members.length],
    );

    const viewabilityConfig = React.useMemo(
      () => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
      }),
      [],
    );

    // Reset prefetch flag when data changes (new page loaded)
    React.useEffect(() => {
      prefetchTriggeredRef.current = false;
    }, [members.length]);

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
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox
                    checked={members.length > 0 && members.every((member) => selectedMembers.has(member.id))}
                    onCheckedChange={handleSelectAll}
                    disabled={members.length === 0}
                  />
                </View>
              )}
              {displayColumns.map((column) => {
                // Single column sort - check if this column is currently sorted
                const sortConfig = sortConfigs?.[0]?.columnKey === column.key ? sortConfigs[0] : null;

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
                          sortConfig.direction === "asc" ? (
                            <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                          ) : (
                            <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                          )
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedMembers, members.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: User; index: number }) => {
        const isSelected = selectedMembers.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onMemberEdit || onMemberDelete)) {
          return (
            <TeamMemberTableRowSwipe
              key={item.id}
              memberId={item.id}
              memberName={item.name}
              onEdit={onMemberEdit}
              onDelete={onMemberDelete}
              disabled={showSelection}
            >
              {(_isActive) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                    },
                    isSelected && { backgroundColor: colors.primary + "20" },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onMemberPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectMember(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectMember(item.id)} />
                      </View>
                    )}
                    {displayColumns.map((column) => (
                      <View
                        key={column.key}
                        style={StyleSheet.flatten([
                          styles.cell,
                          { width: column.width },
                          column.align === "center" && styles.centerAlign,
                          column.align === "right" && styles.rightAlign,
                        ])}
                      >
                        {renderColumnValue(item, column)}
                      </View>
                    ))}
                  </Pressable>
                </ScrollView>
              )}
            </TeamMemberTableRowSwipe>
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
              },
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onMemberPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectMember(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectMember(item.id)} />
                </View>
              )}
              {displayColumns.map((column) => (
                <View
                  key={column.key}
                  style={StyleSheet.flatten([
                    styles.cell,
                    { width: column.width },
                    column.align === "center" && styles.centerAlign,
                    column.align === "right" && styles.rightAlign,
                  ])}
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
        selectedMembers,
        onMemberPress,
        handleSelectMember,
        renderColumnValue,
        enableSwipeActions,
        onMemberEdit,
        onMemberDelete,
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
          <Icon name="users" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum membro encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou verifique sua equipe</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando membros...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            data={members}
            renderItem={renderRow}
            keyExtractor={(member) => member.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.8}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={handleViewableItemsChanged.onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={11}
            initialNumToRender={15}
            updateCellsBatchingPeriod={100}
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
    borderWidth: 1,
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
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {},
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
  mutedText: {
    fontSize: fontSize.xs,
    opacity: 0.5,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
  },
  nameText: {
    flex: 1,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  emailText: {
    color: "#16a34a", // green-600
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

TeamMemberTable.displayName = "TeamMemberTable";
