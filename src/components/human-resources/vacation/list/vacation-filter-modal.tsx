import React, { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Button } from "@/components/ui/button";
import { IconX, IconFilter, IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { spacing } from "@/constants/design-system";
import { VACATION_STATUS, VACATION_STATUS_LABELS, VACATION_TYPE, VACATION_TYPE_LABELS } from '../../../../constants';
import { useUsers } from '../../../../hooks';
import type { VacationGetManyFormData } from '../../../../schemas';

interface VacationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<VacationGetManyFormData>) => void;
  currentFilters: Partial<VacationGetManyFormData>;
}

export const VacationFilterModal = ({ visible, onClose, onApply, currentFilters }: VacationFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<Partial<VacationGetManyFormData>>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

  // Fetch users for selector
  const { data: usersData } = useUsers({ limit: 100 });

  const users = useMemo(
    () =>
      usersData?.data?.map((user) => ({
        value: user.id,
        label: user.name,
      })) || [],
    [usersData],
  );

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
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
    setFilters((prev) => {
      const currentStatuses = (prev.where?.status as any)?.in || [];
      if (checked) {
        return {
          ...prev,
          where: {
            ...prev.where,
            status: { in: [...currentStatuses, status] },
          },
        };
      } else {
        const newStatuses = currentStatuses.filter((s: string) => s !== status);
        return {
          ...prev,
          where: {
            ...prev.where,
            status: newStatuses.length > 0 ? { in: newStatuses } : undefined,
          },
        };
      }
    });
  }, []);

  // Handle type filter
  const handleTypeChange = useCallback((type: string, checked: boolean) => {
    setFilters((prev) => {
      const currentTypes = (prev.where?.type as any)?.in || [];
      if (checked) {
        return {
          ...prev,
          where: {
            ...prev.where,
            type: { in: [...currentTypes, type] },
          },
        };
      } else {
        const newTypes = currentTypes.filter((t: string) => t !== type);
        return {
          ...prev,
          where: {
            ...prev.where,
            type: newTypes.length > 0 ? { in: newTypes } : undefined,
          },
        };
      }
    });
  }, []);

  // Handle date range filters
  const handleStartDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({
      ...prev,
      where: {
        ...prev.where,
        startAt: date ? { gte: date } : undefined,
      },
    }));
  }, []);

  const handleEndDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({
      ...prev,
      where: {
        ...prev.where,
        endAt: date ? { lte: date } : undefined,
      },
    }));
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
    let count = 0;
    if ((filters.where?.status as any)?.in?.length > 0) count++;
    if ((filters.where?.type as any)?.in?.length > 0) count++;
    if (filters.where?.userId) count++;
    if (filters.where?.startAt) count++;
    if (filters.where?.endAt) count++;
    return count;
  }, [filters]);

  const currentStatuses = (filters.where?.status as any)?.in || [];
  const currentTypes = (filters.where?.type as any)?.in || [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.border }])}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.headerTitle}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <View style={StyleSheet.flatten([styles.badge, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{activeFilterCount}</ThemedText>
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
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("status")}>
              <ThemedText style={styles.sectionTitle}>Status</ThemedText>
              {expandedSections.has("status") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("status") && (
              <View style={styles.sectionContent}>
                {Object.entries(VACATION_STATUS_LABELS).map(([key, label]) => (
                  <TouchableOpacity key={key} style={styles.checkboxRow} onPress={() => handleStatusChange(key, !currentStatuses.includes(key))}>
                    <Checkbox checked={currentStatuses.includes(key)} onCheckedChange={(checked) => handleStatusChange(key, checked as boolean)} />
                    <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Type Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("type")}>
              <ThemedText style={styles.sectionTitle}>Tipo de Férias</ThemedText>
              {expandedSections.has("type") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("type") && (
              <View style={styles.sectionContent}>
                {Object.entries(VACATION_TYPE_LABELS).map(([key, label]) => (
                  <TouchableOpacity key={key} style={styles.checkboxRow} onPress={() => handleTypeChange(key, !currentTypes.includes(key))}>
                    <Checkbox checked={currentTypes.includes(key)} onCheckedChange={(checked) => handleTypeChange(key, checked as boolean)} />
                    <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* User Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("user")}>
              <ThemedText style={styles.sectionTitle}>Colaborador</ThemedText>
              {expandedSections.has("user") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("user") && (
              <View style={styles.sectionContent}>
                <Combobox
                  options={users}
                  value={filters.where?.userId as string}
                  onValueChange={(value) => {
                    setFilters((prev) => ({
                      ...prev,
                      where: {
                        ...prev.where,
                        userId: value || undefined,
                      },
                    }));
                  }}
                  placeholder="Selecione um colaborador"
                  searchable
                  clearable
                />
              </View>
            )}
          </View>

          {/* Date Range Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("dates")}>
              <ThemedText style={styles.sectionTitle}>Período</ThemedText>
              {expandedSections.has("dates") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("dates") && (
              <View style={styles.sectionContent}>
                <View style={styles.datePickerContainer}>
                  <ThemedText style={styles.dateLabel}>Data inicial (a partir de)</ThemedText>
                  <DatePicker value={(filters.where?.startAt as any)?.gte} onChange={handleStartDateChange} placeholder="Selecione a data inicial" />
                </View>

                <View style={styles.datePickerContainer}>
                  <ThemedText style={styles.dateLabel}>Data final (até)</ThemedText>
                  <DatePicker value={(filters.where?.endAt as any)?.lte} onChange={handleEndDateChange} placeholder="Selecione a data final" />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={StyleSheet.flatten([styles.footer, { borderTopColor: colors.border }])}>
          <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
            <ThemedText>Limpar</ThemedText>
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            <ThemedText style={{ color: colors.primaryForeground }}>Aplicar Filtros</ThemedText>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
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
    flex: 1,
  },
  datePickerContainer: {
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
