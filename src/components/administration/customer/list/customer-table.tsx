import React, { useCallback, useMemo } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet, Image } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Customer } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { CustomerTableRowSwipe } from "./customer-table-row-swipe";
import { formatCNPJ, formatCPF, formatBrazilianPhone, formatDateTime } from '../../../../utils';
import { getFileUrl } from '@/utils/file';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (customer: Customer) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface CustomerTableProps {
  customers: Customer[];
  onCustomerPress?: (customerId: string) => void;
  onCustomerEdit?: (customerId: string) => void;
  onCustomerDelete?: (customerId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedCustomers?: Set<string>;
  onSelectionChange?: (selectedCustomers: Set<string>) => void;
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
    key: "fantasyName",
    header: "Nome Fantasia",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (customer: Customer) => (
      <View style={styles.nameContainer}>
        {customer.logo?.id ? (
          <Image
            source={{ uri: getFileUrl(customer.logo) }}
            style={[styles.logoImage, { borderColor: extendedColors.neutral[300] }]}
            onError={(_e) => {
              // On error, the fallback avatar will be shown via react-native's onError handling
              console.log('Failed to load logo for customer:', customer.fantasyName);
            }}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: extendedColors.neutral[200] }]}>
            <ThemedText style={[styles.avatarText, { color: extendedColors.neutral[600] }]}>
              {customer.fantasyName?.charAt(0)?.toUpperCase() || "?"}
            </ThemedText>
          </View>
        )}
        <ThemedText style={styles.nameText} numberOfLines={1}>
          {customer.fantasyName}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "document",
    header: "Documento",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (customer: Customer) => {
      if (customer.cnpj) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {formatCNPJ(customer.cnpj)}
          </ThemedText>
        );
      }
      if (customer.cpf) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {formatCPF(customer.cpf)}
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
    key: "corporateName",
    header: "Razão Social",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (customer: Customer) => (
      <ThemedText style={styles.cellText} numberOfLines={2}>
        {customer.corporateName || "-"}
      </ThemedText>
    ),
  },
  {
    key: "email",
    header: "E-mail",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (customer: Customer) => (
      <ThemedText style={[styles.cellText, customer.email && styles.emailText]} numberOfLines={1}>
        {customer.email || "-"}
      </ThemedText>
    ),
  },
  {
    key: "phones",
    header: "Telefones",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (customer: Customer) => {
      if (customer.phones && customer.phones.length > 0) {
        const mainPhone = formatBrazilianPhone(customer.phones[0]);
        const otherCount = customer.phones.length - 1;

        return (
          <View style={styles.phonesContainer}>
            <ThemedText style={styles.cellText} numberOfLines={1}>
              {mainPhone}
            </ThemedText>
            {otherCount > 0 && (
              <Badge variant="secondary" size="sm" style={styles.phoneBadge}>
                <ThemedText style={styles.badgeText}>+{otherCount}</ThemedText>
              </Badge>
            )}
          </View>
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
    key: "city",
    header: "Cidade",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (customer: Customer) => {
      if (customer.city && customer.state) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {`${customer.city}/${customer.state}`}
          </ThemedText>
        );
      }
      if (customer.city) {
        return (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {customer.city}
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
    key: "tags",
    header: "Tags",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (customer: Customer) => {
      if (customer.tags && customer.tags.length > 0) {
        return (
          <View style={styles.tagsContainer}>
            {customer.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" size="sm">
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </Badge>
            ))}
            {customer.tags.length > 2 && (
              <Badge variant="secondary" size="sm">
                <ThemedText style={styles.badgeText}>+{customer.tags.length - 2}</ThemedText>
              </Badge>
            )}
          </View>
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
    key: "taskCount",
    header: "Tarefas",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (customer: Customer) => {
      const count = customer._count?.tasks || 0;
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
  {
    key: "createdAt",
    header: "Cadastrado Em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (customer: Customer) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {customer.createdAt ? formatDateTime(new Date(customer.createdAt)) : "-"}
      </ThemedText>
    ),
  },
];

export const CustomerTable = React.memo<CustomerTableProps>(
  ({
    customers,
    onCustomerPress,
    onCustomerEdit,
    onCustomerDelete,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedCustomers = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["fantasyName", "document"],
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
        fantasyName: 2.5,
        document: 1.5,
        corporateName: 2.0,
        email: 2.0,
        phones: 1.5,
        city: 1.5,
        tags: 1.5,
        taskCount: 0.8,
        createdAt: 1.8,
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

      const allSelected = customers.every((customer) => selectedCustomers.has(customer.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(customers.map((customer) => customer.id)));
      }
    }, [customers, selectedCustomers, onSelectionChange]);

    const handleSelectCustomer = useCallback(
      (customerId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedCustomers);
        if (newSelection.has(customerId)) {
          newSelection.delete(customerId);
        } else {
          newSelection.add(customerId);
        }
        onSelectionChange(newSelection);
      },
      [selectedCustomers, onSelectionChange],
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
    const renderColumnValue = useCallback((customer: Customer, column: TableColumn) => {
      return column.accessor(customer);
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
            const totalItems = customers.length;
            const viewabilityThreshold = totalItems * 0.7;

            if (lastViewableIndex >= viewabilityThreshold) {
              prefetchTriggeredRef.current = true;
              onPrefetch();
            }
          }
        },
      }),
      [onPrefetch, customers.length],
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
    }, [customers.length]);

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
                    checked={customers.length > 0 && customers.every((customer) => selectedCustomers.has(customer.id))}
                    onCheckedChange={handleSelectAll}
                    disabled={customers.length === 0}
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedCustomers, customers.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Customer; index: number }) => {
        const isSelected = selectedCustomers.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onCustomerEdit || onCustomerDelete)) {
          return (
            <CustomerTableRowSwipe
              key={item.id}
              customerId={item.id}
              customerName={item.fantasyName}
              onEdit={onCustomerEdit}
              onDelete={onCustomerDelete}
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
                    onPress={() => onCustomerPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectCustomer(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectCustomer(item.id)} />
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
            </CustomerTableRowSwipe>
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
              onPress={() => onCustomerPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectCustomer(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectCustomer(item.id)} />
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
        selectedCustomers,
        onCustomerPress,
        handleSelectCustomer,
        renderColumnValue,
        enableSwipeActions,
        onCustomerEdit,
        onCustomerDelete,
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
          <ThemedText style={styles.emptyTitle}>Nenhum cliente encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos clientes</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando clientes...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            data={customers}
            renderItem={renderRow}
            keyExtractor={(customer) => customer.id}
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
  logoImage: {
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
  phonesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phoneBadge: {
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tagText: {
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

CustomerTable.displayName = "CustomerTable";
