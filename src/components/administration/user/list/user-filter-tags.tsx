
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconUserCheck, IconBriefcase, IconBuilding, IconShieldCheck } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { usePositions, useSectors } from "@/hooks";
import { USER_STATUS_LABELS } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface UserFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function UserFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: UserFilterTagsProps) {
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

  // Remove individual filter from where clause
  const removeFilter = (filterPath: string[], filterId?: string) => {
    const newFilters = { ...filters };

    // Navigate to the filter location
    let current: any = newFilters;
    for (let i = 0; i < filterPath.length - 1; i++) {
      if (!current[filterPath[i]]) return;
      current = current[filterPath[i]];
    }

    const lastKey = filterPath[filterPath.length - 1];

    if (filterId && current[lastKey]?.in && Array.isArray(current[lastKey].in)) {
      // Remove specific ID from array
      const newArray = current[lastKey].in.filter((id: string) => id !== filterId);
      if (newArray.length > 0) {
        current[lastKey].in = newArray;
      } else {
        delete current[lastKey];
      }
    } else {
      // Remove entire filter
      delete current[lastKey];
    }

    // Clean up empty where clause
    if (newFilters.where && Object.keys(newFilters.where).length === 0) {
      delete newFilters.where;
    }

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
    if (filters.where?.status?.in) {
      filters.where.status.in.forEach((status: string) => {
        tags.push(
          <Badge key={`status-${status}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconUserCheck size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>{USER_STATUS_LABELS[status as keyof typeof USER_STATUS_LABELS]}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter(["where", "status"], status)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Position filters
    if (filters.where?.positionId?.in) {
      filters.where.positionId.in.forEach((positionId: string) => {
        tags.push(
          <Badge key={`position-${positionId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconBriefcase size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>{getOptionLabel(positions, positionId)}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter(["where", "positionId"], positionId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Sector filters
    if (filters.where?.sectorId?.in) {
      filters.where.sectorId.in.forEach((sectorId: string) => {
        tags.push(
          <Badge key={`sector-${sectorId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconBuilding size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>{getOptionLabel(sectors, sectorId)}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter(["where", "sectorId"], sectorId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Managed Sector filters
    if (filters.where?.managedSectorId?.in) {
      filters.where.managedSectorId.in.forEach((managedSectorId: string) => {
        tags.push(
          <Badge key={`managedSector-${managedSectorId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconShieldCheck size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Gerencia: {getOptionLabel(sectors, managedSectorId)}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter(["where", "managedSectorId"], managedSectorId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Boolean filters
    if (filters.where?.verified !== undefined) {
      tags.push(
        <Badge key="verified" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconShieldCheck size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{filters.where.verified ? "Verificado" : "Não Verificado"}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter(["where", "verified"])} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.where?.hasManagedSector !== undefined) {
      tags.push(
        <Badge key="hasManagedSector" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconBuilding size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{filters.where.hasManagedSector ? "Gerencia Setor" : "Não Gerencia"}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter(["where", "hasManagedSector"])} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    return tags;
  };

  const filterTags = renderFilterTags();
  const hasActiveFilters = filterTags.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filterTags}
        {filterTags.length > 1 && (
          <Button variant="ghost" size="sm" onPress={onClearAll} style={styles.clearButton}>
            <IconX size={14} color={colors.destructive} />
            <ThemedText style={{ color: colors.destructive, fontSize: fontSize.xs }}>Limpar tudo</ThemedText>
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    alignItems: "center",
  },
  filterTag: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    marginLeft: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
});
