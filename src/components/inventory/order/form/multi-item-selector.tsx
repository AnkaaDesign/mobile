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
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { getItems } from "@/api-client";
import { formatNumber, formatCurrency } from "@/utils";
import { useCanViewPrices } from "@/hooks";

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
  const canViewPrices = useCanViewPrices();

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
            { brands: { some: { name: { contains: searchTerm, mode: "insensitive" } } } },
            { category: { name: { contains: searchTerm, mode: "insensitive" } } },
          ],
        } : {}),
        // Apply category filter
        ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        // Apply brand filter
        ...(brandIds.length > 0 ? { brands: { some: { id: { in: brandIds } } } } : {}),
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
          brands: true,
          supplier: true,
          measures: true,
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
        // Compact measures string: "5un × 10cm" (reused from the item-table style).
        const measuresText =
          item.measures && item.measures.length > 0
            ? item.measures.map((m) => `${m.value ?? "-"}${m.unit ?? ""}`).join(" × ")
            : null;

        return {
          label,
          value: item.id,
          description: [
            `Estoque: ${stockInfo}`,
            canViewPrices && priceInfo ? `Preço: ${formatCurrency(priceInfo)}` : null,
            supplier ? `Fornecedor: ${supplier}` : null,
          ].filter(Boolean).join(" | "),
          metadata: {
            uniCode: item.uniCode,
            name: item.name,
            quantity: item.quantity,
            reorderPoint: item.reorderPoint,
            measures: measuresText,
            category: item.category,
            brands: item.brands,
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
  }, [categoryIds, brandIds, supplierIds, showInactive, canViewPrices]);

  // Custom render for each selectable item row. Mobile uses a card/row layout
  // (rather than a wide table), surfacing: name + uniCode (title/subtitle), a
  // compact "marca · categoria · medidas" line, and a "preço · estoque · ponto
  // de reposição" line. Selection behavior is unchanged (handled by Combobox).
  const renderOption = useCallback((option: ComboboxOption) => {
    if (!option.metadata) {
      return (
        <View style={styles.optionContainer}>
          <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
        </View>
      );
    }

    const metadata = option.metadata;
    const quantity: number = metadata.quantity ?? 0;
    const stockColor = quantity > 0
      ? colors.success
      : quantity === 0
        ? colors.warning
        : colors.destructive;

    // "marca · categoria · medidas"
    const attributeParts = [
      metadata.brands?.length ? metadata.brands.map((b: any) => b.name).join(", ") : null,
      metadata.category?.name,
      metadata.measures ? `Medidas: ${metadata.measures}` : null,
    ].filter(Boolean) as string[];

    return (
      <View style={styles.optionRow}>
        {/* Title: item name */}
        <ThemedText style={styles.optionLabel} numberOfLines={1}>
          {metadata.name ?? option.label}
        </ThemedText>

        {/* Subtitle: uniCode */}
        {metadata.uniCode && (
          <ThemedText style={[styles.optionSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {metadata.uniCode}
          </ThemedText>
        )}

        {/* Attributes line: marca · categoria · medidas */}
        {attributeParts.length > 0 && (
          <ThemedText style={[styles.optionMeta, { color: colors.mutedForeground }]} numberOfLines={2}>
            {attributeParts.join("  ·  ")}
          </ThemedText>
        )}

        {/* Metrics line: preço · estoque · ponto de reposição */}
        <View style={styles.optionMetrics}>
          {canViewPrices && metadata.price != null && (
            <View style={styles.optionMetric}>
              <ThemedText style={[styles.optionMetricLabel, { color: colors.mutedForeground }]}>
                Preço
              </ThemedText>
              <ThemedText style={[styles.optionMetricValue, { color: colors.foreground }]}>
                {formatCurrency(metadata.price)}
              </ThemedText>
            </View>
          )}
          <View style={styles.optionMetric}>
            <ThemedText style={[styles.optionMetricLabel, { color: colors.mutedForeground }]}>
              Estoque
            </ThemedText>
            <ThemedText style={[styles.optionMetricValue, { color: stockColor }]}>
              {formatNumber(quantity)}
            </ThemedText>
          </View>
          {metadata.reorderPoint != null && (
            <View style={styles.optionMetric}>
              <ThemedText style={[styles.optionMetricLabel, { color: colors.mutedForeground }]}>
                Ponto de reposição
              </ThemedText>
              <ThemedText style={[styles.optionMetricValue, { color: colors.foreground }]}>
                {formatNumber(metadata.reorderPoint)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );
  }, [colors, canViewPrices]);

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
  optionRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  optionSubtitle: {
    fontSize: fontSize.xs,
  },
  optionMeta: {
    fontSize: fontSize.xs,
  },
  optionMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  optionMetric: {
    gap: 2,
  },
  optionMetricLabel: {
    fontSize: fontSize.xs,
  },
  optionMetricValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
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
