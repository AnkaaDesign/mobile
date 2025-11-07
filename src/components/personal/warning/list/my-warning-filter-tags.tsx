import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { WARNING_SEVERITY_LABELS, WARNING_CATEGORY_LABELS } from '@/constants';

interface MyWarningFilterTagsProps {
  filters: {
    severity?: string[];
    category?: string[];
    isActive?: boolean;
    followUpDate?: { gte?: Date; lte?: Date };
    createdAt?: { gte?: Date; lte?: Date };
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

export function MyWarningFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: MyWarningFilterTagsProps) {
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

    // Severity filters
    if (filters.severity?.length) {
      filters.severity.forEach((severity) => {
        tags.push({
          key: `severity-${severity}`,
          label: `Gravidade: ${WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity}`,
          onRemove: () => {
            const newSeverities = filters.severity!.filter((s) => s !== severity);
            onFilterChange({
              ...filters,
              severity: newSeverities.length > 0 ? newSeverities : undefined,
            });
          },
        });
      });
    }

    // Category filters
    if (filters.category?.length) {
      filters.category.forEach((category) => {
        tags.push({
          key: `category-${category}`,
          label: `Categoria: ${WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS] || category}`,
          onRemove: () => {
            const newCategories = filters.category!.filter((c) => c !== category);
            onFilterChange({
              ...filters,
              category: newCategories.length > 0 ? newCategories : undefined,
            });
          },
        });
      });
    }

    // Status filter
    if (filters.isActive !== undefined) {
      tags.push({
        key: "isActive",
        label: filters.isActive ? "Status: Ativas" : "Status: Resolvidas",
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.isActive;
          onFilterChange(newFilters);
        },
      });
    }

    // Date filters
    if (filters.createdAt?.gte) {
      tags.push({
        key: "created-start",
        label: `Criada após: ${new Date(filters.createdAt.gte).toLocaleDateString('pt-BR')}`,
        onRemove: () => {
          const newFilters = { ...filters };
          if (filters.createdAt?.lte) {
            newFilters.createdAt = { lte: filters.createdAt.lte };
          } else {
            delete newFilters.createdAt;
          }
          onFilterChange(newFilters);
        },
      });
    }

    if (filters.createdAt?.lte) {
      tags.push({
        key: "created-end",
        label: `Criada antes: ${new Date(filters.createdAt.lte).toLocaleDateString('pt-BR')}`,
        onRemove: () => {
          const newFilters = { ...filters };
          if (filters.createdAt?.gte) {
            newFilters.createdAt = { gte: filters.createdAt.gte };
          } else {
            delete newFilters.createdAt;
          }
          onFilterChange(newFilters);
        },
      });
    }

    if (filters.followUpDate?.gte) {
      tags.push({
        key: "followup-start",
        label: `Acompanhamento após: ${new Date(filters.followUpDate.gte).toLocaleDateString('pt-BR')}`,
        onRemove: () => {
          const newFilters = { ...filters };
          if (filters.followUpDate?.lte) {
            newFilters.followUpDate = { lte: filters.followUpDate.lte };
          } else {
            delete newFilters.followUpDate;
          }
          onFilterChange(newFilters);
        },
      });
    }

    if (filters.followUpDate?.lte) {
      tags.push({
        key: "followup-end",
        label: `Acompanhamento antes: ${new Date(filters.followUpDate.lte).toLocaleDateString('pt-BR')}`,
        onRemove: () => {
          const newFilters = { ...filters };
          if (filters.followUpDate?.gte) {
            newFilters.followUpDate = { gte: filters.followUpDate.gte };
          } else {
            delete newFilters.followUpDate;
          }
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
