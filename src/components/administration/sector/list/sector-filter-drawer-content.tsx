import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconShieldCheck, IconCalendarPlus, IconUsers } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { SECTOR_PRIVILEGES, SECTOR_PRIVILEGES_LABELS } from '../../../../constants';
import type { SectorGetManyFormData } from '../../../../types';

interface SectorFilterDrawerContentProps {
  filters: Partial<SectorGetManyFormData>;
  onFiltersChange: (filters: Partial<SectorGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  privileges?: string[];
  hasUsers?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

export function SectorFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: SectorFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  // Initialize localFilters from current filters
  const [localFilters, setLocalFilters] = useState<FilterState>(() => {
    const where = filters.where || {};
    return {
      privileges: where.privileges?.in || [],
      hasUsers: filters.hasUsers,
      createdAfter: filters.createdAt?.gte,
      createdBefore: filters.createdAt?.lte,
      updatedAfter: filters.updatedAt?.gte,
      updatedBefore: filters.updatedAt?.lte,
    };
  });

  const handleApply = useCallback(() => {
    const newFilters: Partial<SectorGetManyFormData> = {};
    const where: any = {};

    if (localFilters.privileges && localFilters.privileges.length > 0) {
      where.privileges = { in: localFilters.privileges };
    }

    if (Object.keys(where).length > 0) {
      newFilters.where = where;
    }

    if (localFilters.hasUsers !== undefined) {
      newFilters.hasUsers = localFilters.hasUsers;
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

    if (localFilters.updatedAfter || localFilters.updatedBefore) {
      newFilters.updatedAt = {};
      if (localFilters.updatedAfter) {
        newFilters.updatedAt.gte = localFilters.updatedAfter;
      }
      if (localFilters.updatedBefore) {
        newFilters.updatedAt.lte = localFilters.updatedBefore;
      }
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const privilegeOptions = useMemo(
    () =>
      Object.values(SECTOR_PRIVILEGES).map((privilege) => ({
        value: privilege,
        label: SECTOR_PRIVILEGES_LABELS[privilege],
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
          <ThemedText style={styles.title}>Filtros de Setores</ThemedText>
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
        {/* Privileges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShieldCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Nível de Privilégio
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Níveis de Privilégio
            </ThemedText>
            <Combobox
              options={privilegeOptions}
              selectedValues={localFilters.privileges || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, privileges: values }))}
              placeholder="Todos os níveis"
              searchPlaceholder="Buscar nível..."
              emptyText="Nenhum nível encontrado"
            />
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasUsers: prev.hasUsers === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Possui Funcionários</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas setores com funcionários
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasUsers === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasUsers: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasUsers === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
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

        {/* Updated Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Atualização
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Atualização"
            value={{
              from: localFilters.updatedAfter,
              to: localFilters.updatedBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                updatedAfter: range?.from,
                updatedBefore: range?.to
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
