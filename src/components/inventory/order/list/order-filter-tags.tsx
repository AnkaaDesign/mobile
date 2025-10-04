import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { ORDER_STATUS_LABELS } from '../../../../constants';
import { formatDate, formatCurrency } from '../../../../utils';
import type { OrderGetManyFormData } from '../../../../schemas';
import { useSuppliers } from '../../../../hooks';

interface OrderFilterTagsProps {
  filters: Partial<OrderGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<OrderGetManyFormData>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll?: () => void;
}

export const OrderFilterTags: React.FC<OrderFilterTagsProps> = ({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}) => {
  const { colors } = useTheme();

  // Helper to remove a specific filter
  const removeFilter = (key: keyof OrderGetManyFormData, value?: any) => {
    const newFilters = { ...filters };

    if (key === "status" && Array.isArray(newFilters.status) && value) {
      // Remove specific status
      newFilters.status = newFilters.status.filter(s => s !== value);
      if (newFilters.status.length === 0) delete newFilters.status;
    } else {
      // Remove entire filter
      delete newFilters[key as keyof typeof newFilters];
    }

    onFilterChange(newFilters);
  };

  // Build filter tags
  const tags: Array<{ key: string; label: string; onRemove: () => void }> = [];

  // Search text tag
  if (searchText) {
    tags.push({
      key: "search",
      label: `Busca: "${searchText}"`,
      onRemove: () => onSearchChange?.(""),
    });
  }

  // Status tags
  if (filters.status && Array.isArray(filters.status)) {
    filters.status.forEach(status => {
      tags.push({
        key: `status-${status}`,
        label: ORDER_STATUS_LABELS[status],
        onRemove: () => removeFilter("status", status),
      });
    });
  }

  // Supplier tag
  if (filters.supplierId) {
    tags.push({
      key: "supplier",
      label: "Fornecedor selecionado",
      onRemove: () => removeFilter("supplierId"),
    });
  }

  // Date range tags
  if (filters.createdAt?.gte || filters.createdAt?.lte) {
    const from = filters.createdAt.gte ? formatDate(filters.createdAt.gte) : "";
    const to = filters.createdAt.lte ? formatDate(filters.createdAt.lte) : "";
    tags.push({
      key: "created-date",
      label: `Criado: ${from} - ${to}`,
      onRemove: () => removeFilter("createdAt"),
    });
  }

  if (filters.expectedDelivery?.gte || filters.expectedDelivery?.lte) {
    const from = filters.expectedDelivery.gte ? formatDate(filters.expectedDelivery.gte) : "";
    const to = filters.expectedDelivery.lte ? formatDate(filters.expectedDelivery.lte) : "";
    tags.push({
      key: "expected-date",
      label: `Entrega: ${from} - ${to}`,
      onRemove: () => removeFilter("expectedDelivery"),
    });
  }

  // Price range tag
  if (filters.totalPrice?.gte !== undefined || filters.totalPrice?.lte !== undefined) {
    const min = filters.totalPrice.gte ? formatCurrency(filters.totalPrice.gte) : "";
    const max = filters.totalPrice.lte ? formatCurrency(filters.totalPrice.lte) : "";
    tags.push({
      key: "price",
      label: `Preço: ${min} - ${max}`,
      onRemove: () => removeFilter("totalPrice"),
    });
  }

  if (tags.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tags.map(tag => (
          <Pressable
            key={tag.key}
            style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.accent }])}
            onPress={tag.onRemove}
          >
            <ThemedText style={styles.tagText}>{tag.label}</ThemedText>
            <IconX size={14} color={colors.foreground} />
          </Pressable>
        ))}
        {tags.length > 1 && onClearAll && (
          <Pressable
            style={StyleSheet.flatten([styles.clearAll, { borderColor: colors.border }])}
            onPress={onClearAll}
          >
            <ThemedText style={StyleSheet.flatten([styles.clearAllText, { color: colors.destructive }])}>
              Limpar tudo
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.sm,
  },
  clearAll: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});