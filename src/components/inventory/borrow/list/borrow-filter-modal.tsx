import React, { useState, useCallback, useMemo } from "react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { spacing } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../../constants';
import { useItems, useUsers } from '../../../../hooks';
import type { BorrowGetManyFormData } from '../../../../schemas';

interface BorrowFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<BorrowGetManyFormData>) => void;
  currentFilters: Partial<BorrowGetManyFormData>;
}

export const BorrowFilterModal = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}: BorrowFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<Partial<BorrowGetManyFormData>>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

  // Fetch data for selectors
  const { data: itemsData } = useItems({ limit: 100, where: { category: { type: "TOOL" } } });
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

  // Handle status filter
  const handleStatusChange = useCallback((status: string, checked: boolean) => {
    setFilters(prev => {
      const statusIds = prev.statusIds || [];
      if (checked) {
        return { ...prev, statusIds: [...statusIds, status as any] };
      } else {
        return { ...prev, statusIds: statusIds.filter(s => s !== status) };
      }
    });
  }, []);

  // Clear all filters
  const handleClear = useCallback(() => {
    setFilters({ statusIds: [BORROW_STATUS.ACTIVE] });
  }, []);

  // Apply filters
  const handleApply = useCallback(() => {
    onApply(filters);
  }, [filters, onApply]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statusIds && filters.statusIds.length !== 1) count++;
    if (filters.itemIds?.length) count++;
    if (filters.userIds?.length) count++;
    if (filters.createdAt?.gte || filters.createdAt?.lte) count++;
    if (filters.returnedAt?.gte || filters.returnedAt?.lte) count++;
    return count;
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
          {/* Status Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("status")}
            >
              <ThemedText style={styles.sectionTitle}>Status</ThemedText>
              {expandedSections.has("status") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("status") && (
              <View style={styles.sectionContent}>
                {Object.entries(BORROW_STATUS_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.checkboxRow}
                    onPress={() => handleStatusChange(key, !filters.statusIds?.includes(key as any))}
                  >
                    <Checkbox
                      checked={filters.statusIds?.includes(key as any) || false}
                      onCheckedChange={(checked) => handleStatusChange(key, checked as boolean)}
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

          {/* Borrow Date Range */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("borrowDate")}
            >
              <ThemedText style={styles.sectionTitle}>Data de Empréstimo</ThemedText>
              {expandedSections.has("borrowDate") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("borrowDate") && (
              <View style={styles.sectionContent}>
                <View style={styles.dateInputs}>
                  <View style={styles.dateInput}>
                    <ThemedText style={styles.label}>Data inicial</ThemedText>
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
                    <ThemedText style={styles.label}>Data final</ThemedText>
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

          {/* Return Date Range */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("returnDate")}
            >
              <ThemedText style={styles.sectionTitle}>Data de Devolução</ThemedText>
              {expandedSections.has("returnDate") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("returnDate") && (
              <View style={styles.sectionContent}>
                <View style={styles.dateInputs}>
                  <View style={styles.dateInput}>
                    <ThemedText style={styles.label}>Data inicial</ThemedText>
                    <DatePicker
                      value={filters.returnedAt?.gte}
                      onChange={(date) => {
                        setFilters(prev => ({
                          ...prev,
                          returnedAt: {
                            ...prev.returnedAt,
                            gte: date,
                          },
                        }));
                      }}
                      type="date"
                    />
                  </View>
                  <View style={styles.dateInput}>
                    <ThemedText style={styles.label}>Data final</ThemedText>
                    <DatePicker
                      value={filters.returnedAt?.lte}
                      onChange={(date) => {
                        setFilters(prev => ({
                          ...prev,
                          returnedAt: {
                            ...prev.returnedAt,
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
  dateInputs: {
    gap: spacing.md,
  },
  dateInput: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
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