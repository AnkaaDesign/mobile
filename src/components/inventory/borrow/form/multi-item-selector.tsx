/**
 * @deprecated This component is deprecated in favor of `ItemSelectorTable` from `@/components/forms`.
 * Use the new standardized component for better mobile/tablet support, filtering, and pagination.
 *
 * Migration guide:
 * - For multi-item selection with quantities: Use ItemSelectorTable from @/components/forms
 * - For multi-step forms: Use useMultiStepForm hook with MultiStepFormContainer
 *
 * Example:
 * ```tsx
 * import { ItemSelectorTable } from "@/components/forms";
 * import { useMultiStepForm } from "@/hooks";
 *
 * const multiStepForm = useMultiStepForm({ storageKey: "@my_form" });
 * <ItemSelectorTable
 *   selectedItems={multiStepForm.selectedItems}
 *   quantities={multiStepForm.quantities}
 *   onSelectItem={multiStepForm.toggleItemSelection}
 *   onQuantityChange={multiStepForm.setItemQuantity}
 * />
 * ```
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
import { formatNumber } from "@/utils";

interface MultiItemSelectorProps {
  value?: string[];
  onValueChange: (value: string[] | undefined) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
}

export function MultiItemSelector({
  value = [],
  onValueChange,
  disabled,
  error,
  label = "Itens",
  description,
  placeholder = "Selecione os itens",
  emptyText = "Nenhum item disponível",
  searchPlaceholder = "Pesquisar por nome ou código...",
}: MultiItemSelectorProps) {
  const { colors } = useTheme();

  // Async query function for items
  const queryItems = useCallback(async (searchTerm: string, page = 1) => {
    try {
      const pageSize = 50;
      const response = await getItems({
        orderBy: { name: "asc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
        where: {
          isActive: true,
          quantity: { gt: 0 }, // Only show items with available stock
          itemCategory: {
            type: "TOOL", // Only show tools that can be borrowed
          },
          ...(searchTerm ? {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { uniCode: { contains: searchTerm, mode: "insensitive" } },
            ],
          } : {}),
        },
        include: {
          itemCategory: true,
          itemBrand: true,
        },
      });

      const items = response.data || [];
      const total = response.total || 0;
      const hasMore = (page * pageSize) < total;

      const options: ComboboxOption[] = items.map((item) => {
        const label = item.uniCode ? `${item.uniCode} - ${item.name}` : item.name;
        return {
          label,
          value: item.id,
          metadata: {
            quantity: item.quantity,
            category: item.itemCategory,
            brand: item.itemBrand,
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
  }, []);

  // Custom render for option to show available quantity
  const renderOption = useCallback((option: ComboboxOption) => {
    if (!option.metadata) {
      return (
        <View style={styles.optionContainer}>
          <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.optionContainer}>
        <View style={styles.optionContent}>
          <ThemedText style={styles.optionLabel} numberOfLines={1}>
            {option.label}
          </ThemedText>
        </View>
        <Badge
          variant="secondary"
          style={styles.stockBadge}
        >
          <ThemedText style={styles.stockBadgeText}>
            {formatNumber(option.metadata.quantity)} disponível
          </ThemedText>
        </Badge>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {label && <Label>{label}</Label>}
      <Combobox
        async
        mode="multiple"
        queryKey={["items", "borrow-multi-selector"]}
        queryFn={queryItems}
        initialOptions={[]}
        minSearchLength={0}
        pageSize={50}
        debounceMs={300}
        value={value}
        onValueChange={onValueChange}
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
          Selecione múltiplos itens para empréstimo em lote
        </ThemedText>
      )}
    </View>
  );
}

// Export as default for convenience
export default MultiItemSelector;

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
  stockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stockBadgeText: {
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
