import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { PPE_DELIVERY_STATUS_LABELS, PPE_TYPE_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import { Pressable } from "react-native";

interface MyPpeDeliveryFilterTagsProps {
  filters: {
    status?: string[];
    ppeTypes?: string[];
    deliveryDateRange?: { start?: Date; end?: Date };
  };
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function MyPpeDeliveryFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: MyPpeDeliveryFilterTagsProps) {
  const { colors } = useTheme();

  const hasActiveFilters = filters.status?.length || filters.ppeTypes?.length || filters.deliveryDateRange?.start || filters.deliveryDateRange?.end || searchText;

  if (!hasActiveFilters) {
    return null;
  }

  const handleRemoveStatus = (status: string) => {
    onFilterChange({
      ...filters,
      status: filters.status?.filter((s) => s !== status),
    });
  };

  const handleRemovePpeType = (ppeType: string) => {
    onFilterChange({
      ...filters,
      ppeTypes: filters.ppeTypes?.filter((t) => t !== ppeType),
    });
  };

  const handleRemoveDateRange = () => {
    onFilterChange({
      ...filters,
      deliveryDateRange: undefined,
    });
  };

  const handleRemoveSearch = () => {
    onSearchChange?.("");
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search tag */}
        {searchText && (
          <Pressable onPress={handleRemoveSearch}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText}>Busca: {searchText}</ThemedText>
              <Icon name="x" size={14} color={colors.mutedForeground} />
            </Badge>
          </Pressable>
        )}

        {/* Status tags */}
        {filters.status?.map((status) => (
          <Pressable key={status} onPress={() => handleRemoveStatus(status)}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText}>{PPE_DELIVERY_STATUS_LABELS[status] || status}</ThemedText>
              <Icon name="x" size={14} color={colors.mutedForeground} />
            </Badge>
          </Pressable>
        ))}

        {/* PPE Type tags */}
        {filters.ppeTypes?.map((ppeType) => (
          <Pressable key={ppeType} onPress={() => handleRemovePpeType(ppeType)}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText}>{PPE_TYPE_LABELS[ppeType] || ppeType}</ThemedText>
              <Icon name="x" size={14} color={colors.mutedForeground} />
            </Badge>
          </Pressable>
        ))}

        {/* Date range tag */}
        {(filters.deliveryDateRange?.start || filters.deliveryDateRange?.end) && (
          <Pressable onPress={handleRemoveDateRange}>
            <Badge variant="secondary" style={styles.tag}>
              <ThemedText style={styles.tagText}>
                {filters.deliveryDateRange.start && formatDate(filters.deliveryDateRange.start)}
                {filters.deliveryDateRange.start && filters.deliveryDateRange.end && " - "}
                {filters.deliveryDateRange.end && formatDate(filters.deliveryDateRange.end)}
              </ThemedText>
              <Icon name="x" size={14} color={colors.mutedForeground} />
            </Badge>
          </Pressable>
        )}

        {/* Clear all button */}
        <Pressable onPress={onClearAll}>
          <Badge variant="destructive" style={styles.tag}>
            <ThemedText style={[styles.tagText, { color: colors.destructiveForeground }]}>Limpar Tudo</ThemedText>
          </Badge>
        </Pressable>
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
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
  },
});
