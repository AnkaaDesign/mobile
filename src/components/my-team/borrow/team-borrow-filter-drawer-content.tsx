import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconCalendarPlus, IconUsers, IconChecklist, IconCategory, IconAlertTriangle } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '@/constants';
import type { User } from '@/types';

export interface TeamBorrowFilters {
  userIds?: string[];
  statuses?: string[];
  categoryIds?: string[];
  isOverdue?: boolean;
  startDate?: Date;
  endDate?: Date;
  returnStartDate?: Date;
  returnEndDate?: Date;
}

interface TeamBorrowFilterDrawerContentProps {
  filters: TeamBorrowFilters;
  onFiltersChange: (filters: TeamBorrowFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  teamMembers: User[];
  categories?: Array<{ id: string; name: string }>;
  onClose?: () => void;
}

export function TeamBorrowFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  teamMembers,
  categories = [],
  onClose,
}: TeamBorrowFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<TeamBorrowFilters>(() => ({
    userIds: filters.userIds || [],
    statuses: filters.statuses || [],
    categoryIds: filters.categoryIds || [],
    isOverdue: filters.isOverdue,
    startDate: filters.startDate,
    endDate: filters.endDate,
    returnStartDate: filters.returnStartDate,
    returnEndDate: filters.returnEndDate,
  }));

  const handleApply = useCallback(() => {
    const newFilters: TeamBorrowFilters = {};

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      newFilters.statuses = localFilters.statuses;
    }

    if (localFilters.categoryIds && localFilters.categoryIds.length > 0) {
      newFilters.categoryIds = localFilters.categoryIds;
    }

    if (localFilters.isOverdue !== undefined) {
      newFilters.isOverdue = localFilters.isOverdue;
    }

    if (localFilters.startDate) {
      newFilters.startDate = localFilters.startDate;
    }

    if (localFilters.endDate) {
      newFilters.endDate = localFilters.endDate;
    }

    if (localFilters.returnStartDate) {
      newFilters.returnStartDate = localFilters.returnStartDate;
    }

    if (localFilters.returnEndDate) {
      newFilters.returnEndDate = localFilters.returnEndDate;
    }

    onFiltersChange(newFilters);
    onClose ? onClose() : closeFilterDrawer();
  }, [localFilters, onFiltersChange, onClose, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  // Handle status filter
  const handleStatusToggle = useCallback((status: string) => {
    setLocalFilters((prev) => {
      const statuses = prev.statuses || [];
      const newStatuses = statuses.includes(status)
        ? statuses.filter((s) => s !== status)
        : [...statuses, status];

      return { ...prev, statuses: newStatuses.length > 0 ? newStatuses : undefined };
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

  // Prepare category options
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories]
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
          <ThemedText style={styles.title}>Filtros de Empréstimos</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose || closeFilterDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

        {/* Item Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconCategory size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Tipo de Item
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
                Selecionar Categorias
              </ThemedText>
              <Combobox
                options={categoryOptions}
                selectedValues={localFilters.categoryIds || []}
                onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, categoryIds: values }))}
                placeholder="Todas as categorias"
                searchPlaceholder="Buscar categorias..."
                emptyText="Nenhuma categoria encontrada"
              />
            </View>
          </View>
        )}

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          {Object.values(BORROW_STATUS).map((status) => (
            <View key={status} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleStatusToggle(status)}
                activeOpacity={0.7}
              >
                <View>
                  <ThemedText style={styles.filterLabel}>
                    {BORROW_STATUS_LABELS[status as keyof typeof BORROW_STATUS_LABELS]}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              <RNSwitch
                value={localFilters.statuses?.includes(status) ?? false}
                onValueChange={() => handleStatusToggle(status)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={localFilters.statuses?.includes(status) ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Overdue Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Empréstimos Atrasados
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isOverdue: !prev.isOverdue }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>
                  Apenas Atrasados
                </ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas empréstimos com devolução vencida
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isOverdue ?? false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isOverdue: value }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isOverdue ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Borrow Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período de Empréstimo
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Empréstimo"
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

        {/* Return Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período de Devolução
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Devolução"
            value={{
              from: localFilters.returnStartDate,
              to: localFilters.returnEndDate
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                returnStartDate: range?.from,
                returnEndDate: range?.to
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
