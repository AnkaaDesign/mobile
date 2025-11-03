import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconUserCheck, IconBriefcase, IconBuildingStore, IconShieldCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Combobox } from '@/components/ui/combobox';
import { usePositions, useSectors } from '../../../../hooks';
import { USER_STATUS, USER_STATUS_LABELS } from '../../../../constants';
import type { UserGetManyFormData } from '../../../../schemas';

interface UserFilterDrawerContentProps {
  filters: Partial<UserGetManyFormData>;
  onFiltersChange: (filters: Partial<UserGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

interface FilterState {
  statuses?: string[];
  positionIds?: string[];
  sectorIds?: string[];
  managedSectorIds?: string[];
  verified?: boolean;
  hasManagedSector?: boolean;
}

export function UserFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: UserFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Load filter options
  const { data: positionsData } = usePositions({ limit: 100, orderBy: { name: 'asc' } });
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: 'asc' } });

  const positions = positionsData?.data || [];
  const sectors = sectorsData?.data || [];

  // Initialize localFilters from current filters
  const [localFilters, setLocalFilters] = useState<FilterState>(() => {
    const where = filters.where || {};
    return {
      statuses: where.status?.in || [],
      positionIds: where.positionId?.in || [],
      sectorIds: where.sectorId?.in || [],
      managedSectorIds: where.managedSectorId?.in || [],
      verified: where.verified,
      hasManagedSector: where.hasManagedSector,
    };
  });

  const handleApply = useCallback(() => {
    const newFilters: Partial<UserGetManyFormData> = {};
    const where: any = {};

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      where.status = { in: localFilters.statuses };
    }

    if (localFilters.positionIds && localFilters.positionIds.length > 0) {
      where.positionId = { in: localFilters.positionIds };
    }

    if (localFilters.sectorIds && localFilters.sectorIds.length > 0) {
      where.sectorId = { in: localFilters.sectorIds };
    }

    if (localFilters.managedSectorIds && localFilters.managedSectorIds.length > 0) {
      where.managedSectorId = { in: localFilters.managedSectorIds };
    }

    if (localFilters.verified !== undefined) {
      where.verified = localFilters.verified;
    }

    if (localFilters.hasManagedSector !== undefined) {
      where.hasManagedSector = localFilters.hasManagedSector;
    }

    if (Object.keys(where).length > 0) {
      newFilters.where = where;
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
      Object.values(USER_STATUS).map((status) => ({
        value: status,
        label: USER_STATUS_LABELS[status],
      })),
    []
  );

  const positionOptions = useMemo(
    () =>
      positions.map((position) => ({
        value: position.id,
        label: position.name,
      })),
    [positions]
  );

  const sectorOptions = useMemo(
    () =>
      sectors.map((sector) => ({
        value: sector.id,
        label: sector.name,
      })),
    [sectors]
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
          <ThemedText style={styles.title}>Filtros de Usuários</ThemedText>
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
            <IconUserCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Status do Usuário
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

        {/* Positions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Cargos
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Cargos
            </ThemedText>
            <Combobox
              options={positionOptions}
              selectedValues={localFilters.positionIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, positionIds: values }))}
              placeholder="Todos os cargos"
              searchPlaceholder="Buscar cargos..."
              emptyText="Nenhum cargo encontrado"
            />
          </View>
        </View>

        {/* Sectors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBuildingStore size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Setores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Setores
            </ThemedText>
            <Combobox
              options={sectorOptions}
              selectedValues={localFilters.sectorIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, sectorIds: values }))}
              placeholder="Todos os setores"
              searchPlaceholder="Buscar setores..."
              emptyText="Nenhum setor encontrado"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Setores Gerenciados
            </ThemedText>
            <Combobox
              options={sectorOptions}
              selectedValues={localFilters.managedSectorIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, managedSectorIds: values }))}
              placeholder="Todos os setores gerenciados"
              searchPlaceholder="Buscar setores..."
              emptyText="Nenhum setor encontrado"
            />
          </View>
        </View>

        {/* Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShieldCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Verificação e Permissões
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, verified: prev.verified === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Usuário Verificado</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Filtrar por usuários com email verificado
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.verified === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, verified: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.verified === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasManagedSector: prev.hasManagedSector === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Gerencia Setor</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Filtrar por usuários que gerenciam setores
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasManagedSector === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasManagedSector: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasManagedSector === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
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
