import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconList, IconX } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Checkbox } from '@/components/ui/checkbox';
import { createColumnDefinitions } from './team-vacation-table';

interface TeamVacationColumnDrawerContentProps {
  visibleColumns: Set<string>;
  onVisibilityChange: (columns: Set<string>) => void;
  onClose?: () => void;
}

export function TeamVacationColumnDrawerContent({
  visibleColumns,
  onVisibilityChange,
  onClose,
}: TeamVacationColumnDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [localVisibleColumns, setLocalVisibleColumns] = useState<Set<string>>(() => new Set(visibleColumns));

  const allColumns = createColumnDefinitions();

  const handleToggleColumn = useCallback((columnKey: string) => {
    setLocalVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        // Don't allow removing the last column
        if (newSet.size > 1) {
          newSet.delete(columnKey);
        }
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  }, []);

  const handleApply = useCallback(() => {
    onVisibilityChange(localVisibleColumns);
    onClose?.();
  }, [localVisibleColumns, onVisibilityChange, onClose]);

  const handleReset = useCallback(() => {
    const defaultColumns = new Set(["userName", "dates", "days", "status"]);
    setLocalVisibleColumns(defaultColumns);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: 18
      }]}>
        <View style={styles.headerContent}>
          <IconList size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Colunas Visíveis</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <ThemedText style={[styles.countText, { color: colors.primaryForeground }]}>
              {localVisibleColumns.size}
            </ThemedText>
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
            Selecione as colunas que deseja visualizar na tabela
          </ThemedText>

          <View style={styles.columnList}>
            {allColumns.map((column) => (
              <TouchableOpacity
                key={column.key}
                style={[styles.columnItem, { borderBottomColor: colors.border }]}
                onPress={() => handleToggleColumn(column.key)}
                activeOpacity={0.7}
              >
                <View style={styles.columnInfo}>
                  <Checkbox
                    checked={localVisibleColumns.has(column.key)}
                    onCheckedChange={() => handleToggleColumn(column.key)}
                  />
                  <ThemedText style={styles.columnLabel}>{column.header}</ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleReset}
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
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  columnList: {
    gap: 0,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  columnInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  columnLabel: {
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
});
