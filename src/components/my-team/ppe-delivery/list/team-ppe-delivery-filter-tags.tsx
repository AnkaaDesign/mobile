import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { PPE_DELIVERY_STATUS_LABELS } from '@/constants';

interface TeamPpeDeliveryFilterTagsProps {
  filters: {
    status?: string[];
    itemName?: string;
    userName?: string;
    deliveryDateStart?: Date;
    deliveryDateEnd?: Date;
    hasReviewer?: boolean;
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

export function TeamPpeDeliveryFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: TeamPpeDeliveryFilterTagsProps) {
  const { colors, isDark } = useTheme();

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

    // Status filters
    if (filters.status?.length) {
      filters.status.forEach((status) => {
        tags.push({
          key: `status-${status}`,
          label: `Status: ${PPE_DELIVERY_STATUS_LABELS[status] || status}`,
          onRemove: () => {
            const newStatuses = filters.status?.filter((s) => s !== status) || [];
            onFilterChange({
              ...filters,
              status: newStatuses.length > 0 ? newStatuses : undefined,
            });
          },
        });
      });
    }

    // Item name filter
    if (filters.itemName) {
      tags.push({
        key: "itemName",
        label: `Item: ${filters.itemName}`,
        onRemove: () => {
          onFilterChange({ ...filters, itemName: undefined });
        },
      });
    }

    // User name filter
    if (filters.userName) {
      tags.push({
        key: "userName",
        label: `Funcionário: ${filters.userName}`,
        onRemove: () => {
          onFilterChange({ ...filters, userName: undefined });
        },
      });
    }

    // Date range filters
    if (filters.deliveryDateStart) {
      tags.push({
        key: "deliveryDateStart",
        label: `De: ${new Date(filters.deliveryDateStart).toLocaleDateString('pt-BR')}`,
        onRemove: () => {
          onFilterChange({ ...filters, deliveryDateStart: undefined });
        },
      });
    }

    if (filters.deliveryDateEnd) {
      tags.push({
        key: "deliveryDateEnd",
        label: `Até: ${new Date(filters.deliveryDateEnd).toLocaleDateString('pt-BR')}`,
        onRemove: () => {
          onFilterChange({ ...filters, deliveryDateEnd: undefined });
        },
      });
    }

    // Has reviewer filter
    if (filters.hasReviewer) {
      tags.push({
        key: "hasReviewer",
        label: "Com Aprovador",
        onRemove: () => {
          onFilterChange({ ...filters, hasReviewer: undefined });
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
    minHeight: 44,
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
