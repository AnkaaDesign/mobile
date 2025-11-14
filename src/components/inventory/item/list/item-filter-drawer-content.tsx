import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconPackage, IconTags, IconRuler, IconCoins, IconCalendar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useItemBrands, useItemCategories, useSuppliers } from "@/hooks";
import {
  MEASURE_UNIT,
  MEASURE_TYPE,
  STOCK_LEVEL,
  STOCK_LEVEL_LABELS,
  MEASURE_UNIT_LABELS,
  MEASURE_TYPE_LABELS,
  ITEM_CATEGORY_TYPE,
  ITEM_CATEGORY_TYPE_LABELS,
} from "@/constants";
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { DateRangeFilter } from '@/components/common/filters';
import type { ItemGetManyFormData } from '../../../../schemas';

interface ItemFilterDrawerContentProps {
  filters: Partial<ItemGetManyFormData>;
  onFiltersChange: (filters: Partial<ItemGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  isActive?: boolean;
  shouldAssignToUser?: boolean;
  stockLevels?: string[];
  brandIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];
  quantityRange?: { min?: number; max?: number };
  totalPriceRange?: { min?: number; max?: number };
  icmsRange?: { min?: number; max?: number };
  ipiRange?: { min?: number; max?: number };
  monthlyConsumptionRange?: { min?: number; max?: number };
  measureValueRange?: { min?: number; max?: number };
  measureUnits?: string[];
  measureTypes?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

const getStockLevelColor = (level: string, colors: any) => {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return "#737373";
    case STOCK_LEVEL.OUT_OF_STOCK:
      return "#ef4444";
    case STOCK_LEVEL.CRITICAL:
      return "#f97316";
    case STOCK_LEVEL.LOW:
      return "#eab308";
    case STOCK_LEVEL.OPTIMAL:
      return "#22c55e";
    case STOCK_LEVEL.OVERSTOCKED:
      return "#8b5cf6";
    default:
      return colors.foreground;
  }
};

