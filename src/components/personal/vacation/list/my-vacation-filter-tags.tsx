import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { VACATION_STATUS_LABELS } from '@/constants';

interface MyVacationFilterTagsProps {
  filters: {
    status?: string;
    year?: number;
    isCollective?: boolean;
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

export function MyVacationFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: MyVacationFilterTagsProps) {
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

    // Status
    if (filters.status) {
      tags.push({
        key: "status",
        label: `Status: ${VACATION_STATUS_LABELS[filters.status as keyof typeof VACATION_STATUS_LABELS] || filters.status}`,
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.status;
          onFilterChange(newFilters);
        },
      });
    }

    // Year
    if (filters.year) {
      tags.push({
        key: "year",
        label: `Ano: ${filters.year}`,
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.year;
          onFilterChange(newFilters);
        },
      });
    }

    // Collective
    if (filters.isCollective) {
      tags.push({
        key: "collective",
        label: "Férias Coletivas",
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.isCollective;
          onFilterChange(newFilters);
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
