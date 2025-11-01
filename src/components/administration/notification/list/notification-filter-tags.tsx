
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconAlertCircle, IconTag, IconCalendar, IconEye } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { NOTIFICATION_IMPORTANCE, NOTIFICATION_TYPE, NOTIFICATION_IMPORTANCE_LABELS, NOTIFICATION_TYPE_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface NotificationFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function NotificationFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: NotificationFilterTagsProps) {
  const { colors } = useTheme();

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

    // Importance filters
    if (filters.importance && Array.isArray(filters.importance) && filters.importance.length > 0) {
      filters.importance.forEach((importance: NOTIFICATION_IMPORTANCE) => {
        const importanceLabel = NOTIFICATION_IMPORTANCE_LABELS[importance] || importance;
        tags.push(
          <Badge key={`importance-${importance}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconAlertCircle size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Importância: {importanceLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("importance", importance)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Type filters
    if (filters.types && Array.isArray(filters.types) && filters.types.length > 0) {
      filters.types.forEach((type: NOTIFICATION_TYPE) => {
        const typeLabel = NOTIFICATION_TYPE_LABELS[type] || type;
        tags.push(
          <Badge key={`type-${type}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconTag size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Tipo: {typeLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("types", type)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Unread filter
    if (filters.unread === true) {
      tags.push(
        <Badge key="unread" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconEye size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Apenas não lidas</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("unread")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Sent date range filter
    if (filters.sentAtRange && (filters.sentAtRange.gte || filters.sentAtRange.lte)) {
      const { gte, lte } = filters.sentAtRange;
      let rangeText = "Enviado: ";
      if (gte && lte) {
        rangeText += `${new Date(gte).toLocaleDateString()} - ${new Date(lte).toLocaleDateString()}`;
      } else if (gte) {
        rangeText += `≥ ${new Date(gte).toLocaleDateString()}`;
      } else if (lte) {
        rangeText += `≤ ${new Date(lte).toLocaleDateString()}`;
      }

      tags.push(
        <Badge key="sentAtRange" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("sentAtRange")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Created date range filter
    if (filters.createdAt && (filters.createdAt.gte || filters.createdAt.lte)) {
      const { gte, lte } = filters.createdAt;
      let rangeText = "Criado: ";
      if (gte && lte) {
        rangeText += `${new Date(gte).toLocaleDateString()} - ${new Date(lte).toLocaleDateString()}`;
      } else if (gte) {
        rangeText += `≥ ${new Date(gte).toLocaleDateString()}`;
      } else if (lte) {
        rangeText += `≤ ${new Date(lte).toLocaleDateString()}`;
      }

      tags.push(
        <Badge key="createdAt" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("createdAt")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Updated date range filter
    if (filters.updatedAt && (filters.updatedAt.gte || filters.updatedAt.lte)) {
      const { gte, lte } = filters.updatedAt;
      let rangeText = "Atualizado: ";
      if (gte && lte) {
        rangeText += `${new Date(gte).toLocaleDateString()} - ${new Date(lte).toLocaleDateString()}`;
      } else if (gte) {
        rangeText += `≥ ${new Date(gte).toLocaleDateString()}`;
      } else if (lte) {
        rangeText += `≤ ${new Date(lte).toLocaleDateString()}`;
      }

      tags.push(
        <Badge key="updatedAt" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("updatedAt")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
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
