import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Button } from "@/components/ui/button";
import { IconX, IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { spacing } from "@/constants/design-system";
import { USER_STATUS } from '../../../constants';

export interface TeamUserFilters {
  statuses?: string[];
  positionIds?: string[];
}

interface TeamUserFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TeamUserFilters) => void;
  currentFilters: TeamUserFilters;
  positions: Array<{ id: string; name: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  [USER_STATUS.EXPERIENCE_PERIOD_1]: "Experiência 1/2",
  [USER_STATUS.EXPERIENCE_PERIOD_2]: "Experiência 2/2",
  [USER_STATUS.CONTRACTED]: "Contratado",
  [USER_STATUS.DISMISSED]: "Desligado",
};

export const TeamUserFilterModal = ({ visible, onClose, onApply, currentFilters, positions }: TeamUserFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<TeamUserFilters>(currentFilters);
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

  const handlePositionChange = useCallback((positionId: string, checked: boolean) => {
    setFilters((prev) => {
      const positionIds = prev.positionIds || [];
      if (checked) {
        return { ...prev, positionIds: [...positionIds, positionId] };
      } else {
        return { ...prev, positionIds: positionIds.filter((id) => id !== positionId) };
      }
    });
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
    if (filters.positionIds && filters.positionIds.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Filtrar Usuários</ThemedText>
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

            {positions.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity onPress={() => toggleSection("positions")} style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Cargos</ThemedText>
                  {expandedSections.has("positions") ? <IconChevronUp size={20} color={colors.text} /> : <IconChevronDown size={20} color={colors.text} />}
                </TouchableOpacity>
                {expandedSections.has("positions") && (
                  <View style={styles.sectionContent}>
                    {positions.map((position) => (
                      <View key={position.id} style={styles.checkboxRow}>
                        <Checkbox checked={filters.positionIds?.includes(position.id) ?? false} onCheckedChange={(checked) => handlePositionChange(position.id, checked)} />
                        <ThemedText style={styles.checkboxLabel}>{position.name}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
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
