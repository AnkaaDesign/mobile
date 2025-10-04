import React, { useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { MetricFilters } from "./metric-filter-modal";
import type { MetricCategory } from "./metric-table";

interface MetricFilterTagsProps {
  filters: MetricFilters;
  onFilterChange: (filters: MetricFilters) => void;
  onClearAll: () => void;
}

const CATEGORY_LABELS: Record<MetricCategory, string> = {
  cpu: "CPU",
  memory: "Memória",
  disk: "Disco",
  network: "Rede",
  system: "Sistema",
  temperature: "Temperatura",
};

const TIME_RANGE_LABELS: Record<string, string> = {
  "1h": "Última hora",
  "6h": "Últimas 6 horas",
  "12h": "Últimas 12 horas",
  "24h": "Últimas 24 horas",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
};

export function MetricFilterTags({
  filters,
  onFilterChange,
  onClearAll,
}: MetricFilterTagsProps) {
  const { colors } = useTheme();

  const filterTags = useMemo(() => {
    const tags: Array<{ key: string; label: string; onRemove: () => void }> = [];

    // Category filters
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category) => {
        tags.push({
          key: `category-${category}`,
          label: CATEGORY_LABELS[category],
          onRemove: () => {
            const newCategories = filters.categories?.filter((c) => c !== category);
            onFilterChange({
              ...filters,
              categories: newCategories && newCategories.length > 0 ? newCategories : undefined,
            });
          },
        });
      });
    }

    // Time range filter
    if (filters.timeRange && filters.timeRange !== "24h") {
      tags.push({
        key: "timeRange",
        label: TIME_RANGE_LABELS[filters.timeRange] || filters.timeRange,
        onRemove: () => {
          onFilterChange({
            ...filters,
            timeRange: "24h",
          });
        },
      });
    }

    // Usage filter
    if (filters.minUsage !== undefined || filters.maxUsage !== undefined) {
      let usageLabel = "Uso: ";
      if (filters.minUsage !== undefined && filters.maxUsage !== undefined) {
        usageLabel += `${filters.minUsage}-${filters.maxUsage}%`;
      } else if (filters.minUsage !== undefined) {
        usageLabel += `>${filters.minUsage}%`;
      } else if (filters.maxUsage !== undefined) {
        usageLabel += `<${filters.maxUsage}%`;
      }

      tags.push({
        key: "usage",
        label: usageLabel,
        onRemove: () => {
          onFilterChange({
            ...filters,
            minUsage: undefined,
            maxUsage: undefined,
          });
        },
      });
    }

    return tags;
  }, [filters, onFilterChange]);

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
            style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.primary }])}
            variant="default"
          >
            <ThemedText style={StyleSheet.flatten([styles.tagText, { color: colors.primaryForeground }])}>
              {tag.label}
            </ThemedText>
            <Pressable
              onPress={tag.onRemove}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.removeButton}
            >
              <Icon
                name="x"
                size={14}
                color={colors.primaryForeground}
              />
            </Pressable>
          </Badge>
        ))}

        {filterTags.length > 1 && (
          <Pressable
            onPress={onClearAll}
            style={StyleSheet.flatten([
              styles.clearAllButton,
              {
                backgroundColor: colors.destructive,
              },
            ])}
          >
            <ThemedText style={StyleSheet.flatten([styles.clearAllText, { color: "white" }])}>
              Limpar tudo
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    padding: 2,
  },
  clearAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  clearAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
