
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconAlertTriangle, IconBell, IconCheck, IconClock, IconCategory } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { NOTIFICATION_IMPORTANCE, NOTIFICATION_IMPORTANCE_LABELS, ALERT_TYPE, ALERT_TYPE_LABELS } from "@/constants";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import type { AlertFilters } from "./alert-filter-modal";

interface AlertFilterTagsProps {
  filters: AlertFilters;
  onFilterChange: (filters: AlertFilters) => void;
  onClearAll: () => void;
}

export function AlertFilterTags({ filters, onFilterChange, onClearAll }: AlertFilterTagsProps) {
  const { colors } = useTheme();

  const getSeverityColor = (severity: NOTIFICATION_IMPORTANCE) => {
    switch (severity) {
      case NOTIFICATION_IMPORTANCE.URGENT:
        return "#ef4444"; // red
      case NOTIFICATION_IMPORTANCE.HIGH:
        return "#f59e0b"; // amber
      case NOTIFICATION_IMPORTANCE.NORMAL:
        return "#3b82f6"; // blue
      case NOTIFICATION_IMPORTANCE.LOW:
        return "#6b7280"; // gray
      default:
        return colors.muted;
    }
  };

  // Remove individual filter
  const removeFilter = (filterKey: keyof AlertFilters, filterId?: string) => {
    const newFilters = { ...filters };

    if (filterId && Array.isArray(newFilters[filterKey])) {
      // Remove specific ID from array
      const newArray = (newFilters[filterKey] as string[]).filter((id: string) => id !== filterId);
      (newFilters[filterKey] as any) = newArray.length > 0 ? newArray : undefined;
    } else {
      // Remove entire filter
      (newFilters[filterKey] as any) = undefined;
    }

    // Clean undefined values
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key as keyof AlertFilters] === undefined) {
        delete newFilters[key as keyof AlertFilters];
      }
    });

    onFilterChange(newFilters);
  };

  // Generate all filter tags
  const renderFilterTags = () => {
    const tags = [];

    // Severity filters
    if (filters.severities && filters.severities.length > 0) {
      filters.severities.forEach((severity: NOTIFICATION_IMPORTANCE) => {
        const severityColor = getSeverityColor(severity);
        tags.push(
          <Badge
            key={`severity-${severity}`}
            style={{ ...styles.filterTag, backgroundColor: severityColor }}
          >
            <View style={styles.tagContent}>
              <IconAlertTriangle size={12} color="white" />
              <ThemedText style={[styles.tagText, { color: "white" }]}>
                {NOTIFICATION_IMPORTANCE_LABELS[severity]}
              </ThemedText>
              <TouchableOpacity
                onPress={() => removeFilter("severities", severity)}
                style={styles.removeButton}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <IconX size={12} color="white" />
              </TouchableOpacity>
            </View>
          </Badge>
        );
      });
    }

    // Type filters
    if (filters.types && filters.types.length > 0) {
      filters.types.forEach((type: ALERT_TYPE) => {
        tags.push(
          <Badge
            key={`type-${type}`}
            variant="secondary"
            style={{ ...styles.filterTag, backgroundColor: colors.muted }}
          >
            <View style={styles.tagContent}>
              <IconCategory size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>
                {ALERT_TYPE_LABELS[type] || type}
              </ThemedText>
              <TouchableOpacity
                onPress={() => removeFilter("types", type)}
                style={styles.removeButton}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>
        );
      });
    }

    // Status filters
    if (filters.showAcknowledged) {
      tags.push(
        <Badge
          key="showAcknowledged"
          variant="secondary"
          style={{ ...styles.filterTag, backgroundColor: colors.muted }}
        >
          <View style={styles.tagContent}>
            <IconBell size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Reconhecidos</ThemedText>
            <TouchableOpacity
              onPress={() => removeFilter("showAcknowledged")}
              style={styles.removeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>
      );
    }

    if (filters.showResolved) {
      tags.push(
        <Badge
          key="showResolved"
          variant="secondary"
          style={{ ...styles.filterTag, backgroundColor: colors.muted }}
        >
          <View style={styles.tagContent}>
            <IconCheck size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Resolvidos</ThemedText>
            <TouchableOpacity
              onPress={() => removeFilter("showResolved")}
              style={styles.removeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>
      );
    }

    if (filters.showUnresolved) {
      tags.push(
        <Badge
          key="showUnresolved"
          variant="secondary"
          style={{ ...styles.filterTag, backgroundColor: colors.muted }}
        >
          <View style={styles.tagContent}>
            <IconAlertTriangle size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Não Resolvidos</ThemedText>
            <TouchableOpacity
              onPress={() => removeFilter("showUnresolved")}
              style={styles.removeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>
      );
    }

    // Source filters
    if (filters.sources && filters.sources.length > 0) {
      filters.sources.forEach((source: string) => {
        tags.push(
          <Badge
            key={`source-${source}`}
            variant="secondary"
            style={{ ...styles.filterTag, backgroundColor: colors.muted }}
          >
            <View style={styles.tagContent}>
              <IconCategory size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Origem: {source}</ThemedText>
              <TouchableOpacity
                onPress={() => removeFilter("sources", source)}
                style={styles.removeButton}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>
        );
      });
    }

    // Date range filter
    if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
      const { start, end } = filters.dateRange;
      let dateText = "Período: ";
      if (start && end) {
        dateText += `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      } else if (start) {
        dateText += `A partir de ${start.toLocaleDateString()}`;
      } else if (end) {
        dateText += `Até ${end.toLocaleDateString()}`;
      }

      tags.push(
        <Badge
          key="dateRange"
          variant="secondary"
          style={{ ...styles.filterTag, backgroundColor: colors.muted }}
        >
          <View style={styles.tagContent}>
            <IconClock size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{dateText}</ThemedText>
            <TouchableOpacity
              onPress={() => removeFilter("dateRange")}
              style={styles.removeButton}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>
      );
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filterTags}
      </ScrollView>

      <Button variant="default" size="default" onPress={onClearAll} style={styles.clearButton}>
        <ThemedText style={{ ...styles.clearButtonText, color: colors.primary }}>
          Limpar todos
        </ThemedText>
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