export function ItemFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: ItemFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  const { data: brandsData } = useItemBrands({ limit: 100, orderBy: { name: "asc" } });
  const { data: categoriesData } = useItemCategories({ limit: 100, orderBy: { name: "asc" } });
  const { data: suppliersData } = useSuppliers({ limit: 100, orderBy: { fantasyName: "asc" } });

  const brands = brandsData?.data || [];
  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    isActive: filters.isActive,
    shouldAssignToUser: filters.shouldAssignToUser,
    stockLevels: filters.stockLevels || [],
    brandIds: filters.brandIds || [],
    categoryIds: filters.categoryIds || [],
    supplierIds: filters.supplierIds || [],
    quantityRange: filters.quantityRange,
    totalPriceRange: filters.totalPriceRange,
    icmsRange: filters.icmsRange,
    ipiRange: filters.ipiRange,
    monthlyConsumptionRange: filters.monthlyConsumptionRange,
    measureValueRange: filters.measureValueRange,
    measureUnits: filters.measureUnits || [],
    measureTypes: filters.measureTypes || [],
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
    updatedAfter: filters.updatedAt?.gte,
    updatedBefore: filters.updatedAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<ItemGetManyFormData> = {};

    if (localFilters.isActive !== undefined) {
      newFilters.isActive = localFilters.isActive;
    }
    if (localFilters.shouldAssignToUser !== undefined) {
      newFilters.shouldAssignToUser = localFilters.shouldAssignToUser;
    }
    if (localFilters.stockLevels && localFilters.stockLevels.length > 0) {
      newFilters.stockLevels = localFilters.stockLevels;
    }
    if (localFilters.brandIds && localFilters.brandIds.length > 0) {
      newFilters.brandIds = localFilters.brandIds;
    }
    if (localFilters.categoryIds && localFilters.categoryIds.length > 0) {
      newFilters.categoryIds = localFilters.categoryIds;
    }
    if (localFilters.supplierIds && localFilters.supplierIds.length > 0) {
      newFilters.supplierIds = localFilters.supplierIds;
    }
    if (localFilters.quantityRange?.min !== undefined || localFilters.quantityRange?.max !== undefined) {
      newFilters.quantityRange = localFilters.quantityRange;
    }
    if (localFilters.totalPriceRange?.min !== undefined || localFilters.totalPriceRange?.max !== undefined) {
      newFilters.totalPriceRange = localFilters.totalPriceRange;
    }
    if (localFilters.icmsRange?.min !== undefined || localFilters.icmsRange?.max !== undefined) {
      newFilters.icmsRange = localFilters.icmsRange;
    }
    if (localFilters.ipiRange?.min !== undefined || localFilters.ipiRange?.max !== undefined) {
      newFilters.ipiRange = localFilters.ipiRange;
    }
    if (localFilters.monthlyConsumptionRange?.min !== undefined || localFilters.monthlyConsumptionRange?.max !== undefined) {
      newFilters.monthlyConsumptionRange = localFilters.monthlyConsumptionRange;
    }
    if (localFilters.measureValueRange?.min !== undefined || localFilters.measureValueRange?.max !== undefined) {
      newFilters.measureValueRange = localFilters.measureValueRange;
    }
    if (localFilters.measureUnits && localFilters.measureUnits.length > 0) {
      newFilters.measureUnits = localFilters.measureUnits;
    }
    if (localFilters.measureTypes && localFilters.measureTypes.length > 0) {
      newFilters.measureTypes = localFilters.measureTypes;
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

  const brandOptions = useMemo(
    () => [
      { label: "Sem marca", value: "null" },
      ...brands.map((brand) => ({ label: brand.name, value: brand.id }))
    ],
    [brands]
  );

  const categoryOptions = useMemo(
    () => [
      { label: "Sem categoria", value: "null" },
      ...categories.map((category) => ({
        label: category.type === ITEM_CATEGORY_TYPE.PPE
          ? `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[ITEM_CATEGORY_TYPE.PPE]})`
          : `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[category.type]})`,
        value: category.id,
      }))
    ],
    [categories]
  );

  const supplierOptions = useMemo(
    () => [
      { label: "Sem fornecedor", value: "null" },
      ...suppliers.map((supplier) => ({ label: supplier.fantasyName, value: supplier.id }))
    ],
    [suppliers]
  );

  const measureUnitOptions = useMemo(
    () => Object.values(MEASURE_UNIT).map((unit) => ({
      label: MEASURE_UNIT_LABELS[unit] || unit,
      value: unit,
    })),
    []
  );

  const measureTypeOptions = useMemo(
    () => Object.values(MEASURE_TYPE).map((type) => ({
      label: MEASURE_TYPE_LABELS[type] || type,
      value: type,
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
          <ThemedText style={styles.title}>Filtros de Itens</ThemedText>
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
        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isActive: prev.isActive !== false ? false : undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Produtos Ativos</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Incluir apenas produtos ativos
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

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, shouldAssignToUser: !prev.shouldAssignToUser || undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Atribuir ao Usuário</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Atribuir produtos ao usuário
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={!!localFilters.shouldAssignToUser}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, shouldAssignToUser: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.shouldAssignToUser ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Stock Levels */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Nível de Estoque
            </ThemedText>
          </View>

          {Object.values(STOCK_LEVEL).map((level, index, arr) => {
            const levelLabel = STOCK_LEVEL_LABELS[level as keyof typeof STOCK_LEVEL_LABELS];
            if (!levelLabel) return null;

            const isChecked = (localFilters.stockLevels || []).includes(level);

            return (
              <View key={level} style={[styles.filterItem, { borderBottomWidth: index === arr.length - 1 ? 0 : 1, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.filterTouchable}
                  onPress={() => {
                    const currentLevels = localFilters.stockLevels || [];
                    if (isChecked) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        stockLevels: currentLevels.filter((l) => l !== level)
                      }));
                    } else {
                      setLocalFilters((prev) => ({
                        ...prev,
                        stockLevels: [...currentLevels, level]
                      }));
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.filterLabel, { color: getStockLevelColor(level, colors) }]}>
                    {levelLabel}
                  </ThemedText>
                </TouchableOpacity>
                <RNSwitch
                  value={isChecked}
                  onValueChange={(value) => {
                    const currentLevels = localFilters.stockLevels || [];
                    if (value) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        stockLevels: [...currentLevels, level]
                      }));
                    } else {
                      setLocalFilters((prev) => ({
                        ...prev,
                        stockLevels: currentLevels.filter((l) => l !== level)
                      }));
                    }
                  }}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={isChecked ? colors.primaryForeground : "#f4f3f4"}
                  ios_backgroundColor={colors.muted}
                />
              </View>
            );
          })}
        </View>

        {/* Entities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconTags size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Marcas, Categorias e Fornecedores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Marcas
            </ThemedText>
            <Combobox
              options={brandOptions}
              selectedValues={localFilters.brandIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, brandIds: values }))}
              placeholder={brands.length === 0 ? "Carregando marcas..." : "Selecione as marcas"}
              searchPlaceholder="Buscar marcas..."
              emptyText="Nenhuma marca encontrada"
              disabled={brands.length === 0}
              showBadges={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Categorias
            </ThemedText>
            <Combobox
              options={categoryOptions}
              selectedValues={localFilters.categoryIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, categoryIds: values }))}
              placeholder={categories.length === 0 ? "Carregando categorias..." : "Selecione as categorias"}
              searchPlaceholder="Buscar categorias..."
              emptyText="Nenhuma categoria encontrada"
              disabled={categories.length === 0}
              showBadges={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Fornecedores
            </ThemedText>
            <Combobox
              options={supplierOptions}
              selectedValues={localFilters.supplierIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, supplierIds: values }))}
              placeholder={suppliers.length === 0 ? "Carregando fornecedores..." : "Selecione os fornecedores"}
              searchPlaceholder="Buscar fornecedores..."
              emptyText="Nenhum fornecedor encontrado"
              disabled={suppliers.length === 0}
              showBadges={false}
            />
          </View>
        </View>

        {/* Measure Units & Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconRuler size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Unidades e Tipos de Medida
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Unidades de Medida
            </ThemedText>
            <Combobox
              options={measureUnitOptions}
              selectedValues={localFilters.measureUnits || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, measureUnits: values }))}
              placeholder="Selecione as unidades de medida"
              searchPlaceholder="Buscar unidades..."
              emptyText="Nenhuma unidade encontrada"
              showBadges={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Tipos de Medida
            </ThemedText>
            <Combobox
              options={measureTypeOptions}
              selectedValues={localFilters.measureTypes || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, measureTypes: values }))}
              placeholder="Selecione os tipos de medida"
              searchPlaceholder="Buscar tipos..."
              emptyText="Nenhum tipo encontrado"
              showBadges={false}
            />
          </View>
        </View>

        {/* Ranges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCoins size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Faixas de Valores
            </ThemedText>
          </View>

          <View style={styles.rangeGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Quantidade em Estoque
            </ThemedText>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={localFilters.quantityRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    quantityRange: {
                      ...prev.quantityRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeSeparator, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={localFilters.quantityRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    quantityRange: {
                      ...prev.quantityRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>

          <View style={styles.rangeGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Preço Total (R$)
            </ThemedText>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={localFilters.totalPriceRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    totalPriceRange: {
                      ...prev.totalPriceRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeSeparator, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={localFilters.totalPriceRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    totalPriceRange: {
                      ...prev.totalPriceRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>

          <View style={styles.rangeGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              ICMS (%)
            </ThemedText>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={localFilters.icmsRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    icmsRange: {
                      ...prev.icmsRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeSeparator, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={localFilters.icmsRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    icmsRange: {
                      ...prev.icmsRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>

          <View style={styles.rangeGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              IPI (%)
            </ThemedText>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={localFilters.ipiRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    ipiRange: {
                      ...prev.ipiRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeSeparator, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={localFilters.ipiRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    ipiRange: {
                      ...prev.ipiRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>

          <View style={styles.rangeGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Consumo Mensal
            </ThemedText>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={localFilters.monthlyConsumptionRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    monthlyConsumptionRange: {
                      ...prev.monthlyConsumptionRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeSeparator, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={localFilters.monthlyConsumptionRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    monthlyConsumptionRange: {
                      ...prev.monthlyConsumptionRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>

          <View style={styles.rangeGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Valor de Medida
            </ThemedText>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={localFilters.measureValueRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    measureValueRange: {
                      ...prev.measureValueRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeSeparator, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={localFilters.measureValueRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    measureValueRange: {
                      ...prev.measureValueRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Datas
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <DateRangeFilter
              label="Data de Criação"
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

          <View style={styles.inputGroup}>
            <DateRangeFilter
              label="Data de Atualização"
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
  rangeGroup: {
    marginBottom: 12,
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    fontSize: 14,
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
