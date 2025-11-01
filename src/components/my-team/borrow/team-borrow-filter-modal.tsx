import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Button } from "@/components/ui/button";
import { IconX, IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { spacing } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../constants';
import type { User } from '../../../types';

export interface TeamBorrowFilters {
  userIds?: string[];
  statuses?: string[];
  startDate?: Date;
  endDate?: Date;
  returnStartDate?: Date;
  returnEndDate?: Date;
}

interface TeamBorrowFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TeamBorrowFilters) => void;
  currentFilters: TeamBorrowFilters;
  teamMembers: User[];
}

export const TeamBorrowFilterModal = ({ visible, onClose, onApply, currentFilters, teamMembers }: TeamBorrowFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<TeamBorrowFilters>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

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
      const statuses = prev.statuses || [];
      if (checked) {
        return { ...prev, statuses: [...statuses, status] };
      } else {
        return { ...prev, statuses: statuses.filter((s) => s !== status) };
      }
    });
  }, []);

  // Handle team member filter
  const handleUserChange = useCallback((userId: string, checked: boolean) => {
    setFilters((prev) => {
      const userIds = prev.userIds || [];
      if (checked) {
        return { ...prev, userIds: [...userIds, userId] };
      } else {
        return { ...prev, userIds: userIds.filter((id) => id !== userId) };
      }
    });
  }, []);

  // Handle date filters
  const handleStartDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, startDate: date }));
  }, []);

  const handleEndDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, endDate: date }));
  }, []);

  const handleReturnStartDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, returnStartDate: date }));
  }, []);

  const handleReturnEndDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, returnEndDate: date }));
  }, []);

  // Apply filters
  const handleApply = useCallback(() => {
    onApply(filters);
    onClose();
  }, [filters, onApply, onClose]);

  // Clear all filters
  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.userIds && filters.userIds.length > 0) count++;
    if (filters.statuses && filters.statuses.length > 0) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.returnStartDate) count++;
    if (filters.returnEndDate) count++;
    return count;
  }, [filters]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Filtrar Empréstimos</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconX size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Filter Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Status Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("status")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Status</ThemedText>
                {expandedSections.has("status") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("status") && (
                <View style={styles.sectionContent}>
                  {Object.values(BORROW_STATUS).map((status) => (
                    <View key={status} style={styles.checkboxRow}>
                      <Checkbox checked={filters.statuses?.includes(status) ?? false} onCheckedChange={(checked) => handleStatusChange(status, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{BORROW_STATUS_LABELS[status as keyof typeof BORROW_STATUS_LABELS]}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Team Members Section */}
            {teamMembers.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity onPress={() => toggleSection("members")} style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Membros da Equipe</ThemedText>
                  {expandedSections.has("members") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
                </TouchableOpacity>
                {expandedSections.has("members") && (
                  <View style={styles.sectionContent}>
                    {teamMembers.map((member) => (
                      <View key={member.id} style={styles.checkboxRow}>
                        <Checkbox checked={filters.userIds?.includes(member.id) ?? false} onCheckedChange={(checked) => handleUserChange(member.id, checked)} />
                        <ThemedText style={styles.checkboxLabel}>{member.name}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Borrow Date Range Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("borrowDateRange")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Período de Empréstimo</ThemedText>
                {expandedSections.has("borrowDateRange") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("borrowDateRange") && (
                <View style={styles.sectionContent}>
                  <View style={styles.datePickerRow}>
                    <ThemedText style={styles.dateLabel}>Data Inicial:</ThemedText>
                    <DatePicker value={filters.startDate} onChange={handleStartDateChange} placeholder="Selecionar data" />
                  </View>
                  <View style={styles.datePickerRow}>
                    <ThemedText style={styles.dateLabel}>Data Final:</ThemedText>
                    <DatePicker value={filters.endDate} onChange={handleEndDateChange} placeholder="Selecionar data" />
                  </View>
                </View>
              )}
            </View>

            {/* Return Date Range Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("returnDateRange")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Período de Devolução</ThemedText>
                {expandedSections.has("returnDateRange") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("returnDateRange") && (
                <View style={styles.sectionContent}>
                  <View style={styles.datePickerRow}>
                    <ThemedText style={styles.dateLabel}>Data Inicial:</ThemedText>
                    <DatePicker value={filters.returnStartDate} onChange={handleReturnStartDateChange} placeholder="Selecionar data" />
                  </View>
                  <View style={styles.datePickerRow}>
                    <ThemedText style={styles.dateLabel}>Data Final:</ThemedText>
                    <DatePicker value={filters.returnEndDate} onChange={handleReturnEndDateChange} placeholder="Selecionar data" />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
              <ThemedText>Limpar ({activeFilterCount})</ThemedText>
            </Button>
            <Button onPress={handleApply} style={styles.footerButton}>
              <ThemedText style={{ color: "#fff" }}>Aplicar</ThemedText>
            </Button>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollView: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingLeft: spacing.sm,
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  datePickerRow: {
    marginBottom: spacing.sm,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    marginTop: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
