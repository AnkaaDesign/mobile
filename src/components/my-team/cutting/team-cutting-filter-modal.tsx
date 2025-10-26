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
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from '../../../constants';

export interface TeamCuttingFilters {
  statuses?: string[];
  types?: string[];
  origins?: string[];
  startDate?: Date;
  endDate?: Date;
}

interface TeamCuttingFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TeamCuttingFilters) => void;
  currentFilters: TeamCuttingFilters;
}

const STATUS_LABELS: Record<string, string> = {
  [CUT_STATUS.PENDING]: "Pendente",
  [CUT_STATUS.CUTTING]: "Cortando",
  [CUT_STATUS.COMPLETED]: "Concluído",
};

const TYPE_LABELS: Record<string, string> = {
  [CUT_TYPE.VINYL]: "Adesivo",
  [CUT_TYPE.STENCIL]: "Espovo",
};

const ORIGIN_LABELS: Record<string, string> = {
  [CUT_ORIGIN.PLAN]: "Plano",
  [CUT_ORIGIN.REQUEST]: "Solicitação",
};

export const TeamCuttingFilterModal = ({ visible, onClose, onApply, currentFilters }: TeamCuttingFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<TeamCuttingFilters>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

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

  const handleTypeChange = useCallback((type: string, checked: boolean) => {
    setFilters((prev) => {
      const types = prev.types || [];
      if (checked) {
        return { ...prev, types: [...types, type] };
      } else {
        return { ...prev, types: types.filter((t) => t !== type) };
      }
    });
  }, []);

  const handleOriginChange = useCallback((origin: string, checked: boolean) => {
    setFilters((prev) => {
      const origins = prev.origins || [];
      if (checked) {
        return { ...prev, origins: [...origins, origin] };
      } else {
        return { ...prev, origins: origins.filter((o) => o !== origin) };
      }
    });
  }, []);

  const handleStartDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, startDate: date }));
  }, []);

  const handleEndDateChange = useCallback((date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, endDate: date }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(filters);
    onClose();
  }, [filters, onApply, onClose]);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statuses && filters.statuses.length > 0) count++;
    if (filters.types && filters.types.length > 0) count++;
    if (filters.origins && filters.origins.length > 0) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Filtrar Recortes</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconX size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("status")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Status</ThemedText>
                {expandedSections.has("status") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("status") && (
                <View style={styles.sectionContent}>
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <View key={status} style={styles.checkboxRow}>
                      <Checkbox checked={filters.statuses?.includes(status) ?? false} onCheckedChange={(checked) => handleStatusChange(status, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("type")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Tipo</ThemedText>
                {expandedSections.has("type") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("type") && (
                <View style={styles.sectionContent}>
                  {Object.entries(TYPE_LABELS).map(([type, label]) => (
                    <View key={type} style={styles.checkboxRow}>
                      <Checkbox checked={filters.types?.includes(type) ?? false} onCheckedChange={(checked) => handleTypeChange(type, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggleSection("origin")} style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Origem</ThemedText>
                {expandedSections.has("origin") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
              </TouchableOpacity>
              {expandedSections.has("origin") && (
                <View style={styles.sectionContent}>
                  {Object.entries(ORIGIN_LABELS).map(([origin, label]) => (
                    <View key={origin} style={styles.checkboxRow}>
                      <Checkbox checked={filters.origins?.includes(origin) ?? false} onCheckedChange={(checked) => handleOriginChange(origin, checked)} />
                      <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

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
