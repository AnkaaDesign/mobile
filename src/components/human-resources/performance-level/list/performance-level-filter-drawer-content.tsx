import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconUsers, IconTrophy, IconBriefcase, IconUserCheck, IconUserMinus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { usePositions, useSectors, useUsers } from "@/hooks";
import { USER_STATUS, USER_STATUS_LABELS } from "@/constants";
import type { UserGetManyFormData } from '../../../../schemas';

interface PerformanceLevelFilterDrawerContentProps {
  filters: Partial<UserGetManyFormData>;
  onFiltersChange: (filters: Partial<UserGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  statuses?: string[];
  positionIds?: string[];
  sectorIds?: string[];
  performanceLevelRange?: FilterRange;
  includeUserIds?: string[];
  excludeUserIds?: string[];
  isActive?: boolean;
}

export function PerformanceLevelFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PerformanceLevelFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: positionsData } = usePositions({ limit: 100, orderBy: { name: "asc" } });
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: "asc" } });
  const { data: usersData } = useUsers({
    include: { position: true, sector: true },
    where: { status: 'EFFECTED' },
    orderBy: { name: 'asc' },
    limit: 100,
  });

  const positions = positionsData?.data || [];
  const sectors = sectorsData?.data || [];
  const users = usersData?.data || [];

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    statuses: filters.where?.status?.in || [],
    positionIds: filters.positionIds || [],
    sectorIds: filters.sectorIds || [],
    performanceLevelRange: {
      min: filters.where?.performanceLevel?.gte,
      max: filters.where?.performanceLevel?.lte,
    },
    includeUserIds: filters.includeUserIds || [],
    excludeUserIds: filters.excludeUserIds || [],
    isActive: filters.isActive,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<UserGetManyFormData> = {};

    if (localFilters.positionIds && localFilters.positionIds.length > 0) {
      newFilters.positionIds = localFilters.positionIds;
    }

    if (localFilters.sectorIds && localFilters.sectorIds.length > 0) {
      newFilters.sectorIds = localFilters.sectorIds;
    }

    if (localFilters.isActive !== undefined) {
      newFilters.isActive = localFilters.isActive;
    }

    if (localFilters.includeUserIds && localFilters.includeUserIds.length > 0) {
      newFilters.includeUserIds = localFilters.includeUserIds;
    }

    if (localFilters.excludeUserIds && localFilters.excludeUserIds.length > 0) {
      newFilters.excludeUserIds = localFilters.excludeUserIds;
    }

    // Transform performance level range to where clause
    if (localFilters.performanceLevelRange?.min !== undefined || localFilters.performanceLevelRange?.max !== undefined) {
      newFilters.where = {
        ...(newFilters.where || {}),
        performanceLevel: {
          ...(localFilters.performanceLevelRange.min !== undefined && { gte: localFilters.performanceLevelRange.min }),
          ...(localFilters.performanceLevelRange.max !== undefined && { lte: localFilters.performanceLevelRange.max }),
        },
      };
    }

    // Transform status array to where clause
    if (localFilters.statuses && localFilters.statuses.length > 0) {
      newFilters.where = {
        ...(newFilters.where || {}),
        status: { in: localFilters.statuses },
      };
    }

    onFiltersChange(newFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const statusOptions = useMemo(
    () => Object.values(USER_STATUS).map((status) => ({
      label: USER_STATUS_LABELS[status as keyof typeof USER_STATUS_LABELS] || status,
      value: status,
    })),
    []
  );

  const positionOptions = useMemo(
    () => positions.map((position) => ({ label: position.name, value: position.id })),
    [positions]
  );

  const sectorOptions = useMemo(
    () => sectors.map((sector) => ({ label: sector.name, value: sector.id })),
    [sectors]
  );

  // Filter users based on selected sectors and positions
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (localFilters.sectorIds && localFilters.sectorIds.length > 0) {
      filtered = filtered.filter(
        (user) => user.sectorId && localFilters.sectorIds!.includes(user.sectorId)
      );
    }

    if (localFilters.positionIds && localFilters.positionIds.length > 0) {
      filtered = filtered.filter(
        (user) => user.positionId && localFilters.positionIds!.includes(user.positionId)
      );
    }

    return filtered;
  }, [users, localFilters.sectorIds, localFilters.positionIds]);

  const userOptions = useMemo(
    () =>
      filteredUsers.map((user) => ({
        value: user.id,
        label: `${user.name}${user.sector?.name ? ` (${user.sector.name})` : ''}`,
      })),
    [filteredUsers]
  );

  // Handle filter changes with user list clearing
  const handleSectorsChange = (selectedIds: string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      sectorIds: selectedIds,
      includeUserIds: [],
      excludeUserIds: [],
    }));
  };

  const handlePositionsChange = (selectedIds: string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      positionIds: selectedIds,
      includeUserIds: [],
      excludeUserIds: [],
    }));
  };

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
          <ThemedText style={styles.title}>Filtros de Nível de Performance</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose || (() => {})} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isActive: prev.isActive === false ? undefined : false }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Incluir apenas funcionários ativos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas funcionários com status ativo
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

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Status do Funcionário
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

        {/* Performance Level Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconTrophy size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Nível de Performance
            </ThemedText>
          </View>

          <View style={styles.rangeContainer}>
            <View style={styles.rangeInputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
                Nível Mínimo (0-5)
              </ThemedText>
              <Input
                placeholder="Mín"
                value={localFilters.performanceLevelRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseInt(String(value), 10) : undefined;
                  const clampedValue = numValue !== undefined ? Math.max(0, Math.min(5, numValue)) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    performanceLevelRange: {
                      ...prev.performanceLevelRange,
                      min: clampedValue,
                    },
                  }));
                }}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.rangeInputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
                Nível Máximo (0-5)
              </ThemedText>
              <Input
                placeholder="Máx"
                value={localFilters.performanceLevelRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseInt(String(value), 10) : undefined;
                  const clampedValue = numValue !== undefined ? Math.max(0, Math.min(5, numValue)) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    performanceLevelRange: {
                      ...prev.performanceLevelRange,
                      max: clampedValue,
                    },
                  }));
                }}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <ThemedText style={[styles.infoText, { color: '#1e40af' }]}>
              • 0: Não Avaliado{"\n"}
              • 1: Ruim{"\n"}
              • 2: Regular{"\n"}
              • 3: Bom{"\n"}
              • 4-5: Excelente
            </ThemedText>
          </View>
        </View>

        {/* Positions and Sectors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Cargos e Setores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Cargos
            </ThemedText>
            <Combobox
              options={positionOptions}
              value={localFilters.positionIds || []}
              mode="multiple"
              onValueChange={(values) => handlePositionsChange(Array.isArray(values) ? values : values ? [values] : [])}
              placeholder={positions.length === 0 ? "Carregando cargos..." : "Todos os cargos"}
              searchPlaceholder="Buscar cargos..."
              emptyText="Nenhum cargo encontrado"
              disabled={positions.length === 0}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Setores
            </ThemedText>
            <Combobox
              options={sectorOptions}
              value={localFilters.sectorIds || []}
              mode="multiple"
              onValueChange={(values) => handleSectorsChange(Array.isArray(values) ? values : values ? [values] : [])}
              placeholder={sectors.length === 0 ? "Carregando setores..." : "Todos os setores"}
              searchPlaceholder="Buscar setores..."
              emptyText="Nenhum setor encontrado"
              disabled={sectors.length === 0}
            />
          </View>
        </View>

        {/* Include/Exclude Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUserCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Incluir/Excluir Usuários
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Incluir Apenas os Usuários
            </ThemedText>
            <Combobox
              options={userOptions}
              value={localFilters.includeUserIds || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, includeUserIds: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder="Todos os usuários"
              searchPlaceholder="Buscar usuários..."
              emptyText="Nenhum usuário encontrado"
              disabled={filteredUsers.length === 0}
            />
            <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
              {localFilters.includeUserIds?.length || 0} usuário(s) incluído(s)
              {(localFilters.sectorIds && localFilters.sectorIds.length > 0) || (localFilters.positionIds && localFilters.positionIds.length > 0)
                ? ` de ${filteredUsers.length} disponível(is)`
                : ''}
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <IconUserMinus size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Excluir Usuários Específicos
              </ThemedText>
            </View>
            <Combobox
              options={userOptions}
              value={localFilters.excludeUserIds || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, excludeUserIds: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder="Nenhuma exclusão"
              searchPlaceholder="Buscar usuários..."
              emptyText="Nenhum usuário encontrado"
              disabled={filteredUsers.length === 0}
            />
            <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
              {localFilters.excludeUserIds?.length || 0} usuário(s) excluído(s)
              {(localFilters.sectorIds && localFilters.sectorIds.length > 0) || (localFilters.positionIds && localFilters.positionIds.length > 0)
                ? ` de ${filteredUsers.length} disponível(is)`
                : ''}
            </ThemedText>
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
    marginBottom: 12,
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
  rangeContainer: {
    gap: 12,
    marginBottom: 12,
  },
  rangeInputGroup: {
    marginBottom: 10,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
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
