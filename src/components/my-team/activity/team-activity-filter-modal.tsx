import React, { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Button } from "@/components/ui/button";
import { IconX, IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { spacing } from "@/constants/design-system";
import { ACTIVITY_OPERATION, ACTIVITY_REASON, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '../../../constants';
import type { User } from '../../../types';

export interface TeamActivityFilters {
  userIds?: string[];
  operations?: string[];
  reasons?: string[];
  startDate?: Date;
  endDate?: Date;
}

interface TeamActivityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TeamActivityFilters) => void;
  currentFilters: TeamActivityFilters;
  teamMembers: User[];
}

export const TeamActivityFilterModal = ({ visible, onClose, onApply, currentFilters, teamMembers }: TeamActivityFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<TeamActivityFilters>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["operation"]));

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

  // Handle operation filter
  const handleOperationChange = useCallback((operation: string, checked: boolean) => {
    setFilters((prev) => {
      const operations = prev.operations || [];
      if (checked) {
        return { ...prev, operations: [...operations, operation] };
      } else {
        return { ...prev, operations: operations.filter((o) => o !== operation) };
      }
    });
  }, []);

  // Handle reason filter
  const handleReasonChange = useCallback((reason: string, checked: boolean) => {
    setFilters((prev) => {
      const reasons = prev.reasons || [];
      if (checked) {
        return { ...prev, reasons: [...reasons, reason] };
      } else {
        return { ...prev, reasons: reasons.filter((r) => r !== reason) };
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
    if (filters.operations && filters.operations.length > 0) count++;
    if (filters.reasons && filters.reasons.length > 0) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Filtrar Atividades</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconX size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Filter Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Operation Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("operation")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Operação</ThemedText>
                {expandedSections.has("operation") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("operation") && (
                <View style={styles.sectionContent}>
                  {Object.values(ACTIVITY_OPERATION).map((operation) => (
                    <View key={operation} style={styles.checkboxRow}>
                      <Checkbox checked={filters.operations?.includes(operation) ?? false} onCheckedChange={(checked) => handleOperationChange(operation, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{ACTIVITY_OPERATION_LABELS[operation as keyof typeof ACTIVITY_OPERATION_LABELS]}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Reason Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("reason")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Motivo</ThemedText>
                {expandedSections.has("reason") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("reason") && (
                <View style={styles.sectionContent}>
                  {Object.values(ACTIVITY_REASON).map((reason) => (
                    <View key={reason} style={styles.checkboxRow}>
                      <Checkbox checked={filters.reasons?.includes(reason) ?? false} onCheckedChange={(checked) => handleReasonChange(reason, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{ACTIVITY_REASON_LABELS[reason as keyof typeof ACTIVITY_REASON_LABELS]}</ThemedText>
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

            {/* Date Range Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("dateRange")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Período</ThemedText>
                {expandedSections.has("dateRange") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("dateRange") && (
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
