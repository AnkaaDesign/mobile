import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useItemBrands, useItemCategories, useSuppliers } from "@/hooks";
import { IconFilter, IconX } from "@tabler/icons-react-native";
import type { ItemGetManyFormData } from "@/schemas";

interface ActivityFormFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Partial<ItemGetManyFormData>;
  onFilterChange: (filters: Partial<ItemGetManyFormData>) => void;
}

interface FilterState {
  // Basic filters
  showInactive?: boolean;

  // Entity filters
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
}

export function ActivityFormFilters({
  open,
  onOpenChange,
  filters,
  onFilterChange,
}: ActivityFormFiltersProps) {
  const { colors } = useTheme();
  const [localState, setLocalState] = useState<FilterState>({});

  // Load entity data
  const { data: categoriesResponse, isLoading: loadingCategories } = useItemCategories({
    orderBy: { name: "asc" },
  });
  const { data: brandsResponse, isLoading: loadingBrands } = useItemBrands({
    orderBy: { name: "asc" },
  });
  const { data: suppliersResponse, isLoading: loadingSuppliers } = useSuppliers({
    orderBy: { fantasyName: "asc" },
  });

  const categories = categoriesResponse?.data || [];
  const brands = brandsResponse?.data || [];
  const suppliers = suppliersResponse?.data || [];

  // Initialize local state from filters when dialog opens
  useEffect(() => {
    if (!open) return;

    // Extract current filter values
    const currentState: FilterState = {
      showInactive: filters.showInactive || false,
      categoryIds: [],
      brandIds: [],
      supplierIds: [],
    };

    // Handle where clause filters
    const where = filters.where || {};
    if (where.categoryId) {
      if (typeof where.categoryId === "string") {
        currentState.categoryIds = [where.categoryId];
      } else if (where.categoryId.in) {
        currentState.categoryIds = where.categoryId.in;
      }
    }

    if (where.brandId) {
      if (typeof where.brandId === "string") {
        currentState.brandIds = [where.brandId];
      } else if (where.brandId.in) {
        currentState.brandIds = where.brandId.in;
      }
    }

    if (where.supplierId) {
      if (typeof where.supplierId === "string") {
        currentState.supplierIds = [where.supplierId];
      } else if (where.supplierId.in) {
        currentState.supplierIds = where.supplierId.in;
      }
    }

    // Handle root-level filter arrays (preferred format)
    if (filters.categoryIds) {
      currentState.categoryIds = Array.isArray(filters.categoryIds)
        ? filters.categoryIds
        : [filters.categoryIds];
    }
    if (filters.brandIds) {
      currentState.brandIds = Array.isArray(filters.brandIds)
        ? filters.brandIds
        : [filters.brandIds];
    }
    if (filters.supplierIds) {
      currentState.supplierIds = Array.isArray(filters.supplierIds)
        ? filters.supplierIds
        : [filters.supplierIds];
    }

    setLocalState(currentState);
  }, [open, filters]);

  const handleApply = () => {
    // Build the filters object from local state
    const newFilters: Partial<ItemGetManyFormData> = {
      // Preserve existing configuration
      limit: filters.limit,
      orderBy: filters.orderBy,
      take: filters.take,
      searchingFor: filters.searchingFor,
      include: filters.include,
    };

    // Add basic filters
    if (localState.showInactive) {
      newFilters.showInactive = true;
    }

    // Build where clause for proper Prisma filtering
    const where: any = {};

    // Entity filters using the 'in' operator for multiple selections
    if (localState.categoryIds && localState.categoryIds.length > 0) {
      if (localState.categoryIds.includes("null")) {
        // Handle "no category" case
        const otherIds = localState.categoryIds.filter((id: string) => id !== "null");
        if (otherIds.length > 0) {
          where.OR = [{ categoryId: null }, { categoryId: { in: otherIds } }];
        } else {
          where.categoryId = null;
        }
      } else {
        where.categoryId = { in: localState.categoryIds };
      }
    }

    if (localState.brandIds && localState.brandIds.length > 0) {
      if (localState.brandIds.includes("null")) {
        // Handle "no brand" case
        const otherIds = localState.brandIds.filter((id: string) => id !== "null");
        if (otherIds.length > 0) {
          where.OR = [...(where.OR || []), { brandId: null }, { brandId: { in: otherIds } }];
        } else {
          where.brandId = null;
        }
      } else {
        where.brandId = { in: localState.brandIds };
      }
    }

    if (localState.supplierIds && localState.supplierIds.length > 0) {
      if (localState.supplierIds.includes("null")) {
        // Handle "no supplier" case
        const otherIds = localState.supplierIds.filter((id: string) => id !== "null");
        if (otherIds.length > 0) {
          where.OR = [
            ...(where.OR || []),
            { supplierId: null },
            { supplierId: { in: otherIds } },
          ];
        } else {
          where.supplierId = null;
        }
      } else {
        where.supplierId = { in: localState.supplierIds };
      }
    }

    // Only add where clause if there are conditions
    if (Object.keys(where).length > 0) {
      newFilters.where = where;
    }

    // Apply filters and close dialog
    onFilterChange(newFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    // Reset to clean filters while preserving essential configuration
    const resetFilters: Partial<ItemGetManyFormData> = {
      limit: filters.limit || 100,
      orderBy: filters.orderBy || { name: "asc" },
      take: filters.take,
      searchingFor: filters.searchingFor,
      include: filters.include,
    };

    setLocalState({});
    onFilterChange(resetFilters);
    onOpenChange(false);
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (localState.showInactive) count++;
    if (localState.categoryIds?.length) count++;
    if (localState.brandIds?.length) count++;
    if (localState.supplierIds?.length) count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();

  // Transform data for combobox
  const categoryOptions = useMemo(
    () => [
      // Add "Sem categoria" option first
      { value: "null", label: "Sem categoria" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  );

  const brandOptions = useMemo(
    () => [
      // Add "Sem marca" option first
      { value: "null", label: "Sem marca" },
      ...brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
      })),
    ],
    [brands],
  );

  const supplierOptions = useMemo(
    () => [
      // Add "Sem fornecedor" option first
      { value: "null", label: "Sem fornecedor" },
      ...suppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.fantasyName,
      })),
    ],
    [suppliers],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <IconFilter size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.headerTitle}>Filtros de Seleção de Itens</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" style={styles.headerBadge}>
                <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
              </Badge>
            )}
          </View>
          <ThemedText style={[styles.headerDescription, { color: colors.mutedForeground }]}>
            Configure filtros para refinar a seleção de itens disponíveis
          </ThemedText>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Filters */}
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>Opções de Exibição</Label>
            <View style={styles.switchRow}>
              <Label style={styles.switchLabel}>Mostrar também desativados</Label>
              <Switch
                checked={localState.showInactive ?? false}
                onCheckedChange={(checked) =>
                  setLocalState((prev) => ({ ...prev, showInactive: checked }))
                }
              />
            </View>
          </View>

          {/* Entity Filters */}
          <View style={styles.section}>
            <Label style={styles.sectionLabel}>Categorias e Marcas</Label>

            {/* Categories */}
            <View style={styles.fieldGroup}>
              <Label>Categorias</Label>
              <Combobox
                mode="multiple"
                options={categoryOptions}
                value={localState.categoryIds || []}
                onValueChange={(ids) =>
                  setLocalState((prev) => ({ ...prev, categoryIds: ids }))
                }
                placeholder="Selecione categorias..."
                emptyText="Nenhuma categoria encontrada"
                searchPlaceholder="Buscar categorias..."
                disabled={loadingCategories}
              />
              {(localState.categoryIds?.length || 0) > 0 && (
                <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
                  {localState.categoryIds?.length} categoria
                  {(localState.categoryIds?.length || 0) !== 1 ? "s" : ""} selecionada
                  {(localState.categoryIds?.length || 0) !== 1 ? "s" : ""}
                </ThemedText>
              )}
            </View>

            {/* Brands */}
            <View style={styles.fieldGroup}>
              <Label>Marcas</Label>
              <Combobox
                mode="multiple"
                options={brandOptions}
                value={localState.brandIds || []}
                onValueChange={(ids) =>
                  setLocalState((prev) => ({ ...prev, brandIds: ids }))
                }
                placeholder="Selecione marcas..."
                emptyText="Nenhuma marca encontrada"
                searchPlaceholder="Buscar marcas..."
                disabled={loadingBrands}
              />
              {(localState.brandIds?.length || 0) > 0 && (
                <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
                  {localState.brandIds?.length} marca
                  {(localState.brandIds?.length || 0) !== 1 ? "s" : ""} selecionada
                  {(localState.brandIds?.length || 0) !== 1 ? "s" : ""}
                </ThemedText>
              )}
            </View>

            {/* Suppliers */}
            <View style={styles.fieldGroup}>
              <Label>Fornecedores</Label>
              <Combobox
                mode="multiple"
                options={supplierOptions}
                value={localState.supplierIds || []}
                onValueChange={(ids) =>
                  setLocalState((prev) => ({ ...prev, supplierIds: ids }))
                }
                placeholder="Selecione fornecedores..."
                emptyText="Nenhum fornecedor encontrado"
                searchPlaceholder="Buscar fornecedores..."
                disabled={loadingSuppliers}
              />
              {(localState.supplierIds?.length || 0) > 0 && (
                <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
                  {localState.supplierIds?.length} fornecedor
                  {(localState.supplierIds?.length || 0) !== 1 ? "es" : ""} selecionado
                  {(localState.supplierIds?.length || 0) !== 1 ? "s" : ""}
                </ThemedText>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button variant="outline" onPress={handleReset} style={styles.footerButton}>
            <IconX size={16} color={colors.mutedForeground} />
            <ThemedText style={styles.footerButtonText}>Limpar todos</ThemedText>
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            <ThemedText style={[styles.footerButtonText, { color: colors.primaryForeground }]}>
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: "80%",
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    flex: 1,
  },
  headerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  headerDescription: {
    fontSize: fontSize.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    fontSize: fontSize.sm,
    fontWeight: "400",
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  applyBadge: {
    marginLeft: spacing.sm,
  },
});

export default ActivityFormFilters;
