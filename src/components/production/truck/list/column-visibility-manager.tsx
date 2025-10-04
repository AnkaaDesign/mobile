import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions, ActivityIndicator , StyleSheet} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconListDetails, IconSearch, IconX, IconEye, IconEyeOff } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

export interface ColumnConfig {
  key: string;
  title: string;
  description: string;
  group: string;
  defaultVisible: boolean;
  required?: boolean;
  width: number; // Width percentage (0-1)
}

// All available columns for trucks
const ALL_COLUMNS: ColumnConfig[] = [
  // Basic
  { key: "plate", title: "Placa", description: "Placa do veículo", group: "Básico", defaultVisible: true, required: true, width: 0.25 },
  { key: "model", title: "Modelo", description: "Modelo do caminhão", group: "Básico", defaultVisible: true, required: false, width: 0.25 },
  { key: "manufacturer", title: "Fabricante", description: "Fabricante do veículo", group: "Básico", defaultVisible: true, required: false, width: 0.25 },

  // Position
  { key: "xPosition", title: "Posição X", description: "Coordenada X no layout", group: "Posicionamento", defaultVisible: false, width: 0.2 },
  { key: "yPosition", title: "Posição Y", description: "Coordenada Y no layout", group: "Posicionamento", defaultVisible: false, width: 0.2 },

  // Relations
  { key: "garage", title: "Garagem", description: "Garagem onde está estacionado", group: "Relações", defaultVisible: false, width: 0.3 },
  { key: "task", title: "Tarefa Atual", description: "Tarefa em andamento", group: "Relações", defaultVisible: false, width: 0.35 },

  // Metadata
  { key: "createdAt", title: "Criado em", description: "Data de criação", group: "Metadados", defaultVisible: false, width: 0.25 },
  { key: "updatedAt", title: "Atualizado em", description: "Data de atualização", group: "Metadados", defaultVisible: false, width: 0.25 },
];

// Group columns by category
const COLUMN_GROUPS = ALL_COLUMNS.reduce(
  (groups, column) => {
    if (!groups[column.group]) {
      groups[column.group] = [];
    }
    groups[column.group].push(column);
    return groups;
  },
  {} as Record<string, ColumnConfig[]>,
);

const STORAGE_KEY = "ankaa-truck-table-columns";
const MAX_VISIBLE_COLUMNS = 3; // Mobile limit

interface ColumnVisibilityManagerProps {
  visible: boolean;
  onClose: () => void;
  onColumnsChange: (columns: string[]) => void;
  currentColumns: string[];
}

