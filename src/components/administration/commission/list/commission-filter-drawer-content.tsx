import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCircleCheck, IconUsers, IconChecklist, IconCalendarPlus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { useUsers, useTasks } from '../../../../hooks';
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS } from '../../../../constants';
import type { CommissionGetManyFormData } from '../../../../schemas';

interface CommissionFilterDrawerContentProps {
  filters: Partial<CommissionGetManyFormData>;
  onFiltersChange: (filters: Partial<CommissionGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

interface FilterState {
  statuses?: string[];
  userIds?: string[];
  taskIds?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export function CommissionFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: CommissionFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Load filter options
  const { data: usersData } = useUsers({});
  const { data: tasksData } = useTasks({});

  const users = usersData?.data || [];
  const tasks = tasksData?.data || [];

  // Initialize localFilters from current filters
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    statuses: filters.statuses || [],
    userIds: filters.userIds || [],
    taskIds: filters.taskIds || [],
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<CommissionGetManyFormData> = {};

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      newFilters.statuses = localFilters.statuses;
    }

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.taskIds && localFilters.taskIds.length > 0) {
      newFilters.taskIds = localFilters.taskIds;
    }

    if (localFilters.createdAfter || localFilters.createdBefore) {
      newFilters.createdAt = {};
      if (localFilters.createdAfter) {
        newFilters.createdAt.gte = localFilters.createdAfter;
      }
      if (localFilters.createdBefore) {
        newFilters.createdAt.lte = localFilters.createdBefore;
      }
    }

    onFiltersChange(newFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const statusOptions = useMemo(
    () =>
      Object.values(COMMISSION_STATUS).map((status) => ({
        value: status,
        label: COMMISSION_STATUS_LABELS[status],
      })),
    []
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [users]
  );

  const taskOptions = useMemo(
    () =>
      tasks.map((task) => ({
        value: task.id,
        label: task.name || `#${task.id}`,
      })),
    [tasks]
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
        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCircleCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Status da Comissão
            </ThemedText>
            <Combobox
              options={statusOptions}
              selectedValues={localFilters.statuses || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, statuses: values }))}
              placeholder="Todos os status"
              searchPlaceholder="Buscar status..."
              emptyText="Nenhum status encontrado"
            />
          </View>
        </View>

        {/* Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Colaboradores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Colaboradores
            </ThemedText>
            <Combobox
              options={userOptions}
              selectedValues={localFilters.userIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: values }))}
              placeholder="Todos os colaboradores"
              searchPlaceholder="Buscar colaboradores..."
              emptyText="Nenhum colaborador encontrado"
            />
          </View>
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Serviços
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Serviços
            </ThemedText>
            <Combobox
              options={taskOptions}
              selectedValues={localFilters.taskIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, taskIds: values }))}
              placeholder="Todos os serviços"
              searchPlaceholder="Buscar serviços..."
              emptyText="Nenhum serviço encontrado"
            />
          </View>
        </View>

        {/* Created Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Criação
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Criação"
            value={{
              from: localFilters.createdAfter,
              to: localFilters.createdBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                createdAfter: range?.from,
                createdBefore: range?.to
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
