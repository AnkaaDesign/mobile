import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconEye, IconCalendarPlus, IconChecklist } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import type { ObservationGetManyFormData } from '@/schemas';
import type { Task } from '@/types';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';

interface ObservationFilterDrawerContentProps {
  filters: Partial<ObservationGetManyFormData>;
  onFiltersChange: (filters: Partial<ObservationGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  tasks: Task[];
}

interface FilterState {
  taskIds?: string[];
  hasFiles?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export function ObservationFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  tasks,
}: ObservationFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    taskIds: filters.taskIds || [],
    hasFiles: filters.hasFiles,
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<ObservationGetManyFormData> = {};

    if (localFilters.taskIds && localFilters.taskIds.length > 0) {
      newFilters.taskIds = localFilters.taskIds;
    }

    if (localFilters.hasFiles !== undefined) {
      newFilters.hasFiles = localFilters.hasFiles;
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

  const taskOptions = useMemo(
    () =>
      tasks.map((task) => ({
        value: task.id,
        label: task.name,
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
          <ThemedText style={styles.title}>Filtros de Observações</ThemedText>
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
        {/* Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tarefas
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Tarefas
            </ThemedText>
            <Combobox
              options={taskOptions}
              selectedValues={localFilters.taskIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, taskIds: values }))}
              placeholder="Todas as tarefas"
              searchPlaceholder="Buscar tarefas..."
              emptyText="Nenhuma tarefa encontrada"
            />
          </View>
        </View>

        {/* Files */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconEye size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Arquivos
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasFiles: prev.hasFiles === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Possui Arquivos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas observações com arquivos anexados
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasFiles === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasFiles: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasFiles === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasFiles: prev.hasFiles === false ? undefined : false }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Sem Arquivos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas observações sem arquivos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasFiles === false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasFiles: value ? false : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasFiles === false ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Dates */}
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
  filterDescription: {
    fontSize: 13,
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
