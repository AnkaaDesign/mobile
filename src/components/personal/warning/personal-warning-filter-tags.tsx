import { useMemo } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Chip } from "@/components/ui/chip";
import { spacing } from "@/constants/design-system";
import { WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../constants';
import { formatDate } from '../../../utils';
import type { PersonalWarningFilters } from "./personal-warning-filter-modal";

interface PersonalWarningFilterTagsProps {
  filters: PersonalWarningFilters;
  onRemoveFilter: (filterKey: keyof PersonalWarningFilters, value?: string) => void;
}

export const PersonalWarningFilterTags = ({ filters, onRemoveFilter }: PersonalWarningFilterTagsProps) => {
  const filterTags = useMemo(() => {
    const tags: Array<{ key: keyof PersonalWarningFilters; value?: string; label: string }> = [];

    // Status filter
    if (filters.isActive !== undefined) {
      tags.push({
        key: "isActive",
        label: filters.isActive ? "Ativas" : "Resolvidas",
      });
    }

    // Severity filters
    if (filters.severities && filters.severities.length > 0) {
      filters.severities.forEach((severity) => {
        tags.push({
          key: "severities",
          value: severity,
          label: WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity,
        });
      });
    }

    // Category filters
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach((category) => {
        tags.push({
          key: "categories",
          value: category,
          label: WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS] || category,
        });
      });
    }

    // Date filters
    if (filters.startDate) {
      tags.push({
        key: "startDate",
        label: `Após ${formatDate(filters.startDate)}`,
      });
    }

    if (filters.endDate) {
      tags.push({
        key: "endDate",
        label: `Antes ${formatDate(filters.endDate)}`,
      });
    }

    return tags;
  }, [filters]);

  if (filterTags.length === 0) {
    return null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.contentContainer}>
      {filterTags.map((tag, index) => (
        <Chip key={`${tag.key}-${tag.value || index}`} label={tag.label} onRemove={() => onRemoveFilter(tag.key, tag.value)} size="sm" variant="secondary" style={styles.chip} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  contentContainer: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  chip: {
    marginRight: spacing.xs,
  },
});
