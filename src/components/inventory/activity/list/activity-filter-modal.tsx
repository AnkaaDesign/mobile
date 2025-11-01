import { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Button } from "@/components/ui/button";
import { IconX, IconFilter, IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { spacing } from "@/constants/design-system";
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON, ACTIVITY_REASON_LABELS } from '../../../../constants';
import { useItems, useUsers } from '../../../../hooks';
import type { ActivityGetManyFormData } from '../../../../schemas';

interface ActivityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ActivityGetManyFormData>) => void;
  currentFilters: Partial<ActivityGetManyFormData>;
}

export const ActivityFilterModal = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}: ActivityFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<Partial<ActivityGetManyFormData>>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fetch data for selectors
  const { data: itemsData } = useItems({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const items = useMemo(() =>
    itemsData?.data?.map(item => ({
      value: item.id,
      label: `${item.name} (${item.uniCode})`
    })) || [],
    [itemsData]
  );

  const users = useMemo(() =>
    usersData?.data?.map(user => ({
      value: user.id,
      label: user.name
    })) || [],
    [usersData]
  );

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Handle operation filter
  const handleOperationChange = useCallback((operation: string, checked: boolean) => {
    setFilters(prev => {
      const operations = prev.operations || [];
      if (checked) {
        return { ...prev, operations: [...operations, operation as any] };
      } else {
        return { ...prev, operations: operations.filter((op: ACTIVITY_OPERATION) => op !== operation) };
      }
    });
  }, []);

  // Handle reason filter
  const handleReasonChange = useCallback((reason: string, checked: boolean) => {
    setFilters(prev => {
      const reasons = prev.reasons || [];
      if (checked) {
        return { ...prev, reasons: [...reasons, reason as any] };
      } else {
        return { ...prev, reasons: reasons.filter((r: ACTIVITY_REASON) => r !== reason) };
      }
    });
  }, []);

  // Clear all filters
  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  // Apply filters
  const handleApply = useCallback(() => {
    onApply(filters);
  }, [filters, onApply]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).length;
  }, [filters]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.border }])}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.headerTitle}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <View style={StyleSheet.flatten([styles.badge, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                  {activeFilterCount}
                </ThemedText>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Operation Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("operation")}
            >
              <ThemedText style={styles.sectionTitle}>Tipo de Operação</ThemedText>
              {expandedSections.has("operation") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("operation") && (
              <View style={styles.sectionContent}>
                {Object.entries(ACTIVITY_OPERATION_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.checkboxRow}
                    onPress={() => handleOperationChange(key, !filters.operations?.includes(key as any))}
                  >
                    <Checkbox
                      checked={filters.operations?.includes(key as any) || false}
                      onCheckedChange={(checked) => handleOperationChange(key, checked as boolean)}
                    />
                    <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Reason Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("reason")}
            >
              <ThemedText style={styles.sectionTitle}>Motivo</ThemedText>
              {expandedSections.has("reason") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("reason") && (
              <View style={styles.sectionContent}>
                {Object.entries(ACTIVITY_REASON_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.checkboxRow}
                    onPress={() => handleReasonChange(key, !filters.reasons?.includes(key as any))}
                  >
                    <Checkbox
                      checked={filters.reasons?.includes(key as any) || false}
                      onCheckedChange={(checked) => handleReasonChange(key, checked as boolean)}
                    />
                    <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Item Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("items")}
            >
              <ThemedText style={styles.sectionTitle}>Itens</ThemedText>
              {expandedSections.has("items") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("items") && (
              <View style={styles.sectionContent}>
                <Combobox
                  options={items}
                  value={filters.itemIds?.[0]}
                  onValueChange={(value) => {
                    setFilters(prev => ({
                      ...prev,
                      itemIds: value ? [value] : undefined
                    }));
                  }}
                  placeholder="Selecione um item"
                  searchable
                  clearable
                />
              </View>
            )}
          </View>

          {/* User Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("users")}
            >
              <ThemedText style={styles.sectionTitle}>Usuários</ThemedText>
              {expandedSections.has("users") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("users") && (
              <View style={styles.sectionContent}>
                <Combobox
                  options={users}
                  value={filters.userIds?.[0]}
                  onValueChange={(value) => {
                    setFilters(prev => ({
                      ...prev,
                      userIds: value ? [value] : undefined
                    }));
                  }}
                  placeholder="Selecione um usuário"
                  searchable
                  clearable
                />
              </View>
            )}
          </View>

          {/* Quantity Range */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("quantity")}
            >
              <ThemedText style={styles.sectionTitle}>Quantidade</ThemedText>
              {expandedSections.has("quantity") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("quantity") && (
              <View style={styles.sectionContent}>
                <View style={styles.rangeInputs}>
                  <View style={styles.rangeInput}>
                    <Label>Mínimo</Label>
                    <Input
                      value={filters.quantityRange?.min?.toString() || ""}
                      onChangeText={(text) => {
                        const value = parseFloat(text);
                        setFilters(prev => ({
                          ...prev,
                          quantityRange: {
                            ...prev.quantityRange,
                            min: isNaN(value) ? undefined : value,
                          },
                        }));
                      }}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.rangeInput}>
                    <Label>Máximo</Label>
                    <Input
                      value={filters.quantityRange?.max?.toString() || ""}
                      onChangeText={(text) => {
                        const value = parseFloat(text);
                        setFilters(prev => ({
                          ...prev,
                          quantityRange: {
                            ...prev.quantityRange,
                            max: isNaN(value) ? undefined : value,
                          },
                        }));
                      }}
                      placeholder="999999"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Date Range */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("date")}
            >
              <ThemedText style={styles.sectionTitle}>Período</ThemedText>
              {expandedSections.has("date") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("date") && (
              <View style={styles.sectionContent}>
                <View style={styles.dateInputs}>
                  <View style={styles.dateInput}>
                    <Label>Data inicial</Label>
                    <DatePicker
                      value={filters.createdAt?.gte}
                      onChange={(date) => {
                        setFilters(prev => ({
                          ...prev,
                          createdAt: {
                            ...prev.createdAt,
                            gte: date,
                          },
                        }));
                      }}
                      type="date"
                    />
                  </View>
                  <View style={styles.dateInput}>
                    <Label>Data final</Label>
                    <DatePicker
                      value={filters.createdAt?.lte}
                      onChange={(date) => {
                        setFilters(prev => ({
                          ...prev,
                          createdAt: {
                            ...prev.createdAt,
                            lte: date,
                          },
                        }));
                      }}
                      type="date"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={StyleSheet.flatten([styles.footer, { borderTopColor: colors.border }])}>
          <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
            <ThemedText>Limpar</ThemedText>
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            <IconCheck size={18} color={colors.primaryForeground} />
            <ThemedText style={{ color: colors.primaryForeground }}>
              Aplicar Filtros
            </ThemedText>
          </Button>
        </View>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  rangeInputs: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rangeInput: {
    flex: 1,
    gap: spacing.xs,
  },
  dateInputs: {
    gap: spacing.md,
  },
  dateInput: {
    gap: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});