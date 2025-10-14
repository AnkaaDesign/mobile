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
import { WARNING_CATEGORY, WARNING_SEVERITY, WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../constants';

export interface PersonalWarningFilters {
  categories?: string[];
  severities?: string[];
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface PersonalWarningFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: PersonalWarningFilters) => void;
  currentFilters: PersonalWarningFilters;
}

export const PersonalWarningFilterModal = ({ visible, onClose, onApply, currentFilters }: PersonalWarningFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<PersonalWarningFilters>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["severity", "category"]));

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

  // Handle severity filter
  const handleSeverityChange = useCallback((severity: string, checked: boolean) => {
    setFilters((prev) => {
      const severities = prev.severities || [];
      if (checked) {
        return { ...prev, severities: [...severities, severity] };
      } else {
        return { ...prev, severities: severities.filter((s) => s !== severity) };
      }
    });
  }, []);

  // Handle category filter
  const handleCategoryChange = useCallback((category: string, checked: boolean) => {
    setFilters((prev) => {
      const categories = prev.categories || [];
      if (checked) {
        return { ...prev, categories: [...categories, category] };
      } else {
        return { ...prev, categories: categories.filter((c) => c !== category) };
      }
    });
  }, []);

  // Handle status filter
  const handleStatusChange = useCallback((isActive: boolean | undefined) => {
    setFilters((prev) => ({ ...prev, isActive }));
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
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.severities && filters.severities.length > 0) count++;
    if (filters.isActive !== undefined) count++;
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
            <ThemedText style={styles.modalTitle}>Filtrar Minhas Advertências</ThemedText>
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
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={filters.isActive === true} onCheckedChange={(checked) => handleStatusChange(checked ? true : undefined)} />
                    <ThemedText style={styles.checkboxLabel}>Apenas Ativas</ThemedText>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={filters.isActive === false} onCheckedChange={(checked) => handleStatusChange(checked ? false : undefined)} />
                    <ThemedText style={styles.checkboxLabel}>Apenas Resolvidas</ThemedText>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Checkbox checked={filters.isActive === undefined} onCheckedChange={(checked) => handleStatusChange(checked ? undefined : undefined)} />
                    <ThemedText style={styles.checkboxLabel}>Todas</ThemedText>
                  </View>
                </View>
              )}
            </View>

            {/* Severity Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("severity")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Gravidade</ThemedText>
                {expandedSections.has("severity") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("severity") && (
                <View style={styles.sectionContent}>
                  {Object.values(WARNING_SEVERITY).map((severity) => (
                    <View key={severity} style={styles.checkboxRow}>
                      <Checkbox checked={filters.severities?.includes(severity) ?? false} onCheckedChange={(checked) => handleSeverityChange(severity, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS]}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Category Section */}
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("category")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Categoria</ThemedText>
                {expandedSections.has("category") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("category") && (
                <View style={styles.sectionContent}>
                  {Object.values(WARNING_CATEGORY).map((category) => (
                    <View key={category} style={styles.checkboxRow}>
                      <Checkbox checked={filters.categories?.includes(category) ?? false} onCheckedChange={(checked) => handleCategoryChange(category, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS]}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

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
