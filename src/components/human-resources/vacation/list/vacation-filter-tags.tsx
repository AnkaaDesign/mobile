import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { IconX, IconSearch } from "@tabler/icons-react-native";
import { spacing } from "@/constants/design-system";
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import type { VacationGetManyFormData } from '../../../../schemas';

interface VacationFilterTagsProps {
  filters: Partial<VacationGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<VacationGetManyFormData>) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export const VacationFilterTags = ({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: VacationFilterTagsProps) => {
  const { colors } = useTheme();

  const filterTags: { key: string; label: string; value: string }[] = [];

  // Add status filters
  const statuses = filters.statuses || [];
  if (statuses.length > 0) {
    statuses.forEach((status) => {
      filterTags.push({
        key: `status_${status}`,
        label: "Status",
        value: VACATION_STATUS_LABELS[status as keyof typeof VACATION_STATUS_LABELS] || status,
      });
    });
  }

  // Add type filters
  const types = filters.types || [];
  if (types.length > 0) {
    types.forEach((type) => {
      filterTags.push({
        key: `type_${type}`,
        label: "Tipo",
        value: VACATION_TYPE_LABELS[type as keyof typeof VACATION_TYPE_LABELS] || type,
      });
    });
  }

  // Add user filter
  if (filters.userIds && filters.userIds.length > 0) {
    filterTags.push({
      key: "userId",
      label: "Colaborador",
      value: "Selecionado",
    });
  }

  // Add date range filters
  if (filters.startAtRange?.gte) {
    filterTags.push({
      key: "startAt",
      label: "Início a partir de",
      value: formatDate(filters.startAtRange.gte),
    });
  }

  if (filters.endAtRange?.lte) {
    filterTags.push({
      key: "endAt",
      label: "Término até",
      value: formatDate(filters.endAtRange.lte),
    });
  }

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters };

    if (key.startsWith("status_")) {
      const statusToRemove = key.replace("status_", "");
      const currentStatuses = newFilters.statuses || [];
      const newStatuses = currentStatuses.filter((s) => s !== statusToRemove);

      if (newStatuses.length > 0) {
        newFilters.statuses = newStatuses as any;
      } else {
        delete newFilters.statuses;
      }
    } else if (key.startsWith("type_")) {
      const typeToRemove = key.replace("type_", "");
      const currentTypes = newFilters.types || [];
      const newTypes = currentTypes.filter((t) => t !== typeToRemove);

      if (newTypes.length > 0) {
        newFilters.types = newTypes as any;
      } else {
        delete newFilters.types;
      }
    } else if (key === "userId") {
      delete newFilters.userIds;
    } else if (key === "startAt") {
      delete newFilters.startAtRange;
    } else if (key === "endAt") {
      delete newFilters.endAtRange;
    }

    onFilterChange(newFilters);
  };

  if (!filterTags.length && !searchText) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {searchText && (
          <TouchableOpacity style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.primary }])} onPress={() => onSearchChange?.("")}>
            <IconSearch size={14} color={colors.primaryForeground} />
            <ThemedText style={StyleSheet.flatten([styles.tagText, { color: colors.primaryForeground }])}>&quot;{searchText}&quot;</ThemedText>
            <IconX size={14} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        {filterTags.map((tag) => (
          <TouchableOpacity key={tag.key} style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.muted }])} onPress={() => handleRemoveFilter(tag.key)}>
            <ThemedText style={styles.tagLabel}>{tag.label}:</ThemedText>
            <ThemedText style={styles.tagValue}>{tag.value}</ThemedText>
            <IconX size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        {(filterTags.length > 0 || searchText) && (
          <TouchableOpacity style={StyleSheet.flatten([styles.clearAllButton, { borderColor: colors.border }])} onPress={onClearAll}>
            <ThemedText style={styles.clearAllText}>Limpar tudo</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    gap: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  tagLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  tagValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
