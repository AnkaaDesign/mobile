import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import type { GarageGetManyFormData } from "../../../../schemas";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

interface GarageFilterTagsProps {
  filters: Partial<GarageGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<GarageGetManyFormData>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function GarageFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: GarageFilterTagsProps) {
  const { colors } = useTheme();

  const tags = useMemo(() => {
    const result: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    // Search tag
    if (searchText) {
      result.push({
        key: "search",
        label: "Busca",
        value: searchText,
        onRemove: () => onSearchChange(""),
      });
    }

    // Width range tag
    if (filters.widthRange?.min !== undefined || filters.widthRange?.max !== undefined) {
      const min = filters.widthRange?.min;
      const max = filters.widthRange?.max;
      const value = min && max ? `${min}m - ${max}m` : min ? `≥ ${min}m` : `≤ ${max}m`;
      result.push({
        key: "widthRange",
        label: "Largura",
        value,
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.widthRange;
          onFilterChange(newFilters);
        },
      });
    }

    // Length range tag
    if (filters.lengthRange?.min !== undefined || filters.lengthRange?.max !== undefined) {
      const min = filters.lengthRange?.min;
      const max = filters.lengthRange?.max;
      const value = min && max ? `${min}m - ${max}m` : min ? `≥ ${min}m` : `≤ ${max}m`;
      result.push({
        key: "lengthRange",
        label: "Comprimento",
        value,
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.lengthRange;
          onFilterChange(newFilters);
        },
      });
    }

    // Location tag
    if (filters.where?.location) {
      const locationValue = typeof filters.where.location === 'string'
        ? filters.where.location
        : (filters.where.location as any)?.contains || '';
      result.push({
        key: "location",
        label: "Local",
        value: locationValue,
        onRemove: () => {
          const newFilters = { ...filters };
          if (newFilters.where) {
            const { location, ...rest } = newFilters.where;
            newFilters.where = Object.keys(rest).length > 0 ? rest : undefined;
          }
          onFilterChange(newFilters);
        },
      });
    }

    // Has lanes tag
    if (filters.hasLanes) {
      result.push({
        key: "hasLanes",
        label: "Possui Faixas",
        value: "Sim",
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.hasLanes;
          onFilterChange(newFilters);
        },
      });
    }

    // Has trucks tag
    if (filters.hasTrucks) {
      result.push({
        key: "hasTrucks",
        label: "Possui Caminhões",
        value: "Sim",
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.hasTrucks;
          onFilterChange(newFilters);
        },
      });
    }

    return result;
  }, [filters, searchText, onFilterChange, onSearchChange]);

  const hasFilters = tags.length > 0 || !!searchText;

  if (!hasFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Filtros ativos:</Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={onClearAll}
          style={styles.clearButton}
        >
          <Text style={StyleSheet.flatten([styles.clearText, { color: colors.destructive }])}>
            Limpar todos
          </Text>
        </Button>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
      >
        {tags.map((tag) => (
          <Chip
            key={tag.key}
            label={`${tag.label}: ${tag.value}`}
            onRemove={tag.onRemove}
            variant="secondary"
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  clearButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 20,
  },
  clearText: {
    fontSize: fontSize.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
});
