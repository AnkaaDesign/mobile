import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.headerTitle}>Filtros de Busca</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            variant="outline"
            onPress={handleClearAll}
            style={styles.footerButton}
          >
            <Icon name="refresh-cw" size={16} color={colors.foreground} />
            <ThemedText style={styles.buttonText}>Limpar todos</ThemedText>
          </Button>
          <Button
            variant="default"
            onPress={handleApply}
            style={[styles.footerButton, styles.applyButton]}
          >
            <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
              Aplicar filtros
            </ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" style={styles.applyBadge}>
                <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
              </Badge>
            )}
          </Button>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
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
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  applyButton: {
    flex: 1.5,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  applyBadge: {
    marginLeft: spacing.xs,
  },
});
