import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { COMMISSION_STATUS_LABELS, TASK_STATUS_LABELS } from '../../../constants';
import type { User } from '../../../types';
import { useTheme } from "@/lib/theme";
import { IconFilter, IconX } from "@tabler/icons-react-native";

export interface TeamCommissionFilters {
  userId?: string;
  commissionStatus?: string;
  taskStatus?: string;
  startDate?: Date;
  endDate?: Date;
}

interface TeamCommissionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TeamCommissionFilters) => void;
  currentFilters?: TeamCommissionFilters;
  teamMembers: User[];
}

export function TeamCommissionFilterModal({
  visible,
  onClose,
  onApply,
  currentFilters = {},
  teamMembers,
}: TeamCommissionFilterModalProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<TeamCommissionFilters>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
    onApply({});
    onClose();
  };

  const updateFilter = <K extends keyof TeamCommissionFilters>(key: K, value: TeamCommissionFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Prepare team member options
  const teamMemberOptions = [
    { label: "Todos os Membros", value: "" },
    ...teamMembers.map((member) => ({
      label: member.name,
      value: member.id,
    })),
  ];

  // Prepare commission status options
  const commissionStatusOptions = [
    { label: "Todos os Status", value: "" },
    ...Object.entries(COMMISSION_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  // Prepare task status options
  const taskStatusOptions = [
    { label: "Todos os Status de Serviço", value: "" },
    ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  return (
    <Modal visible={visible} onClose={onClose} title="Filtrar Comissões" size="large">
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team Member Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Membro da Equipe</ThemedText>
          <Select
            value={filters.userId || ""}
            onValueChange={(value) => updateFilter("userId", value || undefined)}
            options={teamMemberOptions}
            placeholder="Selecione um membro"
          />
        </View>

        {/* Commission Status Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Status da Comissão</ThemedText>
          <Select
            value={filters.commissionStatus || ""}
            onValueChange={(value) => updateFilter("commissionStatus", value || undefined)}
            options={commissionStatusOptions}
            placeholder="Selecione o status"
          />
        </View>

        {/* Task Status Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Status do Serviço</ThemedText>
          <Select
            value={filters.taskStatus || ""}
            onValueChange={(value) => updateFilter("taskStatus", value || undefined)}
            options={taskStatusOptions}
            placeholder="Selecione o status"
          />
        </View>

        {/* Date Range Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Período</ThemedText>
          <View style={styles.dateRangeContainer}>
            <View style={styles.datePickerWrapper}>
              <ThemedText style={styles.dateLabel}>Data Inicial</ThemedText>
              <DatePicker
                value={filters.startDate}
                onChange={(date) => updateFilter("startDate", date)}
                placeholder="DD/MM/AAAA"
              />
            </View>
            <View style={styles.datePickerWrapper}>
              <ThemedText style={styles.dateLabel}>Data Final</ThemedText>
              <DatePicker
                value={filters.endDate}
                onChange={(date) => updateFilter("endDate", date)}
                placeholder="DD/MM/AAAA"
              />
            </View>
          </View>
        </View>

        {/* Active Filter Count */}
        {activeFilterCount > 0 && (
          <View style={[styles.filterCountBadge, { backgroundColor: colors.primary + "20" }]}>
            <IconFilter size={16} color={colors.primary} />
            <ThemedText style={[styles.filterCountText, { color: colors.primary }]}>
              {activeFilterCount} {activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Button variant="outline" onPress={handleClear} style={styles.actionButton}>
          <IconX size={18} color={colors.text} />
          <ThemedText style={styles.clearButtonText}>Limpar</ThemedText>
        </Button>
        <Button onPress={handleApply} style={styles.actionButton}>
          <IconFilter size={18} color="#fff" />
          <ThemedText style={styles.applyButtonText}>Aplicar Filtros</ThemedText>
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateRangeContainer: {
    gap: 12,
  },
  datePickerWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 6,
  },
  filterCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  filterCountText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
});
