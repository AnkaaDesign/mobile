import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconShield, IconUsers, IconCategory, IconClock } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { useUsers, useItems, useItemCategories } from '../../../../../hooks';
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS } from '../../../../../constants';
import { Combobox } from '@/components/ui/combobox';
import type { PpeDeliveryScheduleGetManyFormData } from '../../../../../schemas';

interface PpeScheduleFilterDrawerContentProps {
  filters: Partial<PpeDeliveryScheduleGetManyFormData>;
  onFiltersChange: (filters: Partial<PpeDeliveryScheduleGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  userIds?: string[];
  itemIds?: string[];
  categoryIds?: string[];
  frequencies?: string[];
  isActive?: boolean;
  overdueOnly?: boolean;
}

export function PpeScheduleFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PpeScheduleFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Load filter options
  const { data: usersData } = useUsers({
    limit: 100,
    orderBy: { name: "asc" },
    where: { status: "ACTIVE" }
  });
  const { data: itemsData } = useItems({
    limit: 100,
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      category: { type: "EPI" }
    },
  });
  const { data: categoriesData } = useItemCategories({
    limit: 100,
    orderBy: { name: "asc" },
    where: { type: "EPI" },
  });

  const users = usersData?.data || [];
  const items = itemsData?.data || [];
  const categories = categoriesData?.data || [];

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    userIds: filters.userIds || [],
    itemIds: filters.itemIds || [],
    categoryIds: filters.categoryIds || [],
    frequencies: filters.frequencies || [],
    isActive: filters.isActive,
    overdueOnly: filters.where?.nextRun?.lt ? true : undefined,
  }));

  const handleApply = useCallback(() => {
    const queryFilters: Partial<PpeDeliveryScheduleGetManyFormData> = {};

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      queryFilters.userIds = localFilters.userIds;
    }

    if (localFilters.itemIds && localFilters.itemIds.length > 0) {
      queryFilters.itemIds = localFilters.itemIds;
    }

    if (localFilters.categoryIds && localFilters.categoryIds.length > 0) {
      queryFilters.categoryIds = localFilters.categoryIds;
    }

    if (localFilters.frequencies && localFilters.frequencies.length > 0) {
      queryFilters.frequencies = localFilters.frequencies as Array<keyof typeof SCHEDULE_FREQUENCY>;
    }

    if (localFilters.isActive !== undefined) {
      queryFilters.isActive = localFilters.isActive;
    }

    // Handle overdue filter - schedules with nextRun in the past
    if (localFilters.overdueOnly) {
      queryFilters.where = {
        ...queryFilters.where,
        nextRun: {
          lt: new Date(),
        },
        isActive: true,
      };
    }

    onFiltersChange(queryFilters);
    if (onClose) {
      onClose();
    } else {
      closeFilterDrawer();
    }
  }, [localFilters, onFiltersChange, onClose, closeFilterDrawer]);

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

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    [items]
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })),
    [categories]
  );

  const frequencyOptions = useMemo(
    () =>
      Object.entries(SCHEDULE_FREQUENCY).map(([_key, value]) => ({
        value,
        label: SCHEDULE_FREQUENCY_LABELS[value as keyof typeof SCHEDULE_FREQUENCY_LABELS],
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
          <ThemedText style={styles.title}>Filtros de Agendamentos</ThemedText>
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
        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShield size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isActive: prev.isActive === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Ativos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas agendamentos ativos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isActive === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isActive: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isActive === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, overdueOnly: prev.overdueOnly === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Atrasados</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas agendamentos vencidos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.overdueOnly === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, overdueOnly: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.overdueOnly === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Employees */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Funcionários
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Funcionários
            </ThemedText>
            <Combobox
              options={userOptions}
              selectedValues={localFilters.userIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: values }))}
              placeholder="Todos os funcionários"
              searchPlaceholder="Buscar funcionários..."
              emptyText="Nenhum funcionário encontrado"
            />
          </View>
        </View>

        {/* PPE Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShield size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Itens de EPI
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Itens
            </ThemedText>
            <Combobox
              options={itemOptions}
              selectedValues={localFilters.itemIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, itemIds: values }))}
              placeholder="Todos os itens"
              searchPlaceholder="Buscar itens..."
              emptyText="Nenhum item encontrado"
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCategory size={18} color={colors.mutedForeground} />
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
              selectedValues={localFilters.categoryIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, categoryIds: values }))}
              placeholder="Todas as categorias"
              searchPlaceholder="Buscar categorias..."
              emptyText="Nenhuma categoria encontrada"
            />
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconClock size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Frequência
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Frequências
            </ThemedText>
            <Combobox
              options={frequencyOptions}
              selectedValues={localFilters.frequencies || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, frequencies: values }))}
              placeholder="Todas as frequências"
              searchPlaceholder="Buscar frequências..."
              emptyText="Nenhuma frequência encontrada"
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
