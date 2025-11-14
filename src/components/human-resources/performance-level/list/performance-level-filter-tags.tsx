
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconStar, IconBriefcase, IconBuilding, IconShield } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { usePositions, useSectors } from "@/hooks";
import { USER_STATUS_LABELS } from "@/constants";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface PerformanceLevelFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function PerformanceLevelFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: PerformanceLevelFilterTagsProps) {
  const { colors } = useTheme();

  // Load filter options for label lookup
  const { data: positionsData } = usePositions({ limit: 100 });
  const { data: sectorsData } = useSectors({ limit: 100 });

  const positions = positionsData?.data || [];
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
    } else if (filterKey === "performanceLevelRange" || filterKey === "where") {
      // For nested where clause, need to remove properly
      if (filterKey === "where" && filterId === "performanceLevel") {
        const newWhere = { ...newFilters.where };
        delete newWhere.performanceLevel;
        newFilters.where = Object.keys(newWhere).length > 0 ? newWhere : undefined;
      } else {
        newFilters[filterKey] = undefined;
      }
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

    // Status filters
    if (filters.isActive === false) {
      tags.push(
        <Badge key="isActive" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconShield size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Incluindo inativos</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("isActive")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // User status filters (from where.status.in array)
    if (filters.where?.status?.in && Array.isArray(filters.where.status.in) && filters.where.status.in.length > 0) {
      filters.where.status.in.forEach((status: string) => {
        const statusLabel = USER_STATUS_LABELS[status as keyof typeof USER_STATUS_LABELS] || status;
        tags.push(
          <Badge key={`status-${status}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconShield size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Status: {statusLabel}</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  const newFilters = { ...filters };
                  const newStatuses = newFilters.where.status.in.filter((s: string) => s !== status);
                  if (newStatuses.length > 0) {
                    newFilters.where.status.in = newStatuses;
                  } else {
                    delete newFilters.where.status;
                    if (Object.keys(newFilters.where).length === 0) {
                      delete newFilters.where;
                    }
                  }
                  onFilterChange(newFilters);
                }}
                style={styles.removeButton}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Performance level range filter
    if (filters.where?.performanceLevel && (filters.where.performanceLevel.gte !== undefined || filters.where.performanceLevel.lte !== undefined)) {
      const { gte, lte } = filters.where.performanceLevel;
      let rangeText = "Nível: ";
      if (gte !== undefined && lte !== undefined) {
        rangeText += `${gte} - ${lte}`;
      } else if (gte !== undefined) {
        rangeText += `≥ ${gte}`;
      } else if (lte !== undefined) {
        rangeText += `≤ ${lte}`;
      }

      tags.push(
        <Badge key="performanceLevel" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconStar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("where", "performanceLevel")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Position filters
    if (filters.positionIds && Array.isArray(filters.positionIds) && filters.positionIds.length > 0) {
      filters.positionIds.forEach((positionId: string) => {
        const positionLabel = getOptionLabel(positions, positionId);
        tags.push(
          <Badge key={`position-${positionId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconBriefcase size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Cargo: {positionLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("positionIds", positionId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
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
