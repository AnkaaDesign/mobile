import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatDate, formatCurrency } from "@/utils";
import { AIRBRUSHING_STATUS_LABELS } from "@/constants";

interface AirbrushingFilterTagsProps {
  filters: Partial<any>;
  searchText?: string;
  onFilterChange: (filters: Partial<any>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

export function AirbrushingFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: AirbrushingFilterTagsProps) {
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

    // Where clause filters
    const where = filters.where as any;
    if (where) {
      // Status
      if (where.status?.in) {
        const statuses = where.status.in as string[];
        statuses.forEach((status) => {
          tags.push({
            key: `status-${status}`,
            label: `Status: ${AIRBRUSHING_STATUS_LABELS[status as keyof typeof AIRBRUSHING_STATUS_LABELS] || status}`,
            onRemove: () => {
              const newStatuses = statuses.filter((s) => s !== status);
              const newWhere = { ...where };
              if (newStatuses.length === 0) {
                delete newWhere.status;
              } else {
                newWhere.status = { in: newStatuses };
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        });
      }

      // Task ID
      if (where.taskId) {
        tags.push({
          key: "taskId",
          label: `Tarefa: ${where.taskId}`,
          onRemove: () => {
            const newWhere = { ...where };
            delete newWhere.taskId;
            onFilterChange({ ...filters, where: newWhere });
          },
        });
      }

      // Customer ID
      if (where.task?.customerId) {
        tags.push({
          key: "customerId",
          label: `Cliente filtrado`,
          onRemove: () => {
            const newWhere = { ...where };
            delete newWhere.task;
            onFilterChange({ ...filters, where: newWhere });
          },
        });
      }

      // Has price filter
      if (where.price?.not === null) {
        tags.push({
          key: "has-price",
          label: "Com Preço",
          onRemove: () => {
            const newWhere = { ...where };
            delete newWhere.price;
            onFilterChange({ ...filters, where: newWhere });
          },
        });
      }

      // Price range
      if (where.price && typeof where.price === 'object' && !where.price.not) {
        if (where.price.gte !== undefined) {
          tags.push({
            key: "price-min",
            label: `Preço mín: ${formatCurrency(where.price.gte)}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.price.lte !== undefined) {
                newWhere.price = { lte: where.price.lte };
              } else {
                delete newWhere.price;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }

        if (where.price.lte !== undefined) {
          tags.push({
            key: "price-max",
            label: `Preço máx: ${formatCurrency(where.price.lte)}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.price.gte !== undefined) {
                newWhere.price = { gte: where.price.gte };
              } else {
                delete newWhere.price;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }
      }

      // Date filters
      if (where.createdAt) {
        if (where.createdAt.gte) {
          tags.push({
            key: "created-start",
            label: `Cadastrado após: ${formatDate(new Date(where.createdAt.gte))}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.createdAt.lte) {
                newWhere.createdAt = { lte: where.createdAt.lte };
              } else {
                delete newWhere.createdAt;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }

        if (where.createdAt.lte) {
          tags.push({
            key: "created-end",
            label: `Cadastrado antes: ${formatDate(new Date(where.createdAt.lte))}`,
            onRemove: () => {
              const newWhere = { ...where };
              if (where.createdAt.gte) {
                newWhere.createdAt = { gte: where.createdAt.gte };
              } else {
                delete newWhere.createdAt;
              }
              onFilterChange({ ...filters, where: newWhere });
            },
          });
        }
      }
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