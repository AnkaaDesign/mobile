import React, { useState, useMemo, useCallback } from "react";
import { View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Switch as RNSwitch, Keyboard, Pressable } from "react-native";
import { IconColumns, IconSearch, IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";

import { Drawer } from "@/components/ui/drawer";
import type { Supplier } from '../../../../types';

interface SupplierColumn {
  key: string;
  header: string;
  accessor: (supplier: Supplier) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

export function getDefaultVisibleColumns(): Set<string> {
  return new Set([
    "fantasyName",
    "city",
    "itemsCount"
  ]);
}

interface SupplierColumnVisibilityDrawerV2Props {
  columns: SupplierColumn[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierColumnVisibilityDrawerV2({
  columns,
  visibleColumns,
  onVisibilityChange,
  open,
  onOpenChange
}: SupplierColumnVisibilityDrawerV2Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [localVisible, setLocalVisible] = useState(visibleColumns);

  React.useEffect(() => {
    if (open) {
      setLocalVisible(visibleColumns);
      setSearchQuery("");
    }
  }, [open, visibleColumns]);

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

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      width="90%"
      closeOnBackdropPress={true}
      closeOnSwipe={false}
      style={{ borderTopWidth: 0 }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 8
        }]}>
          <View style={styles.headerContent}>
            <IconColumns size={24} color={colors.foreground} />
            <ThemedText style={styles.title}>Gerenciar Colunas</ThemedText>
          </View>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Count */}
        <View style={styles.countBadgeWrapper}>
          <View style={[styles.countBadge, { backgroundColor: colors.muted }]}>
            <ThemedText style={styles.countText}>
              {visibleCount} / {totalCount} selecionadas
            </ThemedText>
          </View>
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

        {/* Quick actions */}
        <View style={styles.actionsWrapper}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Keyboard.dismiss();
              handleDeselectAll();
            }}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.actionBtnText}>Nenhuma</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Keyboard.dismiss();
              handleReset();
            }}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.actionBtnText}>Restaurar</ThemedText>
          </TouchableOpacity>
        </View>

        {/* List */}
        <Pressable style={styles.scrollView} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
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
                    style={[
                      styles.columnItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.columnTouchable}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleToggle(column.key);
                      }}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.columnTitle}>{column.header}</ThemedText>
                    </TouchableOpacity>

                    <RNSwitch
                      value={isVisible}
                      onValueChange={() => {
                        Keyboard.dismiss();
                        handleToggle(column.key);
                      }}
                      trackColor={{ false: colors.muted, true: colors.primary }}
                      thumbColor={isVisible ? colors.primaryForeground : "#f4f3f4"}
                      ios_backgroundColor={colors.muted}
                    />
                  </View>
                );
              })
            )}
          </ScrollView>
        </Pressable>

        {/* Footer */}
        <View style={[styles.footer, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 16)
        }]}>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Keyboard.dismiss();
              handleClose();
            }}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.footerBtnText}>Cancelar</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => {
              Keyboard.dismiss();
              handleApply();
            }}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Drawer>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderTopWidth: 0,
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
  countBadgeWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  countText: {
    fontSize: 14,
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
  actionsWrapper: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    paddingBottom: 16,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 60,
    marginBottom: 10,
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
    paddingTop: 16,
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
