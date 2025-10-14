import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useItemBrands, useItemCategories, useSuppliers } from '../../../../hooks';
import {
  MEASURE_UNIT,
  MEASURE_TYPE,
  STOCK_LEVEL,
  STOCK_LEVEL_LABELS,
  MEASURE_UNIT_LABELS,
  MEASURE_TYPE_LABELS,
  ITEM_CATEGORY_TYPE,
  ITEM_CATEGORY_TYPE_LABELS,
} from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter } from "@/components/ui/drawer";
import type { ItemGetManyFormData } from '../../../../schemas';

interface ItemFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ItemGetManyFormData>) => void;
  currentFilters: Partial<ItemGetManyFormData>;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  isActive?: boolean;
  shouldAssignToUser?: boolean;
  stockLevels?: string[];
  brandIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];
  quantityRange?: FilterRange;
  totalPriceRange?: FilterRange;
  taxRange?: FilterRange;
  monthlyConsumptionRange?: FilterRange;
  measureValueRange?: FilterRange;
  measureUnits?: string[];
  measureTypes?: string[];
  createdDateRange?: { start?: Date; end?: Date };
  updatedDateRange?: { start?: Date; end?: Date };
}

type SectionKey = "status" | "stock" | "entities" | "measureUnits" | "measureTypes" | "ranges" | "dates";

interface FilterSection {
  key: SectionKey;
  title: string;
  component: React.ReactNode;
}

const getStockLevelColor = (level: string) => {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return "#737373";
    case STOCK_LEVEL.OUT_OF_STOCK:
      return "#b91c1c";
    case STOCK_LEVEL.CRITICAL:
      return "#f97316";
    case STOCK_LEVEL.LOW:
      return "#eab308";
    case STOCK_LEVEL.OPTIMAL:
      return "#15803d";
    case STOCK_LEVEL.OVERSTOCKED:
      return "#8b5cf6";
    default:
      return "#737373";
  }
};

