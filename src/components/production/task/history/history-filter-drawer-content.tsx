import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Text } from 'react-native';
import { IconFilter, IconX, IconChecklist, IconCalendar, IconBuildingFactory2, IconUser, IconUsers, IconCurrencyDollar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { CustomerLogoDisplay } from '@/components/ui/customer-logo-display';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { TASK_STATUS, TASK_STATUS_LABELS } from '@/constants';
import { useSectors, useCustomers, useUsers } from '@/hooks';
import { DatePicker } from '@/components/ui/date-picker';
import { formatCurrency } from '@/utils';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import type { Customer } from '@/types';

interface HistoryFilterDrawerContentProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  canViewPrice?: boolean;
}

export function HistoryFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  canViewPrice = false,
}: HistoryFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Load data for selectors
  const { data: sectorsData } = useSectors({ orderBy: { name: "asc" } });
  const { data: customersData } = useCustomers({ orderBy: { fantasyName: "asc" }, include: { logo: true } });
  const { data: usersData } = useUsers({
    orderBy: { name: "asc" },
    where: {
      createdTasks: {
        some: {
          status: "COMPLETED",
        },
      },
    },
  });

  // Default status selections: Finalizado, Faturado, Quitado
  const defaultStatusValues = [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED];

  // Initialize localFilters with filters value or defaults
  const [localFilters, setLocalFilters] = useState(() => ({
    ...filters,
    status: filters?.status || defaultStatusValues,
  }));

  // Price range state
  const [priceMin, setPriceMin] = useState(filters.priceRange?.from?.toString() || "");
  const [priceMax, setPriceMax] = useState(filters.priceRange?.to?.toString() || "");

  // Reset local state when filters change
  useEffect(() => {
    setLocalFilters({
      ...filters,
      status: filters?.status || defaultStatusValues,
    });
    setPriceMin(filters.priceRange?.from?.toString() || "");
    setPriceMax(filters.priceRange?.to?.toString() || "");
  }, [filters, defaultStatusValues]);

  const handleStatusChange = useCallback((value: string | string[] | null | undefined) => {
    const statusValues = Array.isArray(value) ? value : [];
    setLocalFilters((prev: any) => ({
      ...prev,
      status: statusValues.length > 0 ? statusValues : undefined,
    }));
  }, []);

  const handleDateRangeChange = useCallback((field: 'from' | 'to', date: Date | null) => {
    setLocalFilters((prev: any) => {
      const finishedDateRange = prev.finishedDateRange || {};

      if (!date && !finishedDateRange[field === 'from' ? 'to' : 'from']) {
        const { finishedDateRange, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        finishedDateRange: {
          ...finishedDateRange,
          ...(date && { [field]: date }),
        },
      };
    });
  }, []);

  const handleSectorChange = useCallback((value: string | string[] | null | undefined) => {
    const sectorIds = Array.isArray(value) ? value : [];
    setLocalFilters((prev: any) => ({
      ...prev,
      sectorIds: sectorIds.length > 0 ? sectorIds : undefined,
    }));
  }, []);

  const handleCustomerChange = useCallback((value: string | string[] | null | undefined) => {
    const customerIds = Array.isArray(value) ? value : [];
    setLocalFilters((prev: any) => ({
      ...prev,
      customerIds: customerIds.length > 0 ? customerIds : undefined,
    }));
  }, []);

  const handleUserChange = useCallback((value: string | string[] | null | undefined) => {
    const assigneeIds = Array.isArray(value) ? value : [];
    setLocalFilters((prev: any) => ({
      ...prev,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
    }));
  }, []);

  const handleApply = useCallback(() => {
    const updatedFilters = { ...localFilters };

    // Handle price range
    if (priceMin || priceMax) {
      updatedFilters.priceRange = {
        ...(priceMin && { from: parseFloat(priceMin) }),
        ...(priceMax && { to: parseFloat(priceMax) }),
      };
    } else {
      delete updatedFilters.priceRange;
    }

    onFiltersChange(updatedFilters);
    closeFilterDrawer();
  }, [localFilters, priceMin, priceMax, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({
      status: defaultStatusValues,
    });
    setPriceMin("");
    setPriceMax("");
    onClear();
  }, [onClear, defaultStatusValues]);

  // Status filter options
  const statusOptions = useMemo(() =>
    Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  []);

  // Sector options
  const sectorOptions = useMemo(() =>
    sectorsData?.data?.map((sector) => ({
      value: sector.id,
      label: sector.name,
    })) || [],
  [sectorsData]);

  // Customer options
  const customerOptions = useMemo(() =>
    customersData?.data?.map((customer) => ({
      value: customer.id,
      label: customer.fantasyName,
    })) || [],
  [customersData]);

  // User options
  const userOptions = useMemo(() =>
    usersData?.data?.map((user) => ({
      value: user.id,
      label: user.name,
    })) || [],
  [usersData]);

  // Render customer option with logo
  const renderCustomerOption = useCallback(
    (option: any, isSelected: boolean) => {
      const customer = customersData?.data?.find((c) => c.id === option.value);
      if (!customer) return null;

      return (
        <View style={styles.customerOptionContainer}>
          <CustomerLogoDisplay
            logo={customer.logo || null}
            customerName={customer.fantasyName}
            size="sm"
            shape="rounded"
          />
          <View style={styles.customerInfo}>
            <Text
              style={[
                styles.customerName,
                { color: colors.foreground },
                isSelected && styles.selectedText,
              ]}
              numberOfLines={1}
            >
              {customer.fantasyName}
            </Text>
          </View>
        </View>
      );
    },
    [customersData, colors]
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
          <ThemedText style={styles.title}>Filtros de Histórico</ThemedText>
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
        {/* Status Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status das Tarefas
            </ThemedText>
          </View>
          <Combobox
            mode="multiple"
            options={statusOptions}
            value={localFilters.status || []}
            onValueChange={handleStatusChange}
            placeholder="Selecione os status"
            emptyText="Nenhum status encontrado"
            searchable
          />
        </View>

        {/* Finished Date Range Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Finalização
            </ThemedText>
          </View>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInput}>
              <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>De</ThemedText>
              <DatePicker
                value={localFilters.finishedDateRange?.from}
                onChange={(date) => handleDateRangeChange('from', date)}
                placeholder="Selecionar"
              />
            </View>
            <View style={styles.dateInput}>
              <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>Até</ThemedText>
              <DatePicker
                value={localFilters.finishedDateRange?.to}
                onChange={(date) => handleDateRangeChange('to', date)}
                placeholder="Selecionar"
              />
            </View>
          </View>
        </View>

        {/* Sector Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBuildingFactory2 size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Setores
            </ThemedText>
          </View>
          <Combobox
            mode="multiple"
            options={sectorOptions}
            value={localFilters.sectorIds || []}
            onValueChange={handleSectorChange}
            placeholder="Selecione os setores"
            emptyText="Nenhum setor encontrado"
            searchable
          />
        </View>

        {/* Customer Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUser size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Clientes
            </ThemedText>
          </View>
          <Combobox
            mode="multiple"
            options={customerOptions}
            value={localFilters.customerIds || []}
            onValueChange={handleCustomerChange}
            placeholder="Selecione os clientes"
            emptyText="Nenhum cliente encontrado"
            searchable
            renderOption={renderCustomerOption}
          />
        </View>

        {/* User Filter - Who completed the task */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Finalizado por
            </ThemedText>
          </View>
          <Combobox
            mode="multiple"
            options={userOptions}
            value={localFilters.assigneeIds || []}
            onValueChange={handleUserChange}
            placeholder="Selecione os usuários"
            emptyText="Nenhum usuário encontrado"
            searchable
          />
        </View>

        {/* Price Range - Only for Admin and Leader */}
        {canViewPrice && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconCurrencyDollar size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Faixa de Valor
              </ThemedText>
            </View>

            <View style={styles.priceRangeContainer}>
              <View style={styles.priceInput}>
                <ThemedText style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                  Mínimo
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }]}
                  placeholder="0,00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={priceMin}
                  onChangeText={setPriceMin}
                />
              </View>
              <View style={styles.priceInput}>
                <ThemedText style={[styles.priceLabel, { color: colors.mutedForeground }]}>
                  Máximo
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }]}
                  placeholder="0,00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={priceMax}
                  onChangeText={setPriceMax}
                />
              </View>
            </View>

            {(priceMin || priceMax) && (
              <ThemedText style={[styles.priceInfo, { color: colors.mutedForeground }]}>
                {priceMin && priceMax
                  ? `Entre ${formatCurrency(Number(priceMin))} e ${formatCurrency(Number(priceMax))}`
                  : priceMin
                    ? `Acima de ${formatCurrency(Number(priceMin))}`
                    : `Até ${formatCurrency(Number(priceMax))}`}
              </ThemedText>
            )}
          </View>
        )}
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
          <IconX size={18} color={colors.foreground} />
          <ThemedText style={[styles.footerBtnText, { marginLeft: 8 }]}>Limpar Filtros</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>Aplicar Filtros</ThemedText>
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  dateRangeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  priceRangeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  priceInfo: {
    fontSize: 13,
    marginTop: 8,
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
    flexDirection: "row",
  },
  footerBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  customerOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  customerInfo: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as any,
  },
  selectedText: {
    fontWeight: fontWeight.semibold as any,
  },
});
