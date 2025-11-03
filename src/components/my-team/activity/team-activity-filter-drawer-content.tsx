import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconCalendarPlus, IconUsers, IconChecklist } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { ACTIVITY_OPERATION, ACTIVITY_REASON, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '@/constants';
import type { User } from '@/types';

export interface TeamActivityFilters {
  userIds?: string[];
  operations?: string[];
  reasons?: string[];
  startDate?: Date;
  endDate?: Date;
}

interface TeamActivityFilterDrawerContentProps {
  filters: TeamActivityFilters;
  onFiltersChange: (filters: TeamActivityFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  teamMembers: User[];
}

export function TeamActivityFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  teamMembers,
}: TeamActivityFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<TeamActivityFilters>(() => ({
    userIds: filters.userIds || [],
    operations: filters.operations || [],
    reasons: filters.reasons || [],
    startDate: filters.startDate,
    endDate: filters.endDate,
  }));

  const handleApply = useCallback(() => {
    const newFilters: TeamActivityFilters = {};

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.operations && localFilters.operations.length > 0) {
      newFilters.operations = localFilters.operations;
    }

    if (localFilters.reasons && localFilters.reasons.length > 0) {
      newFilters.reasons = localFilters.reasons;
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

  // Handle operation filter
  const handleOperationToggle = useCallback((operation: string) => {
    setLocalFilters((prev) => {
      const operations = prev.operations || [];
      const newOperations = operations.includes(operation)
        ? operations.filter((o) => o !== operation)
        : [...operations, operation];

      return { ...prev, operations: newOperations.length > 0 ? newOperations : undefined };
    });
  }, []);

  // Handle reason filter
  const handleReasonToggle = useCallback((reason: string) => {
    setLocalFilters((prev) => {
      const reasons = prev.reasons || [];
      const newReasons = reasons.includes(reason)
        ? reasons.filter((r) => r !== reason)
        : [...reasons, reason];

      return { ...prev, reasons: newReasons.length > 0 ? newReasons : undefined };
    });
  }, []);

  // Prepare team member options
  const teamMemberOptions = useMemo(
    () =>
      teamMembers.map((member) => ({
        value: member.id,
        label: member.name,
      })),
    [teamMembers]
  );

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
          <ThemedText style={styles.title}>Filtros de Atividades</ThemedText>
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
        {/* Team Members */}
        {teamMembers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconUsers size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Membros da Equipe
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
                Selecionar Membros
              </ThemedText>
              <Combobox
                options={teamMemberOptions}
                selectedValues={localFilters.userIds || []}
                onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: values }))}
                placeholder="Todos os membros"
                searchPlaceholder="Buscar membros..."
                emptyText="Nenhum membro encontrado"
              />
            </View>
          </View>
        )}

        {/* Operations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Operação
            </ThemedText>
          </View>

          {Object.values(ACTIVITY_OPERATION).map((operation) => (
            <View key={operation} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleOperationToggle(operation)}
                activeOpacity={0.7}
              >
                <View>
                  <ThemedText style={styles.filterLabel}>
                    {ACTIVITY_OPERATION_LABELS[operation as keyof typeof ACTIVITY_OPERATION_LABELS]}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              <RNSwitch
                value={localFilters.operations?.includes(operation) ?? false}
                onValueChange={() => handleOperationToggle(operation)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={localFilters.operations?.includes(operation) ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Reasons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Motivo
            </ThemedText>
          </View>

          {Object.values(ACTIVITY_REASON).map((reason) => (
            <View key={reason} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleReasonToggle(reason)}
                activeOpacity={0.7}
              >
                <View>
                  <ThemedText style={styles.filterLabel}>
                    {ACTIVITY_REASON_LABELS[reason as keyof typeof ACTIVITY_REASON_LABELS]}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              <RNSwitch
                value={localFilters.reasons?.includes(reason) ?? false}
                onValueChange={() => handleReasonToggle(reason)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={localFilters.reasons?.includes(reason) ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
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
            label="Período de Atividade"
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
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterTouchable: {
    flex: 1,
    paddingRight: 16,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
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
