import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { StandardModal } from "@/components/ui/standard-modal";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { getItemCategories, getItemBrands, getSuppliers } from "@/api-client";
import { useQuery } from "@tanstack/react-query";

export interface ItemFilters {
  categoryIds: string[];
  brandIds: string[];
  supplierIds: string[];
  showInactive: boolean;
}

interface ItemFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ItemFilters) => void;
  initialFilters?: Partial<ItemFilters>;
}

export function ItemFilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}: ItemFilterModalProps) {
  const { colors } = useTheme();

  // Local filter state
  const [categoryIds, setCategoryIds] = useState<string[]>(initialFilters.categoryIds || []);
  const [brandIds, setBrandIds] = useState<string[]>(initialFilters.brandIds || []);
  const [supplierIds, setSupplierIds] = useState<string[]>(initialFilters.supplierIds || []);
  const [showInactive, setShowInactive] = useState(initialFilters.showInactive || false);

  // Sync with initial filters when they change
  useEffect(() => {
    if (visible) {
      setCategoryIds(initialFilters.categoryIds || []);
      setBrandIds(initialFilters.brandIds || []);
      setSupplierIds(initialFilters.supplierIds || []);
      setShowInactive(initialFilters.showInactive || false);
    }
  }, [visible, initialFilters]);

  // Fetch filter options
  const { data: categoriesResponse } = useQuery({
    queryKey: ["itemCategories", "active"],
    queryFn: () => getItemCategories({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  });

  const { data: brandsResponse } = useQuery({
    queryKey: ["itemBrands", "active"],
    queryFn: () => getItemBrands({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  });

  const { data: suppliersResponse } = useQuery({
    queryKey: ["suppliers", "active"],
    queryFn: () => getSuppliers({
      where: { status: "ACTIVE" },
      orderBy: { fantasyName: "asc" },
    }),
  });

  const categories = categoriesResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const suppliers = suppliersResponse?.data || [];

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const brandOptions = brands.map((brand) => ({
    value: brand.id,
    label: brand.name,
  }));

  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.id,
    label: supplier.fantasyName || supplier.corporateName || "Sem nome",
  }));

  const handleClearAll = () => {
    setCategoryIds([]);
    setBrandIds([]);
    setSupplierIds([]);
    setShowInactive(false);
  };

  const handleApply = () => {
    onApply({
      categoryIds,
      brandIds,
      supplierIds,
      showInactive,
    });
    onClose();
  };

  const activeFilterCount = [
    categoryIds.length > 0 ? 1 : 0,
    brandIds.length > 0 ? 1 : 0,
    supplierIds.length > 0 ? 1 : 0,
    showInactive ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Filtros de Busca"
      headerRight={
        activeFilterCount > 0 ? (
          <Badge variant="secondary">
            <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
          </Badge>
        ) : undefined
      }
      actions={[
        { label: "Limpar todos", variant: "outline", onPress: handleClearAll },
        { label: "Aplicar filtros", onPress: handleApply },
      ]}
    >
      {/* Show Inactive Toggle */}
      <View style={styles.filterSection}>
        <Label style={styles.filterLabel}>Itens Desativados</Label>
        <View style={styles.switchContainer}>
          <Switch
            value={showInactive}
            onValueChange={setShowInactive}
          />
          <ThemedText style={[styles.switchLabel, { color: colors.mutedForeground }]}>
            Mostrar também desativados
          </ThemedText>
        </View>
      </View>

      {/* Categories Filter */}
      <View style={styles.filterSection}>
        <Label style={styles.filterLabel}>Categorias</Label>
        <Combobox
          mode="multiple"
          options={categoryOptions}
          value={categoryIds}
          onValueChange={(value) => setCategoryIds(Array.isArray(value) ? value : [])}
          placeholder="Todas as categorias"
          searchable
          showCount
        />
      </View>

      {/* Brands Filter */}
      <View style={styles.filterSection}>
        <Label style={styles.filterLabel}>Marcas</Label>
        <Combobox
          mode="multiple"
          options={brandOptions}
          value={brandIds}
          onValueChange={(value) => setBrandIds(Array.isArray(value) ? value : [])}
          placeholder="Todas as marcas"
          searchable
          showCount
        />
      </View>

      {/* Suppliers Filter */}
      <View style={styles.filterSection}>
        <Label style={styles.filterLabel}>Fornecedores</Label>
        <Combobox
          mode="multiple"
          options={supplierOptions}
          value={supplierIds}
          onValueChange={(value) => setSupplierIds(Array.isArray(value) ? value : [])}
          placeholder="Todos os fornecedores"
          searchable
          showCount
        />
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    gap: spacing.sm,
  },
  filterLabel: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  switchLabel: {
    fontSize: fontSize.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
