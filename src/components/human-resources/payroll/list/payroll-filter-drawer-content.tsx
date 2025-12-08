import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconBuilding, IconBriefcase, IconUserCheck, IconUserMinus, IconCalendar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { useUsers, useSectors, usePositions } from '@/hooks';

interface PayrollFilterDrawerContentProps {
  filters: PayrollFiltersData;
  onFiltersChange: (filters: PayrollFiltersData) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface PayrollFiltersData {
  year?: number;
  months?: string[];
  sectorIds?: string[];
  positionIds?: string[];
  userIds?: string[];
  excludeUserIds?: string[];
}

export function PayrollFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PayrollFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Load entities for selectors
  const { data: usersData } = useUsers({
    orderBy: { name: 'asc' },
    include: { position: true, sector: true },
    where: {
      isActive: true,
      payrollNumber: { not: null },
    },
    limit: 100,
  });

  const { data: sectorsData } = useSectors({
    orderBy: { name: 'asc' },
    limit: 100,
  });

  const { data: positionsData } = usePositions({
    orderBy: { name: 'asc' },
    include: { remunerations: true },
    limit: 100,
  });

  const users = usersData?.data || [];
  const sectors = sectorsData?.data || [];
  const positions = positionsData?.data || [];

  // Get default sector IDs (production, warehouse, leader)
  const defaultSectorIds = useMemo(() => {
    return sectors
      .filter(
        (sector) =>
          sector.privilege === 'PRODUCTION' ||
          sector.privilege === 'WAREHOUSE' ||
          sector.privilege === 'LEADER'
      )
      .map((sector) => sector.id);
  }, [sectors]);

