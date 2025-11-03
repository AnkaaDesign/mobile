import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCalendarPlus, IconUsers, IconChecklist } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { COMMISSION_STATUS_LABELS, TASK_STATUS_LABELS } from '@/constants';
import type { User } from '@/types';

export interface TeamCommissionFilters {
  userId?: string;
  commissionStatus?: string;
  taskStatus?: string;
  startDate?: Date;
  endDate?: Date;
}

interface TeamCommissionFilterDrawerContentProps {
  filters: TeamCommissionFilters;
  onFiltersChange: (filters: TeamCommissionFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  teamMembers: User[];
}

export function TeamCommissionFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  teamMembers,
}: TeamCommissionFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<TeamCommissionFilters>(() => ({
    userId: filters.userId,
    commissionStatus: filters.commissionStatus,
    taskStatus: filters.taskStatus,
    startDate: filters.startDate,
    endDate: filters.endDate,
  }));

  const handleApply = useCallback(() => {
    const newFilters: TeamCommissionFilters = {};

    if (localFilters.userId) {
      newFilters.userId = localFilters.userId;
    }

    if (localFilters.commissionStatus) {
      newFilters.commissionStatus = localFilters.commissionStatus;
    }

    if (localFilters.taskStatus) {
      newFilters.taskStatus = localFilters.taskStatus;
    }

    if (localFilters.startDate) {
      newFilters.startDate = localFilters.startDate;
    }

    if (localFilters.endDate) {
      newFilters.endDate = localFilters.endDate;
    }

    onFiltersChange(newFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: 18
      }]}>
        <View style={styles.headerContent}>
          <IconFilter size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Filtros de Comissões</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={closeFilterDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Team Member */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Membro da Equipe
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Membro
            </ThemedText>
            <Combobox
              value={localFilters.userId || ""}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, userId: value || undefined }))}
              options={teamMemberOptions}
              placeholder="Selecione um membro"
              searchable={false}
            />
          </View>
        </View>

        {/* Commission Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status da Comissão
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Status
            </ThemedText>
            <Combobox
              value={localFilters.commissionStatus || ""}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, commissionStatus: value || undefined }))}
              options={commissionStatusOptions}
              placeholder="Selecione o status"
              searchable={false}
            />
          </View>
        </View>

        {/* Task Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status do Serviço
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Status
            </ThemedText>
            <Combobox
              value={localFilters.taskStatus || ""}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, taskStatus: value || undefined }))}
              options={taskStatusOptions}
              placeholder="Selecione o status"
              searchable={false}
            />
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Comissão"
            value={{
              from: localFilters.startDate,
              to: localFilters.endDate
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                startDate: range?.from,
                endDate: range?.to
              }))
            }
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.footerBtnText}>Limpar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
