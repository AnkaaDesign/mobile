/**
 * @deprecated This component is deprecated in favor of `ItemSelectorTable` from `@/components/forms`.
 * Use the new standardized component for better mobile/tablet support, filtering, and pagination.
 *
 * Migration guide:
 * - For single item selection: Use Combobox with item search
 * - For multi-item selection with quantities/prices: Use ItemSelectorTable from @/components/forms
 * - For multi-step order forms: Use OrderBatchCreateFormV2 which uses the new standardized components
 */
import { useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { getItems } from "@/api-client";
import type { Item } from "@/types";

interface OrderItemSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  initialItem?: Item;
  error?: string;
  label?: string;
  required?: boolean;
  // Advanced filter props
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
  showInactive?: boolean;
  onFiltersChange?: (filters: {
    categoryIds?: string[];
    brandIds?: string[];
    supplierIds?: string[];
    showInactive?: boolean;
  }) => void;
}

export function OrderItemSelector({
  value,
  onValueChange,
  disabled,
  initialItem,
  error,
  label = "Item",
  required = true,
  categoryIds = [],
  brandIds = [],
  supplierIds = [],
  showInactive = false,
}: OrderItemSelectorProps) {
  const { colors } = useTheme();

  // Memoize initialOptions with stable dependency
  const initialOptions = useMemo(() => {
    if (!initialItem) return [];

    const stockInfo = initialItem.quantity || 0;
    const priceInfo = initialItem.prices?.[0]?.value;
    const supplier = initialItem.supplier?.fantasyName || initialItem.supplier?.corporateName;

    return [{
      value: initialItem.id,
      label: initialItem.uniCode ? `${initialItem.uniCode} - ${initialItem.name}` : initialItem.name,
      description: [
        `Estoque: ${stockInfo}`,
        priceInfo ? `Preço: R$ ${priceInfo.toFixed(2)}` : null,
        supplier ? `Fornecedor: ${supplier}` : null,
      ].filter(Boolean).join(" | "),
      metadata: {
        quantity: initialItem.quantity,
        category: initialItem.itemCategory,
        brand: initialItem.itemBrand,
        supplier: initialItem.supplier,
        price: priceInfo,
        isActive: initialItem.isActive,
      },
    }];
  }, [initialItem?.id]);

  // Async query function for Combobox with pagination and advanced filters
  const queryFn = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 50;

    // Build where clause with all filters
    const where: any = {
      ...(searchTerm ? {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { uniCode: { contains: searchTerm, mode: "insensitive" } },
          { itemBrand: { name: { contains: searchTerm, mode: "insensitive" } } },
          { itemCategory: { name: { contains: searchTerm, mode: "insensitive" } } },
        ],
      } : {}),
      // Apply category filter
      ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
      // Apply brand filter
      ...(brandIds.length > 0 ? { brandId: { in: brandIds } } : {}),
      // Apply supplier filter
      ...(supplierIds.length > 0 ? { supplierId: { in: supplierIds } } : {}),
      // Apply active filter (only show inactive if explicitly requested)
      isActive: showInactive ? undefined : true,
    };

    const response = await getItems({
      take: pageSize,
      skip: (page - 1) * pageSize,
      where,
      orderBy: { name: "asc" },
      include: {
        itemCategory: true,
        itemBrand: true,
        supplier: true,
        prices: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const items = response.data || [];
    const total = response.total || 0;
    const hasMore = (page * pageSize) < total;

    return {
      data: items.map((item) => {
        const stockInfo = item.quantity || 0;
        const priceInfo = item.prices?.[0]?.value;
        const supplier = item.supplier?.fantasyName || item.supplier?.corporateName;

        return {
          value: item.id,
          label: item.uniCode ? `${item.uniCode} - ${item.name}` : item.name,
          description: [
            `Estoque: ${stockInfo}`,
            priceInfo ? `Preço: R$ ${priceInfo.toFixed(2)}` : null,
            supplier ? `Fornecedor: ${supplier}` : null,
          ].filter(Boolean).join(" | "),
          metadata: {
            quantity: item.quantity,
            category: item.itemCategory,
            brand: item.itemBrand,
            supplier: item.supplier,
            price: priceInfo,
            isActive: item.isActive,
            icms: item.icms,
            ipi: item.ipi,
          },
        };
      }) as ComboboxOption[],
      hasMore,
      total,
    };
  }, [categoryIds, brandIds, supplierIds, showInactive]);

  // Custom render function for item options
  const renderItemOption = useCallback((option: ComboboxOption) => {
    const metadata = option.metadata;
    if (!metadata) {
      return (
        <View style={styles.optionContainer}>
          <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
        </View>
      );
    }

    const stockColor = metadata.quantity > 0
      ? colors.success
      : metadata.quantity === 0
        ? colors.warning
        : colors.destructive;

    return (
      <View style={styles.optionContainer}>
        <View style={styles.optionContent}>
          <ThemedText style={styles.optionLabel} numberOfLines={1}>
            {option.label}
          </ThemedText>
          <View style={styles.optionDetails}>
            {metadata.brand?.name && (
              <ThemedText style={[styles.optionMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                {metadata.brand.name}
              </ThemedText>
            )}
            {metadata.category?.name && (
              <ThemedText style={[styles.optionMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                • {metadata.category.name}
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.optionBadges}>
          <Badge
            variant="secondary"
            style={[styles.stockBadge, { backgroundColor: stockColor + '20', borderColor: stockColor }]}
          >
            <ThemedText style={[styles.stockBadgeText, { color: stockColor }]}>
              {metadata.quantity || 0}
            </ThemedText>
          </Badge>
          {metadata.price && (
            <Badge variant="outline" style={styles.priceBadge}>
              <ThemedText style={styles.priceBadgeText}>
                R$ {metadata.price.toFixed(2)}
              </ThemedText>
            </Badge>
          )}
        </View>
      </View>
    );
  }, [colors]);

  return (
    <View style={styles.container}>
      {label && (
        <Label>
          {label} {required && <ThemedText style={{ color: colors.destructive }}>*</ThemedText>}
        </Label>
      )}
      <Combobox
        async
        queryKey={["items", "order-selector", categoryIds, brandIds, supplierIds, showInactive]}
        queryFn={queryFn}
        initialOptions={initialOptions}
        minSearchLength={0}
        pageSize={50}
        debounceMs={300}
        value={value || ""}
        onValueChange={onValueChange}
        placeholder="Selecione um item"
        emptyText="Nenhum item disponível"
        searchPlaceholder="Buscar por nome, código, marca ou categoria..."
        disabled={disabled}
        renderOption={renderItemOption}
        searchable
      />
      {error && (
        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </ThemedText>
      )}
      <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
        Selecione o item para adicionar ao pedido
      </ThemedText>
    </View>
  );
}

// Export as ItemSelector for compatibility
export { OrderItemSelector as ItemSelector };

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  optionContent: {
    flex: 1,
    gap: spacing.xs,
  },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  optionDetails: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  optionMeta: {
    fontSize: fontSize.xs,
  },
  optionBadges: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  stockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  stockBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  priceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priceBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