  // Initialize local filters
  const [localFilters, setLocalFilters] = useState<PayrollFiltersData>(() => {
    // Set defaults if no filters provided
    if (!filters.year && (!filters.months || filters.months.length === 0)) {
      const now = new Date();
      const currentDay = now.getDate();
      let currentYear = now.getFullYear();
      let currentMonth = now.getMonth() + 1;

      // If after 26th, default to next month
      if (currentDay > 26) {
        currentMonth += 1;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear += 1;
        }
      }

      return {
        ...filters,
        year: currentYear,
        months: [String(currentMonth).padStart(2, '0')],
        sectorIds: filters.sectorIds || defaultSectorIds,
      };
    }

    return {
      ...filters,
      sectorIds: filters.sectorIds || defaultSectorIds,
    };
  });

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

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    if (onClose) onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    const now = new Date();
    const currentDay = now.getDate();
    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth() + 1;

    if (currentDay > 26) {
      currentMonth += 1;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear += 1;
      }
    }

    const clearedFilters: PayrollFiltersData = {
      year: currentYear,
      months: [String(currentMonth).padStart(2, '0')],
      sectorIds: [],
      positionIds: [],
      userIds: [],
      excludeUserIds: [],
    };

    setLocalFilters(clearedFilters);
    onClear();
  }, [onClear]);

  // Handle filter changes with user list clearing
  const handleSectorsChange = (selectedIds: string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      sectorIds: selectedIds,
      userIds: [],
      excludeUserIds: [],
    }));
  };

  const handlePositionsChange = (selectedIds: string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      positionIds: selectedIds,
      userIds: [],
      excludeUserIds: [],
    }));
  };

  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 3; i++) {
      const year = currentYear - i;
      years.push({
        value: year.toString(),
        label: year.toString(),
      });
    }
    return years;
  }, []);

  const monthOptions = useMemo(
    () => [
      { value: '01', label: 'Janeiro' },
      { value: '02', label: 'Fevereiro' },
      { value: '03', label: 'Março' },
      { value: '04', label: 'Abril' },
      { value: '05', label: 'Maio' },
      { value: '06', label: 'Junho' },
      { value: '07', label: 'Julho' },
      { value: '08', label: 'Agosto' },
      { value: '09', label: 'Setembro' },
      { value: '10', label: 'Outubro' },
      { value: '11', label: 'Novembro' },
      { value: '12', label: 'Dezembro' },
    ],
    []
  );

  const sectorOptions = useMemo(
    () => sectors.map((sector) => ({ value: sector.id, label: sector.name })),
    [sectors]
  );

  const positionOptions = useMemo(
    () => positions.map((position) => ({ value: position.id, label: position.name })),
    [positions]
  );

  const userOptions = useMemo(
    () =>
      filteredUsers.map((user) => ({
        value: user.id,
        label: `${user.name}${user.sector?.name ? ` (${user.sector.name})` : ''}`,
      })),
    [filteredUsers]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: 18,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <IconFilter size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Filtros de Folha de Pagamento</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={onClose || (() => {})}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Year and Month Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ano e Mês
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Ano</ThemedText>
            <Combobox
              options={yearOptions}
              value={localFilters.year ? localFilters.year.toString() : ''}
              onValueChange={(value) => {
                const year = typeof value === 'string' && value ? parseInt(value) : undefined;
                setLocalFilters((prev) => ({
                  ...prev,
                  year,
                  months: year ? prev.months : undefined,
                }));
              }}
              placeholder="Selecione o ano..."
              emptyText="Nenhum ano encontrado"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Meses
            </ThemedText>
            <Combobox
              options={monthOptions}
              value={localFilters.months || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, months: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder={
                localFilters.year ? 'Selecione os meses...' : 'Selecione um ano primeiro'
              }
              searchPlaceholder="Buscar meses..."
              emptyText="Nenhum mês encontrado"
              disabled={!localFilters.year}
            />
            {localFilters.months && localFilters.months.length > 0 && (
              <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                {localFilters.months.length} mês{localFilters.months.length !== 1 ? 'es' : ''}{' '}
                selecionado{localFilters.months.length !== 1 ? 's' : ''}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Sector Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBuilding size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Filtrar por Setores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <Combobox
              options={sectorOptions}
              value={localFilters.sectorIds || []}
              mode="multiple"
              onValueChange={(values) => handleSectorsChange(Array.isArray(values) ? values : values ? [values] : [])}
              placeholder="Todos os setores"
              searchPlaceholder="Buscar setores..."
              emptyText="Nenhum setor encontrado"
            />
            <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
              {localFilters.sectorIds?.length || 0} setor(es) selecionado(s)
            </ThemedText>
          </View>
        </View>

        {/* Position Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Filtrar por Cargos
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <Combobox
              options={positionOptions}
              value={localFilters.positionIds || []}
              mode="multiple"
              onValueChange={(values) => handlePositionsChange(Array.isArray(values) ? values : values ? [values] : [])}
              placeholder="Todos os cargos"
              searchPlaceholder="Buscar cargos..."
              emptyText="Nenhum cargo encontrado"
            />
            <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
              {localFilters.positionIds?.length || 0} cargo(s) selecionado(s)
            </ThemedText>
          </View>
        </View>

        {/* Include Specific Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUserCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Incluir Apenas os Usuários
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <Combobox
              options={userOptions}
              value={localFilters.userIds || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder="Todos os usuários"
              searchPlaceholder="Buscar usuários..."
              emptyText="Nenhum usuário encontrado"
              disabled={filteredUsers.length === 0}
            />
            <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
              {localFilters.userIds?.length || 0} usuário(s) incluído(s)
              {(localFilters.sectorIds && localFilters.sectorIds.length > 0) ||
              (localFilters.positionIds && localFilters.positionIds.length > 0)
                ? ` de ${filteredUsers.length} disponível(is)`
                : ''}
            </ThemedText>
          </View>
        </View>

        {/* Exclude Specific Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUserMinus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Excluir Usuários Específicos
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <Combobox
              options={userOptions}
              value={localFilters.excludeUserIds || []}
              mode="multiple"
              onValueChange={(values) =>
                setLocalFilters((prev) => ({ ...prev, excludeUserIds: Array.isArray(values) ? values : values ? [values] : [] }))
              }
              placeholder="Nenhuma exclusão"
              searchPlaceholder="Buscar usuários..."
              emptyText="Nenhum usuário encontrado"
              disabled={filteredUsers.length === 0}
            />
            <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
              {localFilters.excludeUserIds?.length || 0} usuário(s) excluído(s)
              {(localFilters.sectorIds && localFilters.sectorIds.length > 0) ||
              (localFilters.positionIds && localFilters.positionIds.length > 0)
                ? ` de ${filteredUsers.length} disponível(is)`
                : ''}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.footerBtnText}>Limpar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.footerBtn,
            { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>
            Aplicar
          </ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
