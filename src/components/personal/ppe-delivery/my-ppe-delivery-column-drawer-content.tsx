import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { TableColumn } from "./my-ppe-delivery-table";

interface MyPpeDeliveryColumnDrawerContentProps {
  columns: TableColumn[];
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
}

export function MyPpeDeliveryColumnDrawerContent({ columns, visibleColumns, onVisibilityChange }: MyPpeDeliveryColumnDrawerContentProps) {
  const { colors } = useTheme();
  const [localVisibleColumns, setLocalVisibleColumns] = useState(visibleColumns);

  const handleToggleColumn = (columnKey: string) => {
    const newVisible = new Set(localVisibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setLocalVisibleColumns(newVisible);
  };

  const handleSelectAll = () => {
    const allKeys = new Set(columns.map((col) => col.key));
    setLocalVisibleColumns(allKeys);
  };

  const handleDeselectAll = () => {
    setLocalVisibleColumns(new Set());
  };

  const handleApply = () => {
    onVisibilityChange(localVisibleColumns);
  };

  const handleReset = () => {
    const defaultColumns = new Set(["itemName", "quantity", "deliveryDate", "status"]);
    setLocalVisibleColumns(defaultColumns);
    onVisibilityChange(defaultColumns);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Colunas Visíveis</ThemedText>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>{localVisibleColumns.size}</ThemedText>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.buttonRow}>
            <Button variant="outline" size="sm" onPress={handleSelectAll} style={styles.selectButton}>
              Selecionar Todos
            </Button>
            <Button variant="outline" size="sm" onPress={handleDeselectAll} style={styles.selectButton}>
              Desmarcar Todos
            </Button>
          </View>
        </View>

        <View style={styles.section}>
          {columns.map((column) => (
            <View key={column.key} style={styles.checkboxRow}>
              <Checkbox checked={localVisibleColumns.has(column.key)} onCheckedChange={() => handleToggleColumn(column.key)} label={column.header} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button variant="outline" onPress={handleReset} style={styles.button}>
          Resetar
        </Button>
        <Button onPress={handleApply} style={styles.button}>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingVertical: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  selectButton: {
    flex: 1,
  },
  checkboxRow: {
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
});
