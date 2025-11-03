import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { TASK_STATUS_LABELS } from '../../../../constants';

interface TaskFilterTagsProps {
  filters: any;
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

export function TaskFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: TaskFilterTagsProps) {
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
    if (filters.status?.length) {
      filters.status.forEach((status: string, index: number) => {
        const statusLabel = TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS];
        if (statusLabel) {
          tags.push({
            key: `status-${index}`,
            label: `Status: ${statusLabel}`,
            onRemove: () => {
              const newStatus = filters.status.filter((s: string) => s !== status);
              onFilterChange({
                ...filters,
                status: newStatus.length > 0 ? newStatus : undefined,
              });
            },
          });
        }
      });
    }

    // Sort by filter
    if (filters.sortBy && filters.sortBy !== "term") {
      const sortLabels: Record<string, string> = {
        createdAt: "Data de Criação",
        term: "Prazo",
        priority: "Prioridade",
      };
      tags.push({
        key: "sortBy",
        label: `Ordenar: ${sortLabels[filters.sortBy] || filters.sortBy}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            sortBy: undefined,
          });
        },
      });
    }

    // Sort order filter
    if (filters.sortOrder && filters.sortOrder !== "asc") {
      tags.push({
        key: "sortOrder",
        label: `Ordem: ${filters.sortOrder === "desc" ? "Decrescente" : "Crescente"}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            sortOrder: undefined,
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
