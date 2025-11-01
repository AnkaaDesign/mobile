
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconShield, IconUsers, IconCalendar } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES_LABELS } from '../../../../constants';
import { spacing, fontSize } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { formatDate } from '../../../../utils';

interface SectorFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function SectorFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: SectorFilterTagsProps) {
  const { colors } = useTheme();

  // Remove individual filter
  const removeFilter = (filterKey: string, filterId?: string) => {
    const newFilters = { ...filters };

    // Handle nested where filters
    if (filterKey.startsWith("where.")) {
      const whereKey = filterKey.split(".")[1];
      if (newFilters.where) {
        if (filterId && newFilters.where[whereKey]?.in) {
          // Remove specific ID from array
          const newArray = newFilters.where[whereKey].in.filter((id: string) => id !== filterId);
          if (newArray.length > 0) {
            newFilters.where[whereKey].in = newArray;
          } else {
            delete newFilters.where[whereKey];
          }
        } else {
          // Remove entire filter
          delete newFilters.where[whereKey];
        }
        // Clean up empty where object
        if (Object.keys(newFilters.where).length === 0) {
          delete newFilters.where;
        }
      }
    } else {
      // Remove entire filter
      delete newFilters[filterKey as keyof typeof newFilters];
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

    // Privilege filters
    if (filters.where?.privileges?.in && Array.isArray(filters.where.privileges.in)) {
      filters.where.privileges.in.forEach((privilege: string) => {
        tags.push(
          <Badge key={`privilege-${privilege}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconShield size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>{SECTOR_PRIVILEGES_LABELS[privilege as keyof typeof SECTOR_PRIVILEGES_LABELS]}</ThemedText>
              <TouchableOpacity
                onPress={() => removeFilter("where.privileges", privilege)}
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

    // Has users filter
    if (filters.hasUsers) {
      tags.push(
        <Badge key="hasUsers" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconUsers size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com funcionários</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasUsers")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Created date range
    if (filters.createdAt) {
      const createdStart = filters.createdAt.gte ? formatDate(new Date(filters.createdAt.gte)) : null;
      const createdEnd = filters.createdAt.lte ? formatDate(new Date(filters.createdAt.lte)) : null;
      let dateLabel = "Criado";
      if (createdStart && createdEnd) {
        dateLabel += `: ${createdStart} - ${createdEnd}`;
      } else if (createdStart) {
        dateLabel += `: após ${createdStart}`;
      } else if (createdEnd) {
        dateLabel += `: antes de ${createdEnd}`;
      }

      tags.push(
        <Badge key="createdAt" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{dateLabel}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("createdAt")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Updated date range
    if (filters.updatedAt) {
      const updatedStart = filters.updatedAt.gte ? formatDate(new Date(filters.updatedAt.gte)) : null;
      const updatedEnd = filters.updatedAt.lte ? formatDate(new Date(filters.updatedAt.lte)) : null;
      let dateLabel = "Atualizado";
      if (updatedStart && updatedEnd) {
        dateLabel += `: ${updatedStart} - ${updatedEnd}`;
      } else if (updatedStart) {
        dateLabel += `: após ${updatedStart}`;
      } else if (updatedEnd) {
        dateLabel += `: antes de ${updatedEnd}`;
      }

      tags.push(
        <Badge key="updatedAt" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{dateLabel}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("updatedAt")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    return tags;
  };

  const tags = renderFilterTags();
  const hasFilters = tags.length > 0;

  if (!hasFilters) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tags}
      </ScrollView>
      <Button variant="ghost" size="sm" onPress={onClearAll} style={styles.clearButton}>
        <ThemedText style={styles.clearButtonText}>Limpar tudo</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  scrollContent: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  filterTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
  },
  removeButton: {
    marginLeft: spacing.xs,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
  },
  clearButtonText: {
    fontSize: fontSize.xs,
  },
});
