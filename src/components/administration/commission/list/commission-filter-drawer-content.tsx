import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCircleCheck, IconUsers, IconChecklist, IconCalendarPlus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { useUsers, useTasks } from "@/hooks";
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS } from "@/constants";
import type { CommissionGetManyFormData } from '../../../../schemas';

interface CommissionFilterDrawerContentProps {
  filters: Partial<CommissionGetManyFormData>;
  onFiltersChange: (filters: Partial<CommissionGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
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
  onClose,
}: CommissionFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  // Load filter options
  const { data: usersData } = useUsers({});
  const { data: tasksData } = useTasks({});

  const users = usersData?.data || [];
  const tasks = tasksData?.data || [];

  // Initialize localFilters from current filters
  const [localFilters, setLocalFilters] = useState<FilterState>(() => {
    const createdAtGte = filters.where?.createdAt?.gte;
    const createdAtLte = filters.where?.createdAt?.lte;

    return {
      statuses: filters.where?.statuses || [],
      userIds: filters.where?.userIds || [],
      taskIds: filters.where?.taskIds || [],
      createdAfter: createdAtGte instanceof Date ? createdAtGte : createdAtGte ? new Date(createdAtGte) : undefined,
      createdBefore: createdAtLte instanceof Date ? createdAtLte : createdAtLte ? new Date(createdAtLte) : undefined,
    };
  });

  const handleApply = useCallback(() => {
    const newFilters: Partial<CommissionGetManyFormData> = {};

    const whereFilters: any = {};

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      whereFilters.statuses = localFilters.statuses;
    }

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      whereFilters.userIds = localFilters.userIds;
    }

    if (localFilters.taskIds && localFilters.taskIds.length > 0) {
      whereFilters.taskIds = localFilters.taskIds;
    }

    if (localFilters.createdAfter || localFilters.createdBefore) {
      whereFilters.createdAt = {};
      if (localFilters.createdAfter) {
        whereFilters.createdAt.gte = localFilters.createdAfter;
      }
      if (localFilters.createdBefore) {
        whereFilters.createdAt.lte = localFilters.createdBefore;
      }
    }

    if (Object.keys(whereFilters).length > 0) {
      newFilters.where = whereFilters;
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

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
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              value={localFilters.statuses || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, statuses: Array.isArray(values) ? values : values ? [values] : [] }))}
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
              value={localFilters.userIds || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: Array.isArray(values) ? values : values ? [values] : [] }))}
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
              value={localFilters.taskIds || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, taskIds: Array.isArray(values) ? values : values ? [values] : [] }))}
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
