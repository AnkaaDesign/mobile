import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconBeach, IconUsers, IconCalendarPlus, IconCalendar } from '@tabler/icons-react-native';
import { Switch as RNSwitch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUsers } from "@/hooks";
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from "@/constants";
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import type { VacationGetManyFormData } from '../../../../schemas';

interface VacationFilterDrawerContentProps {
  filters: Partial<VacationGetManyFormData>;
  onFiltersChange: (filters: Partial<VacationGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  statuses?: string[];
  types?: string[];
  userIds?: string[];
  isCollective?: boolean;
  year?: number;
  startAfter?: Date;
  startBefore?: Date;
  endAfter?: Date;
  endBefore?: Date;
}

export function VacationFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: VacationFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Fetch users for selector
  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.data || [];

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    statuses: filters.statuses || [],
    types: filters.types || [],
    userIds: filters.userIds || [],
    isCollective: filters.isCollective,
    year: filters.year || new Date().getFullYear(),
    startAfter: filters.startAtRange?.gte,
    startBefore: filters.startAtRange?.lte,
    endAfter: filters.endAtRange?.gte,
    endBefore: filters.endAtRange?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<VacationGetManyFormData> = {};

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      newFilters.statuses = localFilters.statuses as any;
    }

    if (localFilters.types && localFilters.types.length > 0) {
      newFilters.types = localFilters.types as any;
    }

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.isCollective !== undefined) {
      newFilters.isCollective = localFilters.isCollective;
    }

    if (localFilters.year !== undefined) {
      newFilters.year = localFilters.year;
    }

    if (localFilters.startAfter || localFilters.startBefore) {
      newFilters.startAtRange = {};
      if (localFilters.startAfter) {
        newFilters.startAtRange.gte = localFilters.startAfter;
      }
      if (localFilters.startBefore) {
        newFilters.startAtRange.lte = localFilters.startBefore;
      }
    }

    if (localFilters.endAfter || localFilters.endBefore) {
      newFilters.endAtRange = {};
      if (localFilters.endAfter) {
        newFilters.endAtRange.gte = localFilters.endAfter;
      }
      if (localFilters.endBefore) {
        newFilters.endAtRange.lte = localFilters.endBefore;
      }
    }

    onFiltersChange(newFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose]);

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

  const statusOptions = useMemo(
    () =>
      Object.entries(VACATION_STATUS_LABELS).map(([key, label]) => ({
        value: key,
        label,
      })),
    []
  );

  const typeOptions = useMemo(
    () =>
      Object.entries(VACATION_TYPE_LABELS).map(([key, label]) => ({
        value: key,
        label,
      })),
    []
  );

  const yearOptions = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = -5; i <= 5; i++) {
      const year = currentYear + i;
      years.push({
        value: year.toString(),
        label: year.toString(),
      });
    }
    return years;
  }, []);

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
          <ThemedText style={styles.title}>Filtros de Férias</ThemedText>
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
            <IconBeach size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Status
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

        {/* Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBeach size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Férias
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Tipos
            </ThemedText>
            <Combobox
              options={typeOptions}
              value={localFilters.types || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, types: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder="Todos os tipos"
              searchPlaceholder="Buscar tipos..."
              emptyText="Nenhum tipo encontrado"
            />
          </View>
        </View>

        {/* Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Colaborador
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

        {/* Year and Collective */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ano e Tipo
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Ano
            </ThemedText>
            <Combobox
              options={yearOptions}
              value={localFilters.year ? localFilters.year.toString() : ''}
              onValueChange={(value) => {
                const year = typeof value === 'string' && value ? parseInt(value) : undefined;
                setLocalFilters((prev) => ({ ...prev, year }));
              }}
              placeholder="Selecione o ano..."
              emptyText="Nenhum ano encontrado"
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isCollective: !prev.isCollective }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas férias coletivas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas períodos de férias coletivas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isCollective || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isCollective: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isCollective ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Start Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data Inicial
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período (Data Inicial)"
            value={{
              from: localFilters.startAfter,
              to: localFilters.startBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                startAfter: range?.from,
                startBefore: range?.to
              }))
            }
          />
        </View>

        {/* End Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data Final
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período (Data Final)"
            value={{
              from: localFilters.endAfter,
              to: localFilters.endBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                endAfter: range?.from,
                endBefore: range?.to
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
