import React, { useState, useMemo, useCallback } from "react";
import { View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Switch as RNSwitch } from "react-native";
import { IconColumns, IconSearch, IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

export interface ColumnDefinition {
  key: string;
  header: string;
}

interface GenericColumnDrawerContentProps {
  columns: ColumnDefinition[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
  onClose: () => void;
  defaultColumns?: Set<string>;
  title?: string;
}

export function GenericColumnDrawerContent({
  columns,
  visibleColumns,
  onVisibilityChange,
  onClose,
  defaultColumns,
  title = "Gerenciar Colunas",
}: GenericColumnDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleRestore = useCallback(() => {
    if (defaultColumns) {
      setLocalVisible(new Set(defaultColumns));
    }
  }, [defaultColumns]);

  const handleApply = useCallback(() => {
    onVisibilityChange(localVisible);
    onClose();
  }, [localVisible, onVisibilityChange, onClose]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const visibleCount = localVisible.size;
  const totalCount = columns.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconColumns size={24} color={colors.foreground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            {title}
          </ThemedText>
          {visibleCount < totalCount && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
                {visibleCount}/{totalCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
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

      {/* Columns List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={true}
      >
        {filteredColumns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma coluna encontrada
            </ThemedText>
          </View>
        ) : (
          filteredColumns.map((column) => {
            const isVisible = localVisible.has(column.key);
            return (
              <View key={column.key} style={styles.columnItem}>
                <TouchableOpacity
                  style={styles.columnTouchable}
                  onPress={() => handleToggle(column.key)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.columnTitle, { color: colors.foreground }]}>
                    {column.header}
                  </ThemedText>
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
        paddingBottom: insets.bottom + 16,
        borderTopColor: colors.border,
        backgroundColor: colors.background
      }]}>
        <Button
          variant="outline"
          onPress={handleRestore}
          style={styles.button}
        >
          Restaurar
        </Button>
        <Button
          variant="default"
          onPress={handleApply}
          style={styles.button}
        >
          Aplicar
        </Button>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
    paddingVertical: 0,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
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
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
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