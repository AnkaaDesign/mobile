import React, { useState, useMemo, useCallback } from "react";
import { View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Switch as RNSwitch } from "react-native";
import { IconColumns, IconSearch, IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";

// Generic column interface
export interface ColumnDefinition {
  key: string;
  header: string;
  accessor?: (item: any) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

interface ColumnVisibilityDrawerContentProps {
  columns: ColumnDefinition[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
  defaultColumns?: Set<string>;
}

export function ColumnVisibilityDrawerContent({
  columns,
  visibleColumns,
  onVisibilityChange,
  defaultColumns,
}: ColumnVisibilityDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeColumnDrawer } = useUtilityDrawer();
  const [searchQuery, setSearchQuery] = useState("");
  // Initialize localVisible with visibleColumns value immediately
  const [localVisible, setLocalVisible] = useState(() => new Set(visibleColumns || []));

  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const query = searchQuery.toLowerCase();
    return columns.filter((col) => col.header.toLowerCase().includes(query));
  }, [columns, searchQuery]);

  const handleToggle = useCallback((columnKey: string) => {
    setLocalVisible((prev) => {
      const newVisible = new Set(prev);
      if (newVisible.has(columnKey)) {
        newVisible.delete(columnKey);
      } else {
        newVisible.add(columnKey);
      }
      return newVisible;
    });
  }, []);

  const handleClear = useCallback(() => {
    if (defaultColumns) {
      setLocalVisible(defaultColumns);
    } else {
      setLocalVisible(new Set());
    }
  }, [defaultColumns]);

  const handleApply = useCallback(() => {
    onVisibilityChange(localVisible);
    closeColumnDrawer();
  }, [localVisible, onVisibilityChange, closeColumnDrawer]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const visibleCount = localVisible.size;
  const totalCount = columns.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: 18
      }]}>
        <View style={styles.headerContent}>
          <IconColumns size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Gerenciar Colunas</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <ThemedText style={styles.countText}>
              {visibleCount}/{totalCount}
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity onPress={closeColumnDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSearch size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Buscar coluna..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <IconX size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {filteredColumns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhuma coluna encontrada</ThemedText>
          </View>
        ) : (
          filteredColumns.map((column) => {
            const isVisible = localVisible.has(column.key);
            return (
              <View
                key={column.key}
                style={styles.columnItem}
              >
                <TouchableOpacity
                  style={styles.columnTouchable}
                  onPress={() => handleToggle(column.key)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.columnTitle}>{column.header}</ThemedText>
                </TouchableOpacity>

                <RNSwitch
                  value={isVisible}
                  onValueChange={() => handleToggle(column.key)}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={isVisible ? colors.primaryForeground : "#f4f3f4"}
                  ios_backgroundColor={colors.muted}
                />
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.footerBtnText}>Restaurar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  columnTouchable: {
    flex: 1,
    paddingVertical: 4,
    paddingRight: 16,
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});

// Export alias for backward compatibility
export { ColumnVisibilityDrawerContent as ColumnVisibilityDrawer };
