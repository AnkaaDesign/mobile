import React from "react";
import { View, ScrollView, TouchableOpacity, ViewStyle, TextStyle, StyleSheet } from "react-native";
import {
  IconX,
  IconSearch,
  IconTags,
  IconChartBar,
  IconPackage,
  IconCurrencyDollar,
  IconChartPie,
  IconBox,
  IconPackage as IconBoxMultiple,
  IconId,
  IconUser,
  IconEye,
  IconTrendingDown,
  IconRuler,
  IconCalculator,
  IconAlertTriangle,
  IconTarget,
  IconQuestionMark,
  IconMinus,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useItemBrands, useItemCategories, useSuppliers } from '../../../../hooks';
import { MEASURE_UNIT, STOCK_LEVEL, STOCK_LEVEL_LABELS, ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface ItemFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function ItemFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: ItemFilterTagsProps) {
  const { colors } = useTheme();

  // Load filter options for label lookup
  const { data: brandsData } = useItemBrands({ limit: 100 });
  const { data: categoriesData } = useItemCategories({ limit: 100 });
  const { data: suppliersData } = useSuppliers({ limit: 100, orderBy: { fantasyName: "asc" } });

  const brands = brandsData?.data || [];
  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];

  // Helper function to find option label by ID
  const getOptionLabel = (options: any[], id: string) => {
    const option = options.find((opt) => opt.id === id);
    return option?.name || option?.fantasyName || id;
  };

  // Remove individual filter
  const removeFilter = (filterKey: string, filterId?: string) => {
    const newFilters = { ...filters };

    if (filterId && Array.isArray(newFilters[filterKey])) {
      // Remove specific ID from array
      const newArray = newFilters[filterKey].filter((id: string) => id !== filterId);
      newFilters[filterKey] = newArray.length > 0 ? newArray : undefined;
    } else {
      // Remove entire filter
      newFilters[filterKey] = undefined;
    }

    // Clean undefined values
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === undefined) {
        delete newFilters[key as keyof typeof newFilters];
      }
    });

    onFilterChange(newFilters);
  };

  // Generate all filter tags
  const renderFilterTags = () => {
    const tags = [];

    // Search tag
    if (searchText) {
      tags.push(
        <Badge key="search" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconSearch size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
            <TouchableOpacity onPress={() => onSearchChange?.("")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Status filters
    if (filters.isActive === false) {
      tags.push(
        <Badge key="isActive" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconEye size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Incluindo inativos</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("isActive")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Stock filters
    if (filters.lowStock === true) {
      tags.push(
        <Badge key="lowStock" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconTrendingDown size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Estoque baixo</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("lowStock")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.outOfStock === true) {
      tags.push(
        <Badge key="outOfStock" variant="destructive" style={styles.filterTag}>
          <View style={styles.tagContent}>
            <IconBox size={12} color={colors.destructiveForeground} />
            <ThemedText style={{ ...styles.tagText, color: colors.destructiveForeground }}>Sem estoque</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("outOfStock")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.destructiveForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.overStock === true) {
      tags.push(
        <Badge key="overStock" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconBoxMultiple size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Estoque excedente</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("overStock")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.criticalStock === true) {
      tags.push(
        <Badge key="criticalStock" variant="destructive" style={styles.filterTag}>
          <View style={styles.tagContent}>
            <IconAlertTriangle size={12} color={colors.destructiveForeground} />
            <ThemedText style={{ ...styles.tagText, color: colors.destructiveForeground }}>Estoque crítico</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("criticalStock")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.destructiveForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.nearReorderPoint === true) {
      tags.push(
        <Badge key="nearReorderPoint" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconTarget size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Próximo ao reorder</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("nearReorderPoint")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.noReorderPoint === true) {
      tags.push(
        <Badge key="noReorderPoint" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconQuestionMark size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Sem ponto de reorder</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("noReorderPoint")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.negativeStock === true) {
      tags.push(
        <Badge key="negativeStock" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconMinus size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Estoque negativo</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("negativeStock")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Stock levels array filter - display individual badges for each level
    if (filters.stockLevels && Array.isArray(filters.stockLevels) && filters.stockLevels.length > 0) {
      filters.stockLevels.forEach((level: STOCK_LEVEL) => {
        const levelLabel = STOCK_LEVEL_LABELS[level] || level;
        tags.push(
          <Badge key={`stockLevel-${level}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconBox size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Nível: {levelLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("stockLevels", level)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Brand filters
    if (filters.brandIds && Array.isArray(filters.brandIds) && filters.brandIds.length > 0) {
      filters.brandIds.forEach((brandId: string) => {
        const brandLabel = getOptionLabel(brands, brandId);
        tags.push(
          <Badge key={`brand-${brandId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconTags size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Marca: {brandLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("brandIds", brandId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // ABC/XYZ Category filters
    if (filters.abcCategories && Array.isArray(filters.abcCategories) && filters.abcCategories.length > 0) {
      filters.abcCategories.forEach((category: string) => {
        tags.push(
          <Badge key={`abcCategory-${category}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconChartPie size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>ABC: {category}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("abcCategories", category)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    if (filters.xyzCategories && Array.isArray(filters.xyzCategories) && filters.xyzCategories.length > 0) {
      filters.xyzCategories.forEach((category: string) => {
        tags.push(
          <Badge key={`xyzCategory-${category}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconChartPie size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>XYZ: {category}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("xyzCategories", category)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Category filters
    if (filters.categoryIds && Array.isArray(filters.categoryIds) && filters.categoryIds.length > 0) {
      filters.categoryIds.forEach((categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        const typeLabel = category?.type ? ITEM_CATEGORY_TYPE_LABELS[category.type as keyof typeof ITEM_CATEGORY_TYPE_LABELS] : "";
        const categoryLabel = category ? `${category.name} (${typeLabel})` : categoryId;

        tags.push(
          <Badge key={`category-${categoryId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconChartBar size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Categoria: {categoryLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("categoryIds", categoryId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Supplier filters
    if (filters.supplierIds && Array.isArray(filters.supplierIds) && filters.supplierIds.length > 0) {
      filters.supplierIds.forEach((supplierId: string) => {
        const supplierLabel = getOptionLabel(suppliers, supplierId);
        tags.push(
          <Badge key={`supplier-${supplierId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconPackage size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Fornecedor: {supplierLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("supplierIds", supplierId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Other filters
    if (filters.shouldAssignToUser === true) {
      tags.push(
        <Badge key="shouldAssignToUser" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconUser size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Atribuir ao usuário</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("shouldAssignToUser")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Range filters
    if (filters.totalPriceRange && (filters.totalPriceRange.min !== undefined || filters.totalPriceRange.max !== undefined)) {
      const { min, max } = filters.totalPriceRange;
      let rangeText = "Preço: ";
      if (min !== undefined && max !== undefined) {
        rangeText += `R$ ${min} - R$ ${max}`;
      } else if (min !== undefined) {
        rangeText += `≥ R$ ${min}`;
      } else if (max !== undefined) {
        rangeText += `≤ R$ ${max}`;
      }

      tags.push(
        <Badge key="totalPriceRange" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCurrencyDollar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("totalPriceRange")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.measureValueRange && (filters.measureValueRange.min !== undefined || filters.measureValueRange.max !== undefined)) {
      const { min, max } = filters.measureValueRange;
      let rangeText = "Medida: ";
      if (min !== undefined && max !== undefined) {
        rangeText += `${min} - ${max}`;
      } else if (min !== undefined) {
        rangeText += `≥ ${min}`;
      } else if (max !== undefined) {
        rangeText += `≤ ${max}`;
      }

      tags.push(
        <Badge key="measureValueRange" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconRuler size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("measureValueRange")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Monthly Consumption Range filter
    if (filters.monthlyConsumptionRange && (filters.monthlyConsumptionRange.min !== undefined || filters.monthlyConsumptionRange.max !== undefined)) {
      const { min, max } = filters.monthlyConsumptionRange;
      let rangeText = "Consumo Mensal: ";
      if (min !== undefined && max !== undefined) {
        rangeText += `${min} - ${max}`;
      } else if (min !== undefined) {
        rangeText += `≥ ${min}`;
      } else if (max !== undefined) {
        rangeText += `≤ ${max}`;
      }

      tags.push(
        <Badge key="monthlyConsumptionRange" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconRuler size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("monthlyConsumptionRange")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Measure Units filters
    if (filters.measureUnits && Array.isArray(filters.measureUnits) && filters.measureUnits.length > 0) {
      filters.measureUnits.forEach((unit: string) => {
        const unitLabels: Record<string, string> = {
          [MEASURE_UNIT.KILOGRAM]: "kg",
          [MEASURE_UNIT.GRAM]: "g",
          [MEASURE_UNIT.MILLILITER]: "ml",
          [MEASURE_UNIT.LITER]: "l",
          [MEASURE_UNIT.METER]: "m",
          [MEASURE_UNIT.CENTIMETER]: "cm",
          [MEASURE_UNIT.MILLIMETER]: "mm",
          [MEASURE_UNIT.UNIT]: "unid",
          [MEASURE_UNIT.PACKAGE]: "pacote",
          [MEASURE_UNIT.BOX]: "caixa",
          [MEASURE_UNIT.ROLL]: "rolo",
          [MEASURE_UNIT.SHEET]: "folha",
          [MEASURE_UNIT.SET]: "conjunto",
          [MEASURE_UNIT.PAIR]: "par",
          [MEASURE_UNIT.DOZEN]: "dúzia",
          [MEASURE_UNIT.HUNDRED]: "centena",
          [MEASURE_UNIT.THOUSAND]: "milheiro",
        };
        const unitLabel = unitLabels[unit] || unit;

        tags.push(
          <Badge key={`measureUnit-${unit}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconCalculator size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Unidade: {unitLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("measureUnits", unit)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    return tags;
  };

  const filterTags = renderFilterTags();
  const hasFilters = filterTags.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filterTags}
      </ScrollView>

      <Button variant="default" size="default" onPress={onClearAll} style={styles.clearButton}>
        <ThemedText style={{ ...styles.clearButtonText, color: colors.primary }}>Limpar todos</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8, // Match search container padding
    paddingVertical: 2, // Minimal vertical padding
    gap: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.xs,
  },
  filterTag: {
    marginRight: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minHeight: 24,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
  removeButton: {
    padding: 2,
  },
  clearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minHeight: 24, // Match tag height
    borderRadius: borderRadius.md,
    minWidth: 60, // Further reduced width
  },
  clearButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
});
