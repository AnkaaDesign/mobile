import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconCalendar, IconAlertCircle, IconInfoCircle, IconAlertTriangle, IconBug, IconFileText, IconCode } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { formatDate } from '../../../../../utils';
import type { LogFilterState } from "./log-filter-modal";

interface LogFilterTagsProps {
  filters: LogFilterState;
  searchText?: string;
  onFilterChange: (filters: LogFilterState) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

const LOG_LEVEL_LABELS: Record<string, string> = {
  error: "ERROR",
  warning: "WARN",
  info: "INFO",
  debug: "DEBUG",
};

const LOG_LEVEL_COLORS: Record<string, string> = {
  error: "#ef4444",
  warning: "#f97316",
  info: "#3b82f6",
  debug: "#737373",
};

export function LogFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: LogFilterTagsProps) {
  const { colors } = useTheme();

  // Remove individual filter
  const removeFilter = (filterKey: keyof LogFilterState, filterId?: string) => {
    const newFilters = { ...filters };

    if (filterId && Array.isArray(newFilters[filterKey])) {
      // Remove specific ID from array
      const newArray = (newFilters[filterKey] as string[]).filter((id: string) => id !== filterId);
      newFilters[filterKey] = newArray.length > 0 ? (newArray as any) : undefined;
    } else {
      // Remove entire filter
      newFilters[filterKey] = undefined;
    }

    // Clean undefined values
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key as keyof LogFilterState] === undefined) {
        delete newFilters[key as keyof LogFilterState];
      }
    });

    onFilterChange(newFilters);
  };

  const getLevelIcon = (level: string, size: number = 12) => {
    switch (level) {
      case "error":
        return <IconAlertCircle size={size} color="white" />;
      case "warning":
        return <IconAlertTriangle size={size} color="white" />;
      case "debug":
        return <IconBug size={size} color="white" />;
      default:
        return <IconInfoCircle size={size} color="white" />;
    }
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

    // Level filters
    if (filters.levels && filters.levels.length > 0) {
      filters.levels.forEach((level) => {
        tags.push(
          <Badge key={`level-${level}`} style={{ ...styles.filterTag, backgroundColor: LOG_LEVEL_COLORS[level] }}>
            <View style={styles.tagContent}>
              {getLevelIcon(level)}
              <ThemedText style={StyleSheet.flatten([styles.tagText, { color: "white" }])}>{LOG_LEVEL_LABELS[level]}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("levels", level)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color="white" />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Source filters
    if (filters.sources && filters.sources.length > 0) {
      filters.sources.forEach((source) => {
        tags.push(
          <Badge key={`source-${source}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.primary }}>
            <View style={styles.tagContent}>
              <IconCode size={12} color={colors.primaryForeground} />
              <ThemedText style={StyleSheet.flatten([styles.tagText, { color: colors.primaryForeground }])}>{source}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("sources", source)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const dateLabel = filters.dateRange.start && filters.dateRange.end ? `${formatDate(filters.dateRange.start)} - ${formatDate(filters.dateRange.end)}` : filters.dateRange.start ? `Após ${formatDate(filters.dateRange.start)}` : filters.dateRange.end ? `Até ${formatDate(filters.dateRange.end)}` : "";

      tags.push(
        <Badge key="dateRange" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{dateLabel}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("dateRange")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Has details filter
    if (filters.hasDetails) {
      tags.push(
        <Badge key="hasDetails" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconFileText size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com detalhes</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasDetails")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Has stack filter
    if (filters.hasStack) {
      tags.push(
        <Badge key="hasStack" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCode size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com stack trace</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasStack")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    return tags;
  };

  const tags = renderFilterTags();

  if (tags.length === 0 && !searchText) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tags}
      </ScrollView>

      {tags.length > 1 && (
        <Button variant="ghost" size="sm" onPress={onClearAll} style={styles.clearButton}>
          <ThemedText style={styles.clearButtonText}>Limpar todos</ThemedText>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  filterTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 2,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