// Memoized section header component
const SectionHeader = React.memo<{
  title: string;
  isExpanded: boolean;
  onPress: () => void;
  colors: any;
}>(({ title, isExpanded, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.sectionHeader, { backgroundColor: colors.background }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    {isExpanded ? (
      <IconChevronDown size={20} color={colors.foreground} />
    ) : (
      <IconChevronRight size={20} color={colors.foreground} />
    )}
  </TouchableOpacity>
));

SectionHeader.displayName = "SectionHeader";

export function ItemFilterDrawer({ visible, onClose, onApply, currentFilters }: ItemFilterDrawerProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status", "entities"])
  );

  // Lazy load filter options only when entities section is expanded
  const shouldLoadEntities = expandedSections.has("entities");

  const { data: brandsData } = useItemBrands({
    limit: 100,
    orderBy: { name: "asc" },
    enabled: shouldLoadEntities
  });
  const { data: categoriesData } = useItemCategories({
    limit: 100,
    orderBy: { name: "asc" },
    enabled: shouldLoadEntities
  });
  const { data: suppliersData } = useSuppliers({
    limit: 100,
    orderBy: { fantasyName: "asc" },
    enabled: shouldLoadEntities
  });

  const brands = brandsData?.data || [];
  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];

  // Reset filters when drawer opens
  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.isActive === false) count++;
    if (filters.shouldAssignToUser) count++;
    if (filters.stockLevels?.length) count++;
    if (filters.brandIds?.length) count++;
    if (filters.categoryIds?.length) count++;
    if (filters.supplierIds?.length) count++;
    if (filters.quantityRange?.min !== undefined || filters.quantityRange?.max !== undefined) count++;
    if (filters.totalPriceRange?.min !== undefined || filters.totalPriceRange?.max !== undefined) count++;
    if (filters.taxRange?.min !== undefined || filters.taxRange?.max !== undefined) count++;
    if (filters.monthlyConsumptionRange?.min !== undefined || filters.monthlyConsumptionRange?.max !== undefined) count++;
    if (filters.measureValueRange?.min !== undefined || filters.measureValueRange?.max !== undefined) count++;
    if (filters.measureUnits?.length) count++;
    if (filters.measureTypes?.length) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) count++;
    return count;
  }, [filters]);

  const handleToggle = useCallback((key: keyof FilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'isActive' ? value : (value || undefined),
    }));
  }, []);

  const handleArrayChange = useCallback((key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  }, []);

  const handleRangeChange = useCallback((key: keyof FilterState, field: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as FilterRange) || {}),
        [field]: numValue,
      },
    }));
  }, []);

  const toggleSection = useCallback((sectionKey: SectionKey) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  const handleApply = useCallback(() => {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) return acc;
        if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
          const cleanObj = Object.entries(value).reduce((objAcc, [objKey, objValue]) => {
            if (objValue !== undefined && objValue !== null && objValue !== "") {
              objAcc[objKey] = objValue;
            }
            return objAcc;
          }, {} as any);
          if (Object.keys(cleanObj).length > 0) {
            acc[key] = cleanObj;
          }
        } else if (value !== "") {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as any);

    // Transform date ranges
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      cleanFilters.createdAt = {
        ...(filters.createdDateRange.start && { gte: filters.createdDateRange.start }),
        ...(filters.createdDateRange.end && { lte: filters.createdDateRange.end }),
      };
      delete cleanFilters.createdDateRange;
    }
    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) {
      cleanFilters.updatedAt = {
        ...(filters.updatedDateRange.start && { gte: filters.updatedDateRange.start }),
        ...(filters.updatedDateRange.end && { lte: filters.updatedDateRange.end }),
      };
      delete cleanFilters.updatedDateRange;
    }

    onApply(cleanFilters);
  }, [filters, onApply]);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  // Build sections with content
  const sections: FilterSection[] = useMemo(() => [
    {
      key: "status" as const,
      title: "Status e Características",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Apenas produtos ativos</Label>
            <Switch
              checked={filters.isActive !== false}
              onCheckedChange={(value) => handleToggle("isActive", value)}
            />
          </View>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Atribuir ao usuário</Label>
            <Switch
              checked={!!filters.shouldAssignToUser}
              onCheckedChange={(value) => handleToggle("shouldAssignToUser", value)}
            />
          </View>
        </View>
      ),
    },
    {
      key: "stock" as const,
      title: "Nível de Estoque",
      component: (
        <View style={styles.sectionContent}>
          {Object.values(STOCK_LEVEL).map((level) => {
            const levelLabel = STOCK_LEVEL_LABELS[level as keyof typeof STOCK_LEVEL_LABELS];
            if (!levelLabel) return null;

            return (
              <View key={level} style={styles.switchOption}>
                <ThemedText style={[styles.stockLevelLabel, { color: getStockLevelColor(level) }]}>
                  {levelLabel}
                </ThemedText>
                <Switch
                  checked={(filters.stockLevels || []).includes(level)}
                  onCheckedChange={(value) => {
                    const currentLevels = filters.stockLevels || [];
                    if (value) {
                      handleArrayChange("stockLevels", [...currentLevels, level]);
                    } else {
                      handleArrayChange("stockLevels", currentLevels.filter((l) => l !== level));
                    }
                  }}
                />
              </View>
            );
          })}
        </View>
      ),
    },
    {
      key: "entities" as const,
      title: "Marcas, Categorias e Fornecedores",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.entitySection}>
            <Label style={styles.entityLabel}>Marcas</Label>
            <MultiCombobox
              options={[
                { label: "Sem marca", value: "null" },
                ...brands.map((brand) => ({ label: brand.name, value: brand.id }))
              ]}
              selectedValues={filters.brandIds || []}
              onValueChange={(value) => handleArrayChange("brandIds", value)}
              placeholder={brands.length === 0 ? "Carregando..." : "Selecione"}
              showBadges={false}
              disabled={brands.length === 0}
            />
          </View>
          <View style={styles.entitySection}>
            <Label style={styles.entityLabel}>Categorias</Label>
            <MultiCombobox
              options={[
                { label: "Sem categoria", value: "null" },
                ...categories.map((cat) => ({
                  label: cat.type === ITEM_CATEGORY_TYPE.PPE
                    ? `${cat.name} (${ITEM_CATEGORY_TYPE_LABELS[ITEM_CATEGORY_TYPE.PPE]})`
                    : `${cat.name} (${ITEM_CATEGORY_TYPE_LABELS[cat.type]})`,
                  value: cat.id,
                }))
              ]}
              selectedValues={filters.categoryIds || []}
              onValueChange={(value) => handleArrayChange("categoryIds", value)}
              placeholder={categories.length === 0 ? "Carregando..." : "Selecione"}
              showBadges={false}
              disabled={categories.length === 0}
            />
          </View>
          <View style={styles.entitySection}>
            <Label style={styles.entityLabel}>Fornecedores</Label>
            <MultiCombobox
              options={[
                { label: "Sem fornecedor", value: "null" },
                ...suppliers.map((sup) => ({ label: sup.fantasyName, value: sup.id }))
              ]}
              selectedValues={filters.supplierIds || []}
              onValueChange={(value) => handleArrayChange("supplierIds", value)}
              placeholder={suppliers.length === 0 ? "Carregando..." : "Selecione"}
              showBadges={false}
              disabled={suppliers.length === 0}
            />
          </View>
        </View>
      ),
    },
    {
      key: "measureUnits" as const,
      title: "Unidades de Medida",
      component: (
        <View style={styles.sectionContent}>
          <MultiCombobox
            options={Object.values(MEASURE_UNIT).map((unit) => ({
              label: MEASURE_UNIT_LABELS[unit] || unit,
              value: unit,
            }))}
            selectedValues={filters.measureUnits || []}
            onValueChange={(value) => handleArrayChange("measureUnits", value)}
            placeholder="Selecione"
            showBadges={false}
          />
        </View>
      ),
    },
    {
      key: "measureTypes" as const,
      title: "Tipos de Medida",
      component: (
        <View style={styles.sectionContent}>
          <MultiCombobox
            options={Object.values(MEASURE_TYPE).map((type) => ({
              label: MEASURE_TYPE_LABELS[type] || type,
              value: type,
            }))}
            selectedValues={filters.measureTypes || []}
            onValueChange={(value) => handleArrayChange("measureTypes", value)}
            placeholder="Selecione"
            showBadges={false}
          />
        </View>
      ),
    },
    {
      key: "ranges" as const,
      title: "Faixas de Valores",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.rangeSection}>
            <Label style={styles.rangeLabel}>Quantidade</Label>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={filters.quantityRange?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("quantityRange", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeTo, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={filters.quantityRange?.max?.toString() || ""}
                onChangeText={(value) => handleRangeChange("quantityRange", "max", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
          <View style={styles.rangeSection}>
            <Label style={styles.rangeLabel}>Preço Total (R$)</Label>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={filters.totalPriceRange?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("totalPriceRange", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeTo, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={filters.totalPriceRange?.max?.toString() || ""}
                onChangeText={(value) => handleRangeChange("totalPriceRange", "max", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
        </View>
      ),
    },
  ], [filters, brands, categories, suppliers, colors, handleToggle, handleArrayChange, handleRangeChange]);

  const renderSection = useCallback(({ item }: { item: FilterSection }) => {
    const isExpanded = expandedSections.has(item.key);

    return (
      <View style={styles.section}>
        <SectionHeader
          title={item.title}
          isExpanded={isExpanded}
          onPress={() => toggleSection(item.key)}
          colors={colors}
        />
        {isExpanded && item.component}
        <Separator style={styles.separator} />
      </View>
    );
  }, [expandedSections, toggleSection, colors]);

  const keyExtractor = useCallback((item: FilterSection) => item.key, []);

  return (
    <Drawer
      open={visible}
      onOpenChange={onClose}
      side="right"
      width="90%"
      closeOnBackdropPress={true}
      closeOnSwipe={true}
    >
      <View style={styles.drawerContainer}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.headerTitle}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Filter sections list */}
        <View style={styles.listContainer}>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footerContainer, { borderTopColor: colors.border }]}>
          <View style={styles.footer}>
            <Button
              variant="outline"
              size="default"
              onPress={handleClear}
              style={styles.footerButton}
              disabled={activeFilterCount === 0}
            >
              {activeFilterCount > 0 ? `Limpar (${activeFilterCount})` : "Limpar"}
            </Button>
            <Button
              variant="default"
              size="default"
              onPress={handleApply}
              style={styles.footerButton}
            >
              Aplicar
            </Button>
          </View>
        </View>
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  section: {
    marginVertical: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  switchOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  optionLabel: {
    fontSize: fontSize.base,
    flex: 1,
  },
  stockLevelLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  entitySection: {
    gap: spacing.sm,
  },
  entityLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  rangeSection: {
    gap: spacing.sm,
  },
  rangeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rangeInput: {
    flex: 1,
  },
  rangeTo: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.xs,
  },
  separator: {
    marginVertical: spacing.sm,
  },
  footerContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
  },
});
