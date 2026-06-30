import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";

import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useItemCategories, useItemBrands, useSuppliers } from "@/hooks";

import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { StandardModal } from "@/components/ui/standard-modal";

/**
 * ItemSelectorFilters
 *
 * A modal dialog for filtering items in the ItemSelectorTable.
 * Uses temporary state until user applies filters.
 *
 * Filters:
 * - Show inactive items (toggle)
 * - Categories (multi-select)
 * - Brands (multi-select)
 * - Suppliers (multi-select)
 */

export interface ItemSelectorFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showInactive?: boolean;
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
  onShowInactiveChange?: (value: boolean) => void;
  onCategoryIdsChange?: (ids: string[]) => void;
  onBrandIdsChange?: (ids: string[]) => void;
  onSupplierIdsChange?: (ids: string[]) => void;
}

export function ItemSelectorFilters({
  open,
  onOpenChange,
  showInactive = false,
  categoryIds = [],
  brandIds = [],
  supplierIds = [],
  onShowInactiveChange,
  onCategoryIdsChange,
  onBrandIdsChange,
  onSupplierIdsChange,
}: ItemSelectorFiltersProps) {
  const { colors } = useTheme();

  // Temporary state (until Apply is pressed)
  const [tempShowInactive, setTempShowInactive] = useState(showInactive);
  const [tempCategoryIds, setTempCategoryIds] = useState<string[]>(categoryIds);
  const [tempBrandIds, setTempBrandIds] = useState<string[]>(brandIds);
  const [tempSupplierIds, setTempSupplierIds] = useState<string[]>(supplierIds);

  // Sync temp state when modal opens
  useEffect(() => {
    if (open) {
      setTempShowInactive(showInactive);
      setTempCategoryIds(categoryIds);
      setTempBrandIds(brandIds);
      setTempSupplierIds(supplierIds);
    }
  }, [open, showInactive, categoryIds, brandIds, supplierIds]);

  // Fetch filter options
  const { data: categoriesData } = useItemCategories({ limit: 100 });
  const { data: brandsData } = useItemBrands({ limit: 100 });
  const { data: suppliersData } = useSuppliers({ limit: 100 });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];
  const suppliers = suppliersData?.data || [];

  // Convert to combobox options
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const brandOptions = brands.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.fantasyName || s.corporateName || s.id,
  }));

  // Apply filters
  const handleApply = useCallback(() => {
    onShowInactiveChange?.(tempShowInactive);
    onCategoryIdsChange?.(tempCategoryIds);
    onBrandIdsChange?.(tempBrandIds);
    onSupplierIdsChange?.(tempSupplierIds);
    onOpenChange(false);
  }, [
    tempShowInactive,
    tempCategoryIds,
    tempBrandIds,
    tempSupplierIds,
    onShowInactiveChange,
    onCategoryIdsChange,
    onBrandIdsChange,
    onSupplierIdsChange,
    onOpenChange,
  ]);

  // Clear all filters
  const handleClear = useCallback(() => {
    setTempShowInactive(false);
    setTempCategoryIds([]);
    setTempBrandIds([]);
    setTempSupplierIds([]);
  }, []);

  // Count active temp filters
  const tempActiveFilterCount =
    (tempShowInactive ? 1 : 0) +
    (tempCategoryIds.length > 0 ? 1 : 0) +
    (tempBrandIds.length > 0 ? 1 : 0) +
    (tempSupplierIds.length > 0 ? 1 : 0);

  return (
    <StandardModal
      visible={open}
      onClose={() => onOpenChange(false)}
      title="Filtros"
      actions={[
        {
          label: "Limpar filtros",
          variant: "outline",
          onPress: handleClear,
          disabled: tempActiveFilterCount === 0,
        },
        {
          label: `Aplicar${tempActiveFilterCount > 0 ? ` (${tempActiveFilterCount})` : ""}`,
          onPress: handleApply,
        },
      ]}
    >
      {/* Show Inactive */}
      <View style={styles.filterSection}>
        <View style={styles.switchRow}>
          <Label style={{ color: colors.foreground }}>
            Mostrar itens desativados
          </Label>
          <Switch
            checked={tempShowInactive}
            onCheckedChange={setTempShowInactive}
          />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.filterSection}>
        <Label style={{ color: colors.foreground, marginBottom: spacing.sm }}>
          Categorias
        </Label>
        <Combobox
          options={categoryOptions}
          value={tempCategoryIds}
          onValueChange={(value) =>
            setTempCategoryIds(value as string[] || [])
          }
          placeholder="Selecione categorias..."
          mode="multiple"
          searchable
        />
      </View>

      {/* Brands */}
      <View style={styles.filterSection}>
        <Label style={{ color: colors.foreground, marginBottom: spacing.sm }}>
          Marcas
        </Label>
        <Combobox
          options={brandOptions}
          value={tempBrandIds}
          onValueChange={(value) =>
            setTempBrandIds(value as string[] || [])
          }
          placeholder="Selecione marcas..."
          mode="multiple"
          searchable
        />
      </View>

      {/* Suppliers */}
      <View style={styles.filterSection}>
        <Label style={{ color: colors.foreground, marginBottom: spacing.sm }}>
          Fornecedores
        </Label>
        <Combobox
          options={supplierOptions}
          value={tempSupplierIds}
          onValueChange={(value) =>
            setTempSupplierIds(value as string[] || [])
          }
          placeholder="Selecione fornecedores..."
          mode="multiple"
          searchable
        />
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    gap: spacing.xs,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default ItemSelectorFilters;
