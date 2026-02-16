import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatDate } from "@/utils";
import { USER_STATUS } from "@/constants";

interface TeamMemberFilters {
  statuses?: string[];
  positionIds?: string[];
  sectorIds?: string[];
  exp1StartAtStart?: Date;
  exp1StartAtEnd?: Date;
}

interface TeamMemberFilterTagsProps {
  filters: TeamMemberFilters;
  searchText?: string;
  onFilterChange: (filters: TeamMemberFilters) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
  positions?: Array<{ id: string; name: string }>;
  sectors?: Array<{ id: string; name: string }>;
}

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  [USER_STATUS.EXPERIENCE_PERIOD_1]: "Experiência 1",
  [USER_STATUS.EXPERIENCE_PERIOD_2]: "Experiência 2",
  [USER_STATUS.EFFECTED]: "Efetivado",
  [USER_STATUS.DISMISSED]: "Desligado",
};

export function TeamMemberFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
  positions = [],
  sectors = [],
}: TeamMemberFilterTagsProps) {
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
    if (filters.statuses?.length) {
      filters.statuses.forEach((status) => {
        tags.push({
          key: `status-${status}`,
          label: `Status: ${STATUS_LABELS[status] || status}`,
          onRemove: () => {
            const newStatuses = filters.statuses?.filter((s) => s !== status);
            onFilterChange({
              ...filters,
              statuses: newStatuses?.length ? newStatuses : undefined,
            });
          },
        });
      });
    }

    // Position filters
    if (filters.positionIds?.length) {
      filters.positionIds.forEach((positionId) => {
        const position = positions.find((p) => p.id === positionId);
        if (position) {
          tags.push({
            key: `position-${positionId}`,
            label: `Cargo: ${position.name}`,
            onRemove: () => {
              const newPositionIds = filters.positionIds?.filter((id) => id !== positionId);
              onFilterChange({
                ...filters,
                positionIds: newPositionIds?.length ? newPositionIds : undefined,
              });
            },
          });
        }
      });
    }

    // Sector filters
    if (filters.sectorIds?.length) {
      filters.sectorIds.forEach((sectorId) => {
        const sector = sectors.find((s) => s.id === sectorId);
        if (sector) {
          tags.push({
            key: `sector-${sectorId}`,
            label: `Setor: ${sector.name}`,
            onRemove: () => {
              const newSectorIds = filters.sectorIds?.filter((id) => id !== sectorId);
              onFilterChange({
                ...filters,
                sectorIds: newSectorIds?.length ? newSectorIds : undefined,
              });
            },
          });
        }
      });
    }

    // Hire date start
    if (filters.exp1StartAtStart) {
      tags.push({
        key: "hire-start",
        label: `Admissão após: ${formatDate(filters.exp1StartAtStart)}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            exp1StartAtStart: undefined,
          });
        },
      });
    }

    // Hire date end
    if (filters.exp1StartAtEnd) {
      tags.push({
        key: "hire-end",
        label: `Admissão antes: ${formatDate(filters.exp1StartAtEnd)}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            exp1StartAtEnd: undefined,
          });
        },
      });
    }

    return tags;
  }, [filters, searchText, onFilterChange, onSearchChange, positions, sectors]);

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
