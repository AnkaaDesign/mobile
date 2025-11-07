import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from "react-native";
import { IconList, IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { TableColumn } from "./notification-table";

interface NotificationColumnDrawerContentProps {
  columns: TableColumn[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
  onClose?: () => void;
}

export function NotificationColumnDrawerContent({
  columns,
  visibleColumns,
  onVisibilityChange,
  onClose,
}: NotificationColumnDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [localVisibleColumns, setLocalVisibleColumns] = useState<Set<string>>(visibleColumns);

  const handleToggleColumn = useCallback(
    (columnKey: string) => {
      setLocalVisibleColumns((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(columnKey)) {
          // Don't allow removing all columns
          if (newSet.size > 1) {
            newSet.delete(columnKey);
          }
        } else {
          newSet.add(columnKey);
        }
        return newSet;
      });
    },
    [],
  );

  const handleApply = useCallback(() => {
    onVisibilityChange(localVisibleColumns);
    onClose?.();
  }, [localVisibleColumns, onVisibilityChange, onClose]);

  const handleReset = useCallback(() => {
    // Reset to default columns
    const defaultColumns = new Set(["title", "type", "createdAt"]);
    setLocalVisibleColumns(defaultColumns);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: 18,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <IconList size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Colunas Visíveis</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <ThemedText style={[styles.countText, { color: colors.primaryForeground }]}>{localVisibleColumns.size}</ThemedText>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.section}>
          <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Selecione quais colunas deseja visualizar na tabela. Pelo menos uma coluna deve estar visível.
          </ThemedText>

          {columns.map((column) => {
            const isVisible = localVisibleColumns.has(column.key);
            const isOnlyVisible = isVisible && localVisibleColumns.size === 1;

            return (
              <TouchableOpacity
                key={column.key}
                style={[styles.columnItem, { borderBottomColor: colors.border }]}
                onPress={() => !isOnlyVisible && handleToggleColumn(column.key)}
                activeOpacity={isOnlyVisible ? 1 : 0.7}
                disabled={isOnlyVisible}
              >
                <View style={[styles.columnTouchable, isOnlyVisible && { opacity: 0.5 }]}>
                  <ThemedText style={styles.columnLabel}>{column.header}</ThemedText>
                  {isOnlyVisible && (
                    <ThemedText style={[styles.columnNote, { color: colors.mutedForeground }]}>(obrigatório)</ThemedText>
                  )}
                </View>
                <RNSwitch
                  value={isVisible}
                  onValueChange={() => !isOnlyVisible && handleToggleColumn(column.key)}
                  disabled={isOnlyVisible}
                  trackColor={{
                    false: colors.muted,
                    true: colors.primary,
                  }}
                  thumbColor={colors.background}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableOpacity style={[styles.footerButton, styles.resetButton, { borderColor: colors.border }]} onPress={handleReset} activeOpacity={0.7}>
          <ThemedText style={[styles.buttonText, { color: colors.foreground }]}>Restaurar Padrão</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerButton, styles.applyButton, { backgroundColor: colors.primary }]} onPress={handleApply} activeOpacity={0.8}>
          <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  columnTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  columnLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  columnNote: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    borderWidth: 1,
  },
  applyButton: {},
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
