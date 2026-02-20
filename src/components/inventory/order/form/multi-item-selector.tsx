/**
 * @deprecated This component is deprecated in favor of `ItemSelectorTable` from `@/components/forms`.
 * Use the new standardized component for better mobile/tablet support, filtering, and pagination.
 *
 * Migration guide:
 * - For multi-item selection with quantities/prices: Use ItemSelectorTable from @/components/forms
 * - For multi-step order forms: Use OrderBatchCreateFormV2 which uses the new standardized components
 * - Use useMultiStepForm hook for form state management with persistence
 */
import { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { getItems } from "@/api-client";
import { formatNumber, formatCurrency } from "@/utils";

interface OrderMultiItemSelectorProps {
  value?: string[];
  onValueChange: (value: string[] | undefined) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  // Advanced filter props
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
  showInactive?: boolean;
}

export function OrderMultiItemSelector({
  value = [],
  onValueChange,
  disabled,
  error,
  label = "Itens",
  description,
  placeholder = "Selecione os itens",
  emptyText = "Nenhum item disponível",
  searchPlaceholder = "Pesquisar por nome, código, marca ou categoria...",
  categoryIds = [],
  brandIds = [],
  supplierIds = [],
  showInactive = false,
}: OrderMultiItemSelectorProps) {
  const { colors } = useTheme();

  // Async query function for items with advanced filters
  const queryItems = useCallback(async (searchTerm: string, page = 1) => {
    try {
      const pageSize = 50;

      // Build where clause with all filters
      const where: any = {
        ...(searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { uniCode: { contains: searchTerm, mode: "insensitive" } },
            { brand: { name: { contains: searchTerm, mode: "insensitive" } } },
            { category: { name: { contains: searchTerm, mode: "insensitive" } } },
          ],
        } : {}),
        // Apply category filter
        ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        // Apply brand filter
        ...(brandIds.length > 0 ? { brandId: { in: brandIds } } : {}),
        // Apply supplier filter
        ...(supplierIds.length > 0 ? { supplierId: { in: supplierIds } } : {}),
        // Apply active filter
        isActive: showInactive ? undefined : true,
      };

      const response = await getItems({
        orderBy: { name: "asc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
        where,
        include: {
          category: true,
          brand: true,
          supplier: true,
          prices: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      const items = response.data || [];
      const total = response.meta?.totalRecords || 0;
      const hasMore = (page * pageSize) < total;

      const options: ComboboxOption[] = items.map((item) => {
        const label = item.uniCode ? `${item.uniCode} - ${item.name}` : item.name;
        const stockInfo = item.quantity || 0;
        const priceInfo = item.prices?.[0]?.value;
        const supplier = item.supplier?.fantasyName || item.supplier?.corporateName;

        return {
          label,
          value: item.id,
          description: [
            `Estoque: ${stockInfo}`,
            priceInfo ? `Preço: ${formatCurrency(priceInfo)}` : null,
            supplier ? `Fornecedor: ${supplier}` : null,
          ].filter(Boolean).join(" | "),
          metadata: {
            quantity: item.quantity,
            category: item.category,
            brand: item.brand,
            supplier: item.supplier,
            price: priceInfo,
            isActive: item.isActive,
            icms: item.icms,
            ipi: item.ipi,
          },
        };
      });

      return {
        data: options,
        hasMore: hasMore,
        total,
      };
    } catch (error) {
      console.error("Error fetching items:", error);
      return {
        data: [],
        hasMore: false,
        total: 0,
      };
    }
  }, [categoryIds, brandIds, supplierIds, showInactive]);

  // Custom render for option to show stock, price, and supplier info
  const renderOption = useCallback((option: ComboboxOption) => {
    if (!option.metadata) {
      return (
        <View style={styles.optionContainer}>
          <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
        </View>
      );
    }

    const metadata = option.metadata;
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
            {metadata.supplier?.fantasyName && (
              <ThemedText style={[styles.optionMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                • {metadata.supplier.fantasyName}
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
              {formatNumber(metadata.quantity)}
            </ThemedText>
          </Badge>
          {metadata.price && (
            <Badge variant="outline" style={styles.priceBadge}>
              <ThemedText style={styles.priceBadgeText}>
                {formatCurrency(metadata.price)}
              </ThemedText>
            </Badge>
          )}
        </View>
      </View>
    );
  }, [colors]);

  return (
    <View style={styles.container}>
      {label && <Label>{label}</Label>}
      <Combobox
        async
        mode="multiple"
        queryKey={["items", "order-multi-selector", categoryIds, brandIds, supplierIds, showInactive]}
        queryFn={queryItems}
        initialOptions={[]}
        minSearchLength={0}
        pageSize={50}
        debounceMs={300}
        value={value}
        onValueChange={(val) => onValueChange(Array.isArray(val) ? val : undefined)}
        placeholder={placeholder}
        emptyText={emptyText}
        searchPlaceholder={searchPlaceholder}
        disabled={disabled}
        renderOption={renderOption}
        searchable
        showCount
      />
      {error && (
        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </ThemedText>
      )}
      {description && (
        <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
          {description}
        </ThemedText>
      )}
      {!description && (
        <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
          Selecione múltiplos itens para adicionar ao pedido em lote
        </ThemedText>
      )}
    </View>
  );
}

// Export as default for convenience
export default OrderMultiItemSelector;

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
