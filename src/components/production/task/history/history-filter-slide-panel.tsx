import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getFilterIcon } from '@/lib/filter-icon-mapping';
import {
  MultiSelectFilter,
  DateRangeFilter,
  NumericRangeFilter,
} from '@/components/common/filters';
import { TASK_STATUS, TASK_STATUS_LABELS } from '@/constants';
import { useSectors, useCustomers, useUsers } from '@/hooks';
import { spacing } from '@/constants/design-system';

interface HistoryFilterSlidePanelProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  onClose: () => void;
  activeFiltersCount: number;
  canViewPrice?: boolean;
  canViewStatusFilter?: boolean;
}

// Move default status values outside component to prevent re-creation on every render
const DEFAULT_STATUS_VALUES = [TASK_STATUS.COMPLETED];

export function HistoryFilterSlidePanel({
  filters,
  onFiltersChange,
  onClear,
  onClose,
  activeFiltersCount,
  canViewPrice = false,
  canViewStatusFilter = true,
}: HistoryFilterSlidePanelProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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

  // Initialize localFilters with filters value or defaults
  const [localFilters, setLocalFilters] = useState(() => ({
    ...filters,
    status: filters?.status || DEFAULT_STATUS_VALUES,
  }));

  // Reset local state when filters change
  useEffect(() => {
    setLocalFilters({
      ...filters,
      status: filters?.status || DEFAULT_STATUS_VALUES,
    });
  }, [filters]);

  const updateFilter = useCallback((key: string, value: any) => {
    setLocalFilters((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({
      status: DEFAULT_STATUS_VALUES,
    });
    onClear();
  }, [onClear]);

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
          <Text style={styles.title}>Filtros de Histórico</Text>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              <Text style={{ fontSize: 12, fontWeight: '600' }}>
                {activeFiltersCount}
              </Text>
            </Badge>
          )}
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Filter List - Flat structure with icons */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {
          paddingBottom: Math.max(insets.bottom, 16) + 90,
          gap: spacing.lg
        }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Multi-Select: Status - Only for Admin and Financial */}
        {canViewStatusFilter && (
          <>
            <MultiSelectFilter
              label="Status das Tarefas"
              icon={getFilterIcon('status')}
              value={localFilters.status || []}
              onChange={(values) => updateFilter('status', values.length > 0 ? values : undefined)}
              options={statusOptions}
              placeholder="Selecione os status"
            />
            <Separator />
          </>
        )}

        {/* Date Range: Finished Date */}
        <DateRangeFilter
          label="Data de Finalização"
          icon={getFilterIcon('finishedDateRange')}
          value={{
            from: localFilters.finishedDateRange?.from,
            to: localFilters.finishedDateRange?.to,
          }}
          onChange={(range) => updateFilter('finishedDateRange', range)}
          showPresets={true}
        />

        <Separator />

        {/* Multi-Select: Sectors */}
        <MultiSelectFilter
          label="Setores"
          icon={getFilterIcon('sectorIds')}
          value={localFilters.sectorIds || []}
          onChange={(values) => updateFilter('sectorIds', values.length > 0 ? values : undefined)}
          options={sectorOptions}
          placeholder={sectorsData?.data ? 'Selecione os setores' : 'Carregando setores...'}
        />

        <Separator />

        {/* Multi-Select: Customers */}
        <MultiSelectFilter
          label="Clientes"
          icon={getFilterIcon('customerIds')}
          value={localFilters.customerIds || []}
          onChange={(values) => updateFilter('customerIds', values.length > 0 ? values : undefined)}
          options={customerOptions}
          placeholder={customersData?.data ? 'Selecione os clientes' : 'Carregando clientes...'}
        />

        <Separator />

        {/* Multi-Select: Users/Assignees */}
        <MultiSelectFilter
          label="Finalizado por"
          icon={getFilterIcon('assigneeIds')}
          value={localFilters.assigneeIds || []}
          onChange={(values) => updateFilter('assigneeIds', values.length > 0 ? values : undefined)}
          options={userOptions}
          placeholder={usersData?.data ? 'Selecione os usuários' : 'Carregando usuários...'}
        />

        {/* Price Range - Only for Admin and Leader */}
        {canViewPrice && (
          <>
            <Separator />
            <NumericRangeFilter
              label="Faixa de Valor"
              icon={getFilterIcon('priceRange')}
              value={localFilters.priceRange}
              onChange={(v) => updateFilter('priceRange', v)}
              prefix="R$ "
              minPlaceholder="Mínimo"
              maxPlaceholder="Máximo"
              decimalPlaces={2}
            />
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <Button
          variant="outline"
          onPress={handleClear}
          style={styles.footerButton}
        >
          <IconX size={18} color={colors.foreground} />
          <Text style={{ marginLeft: spacing.xs }}>Limpar</Text>
        </Button>
        <Button
          variant="default"
          onPress={handleApply}
          style={styles.footerButton}
        >
          <IconCheck size={18} color={colors.background} />
          <Text style={{ marginLeft: spacing.xs, color: colors.background }}>
            Aplicar
          </Text>
        </Button>
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
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
