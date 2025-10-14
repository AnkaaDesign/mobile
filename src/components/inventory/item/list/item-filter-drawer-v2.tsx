import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Switch as RNSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { Drawer } from "@/components/ui/drawer";
import type { ItemGetManyFormData } from '../../../../schemas';

interface ItemFilterDrawerV2Props {
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
}

type SectionKey = "status" | "stock" | "entities" | "ranges";

interface FilterSection {
  key: SectionKey;
  title: string;
  component: React.ReactNode;
}

const getStockLevelColor = (level: string) => {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK: return "#737373";
    case STOCK_LEVEL.OUT_OF_STOCK: return "#b91c1c";
    case STOCK_LEVEL.CRITICAL: return "#f97316";
    case STOCK_LEVEL.LOW: return "#eab308";
    case STOCK_LEVEL.OPTIMAL: return "#15803d";
    case STOCK_LEVEL.OVERSTOCKED: return "#8b5cf6";
    default: return "#737373";
  }
};

const SectionHeader = React.memo<{
  title: string;
  isExpanded: boolean;
  onPress: () => void;
  colors: any;
}>(({ title, isExpanded, onPress, colors }) => (
  <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    {isExpanded ? (
      <IconChevronDown size={20} color={colors.foreground} />
    ) : (
      <IconChevronRight size={20} color={colors.foreground} />
    )}
  </TouchableOpacity>
));

SectionHeader.displayName = "SectionHeader";

export function ItemFilterDrawerV2({ visible, onClose, onApply, currentFilters }: ItemFilterDrawerV2Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status", "entities"])
  );

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

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

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

    onApply(cleanFilters);
  }, [filters, onApply]);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  const sections: FilterSection[] = useMemo(() => [
    {
      key: "status" as const,
      title: "Status",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Label style={styles.label}>Apenas ativos</Label>
            <RNSwitch
              value={filters.isActive !== false}
              onValueChange={(value) => handleToggle("isActive", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={filters.isActive !== false ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Atribuir ao usuário</Label>
            <RNSwitch
              value={!!filters.shouldAssignToUser}
              onValueChange={(value) => handleToggle("shouldAssignToUser", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.shouldAssignToUser ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
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
            const isChecked = (filters.stockLevels || []).includes(level);

            return (
              <View key={level} style={styles.row}>
                <ThemedText style={[styles.label, { color: getStockLevelColor(level) }]}>
                  {levelLabel}
                </ThemedText>
                <RNSwitch
                  value={isChecked}
                  onValueChange={(value) => {
                    const currentLevels = filters.stockLevels || [];
                    if (value) {
                      handleArrayChange("stockLevels", [...currentLevels, level]);
                    } else {
                      handleArrayChange("stockLevels", currentLevels.filter((l) => l !== level));
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
      ),
    },
    {
      key: "entities" as const,
      title: "Marcas, Categorias e Fornecedores",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Marcas</Label>
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
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Categorias</Label>
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
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Fornecedores</Label>
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
      key: "ranges" as const,
      title: "Faixas de Valores",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Quantidade</Label>
            <View style={styles.rangeRow}>
              <Input
                placeholder="Mín"
                value={filters.quantityRange?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("quantityRange", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeText, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={filters.quantityRange?.max?.toString() || ""}
                onChangeText={(value) => handleRangeChange("quantityRange", "max", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Preço Total (R$)</Label>
            <View style={styles.rangeRow}>
              <Input
                placeholder="Mín"
                value={filters.totalPriceRange?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("totalPriceRange", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeText, { color: colors.mutedForeground }]}>até</ThemedText>
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
      <View>
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
      closeOnSwipe={false}
      style={{ borderTopWidth: 0 }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 8
        }]}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.title}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listWrapper}>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 16)
        }]}>
          <Button
            variant="outline"
            size="default"
            onPress={handleClear}
            style={styles.btn}
            disabled={activeFilterCount === 0}
          >
            {activeFilterCount > 0 ? `Limpar (${activeFilterCount})` : "Limpar"}
          </Button>
          <Button variant="default" size="default" onPress={handleApply} style={styles.btn}>
            Aplicar
          </Button>
        </View>
      </View>
    </Drawer>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderTopWidth: 0,
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
  listWrapper: {
    flex: 1,
  },
  list: {
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
  rangeText: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
  separator: {
    marginVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
  },
});
