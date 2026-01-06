/**
 * @deprecated This component is deprecated in favor of `ItemSelectorTable` from `@/components/forms`.
 * Use the new standardized component for better mobile/tablet support, filtering, and pagination.
 *
 * Migration guide:
 * - For single item selection: Use Combobox with item search
 * - For multi-item selection with quantities: Use ItemSelectorTable from @/components/forms
 * - For multi-step forms: Use useMultiStepForm hook with MultiStepFormContainer
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

interface ItemSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  initialItem?: Item;
  error?: string;
  label?: string;
  required?: boolean;
}

export function BorrowItemSelector({
  value,
  onValueChange,
  disabled,
  initialItem,
  error,
  label = "Item",
  required = true,
}: ItemSelectorProps) {
  const { colors } = useTheme();

  // Memoize initialOptions with stable dependency
  const initialOptions = useMemo(() => {
    if (!initialItem) return [];

    return [{
      value: initialItem.id,
      label: initialItem.uniCode ? `${initialItem.uniCode} - ${initialItem.name}` : initialItem.name,
      description: `Estoque: ${initialItem.quantity || 0}`,
      metadata: {
        quantity: initialItem.quantity,
        category: initialItem.category,
        brand: initialItem.brand,
        isActive: initialItem.isActive,
      },
    }];
  }, [initialItem?.id]);

  // Async query function for Combobox with pagination
  const queryFn = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 50;
    const response = await getItems({
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
      orderBy: { name: "asc" },
      include: {
        itemCategory: true,
        itemBrand: true,
      },
    });

    const items = response.data || [];
    const total = items.length;
    const hasMore = (page * pageSize) < total;

    return {
      data: items.map((item) => ({
        value: item.id,
        label: item.uniCode ? `${item.uniCode} - ${item.name}` : item.name,
        description: `Estoque: ${item.quantity || 0}`,
        metadata: {
          quantity: item.quantity,
          category: item.category,
          brand: item.brand,
          isActive: item.isActive,
        },
      })) as ComboboxOption[],
      hasMore,
      total,
    };
  }, []);

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

    return (
      <View style={styles.optionContainer}>
        <View style={styles.optionContent}>
          <ThemedText style={styles.optionLabel} numberOfLines={1}>
            {option.label}
          </ThemedText>
          {option.description && (
            <ThemedText style={[styles.optionDescription, { color: colors.mutedForeground }]} numberOfLines={1}>
              {option.description}
            </ThemedText>
          )}
        </View>
        <Badge
          variant="secondary"
          style={styles.stockBadge}
        >
          <ThemedText style={styles.stockBadgeText}>
            {metadata.quantity || 0} disp.
          </ThemedText>
        </Badge>
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
        queryKey={["items", "borrow-selector"]}
        queryFn={queryFn}
        initialOptions={initialOptions}
        minSearchLength={0}
        pageSize={50}
        debounceMs={300}
        value={value || ""}
        onValueChange={(val) => onValueChange(Array.isArray(val) ? val[0] : val || undefined)}
        placeholder="Selecione um item"
        emptyText="Nenhum item disponível"
        searchPlaceholder="Buscar por nome ou código..."
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
        Selecione a ferramenta que será emprestada
      </ThemedText>
    </View>
  );
}

// Export as ItemSelector for compatibility
export { BorrowItemSelector as ItemSelector };

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
  optionDescription: {
    fontSize: fontSize.xs,
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
