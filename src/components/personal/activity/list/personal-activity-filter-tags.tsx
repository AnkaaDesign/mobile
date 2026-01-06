import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '@/constants';

interface PersonalActivityFilterTagsProps {
  filters: {
    operations?: string[];
    reasons?: string[];
    itemIds?: string[];
    quantityRange?: { min?: number; max?: number };
    createdAt?: { gte?: Date; lte?: Date };
  };
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

export function PersonalActivityFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: PersonalActivityFilterTagsProps) {
  const { colors } = useTheme();

  // Build array of active filter tags
  const filterTags = useMemo((): FilterTag[] => {
    const tags: FilterTag[] = [];

    // Search text
    if (searchText) {
      tags.push({
        key: "search",
        label: `Busca: "${searchText}"`,
        onRemove: () => onSearchChange?.(""),
      });
    }

    // Operations
    if (filters.operations && filters.operations.length > 0) {
      filters.operations.forEach((operation: string) => {
        tags.push({
          key: `operation-${operation}`,
          label: `Operação: ${ACTIVITY_OPERATION_LABELS[operation as keyof typeof ACTIVITY_OPERATION_LABELS] || operation}`,
          onRemove: () => {
            const newOperations = filters.operations!.filter((op: string) => op !== operation);
            onFilterChange({
              ...filters,
              operations: newOperations.length > 0 ? newOperations : undefined,
            });
          },
        });
      });
    }

    // Reasons
    if (filters.reasons && filters.reasons.length > 0) {
      filters.reasons.forEach((reason: string) => {
        tags.push({
          key: `reason-${reason}`,
          label: `Motivo: ${ACTIVITY_REASON_LABELS[reason as keyof typeof ACTIVITY_REASON_LABELS] || reason}`,
          onRemove: () => {
            const newReasons = filters.reasons!.filter((r: string) => r !== reason);
            onFilterChange({
              ...filters,
              reasons: newReasons.length > 0 ? newReasons : undefined,
            });
          },
        });
      });
    }

    // Quantity range
    if (filters.quantityRange) {
      if (filters.quantityRange.min !== undefined) {
        tags.push({
          key: "quantity-min",
          label: `Quantidade ≥ ${filters.quantityRange.min}`,
          onRemove: () => {
            const newRange = { ...filters.quantityRange };
            delete newRange.min;
            onFilterChange({
              ...filters,
              quantityRange: Object.keys(newRange).length > 0 ? newRange : undefined,
            });
          },
        });
      }
      if (filters.quantityRange.max !== undefined) {
        tags.push({
          key: "quantity-max",
          label: `Quantidade ≤ ${filters.quantityRange.max}`,
          onRemove: () => {
            const newRange = { ...filters.quantityRange };
            delete newRange.max;
            onFilterChange({
              ...filters,
              quantityRange: Object.keys(newRange).length > 0 ? newRange : undefined,
            });
          },
        });
      }
    }

    // Item IDs
    if (filters.itemIds && filters.itemIds.length > 0) {
      tags.push({
        key: "itemIds",
        label: `Itens: ${filters.itemIds.length} selecionado${filters.itemIds.length > 1 ? 's' : ''}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            itemIds: undefined,
          });
        },
      });
    }

    return tags;
  }, [filters, searchText, onFilterChange, onSearchChange]);

  // Don't render if no active filters
  if (filterTags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Individual filter tags */}
        {filterTags.map((tag) => (
          <Badge
            key={tag.key}
            variant="secondary"
            style={StyleSheet.flatten([
              styles.filterTag,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              }
            ])}
          >
            <ThemedText style={[styles.filterTagText, { color: colors.secondaryForeground }]}>
              {tag.label}
            </ThemedText>
            <TouchableOpacity
              onPress={tag.onRemove}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <IconX size={14} color={colors.secondaryForeground} />
            </TouchableOpacity>
          </Badge>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    minHeight: 44, // Ensure consistent height
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minHeight: 32,
  },
  filterTagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
});
