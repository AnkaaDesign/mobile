import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions, StyleSheet } from "react-native";
import { IconColumns, IconSearch, IconX, IconRefresh } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { Borrow } from '../../../../types';
import { getDefaultVisibleColumns } from "./borrow-column-visibility-manager";

// Column interface matching table pattern
interface BorrowColumn {
  key: string;
  header: string;
  accessor: (borrow: Borrow) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

interface BorrowColumnVisibilityDrawerProps {
  columns: BorrowColumn[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BorrowColumnVisibilityDrawer({ columns, visibleColumns, onVisibilityChange, open, onOpenChange }: BorrowColumnVisibilityDrawerProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [localVisible, setLocalVisible] = useState(visibleColumns);

  const filteredColumns = useMemo(() => {
    if (!searchQuery) return columns;
    return columns.filter((col) => col.header.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [columns, searchQuery]);

  const handleToggle = useCallback((columnKey: string, checked: boolean) => {
    const newVisible = new Set(localVisible);
    if (checked) {
      newVisible.add(columnKey);
    } else {
      newVisible.delete(columnKey);
    }
    setLocalVisible(newVisible);
  }, [localVisible]);

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
    setLocalVisible(visibleColumns); // Reset to original state
    onOpenChange(false);
  }, [visibleColumns, onOpenChange]);

  const visibleCount = localVisible.size;
  const totalCount = columns.length;

  return (
    <Modal visible={open} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={StyleSheet.flatten([styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }])}>
        <View
          style={StyleSheet.flatten([
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ])}
        >
          {/* Header */}
          <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.border }])}>
            <View style={styles.headerLeft}>
              <IconColumns size={24} color={colors.foreground} />
              <ThemedText style={styles.headerTitle}>Gerenciar Colunas</ThemedText>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconX size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Column count indicator */}
          <View style={StyleSheet.flatten([styles.countIndicator, { backgroundColor: colors.muted }])}>
            <ThemedText style={styles.countText}>
              {visibleCount} / {totalCount} colunas selecionadas
            </ThemedText>
          </View>

          {/* Search and quick actions */}
          <View style={styles.searchSection}>
            <View style={StyleSheet.flatten([styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }])}>
              <IconSearch size={20} color={colors.mutedForeground} />
              <TextInput
                style={StyleSheet.flatten([styles.searchInput, { color: colors.foreground }])}
                placeholder="Buscar coluna..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <IconX size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.quickActions}>
              <Button variant="outline" size="sm" onPress={handleSelectAll} style={styles.quickActionButton}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onPress={handleDeselectAll} style={styles.quickActionButton}>
                Desmarcar Todas
              </Button>
            </View>
          </View>

          {/* Column list */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: spacing.lg,
              flexGrow: 1,
            }}
          >
            {filteredColumns.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>Nenhuma coluna encontrada</ThemedText>
              </View>
            ) : (
              <View style={styles.columnList}>
                {filteredColumns.map((column) => (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([
                      styles.columnItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ])}
                    onPress={() => handleToggle(column.key, !localVisible.has(column.key))}
                    activeOpacity={0.7}
                  >
                    <View style={styles.columnInfo}>
                      <ThemedText style={styles.columnTitle}>{column.header}</ThemedText>
                    </View>
                    <Switch checked={localVisible.has(column.key)} onCheckedChange={(checked) => handleToggle(column.key, !!checked)} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={StyleSheet.flatten([
              styles.footer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.background,
              },
            ])}
          >
            <Button variant="outline" size="default" onPress={handleReset} style={styles.footerButton}>
              <IconRefresh size={18} color={colors.foreground} />
              <ThemedText style={styles.footerButtonText}>Restaurar</ThemedText>
            </Button>
            <Button variant="outline" size="default" onPress={handleClose} style={styles.footerButton}>
              Cancelar
            </Button>
            <Button variant="default" size="default" onPress={handleApply} style={styles.footerButton}>
              Aplicar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: screenHeight * 0.85,
    minHeight: screenHeight * 0.6,
    flexShrink: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
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
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
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
  },
  quickActionButton: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: spacing.md,
  },
  columnList: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  columnInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  columnTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
