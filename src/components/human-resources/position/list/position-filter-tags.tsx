
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconBriefcase, IconUsers, IconCurrencyDollar, IconBuilding } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useSectors } from '../../../../hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface PositionFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function PositionFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: PositionFilterTagsProps) {
  const { colors } = useTheme();

  // Load filter options for label lookup
  const { data: sectorsData } = useSectors({ limit: 100 });

  const sectors = sectorsData?.data || [];

  // Helper function to find option label by ID
  const getOptionLabel = (options: any[], id: string) => {
    const option = options.find((opt) => opt.id === id);
    return option?.name || id;
  };

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

  // Generate all filter tags
  const renderFilterTags = () => {
    const tags = [];

    // Search tag
    if (searchText) {
      tags.push(
        <Badge key="search" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconSearch size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
            <TouchableOpacity onPress={() => onSearchChange?.("")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Bonifiable filter
    if (filters.bonifiable === true) {
      tags.push(
        <Badge key="bonifiable" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconBriefcase size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Apenas bonificáveis</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("bonifiable")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Has users filter
    if (filters.hasUsers === true) {
      tags.push(
        <Badge key="hasUsers" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconUsers size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Apenas com usuários</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasUsers")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Sector filters
    if (filters.sectorIds && Array.isArray(filters.sectorIds) && filters.sectorIds.length > 0) {
      filters.sectorIds.forEach((sectorId: string) => {
        const sectorLabel = getOptionLabel(sectors, sectorId);
        tags.push(
          <Badge key={`sector-${sectorId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconBuilding size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Setor: {sectorLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("sectorIds", sectorId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Remuneration range filter
    if (filters.remunerationRange && (filters.remunerationRange.min !== undefined || filters.remunerationRange.max !== undefined)) {
      const { min, max } = filters.remunerationRange;
      let rangeText = "Remuneração: ";
      if (min !== undefined && max !== undefined) {
        rangeText += `R$ ${min} - R$ ${max}`;
      } else if (min !== undefined) {
        rangeText += `≥ R$ ${min}`;
      } else if (max !== undefined) {
        rangeText += `≤ R$ ${max}`;
      }

      tags.push(
        <Badge key="remunerationRange" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCurrencyDollar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("remunerationRange")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    return tags;
  };

  const filterTags = renderFilterTags();
  const hasFilters = filterTags.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filterTags}
      </ScrollView>

      <Button variant="default" size="default" onPress={onClearAll} style={styles.clearButton}>
        <ThemedText style={{ ...styles.clearButtonText, color: colors.primary }}>Limpar todos</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.xs,
  },
  filterTag: {
    marginRight: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minHeight: 24,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
  removeButton: {
    padding: 2,
  },
  clearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minHeight: 24,
    borderRadius: borderRadius.md,
    minWidth: 60,
  },
  clearButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
});
