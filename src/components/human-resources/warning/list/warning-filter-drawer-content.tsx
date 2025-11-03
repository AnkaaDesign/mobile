import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconUsers, IconCalendarPlus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { useUsers } from '../../../../hooks';
import { WARNING_CATEGORY, WARNING_SEVERITY, WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../../constants';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import type { WarningGetManyFormData } from '../../../../schemas';

interface WarningFilterDrawerContentProps {
  filters: Partial<WarningGetManyFormData>;
  onFiltersChange: (filters: Partial<WarningGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

interface FilterState {
  isActive?: boolean;
  collaboratorIds?: string[];
  supervisorIds?: string[];
  categories?: string[];
  severities?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  followUpAfter?: Date;
  followUpBefore?: Date;
}

export function WarningFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: WarningFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Load filter options
  const { data: usersData } = useUsers({ limit: 100, orderBy: { name: "asc" } });
  const users = usersData?.data || [];

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    isActive: filters.isActive,
    collaboratorIds: filters.collaboratorIds || [],
    supervisorIds: filters.supervisorIds || [],
    categories: filters.categories || [],
    severities: filters.severities || [],
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
    followUpAfter: filters.followUpDate?.gte,
    followUpBefore: filters.followUpDate?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<WarningGetManyFormData> = {};

    if (localFilters.isActive !== undefined) {
      newFilters.isActive = localFilters.isActive;
    }

    if (localFilters.collaboratorIds && localFilters.collaboratorIds.length > 0) {
      newFilters.collaboratorIds = localFilters.collaboratorIds;
    }

    if (localFilters.supervisorIds && localFilters.supervisorIds.length > 0) {
      newFilters.supervisorIds = localFilters.supervisorIds;
    }

    if (localFilters.categories && localFilters.categories.length > 0) {
      newFilters.categories = localFilters.categories;
    }

    if (localFilters.severities && localFilters.severities.length > 0) {
      newFilters.severities = localFilters.severities;
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

    if (localFilters.followUpAfter || localFilters.followUpBefore) {
      newFilters.followUpDate = {};
      if (localFilters.followUpAfter) {
        newFilters.followUpDate.gte = localFilters.followUpAfter;
      }
      if (localFilters.followUpBefore) {
        newFilters.followUpDate.lte = localFilters.followUpBefore;
      }
    }

    onFiltersChange(newFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [users]
  );

  const categoryOptions = useMemo(
    () =>
      Object.values(WARNING_CATEGORY).map((category) => ({
        value: category,
        label: WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS] || category,
      })),
    []
  );

  const severityOptions = useMemo(
    () =>
      Object.values(WARNING_SEVERITY).map((severity) => ({
        value: severity,
        label: WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity,
      })),
    []
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
          <ThemedText style={styles.title}>Filtros de Advertências</ThemedText>
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
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isActive: prev.isActive !== false ? false : undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Incluir apenas advertências ativas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas advertências que ainda estão ativas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isActive !== false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isActive: value ? undefined : false }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isActive !== false ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Categorias
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Categorias
            </ThemedText>
            <Combobox
              options={categoryOptions}
              selectedValues={localFilters.categories || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, categories: values }))}
              placeholder="Todas as categorias"
              searchPlaceholder="Buscar categorias..."
              emptyText="Nenhuma categoria encontrada"
            />
          </View>
        </View>

        {/* Severities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Gravidades
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Gravidades
            </ThemedText>
            <Combobox
              options={severityOptions}
              selectedValues={localFilters.severities || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, severities: values }))}
              placeholder="Todas as gravidades"
              searchPlaceholder="Buscar gravidades..."
              emptyText="Nenhuma gravidade encontrada"
            />
          </View>
        </View>

        {/* Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Colaboradores e Supervisores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Colaboradores
            </ThemedText>
            <Combobox
              options={userOptions}
              selectedValues={localFilters.collaboratorIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, collaboratorIds: values }))}
              placeholder="Todos os colaboradores"
              searchPlaceholder="Buscar colaboradores..."
              emptyText="Nenhum colaborador encontrado"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Supervisores
            </ThemedText>
            <Combobox
              options={userOptions}
              selectedValues={localFilters.supervisorIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, supervisorIds: values }))}
              placeholder="Todos os supervisores"
              searchPlaceholder="Buscar supervisores..."
              emptyText="Nenhum supervisor encontrado"
            />
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Emissão
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Emissão"
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

        {/* Follow-up Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Acompanhamento
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Acompanhamento"
            value={{
              from: localFilters.followUpAfter,
              to: localFilters.followUpBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                followUpAfter: range?.from,
                followUpBefore: range?.to
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
