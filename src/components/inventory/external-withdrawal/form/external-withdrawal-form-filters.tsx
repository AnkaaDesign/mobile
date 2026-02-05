import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { IconFilter, IconRefresh } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useItemCategories, useItemBrands, useSuppliers } from "@/hooks";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { FormLabel } from "@/components/ui/form";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ExternalWithdrawalFormFiltersProps {
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

export function ExternalWithdrawalFormFilters({
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
}: ExternalWithdrawalFormFiltersProps) {
  const { colors } = useTheme();

  // Local state for temporary filter values
  const [localShowInactive, setLocalShowInactive] = useState(showInactive);
  const [localCategoryIds, setLocalCategoryIds] = useState<string[]>(categoryIds);
  const [localBrandIds, setLocalBrandIds] = useState<string[]>(brandIds);
  const [localSupplierIds, setLocalSupplierIds] = useState<string[]>(supplierIds);

  // Load filter data
  const { data: categoriesResponse, isLoading: loadingCategories } = useItemCategories({
    orderBy: { name: "asc" as const },
    where: { status: "ACTIVE" },
  });
  const { data: brandsResponse, isLoading: loadingBrands } = useItemBrands({
    orderBy: { name: "asc" as const },
    where: { status: "ACTIVE" },
  });
  const { data: suppliersResponse, isLoading: loadingSuppliers } = useSuppliers({
    orderBy: { fantasyName: "asc" as const },
    where: { status: "ACTIVE" },
  });

  const categories = categoriesResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const suppliers = suppliersResponse?.data || [];

  // Sync local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalShowInactive(showInactive);
      setLocalCategoryIds(categoryIds);
      setLocalBrandIds(brandIds);
      setLocalSupplierIds(supplierIds);
    }
  }, [open, showInactive, categoryIds, brandIds, supplierIds]);

  // Count active filters
  const activeFilterCount = () => {
    let count = 0;
    if (localShowInactive) count++;
    if (localCategoryIds.length > 0) count++;
    if (localBrandIds.length > 0) count++;
    if (localSupplierIds.length > 0) count++;
    return count;
  };

  // Apply filters
  const handleApply = () => {
    onShowInactiveChange?.(localShowInactive);
    onCategoryIdsChange?.(localCategoryIds);
    onBrandIdsChange?.(localBrandIds);
    onSupplierIdsChange?.(localSupplierIds);
    onOpenChange(false);
  };

  // Reset filters
  const handleReset = () => {
    setLocalShowInactive(false);
    setLocalCategoryIds([]);
    setLocalBrandIds([]);
    setLocalSupplierIds([]);
  };

  // Transform data for combobox
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

  return (
    <Modal
      visible={open}
      onClose={() => onOpenChange(false)}
      style={styles.modal}
    >
      <ModalContent style={styles.modalContent}>
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <IconFilter size={20} color={colors.mutedForeground} />
            <Text style={styles.title}>Filtros de Seleção de Itens</Text>
            {activeFilterCount() > 0 && (
              <Badge variant="secondary">{activeFilterCount()}</Badge>
            )}
          </View>
          <Text style={styles.subtitle}>
            Configure filtros para refinar a seleção de itens
          </Text>
        </View>

        {/* Tabs */}
        <Tabs defaultValue="basic" style={styles.tabs}>
          <TabsList>
            <TabsTrigger value="basic">
              Básico
            </TabsTrigger>
            <TabsTrigger value="entities">
              Categorias e Marcas
            </TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" style={styles.tabContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <FormLabel>Opções de Exibição</FormLabel>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    Mostrar também desativados
                  </Text>
                  <Switch
                    checked={localShowInactive}
                    onCheckedChange={setLocalShowInactive}
                  />
                </View>
              </View>
            </ScrollView>
          </TabsContent>

          {/* Entities Tab */}
          <TabsContent value="entities" style={styles.tabContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                {/* Categories */}
                <View style={styles.field}>
                  <FormLabel>Categorias</FormLabel>
                  <Combobox
                    mode="multiple"
                    options={categoryOptions}
                    value={localCategoryIds}
                    onValueChange={(values) => {
                      const ids = Array.isArray(values) ? values : values ? [values] : [];
                      setLocalCategoryIds(ids);
                    }}
                    placeholder="Selecione categorias..."
                    emptyText="Nenhuma categoria encontrada"
                    searchPlaceholder="Buscar categorias..."
                    disabled={loadingCategories}
                  />
                  {localCategoryIds.length > 0 && (
                    <Text style={styles.helperText}>
                      {localCategoryIds.length} categoria
                      {localCategoryIds.length !== 1 ? "s" : ""} selecionada
                      {localCategoryIds.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>

                {/* Brands */}
                <View style={styles.field}>
                  <FormLabel>Marcas</FormLabel>
                  <Combobox
                    mode="multiple"
                    options={brandOptions}
                    value={localBrandIds}
                    onValueChange={(values) => {
                      const ids = Array.isArray(values) ? values : values ? [values] : [];
                      setLocalBrandIds(ids);
                    }}
                    placeholder="Selecione marcas..."
                    emptyText="Nenhuma marca encontrada"
                    searchPlaceholder="Buscar marcas..."
                    disabled={loadingBrands}
                  />
                  {localBrandIds.length > 0 && (
                    <Text style={styles.helperText}>
                      {localBrandIds.length} marca
                      {localBrandIds.length !== 1 ? "s" : ""} selecionada
                      {localBrandIds.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>

                {/* Suppliers */}
                <View style={styles.field}>
                  <FormLabel>Fornecedores</FormLabel>
                  <Combobox
                    mode="multiple"
                    options={supplierOptions}
                    value={localSupplierIds}
                    onValueChange={(values) => {
                      const ids = Array.isArray(values) ? values : values ? [values] : [];
                      setLocalSupplierIds(ids);
                    }}
                    placeholder="Selecione fornecedores..."
                    emptyText="Nenhum fornecedor encontrado"
                    searchPlaceholder="Buscar fornecedores..."
                    disabled={loadingSuppliers}
                  />
                  {localSupplierIds.length > 0 && (
                    <Text style={styles.helperText}>
                      {localSupplierIds.length} fornecedor
                      {localSupplierIds.length !== 1 ? "es" : ""} selecionado
                      {localSupplierIds.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>
          </TabsContent>
        </Tabs>

        <Separator style={styles.separator} />

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleReset}
            icon={<IconRefresh size={16} />}
            style={styles.footerButton}
          >
            Limpar todos
          </Button>
          <Button
            variant="default"
            onPress={handleApply}
            style={styles.footerButton}
          >
            Aplicar filtros
            {activeFilterCount() > 0 && (
              <Badge variant="secondary" style={styles.applyBadge}>
                {activeFilterCount()}
              </Badge>
            )}
          </Button>
        </View>
      </View>
      </ModalContent>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    maxHeight: "80%",
  },
  modalContent: {
    maxHeight: "80%",
  },
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  tabs: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
  separator: {
    marginTop: "auto",
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  applyBadge: {
    marginLeft: spacing.xs,
  },
});
