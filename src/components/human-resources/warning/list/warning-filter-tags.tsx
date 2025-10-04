import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconUser, IconAlertCircle, IconExclamationCircle, IconCheck } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useUsers } from '../../../../hooks';
import { WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface WarningFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function WarningFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: WarningFilterTagsProps) {
  const { colors } = useTheme();

  // Load filter options for label lookup
  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.data || [];

  // Helper function to find option label by ID
  const getOptionLabel = (options: any[], id: string) => {
    const option = options.find((opt) => opt.id === id);
    return option?.name || id;
  };

  // Remove individual filter
  const removeFilter = (filterKey: string, filterId?: string) => {
    const newFilters = { ...filters };

    if (filterId && Array.isArray(newFilters[filterKey])) {
      // Remove specific ID from array
      const newArray = newFilters[filterKey].filter((id: string) => id !== filterId);
      newFilters[filterKey] = newArray.length > 0 ? newArray : undefined;
    } else {
      // Remove entire filter
      newFilters[filterKey] = undefined;
    }

    // Clean undefined values
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === undefined) {
        delete newFilters[key as keyof typeof newFilters];
      }
    });

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
    if (filters.isActive === false) {
      tags.push(
        <Badge key="isActive" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCheck size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Incluindo resolvidas</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("isActive")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Category filters
    if (filters.categories && Array.isArray(filters.categories) && filters.categories.length > 0) {
      filters.categories.forEach((category: string) => {
        const categoryLabel = WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS] || category;
        tags.push(
          <Badge key={`category-${category}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconAlertCircle size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Categoria: {categoryLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("categories", category)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Severity filters
    if (filters.severities && Array.isArray(filters.severities) && filters.severities.length > 0) {
      filters.severities.forEach((severity: string) => {
        const severityLabel = WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity;
        tags.push(
          <Badge key={`severity-${severity}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconExclamationCircle size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Gravidade: {severityLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("severities", severity)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Collaborator filters
    if (filters.collaboratorIds && Array.isArray(filters.collaboratorIds) && filters.collaboratorIds.length > 0) {
      filters.collaboratorIds.forEach((collaboratorId: string) => {
        const collaboratorLabel = getOptionLabel(users, collaboratorId);
        tags.push(
          <Badge key={`collaborator-${collaboratorId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconUser size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Colaborador: {collaboratorLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("collaboratorIds", collaboratorId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Supervisor filters
    if (filters.supervisorIds && Array.isArray(filters.supervisorIds) && filters.supervisorIds.length > 0) {
      filters.supervisorIds.forEach((supervisorId: string) => {
        const supervisorLabel = getOptionLabel(users, supervisorId);
        tags.push(
          <Badge key={`supervisor-${supervisorId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconUser size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Supervisor: {supervisorLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("supervisorIds", supervisorId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    return tags;
  };

  const filterTags = renderFilterTags();
  const hasFilters = filterTags.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filterTags}
      </ScrollView>

      <Button variant="default" size="default" onPress={onClearAll} style={styles.clearButton}>
        <ThemedText style={{ ...styles.clearButtonText, color: colors.primary }}>Limpar todos</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.xs,
  },
  filterTag: {
    marginRight: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minHeight: 24,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
  removeButton: {
    padding: 2,
  },
  clearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minHeight: 24,
    borderRadius: borderRadius.md,
    minWidth: 60,
  },
  clearButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
});