export const ColumnVisibilityManager: React.FC<ColumnVisibilityManagerProps> = ({ visible, onClose, onColumnsChange, currentColumns }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(currentColumns));
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Load saved columns on mount
  useEffect(() => {
    loadSavedColumns();
  }, []);

  const loadSavedColumns = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const columns = JSON.parse(saved);
        setSelectedColumns(new Set(columns));
      }
    } catch (error) {
      console.warn("Failed to load saved columns:", error);
    }
  };

  const saveColumns = async (columns: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    } catch (error) {
      console.warn("Failed to save columns:", error);
    }
  };

  // Filter columns based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return COLUMN_GROUPS;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, ColumnConfig[]> = {};

    Object.entries(COLUMN_GROUPS).forEach(([group, columns]) => {
      const matchedColumns = columns.filter(
        (col) => col.title.toLowerCase().includes(query) || col.description.toLowerCase().includes(query) || col.key.toLowerCase().includes(query),
      );

      if (matchedColumns.length > 0) {
        filtered[group] = matchedColumns;
      }
    });

    return filtered;
  }, [searchQuery]);

  const handleColumnToggle = useCallback((columnKey: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      const column = ALL_COLUMNS.find((c) => c.key === columnKey);

      if (column?.required) return prev; // Can't toggle required columns

      if (next.has(columnKey)) {
        next.delete(columnKey);
      } else {
        // Check if we're at the limit
        if (next.size >= MAX_VISIBLE_COLUMNS) {
          // Don't add more columns
          return prev;
        }
        next.add(columnKey);
      }

      return next;
    });
  }, []);

  const handleGroupToggle = useCallback(
    (groupName: string) => {
      const groupColumns = COLUMN_GROUPS[groupName as keyof typeof COLUMN_GROUPS];
      const nonRequiredColumns = groupColumns.filter((c) => !c.required);
      const allSelected = nonRequiredColumns.every((c) => selectedColumns.has(c.key));

      setSelectedColumns((prev) => {
        const next = new Set(prev);

        if (allSelected) {
          // Deselect all non-required columns in group
          nonRequiredColumns.forEach((c) => next.delete(c.key));
        } else {
          // Select columns up to the limit
          const availableSlots = MAX_VISIBLE_COLUMNS - next.size;
          const columnsToAdd = nonRequiredColumns.filter((c) => !next.has(c.key)).slice(0, availableSlots);

          columnsToAdd.forEach((c) => next.add(c.key));
        }

        return next;
      });
    },
    [selectedColumns],
  );

  const handleApply = async () => {
    setLoading(true);
    const columns = Array.from(selectedColumns);
    await saveColumns(columns);
    onColumnsChange(columns);
    setLoading(false);
    onClose();
  };

  const handleReset = () => {
    const defaultColumns = ALL_COLUMNS.filter((c) => c.defaultVisible)
      .slice(0, MAX_VISIBLE_COLUMNS) // Ensure we don't exceed the limit
      .map((c) => c.key);
    setSelectedColumns(new Set(defaultColumns));
  };

  const visibleCount = selectedColumns.size;
  const canAddMore = visibleCount < MAX_VISIBLE_COLUMNS;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
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
              <IconListDetails size={24} color={colors.foreground} />
              <ThemedText style={styles.headerTitle}>Gerenciar Colunas</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconX size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Column count indicator */}
          <View style={StyleSheet.flatten([styles.countIndicator, { backgroundColor: colors.muted }])}>
            <ThemedText style={styles.countText}>
              {visibleCount} / {MAX_VISIBLE_COLUMNS} colunas selecionadas
            </ThemedText>
            {!canAddMore && (
              <Badge variant="secondary" size="sm">
                Limite atingido
              </Badge>
            )}
          </View>

          {/* Search bar */}
          <View style={StyleSheet.flatten([styles.searchContainer, { backgroundColor: colors.card }])}>
            <IconSearch size={20} color={colors.mutedForeground} />
            <TextInput
              style={StyleSheet.flatten([styles.searchInput, { color: colors.foreground }])}
              placeholder="Buscar colunas..."
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

          {/* Column groups */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: spacing.xxl,
              flexGrow: 1,
            }}
          >
            {Object.entries(filteredGroups).length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>Nenhuma coluna encontrada</ThemedText>
              </View>
            ) : (
              Object.entries(filteredGroups).map(([groupName, columns]) => {
                const nonRequiredColumns = columns.filter((c) => !c.required);
                const allSelected = nonRequiredColumns.length > 0 && nonRequiredColumns.every((c) => selectedColumns.has(c.key));

                return (
                  <Card key={groupName} style={styles.groupCard} level={2}>
                    <CardHeader style={styles.groupHeader}>
                      <View style={styles.groupTitleContainer}>
                        <CardTitle style={styles.groupTitle}>{groupName}</CardTitle>
                        {nonRequiredColumns.length > 0 && (
                          <TouchableOpacity
                            onPress={() => handleGroupToggle(groupName)}
                            disabled={!canAddMore && !allSelected}
                            style={StyleSheet.flatten([styles.groupToggle, !canAddMore && !allSelected && styles.disabledToggle])}
                          >
                            {allSelected ? <IconEyeOff size={18} color={colors.primary} /> : <IconEye size={18} color={colors.mutedForeground} />}
                          </TouchableOpacity>
                        )}
                      </View>
                    </CardHeader>
                    <CardContent style={styles.groupContent}>
                      {columns.map((column, index) => {
                        const isSelected = selectedColumns.has(column.key);
                        const isDisabled = column.required || (!isSelected && !canAddMore);

                        return (
                          <React.Fragment key={column.key}>
                            {index > 0 && <Separator style={styles.separator} />}
                            <TouchableOpacity style={StyleSheet.flatten([styles.columnItem, isDisabled && styles.disabledItem])} onPress={() => handleColumnToggle(column.key)} disabled={isDisabled}>
                              <View style={styles.columnInfo}>
                                <View style={styles.columnHeader}>
                                  <ThemedText style={styles.columnTitle}>{column.title}</ThemedText>
                                  {column.required && (
                                    <Badge variant="secondary" size="sm" style={styles.requiredBadge}>
                                      Obrigatório
                                    </Badge>
                                  )}
                                </View>
                                <ThemedText style={styles.columnDescription}>{column.description}</ThemedText>
                              </View>
                              <Checkbox checked={isSelected} onCheckedChange={() => handleColumnToggle(column.key)} disabled={isDisabled} />
                            </TouchableOpacity>
                          </React.Fragment>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={StyleSheet.flatten([
              styles.footer,
              {
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ])}
          >
            <Button variant="outline" size="default" onPress={handleReset} style={styles.footerButton}>
              Restaurar Padrão
            </Button>
            <Button variant="default" size="default" onPress={handleApply} disabled={loading || selectedColumns.size === 0} style={styles.footerButton}>
              {loading ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : "Aplicar"}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.72,
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
    justifyContent: "space-between",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  groupCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  groupHeader: {
    paddingBottom: 0,
  },
  groupTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  groupToggle: {
    padding: spacing.xs,
  },
  disabledToggle: {
    opacity: 0.5,
  },
  groupContent: {
    paddingTop: spacing.sm,
  },
  columnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  disabledItem: {
    opacity: 0.5,
  },
  columnInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  columnTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  requiredBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  columnDescription: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginTop: 2,
  },
  separator: {
    marginVertical: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
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