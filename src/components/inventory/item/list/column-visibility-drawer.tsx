import React, { useState, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { IconColumns, IconSearch, IconX, IconRefresh } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter } from "@/components/ui/drawer";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { Item } from '../../../../types';

// Column interface matching web pattern
interface ItemColumn {
  key: string;
  header: string;
  accessor: (item: Item) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

// Function to get default visible columns for items
export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "uniCode",
    "name",
    "brand.name",
    "category.name",
    "measures",
    "quantity",
    "monthlyConsumption",
    "price",
    "totalPrice"
  ]);
}

interface ColumnVisibilityDrawerProps {
  columns: ItemColumn[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Memoized list item for better performance
const ColumnListItem = React.memo<{
  column: ItemColumn;
  isVisible: boolean;
  onToggle: (key: string, checked: boolean) => void;
  colors: any;
}>(({ column, isVisible, onToggle, colors }) => {
  const handlePress = useCallback(() => {
    onToggle(column.key, !isVisible);
  }, [column.key, isVisible, onToggle]);

  const handleSwitchChange = useCallback((checked: boolean) => {
    onToggle(column.key, checked);
  }, [column.key, onToggle]);

  return (
    <TouchableOpacity
      style={StyleSheet.flatten([
        styles.columnItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ])}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.columnInfo}>
        <ThemedText style={styles.columnTitle}>{column.header}</ThemedText>
      </View>
      <Switch
        checked={isVisible}
        onCheckedChange={handleSwitchChange}
      />
    </TouchableOpacity>
  );
});

ColumnListItem.displayName = "ColumnListItem";

export function ColumnVisibilityDrawer({
  columns,
  visibleColumns,
  onVisibilityChange,
  open,
  onOpenChange
}: ColumnVisibilityDrawerProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [localVisible, setLocalVisible] = useState(visibleColumns);

  // Reset local state when drawer opens
  React.useEffect(() => {
    if (open) {
      setLocalVisible(visibleColumns);
      setSearchQuery("");
    }
  }, [open, visibleColumns]);

  // Filtered columns with memoization
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const query = searchQuery.toLowerCase();
    return columns.filter((col) => col.header.toLowerCase().includes(query));
  }, [columns, searchQuery]);

  // Memoized toggle handler
  const handleToggle = useCallback((columnKey: string, checked: boolean) => {
    setLocalVisible((prev) => {
      const newVisible = new Set(prev);
      if (checked) {
        newVisible.add(columnKey);
      } else {
        newVisible.delete(columnKey);
      }
      return newVisible;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setLocalVisible(new Set(columns.map((col) => col.key)));
  }, [columns]);

  const handleDeselectAll = useCallback(() => {
    setLocalVisible(new Set());
  }, []);

  const handleReset = useCallback(() => {
    setLocalVisible(getDefaultVisibleColumns());
  }, []);

  const handleApply = useCallback(() => {
    onVisibilityChange(localVisible);
    onOpenChange(false);
  }, [localVisible, onVisibilityChange, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const visibleCount = localVisible.size;
  const totalCount = columns.length;

  // Render item with getItemLayout for better performance
  const renderItem = useCallback(({ item }: { item: ItemColumn }) => (
    <ColumnListItem
      column={item}
      isVisible={localVisible.has(item.key)}
      onToggle={handleToggle}
      colors={colors}
    />
  ), [localVisible, handleToggle, colors]);

  const keyExtractor = useCallback((item: ItemColumn) => item.key, []);

  // Fixed item height for getItemLayout optimization
  const ITEM_HEIGHT = 56;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>Nenhuma coluna encontrada</ThemedText>
    </View>
  ), []);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      width="85%"
      closeOnBackdropPress={true}
      closeOnSwipe={true}
    >
      <View style={styles.drawerContainer}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconColumns size={24} color={colors.foreground} />
            <ThemedText style={styles.headerTitle}>Colunas</ThemedText>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Column count indicator */}
        <View style={[styles.countIndicator, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.countText}>
            {visibleCount} / {totalCount} selecionadas
          </ThemedText>
        </View>

        {/* Search bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSearch size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar coluna..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <IconX size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <Button variant="outline" size="sm" onPress={handleSelectAll} style={styles.quickActionButton}>
              Todas
            </Button>
            <Button variant="outline" size="sm" onPress={handleDeselectAll} style={styles.quickActionButton}>
              Nenhuma
            </Button>
            <Button variant="outline" size="sm" onPress={handleReset} style={styles.quickActionButton}>
              <IconRefresh size={16} color={colors.foreground} />
            </Button>
          </View>
        </View>

        {/* Column list */}
        <View style={styles.listContainer}>
          <FlatList
            data={filteredColumns}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={ListEmptyComponent}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footerContainer, { borderTopColor: colors.border }]}>
          <View style={styles.footer}>
            <Button
              variant="outline"
              size="default"
              onPress={handleClose}
              style={styles.footerButton}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="default"
              onPress={handleApply}
              style={styles.footerButton}
            >
              Aplicar
            </Button>
          </View>
        </View>
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  countIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: spacing.xs,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  listContainer: {
    flex: 1,
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    height: 56,
  },
  columnInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  columnTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footerContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.base,
    opacity: 0.6,
  },
});
