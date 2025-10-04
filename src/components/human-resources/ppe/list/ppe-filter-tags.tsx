import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useItemCategories } from '../../../../hooks';
import { PPE_TYPE_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemGetManyFormData } from '../../../../schemas';

interface PpeFilterTagsProps {
  filters: Partial<ItemGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<ItemGetManyFormData>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

interface FilterTag {
  id: string;
  label: string;
  onRemove: () => void;
}

export function PpeFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: PpeFilterTagsProps) {
  const { colors } = useTheme();

  // Load categories for label lookup
  const { data: categoriesResponse } = useItemCategories({
    perPage: 100,
    orderBy: { name: "asc" },
  });
  const categories = categoriesResponse?.data || [];

  // Build filter tags
  const filterTags = useMemo(() => {
    const tags: FilterTag[] = [];
    const where = filters.where || {};

    // Search tag
    if (searchText) {
      tags.push({
        id: "search",
        label: `Busca: "${searchText}"`,
        onRemove: () => onSearchChange(""),
      });
    }

    // PPE Type tags
    if (Array.isArray(where.ppeType?.in)) {
      where.ppeType.in.forEach((type: string) => {
        tags.push({
          id: `ppeType-${type}`,
          label: `Tipo: ${PPE_TYPE_LABELS[type] || type}`,
          onRemove: () => {
            const newTypes = where.ppeType.in.filter((t: string) => t !== type);
            const newWhere = { ...where };
            if (newTypes.length > 0) {
              newWhere.ppeType = { in: newTypes };
            } else {
              delete newWhere.ppeType;
            }
            onFilterChange({ ...filters, where: { ...newWhere, ppeType: { not: null } } });
          },
        });
      });
    }

    // Category tags
    if (Array.isArray(where.categoryId?.in)) {
      where.categoryId.in.forEach((categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        tags.push({
          id: `category-${categoryId}`,
          label: `Categoria: ${category?.name || "Desconhecida"}`,
          onRemove: () => {
            const newCategories = where.categoryId.in.filter((id: string) => id !== categoryId);
            const newWhere = { ...where };
            if (newCategories.length > 0) {
              newWhere.categoryId = { in: newCategories };
            } else {
              delete newWhere.categoryId;
            }
            onFilterChange({ ...filters, where: { ...newWhere, ppeType: { not: null } } });
          },
        });
      });
    }

    // Has deliveries tag
    if (where.ppeDeliveries?.some) {
      tags.push({
        id: "hasDeliveries",
        label: "Com entregas",
        onRemove: () => {
          const newWhere = { ...where };
          delete newWhere.ppeDeliveries;
          onFilterChange({ ...filters, where: { ...newWhere, ppeType: { not: null } } });
        },
      });
    }

    return tags;
  }, [filters, searchText, categories, onFilterChange, onSearchChange]);

  // Don't render if no tags
  if (filterTags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filterTags.map((tag) => (
          <TouchableOpacity key={tag.id} onPress={tag.onRemove} style={[styles.tag, { backgroundColor: colors.secondary, borderColor: colors.border }]} activeOpacity={0.7}>
            <ThemedText style={styles.tagText}>{tag.label}</ThemedText>
            <IconX size={14} color={colors.secondaryForeground} />
          </TouchableOpacity>
        ))}
        {filterTags.length > 1 && (
          <TouchableOpacity onPress={onClearAll} style={[styles.clearAllButton, { backgroundColor: colors.destructive }]} activeOpacity={0.7}>
            <ThemedText style={[styles.clearAllText, { color: colors.destructiveForeground }]}>Limpar tudo</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  clearAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  clearAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
