
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconCalendar, IconTag } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { HOLIDAY_TYPE, HOLIDAY_TYPE_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface HolidayFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function HolidayFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: HolidayFilterTagsProps) {
  const { colors } = useTheme();

  // Remove individual filter
  const removeFilter = (filterKey: string, filterId?: string) => {
    const newFilters = { ...filters };

    if (filterId && Array.isArray(newFilters[filterKey])) {
      // Remove specific ID from array
      const newArray = newFilters[filterKey].filter((id: string) => id !== filterId);
      newFilters[filterKey] = newArray.length > 0 ? newArray : undefined;
    } else {
      // Remove entire filter
      newFilters[filterKey] = undefined;
    }

    // Clean undefined values
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === undefined) {
        delete newFilters[key as keyof typeof newFilters];
      }
    });

    onFilterChange(newFilters);
  };

  // Count total active filters
  const hasActiveFilters =
    searchText ||
    (filters.types && filters.types.length > 0) ||
    filters.year ||
    filters.month ||
    filters.isUpcoming;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search tag */}
        {searchText && (
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <IconSearch size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.tagText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {searchText}
            </ThemedText>
            <TouchableOpacity onPress={() => onSearchChange?.("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <IconX size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Type filters */}
        {filters.types &&
          filters.types.map((type: string) => (
            <View key={type} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <IconTag size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.tagText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {HOLIDAY_TYPE_LABELS[type as HOLIDAY_TYPE] || type}
              </ThemedText>
              <TouchableOpacity onPress={() => removeFilter("types", type)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconX size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}

        {/* Year filter */}
        {filters.year && (
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <IconCalendar size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.tagText, { color: colors.mutedForeground }]}>
              Ano: {filters.year}
            </ThemedText>
            <TouchableOpacity onPress={() => removeFilter("year")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <IconX size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Month filter */}
        {filters.month && (
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <IconCalendar size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.tagText, { color: colors.mutedForeground }]}>
              Mês: {filters.month}
            </ThemedText>
            <TouchableOpacity onPress={() => removeFilter("month")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <IconX size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming filter */}
        {filters.isUpcoming && (
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <IconCalendar size={14} color={colors.mutedForeground} />
            <ThemedText style={[styles.tagText, { color: colors.mutedForeground }]}>
              Próximos
            </ThemedText>
            <TouchableOpacity onPress={() => removeFilter("isUpcoming")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <IconX size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Clear all button */}
        <Button variant="ghost" size="sm" onPress={onClearAll} style={styles.clearButton}>
          Limpar tudo
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    maxWidth: 200,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  clearButton: {
    marginLeft: spacing.xs,
  },
});
