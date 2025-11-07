import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { BORROW_STATUS_LABELS } from '@/constants';
import { formatDate } from '@/utils';

interface MyBorrowFilterTagsProps {
  filters: {
    status?: string[];
    itemType?: string;
    dateRange?: { start?: Date; end?: Date };
    showOverdueOnly?: boolean;
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

export function MyBorrowFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: MyBorrowFilterTagsProps) {
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

    // Status filters
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((status) => {
        const label = BORROW_STATUS_LABELS[status as keyof typeof BORROW_STATUS_LABELS];
        tags.push({
          key: `status-${status}`,
          label: `Status: ${label}`,
          onRemove: () => {
            const newStatuses = filters.status!.filter(s => s !== status);
            onFilterChange({
              ...filters,
              status: newStatuses.length > 0 ? newStatuses : undefined
            });
          },
        });
      });
    }

    // Item type filter
    if (filters.itemType) {
      tags.push({
        key: "itemType",
        label: `Tipo: ${filters.itemType}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            itemType: undefined
          });
        },
      });
    }

    // Date range filters
    if (filters.dateRange?.start) {
      tags.push({
        key: "dateStart",
        label: `Após: ${formatDate(filters.dateRange.start)}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            dateRange: {
              ...filters.dateRange,
              start: undefined
            }
          });
        },
      });
    }

    if (filters.dateRange?.end) {
      tags.push({
        key: "dateEnd",
        label: `Antes: ${formatDate(filters.dateRange.end)}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            dateRange: {
              ...filters.dateRange,
              end: undefined
            }
          });
        },
      });
    }

    // Overdue only filter
    if (filters.showOverdueOnly) {
      tags.push({
        key: "overdue",
        label: "Apenas Atrasados",
        onRemove: () => {
          onFilterChange({
            ...filters,
            showOverdueOnly: undefined
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
        {/* Individual filter tags - no "Limpar tudo" button on mobile */}
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
