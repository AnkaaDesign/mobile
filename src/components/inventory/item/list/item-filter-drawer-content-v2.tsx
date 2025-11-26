/**
 * Item Filter Drawer - Refactored Version
 *
 * This is the new implementation using common filter components with icons.
 * Features:
 * - Flat list structure (no sections)
 * - Icons for every filter
 * - Consistent spacing and visual hierarchy
 * - Uses reusable filter components
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { IconFilter, IconX, IconCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getFilterIcon } from '@/lib/filter-icon-mapping';
import {
  StringFilter,
  BooleanFilter,
  MultiSelectFilter,
  NumericRangeFilter,
  DateRangeFilter,
} from '@/components/common/filters';
import { useItemBrands, useItemCategories, useSuppliers } from '@/hooks';
import {
  STOCK_LEVEL,
  STOCK_LEVEL_LABELS,
  MEASURE_UNIT,
  MEASURE_UNIT_LABELS,
  MEASURE_TYPE,
  MEASURE_TYPE_LABELS,
  ITEM_CATEGORY_TYPE,
  ITEM_CATEGORY_TYPE_LABELS,
} from '@/constants';
import { spacing } from '@/constants/design-system';
import type { ItemGetManyFormData } from '@/schemas';

interface ItemFilterDrawerContentV2Props {
  filters: Partial<ItemGetManyFormData>;
  onFiltersChange: (filters: Partial<ItemGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function ItemFilterDrawerContentV2({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: ItemFilterDrawerContentV2Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Fetch options data
  const { data: brandsData } = useItemBrands({ limit: 100, orderBy: { name: 'asc' } });
  const { data: categoriesData } = useItemCategories({ limit: 100, orderBy: { name: 'asc' } });
  const { data: suppliersData } = useSuppliers({ limit: 100, orderBy: { fantasyName: 'asc' } });

  const brands = brandsData?.data || [];
  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];

  // Local filter state
  const [localFilters, setLocalFilters] = useState<Partial<ItemGetManyFormData>>(filters);

  // Sync local state when drawer opens
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Prepare options
  const brandOptions = useMemo(
    () => [
      { label: 'Sem marca', value: 'null' },
      ...brands.map((brand) => ({ label: brand.name, value: brand.id })),
    ],
    [brands]
  );

  const categoryOptions = useMemo(
    () => [
      { label: 'Sem categoria', value: 'null' },
      ...categories.map((category) => ({
        label: category.type === ITEM_CATEGORY_TYPE.PPE
          ? `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[ITEM_CATEGORY_TYPE.PPE]})`
          : `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[category.type]})`,
        value: category.id,
      })),
    ],
    [categories]
  );

  const supplierOptions = useMemo(
    () => [
      { label: 'Sem fornecedor', value: 'null' },
      ...suppliers.map((supplier) => ({ label: supplier.fantasyName, value: supplier.id })),
    ],
    [suppliers]
  );

  const stockLevelOptions = useMemo(
    () =>
      Object.values(STOCK_LEVEL).map((level) => ({
        label: STOCK_LEVEL_LABELS[level as keyof typeof STOCK_LEVEL_LABELS] || level,
        value: level,
      })),
    []
  );

  const measureUnitOptions = useMemo(
    () =>
      Object.values(MEASURE_UNIT).map((unit) => ({
        label: MEASURE_UNIT_LABELS[unit] || unit,
        value: unit,
      })),
    []
  );

  const measureTypeOptions = useMemo(
    () =>
      Object.values(MEASURE_TYPE).map((type) => ({
        label: MEASURE_TYPE_LABELS[type] || type,
        value: type,
      })),
    []
  );

  // Handlers
  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose?.();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const updateFilter = useCallback((key: string, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      paddingTop: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
    },
    closeButton: {
      padding: 4,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md) + 80,
      gap: spacing.lg, // Consistent spacing between ALL filters
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    footerButton: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconFilter size={24} color={colors.foreground} />
          <Text style={styles.title}>Filtros</Text>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              <Text style={{ fontSize: 12, fontWeight: '600' }}>
                {activeFiltersCount}
              </Text>
            </Badge>
          )}
        </View>
        <Button variant="ghost" size="sm" onPress={onClose} style={styles.closeButton}>
          <IconX size={20} color={colors.mutedForeground} />
        </Button>
      </View>

      {/* Filter List - Flat structure with icons */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Boolean: Active Status */}
        <BooleanFilter
          label="Apenas itens ativos"
          icon={getFilterIcon('isActive')}
          description="Mostrar somente produtos ativos"
          value={localFilters.isActive !== false}
          onChange={(v) => updateFilter('isActive', v ? undefined : false)}
        />

        <Separator />

        {/* Boolean: Should Assign to User */}
        <BooleanFilter
          label="Atribuir ao usuário"
          icon={getFilterIcon('shouldAssignToUser')}
          description="Produtos que devem ser atribuídos ao usuário"
          value={!!localFilters.shouldAssignToUser}
          onChange={(v) => updateFilter('shouldAssignToUser', v || undefined)}
        />

        <Separator />

        {/* Multi-Select: Stock Levels */}
        <MultiSelectFilter
          label="Nível de Estoque"
          icon={getFilterIcon('stockLevels')}
          value={localFilters.stockLevels || []}
          onChange={(v) => updateFilter('stockLevels', v.length > 0 ? v : undefined)}
          options={stockLevelOptions}
          placeholder="Selecione os níveis"
        />

        <Separator />

        {/* Multi-Select: Brands */}
        <MultiSelectFilter
          label="Marcas"
          icon={getFilterIcon('brandIds')}
          value={localFilters.brandIds || []}
          onChange={(v) => updateFilter('brandIds', v.length > 0 ? v : undefined)}
          options={brandOptions}
          placeholder={brands.length === 0 ? 'Carregando marcas...' : 'Selecione as marcas'}
        />

        <Separator />

        {/* Multi-Select: Categories */}
        <MultiSelectFilter
          label="Categorias"
          icon={getFilterIcon('categoryIds')}
          value={localFilters.categoryIds || []}
          onChange={(v) => updateFilter('categoryIds', v.length > 0 ? v : undefined)}
          options={categoryOptions}
          placeholder={categories.length === 0 ? 'Carregando categorias...' : 'Selecione as categorias'}
        />

        <Separator />

        {/* Multi-Select: Suppliers */}
        <MultiSelectFilter
          label="Fornecedores"
          icon={getFilterIcon('supplierIds')}
          value={localFilters.supplierIds || []}
          onChange={(v) => updateFilter('supplierIds', v.length > 0 ? v : undefined)}
          options={supplierOptions}
          placeholder={suppliers.length === 0 ? 'Carregando fornecedores...' : 'Selecione os fornecedores'}
        />

        <Separator />

        {/* Multi-Select: Measure Units */}
        <MultiSelectFilter
          label="Unidades de Medida"
          icon={getFilterIcon('measureUnit')}
          value={localFilters.measureUnits || []}
          onChange={(v) => updateFilter('measureUnits', v.length > 0 ? v : undefined)}
          options={measureUnitOptions}
          placeholder="Selecione as unidades"
        />

        <Separator />

        {/* Multi-Select: Measure Types */}
        <MultiSelectFilter
          label="Tipos de Medida"
          icon={getFilterIcon('measureType')}
          value={localFilters.measureTypes || []}
          onChange={(v) => updateFilter('measureTypes', v.length > 0 ? v : undefined)}
          options={measureTypeOptions}
          placeholder="Selecione os tipos"
        />

        <Separator />

        {/* Numeric Range: Quantity */}
        <NumericRangeFilter
          label="Quantidade em Estoque"
          icon={getFilterIcon('quantityRange')}
          value={localFilters.quantityRange}
          onChange={(v) => updateFilter('quantityRange', v)}
          minPlaceholder="Mínimo"
          maxPlaceholder="Máximo"
          suffix=" unid."
        />

        <Separator />

        {/* Numeric Range: Total Price */}
        <NumericRangeFilter
          label="Preço Total"
          icon={getFilterIcon('priceRange')}
          value={localFilters.totalPriceRange}
          onChange={(v) => updateFilter('totalPriceRange', v)}
          prefix="R$ "
          minPlaceholder="Mínimo"
          maxPlaceholder="Máximo"
          decimalPlaces={2}
        />

        <Separator />

        {/* Numeric Range: ICMS */}
        <NumericRangeFilter
          label="ICMS"
          icon={getFilterIcon('icmsRange')}
          value={localFilters.icmsRange}
          onChange={(v) => updateFilter('icmsRange', v)}
          suffix="%"
          minPlaceholder="Mínimo"
          maxPlaceholder="Máximo"
          decimalPlaces={2}
        />

        <Separator />

        {/* Numeric Range: IPI */}
        <NumericRangeFilter
          label="IPI"
          icon={getFilterIcon('ipiRange')}
          value={localFilters.ipiRange}
          onChange={(v) => updateFilter('ipiRange', v)}
          suffix="%"
          minPlaceholder="Mínimo"
          maxPlaceholder="Máximo"
          decimalPlaces={2}
        />

        <Separator />

        {/* Numeric Range: Monthly Consumption */}
        <NumericRangeFilter
          label="Consumo Mensal"
          icon={getFilterIcon('monthlyConsumptionRange')}
          value={localFilters.monthlyConsumptionRange}
          onChange={(v) => updateFilter('monthlyConsumptionRange', v)}
          minPlaceholder="Mínimo"
          maxPlaceholder="Máximo"
        />

        <Separator />

        {/* Numeric Range: Measure Value */}
        <NumericRangeFilter
          label="Valor de Medida"
          icon={getFilterIcon('measureValueRange')}
          value={localFilters.measureValueRange}
          onChange={(v) => updateFilter('measureValueRange', v)}
          minPlaceholder="Mínimo"
          maxPlaceholder="Máximo"
          decimalPlaces={2}
        />

        <Separator />

        {/* Date Range: Created At */}
        <DateRangeFilter
          label="Data de Criação"
          icon={getFilterIcon('createdAt')}
          value={{
            from: localFilters.createdAt?.gte,
            to: localFilters.createdAt?.lte,
          }}
          onChange={(range) => {
            if (range) {
              updateFilter('createdAt', {
                gte: range.from,
                lte: range.to,
              });
            } else {
              updateFilter('createdAt', undefined);
            }
          }}
          showPresets={true}
        />

        <Separator />

        {/* Date Range: Updated At */}
        <DateRangeFilter
          label="Data de Atualização"
          icon={getFilterIcon('updatedAt')}
          value={{
            from: localFilters.updatedAt?.gte,
            to: localFilters.updatedAt?.lte,
          }}
          onChange={(range) => {
            if (range) {
              updateFilter('updatedAt', {
                gte: range.from,
                lte: range.to,
              });
            } else {
              updateFilter('updatedAt', undefined);
            }
          }}
          showPresets={true}
        />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
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
