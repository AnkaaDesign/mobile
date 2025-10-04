import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconUser, IconPackage, IconCalendar, IconCircleCheck, IconCircleX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useUsers } from '../../../../../hooks';
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '../../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { formatDate } from '../../../../../utils';

interface PpeDeliveryFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function PpeDeliveryFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: PpeDeliveryFilterTagsProps) {
  const { colors } = useTheme();

  // Load filter options for label lookup
  const { data: usersData } = useUsers({ perPage: 100, orderBy: { name: "asc" } });
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

    // Employee filters
    if (filters.userIds && Array.isArray(filters.userIds) && filters.userIds.length > 0) {
      filters.userIds.forEach((userId: string) => {
        const userLabel = getOptionLabel(users, userId);
        tags.push(
          <Badge key={`user-${userId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconUser size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Funcionário: {userLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("userIds", userId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Status filters
    if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
      filters.statuses.forEach((status: PPE_DELIVERY_STATUS) => {
        const statusLabel = PPE_DELIVERY_STATUS_LABELS[status] || status;
        const statusIcon = status === PPE_DELIVERY_STATUS.DELIVERED ? IconCircleCheck : IconCircleX;

        tags.push(
          <Badge key={`status-${status}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              {React.createElement(statusIcon, { size: 12, color: colors.mutedForeground })}
              <ThemedText style={styles.tagText}>Status: {statusLabel}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("statuses", status)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Signed status filter
    if (filters.isSigned !== undefined) {
      tags.push(
        <Badge key="isSigned" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCircleCheck size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{filters.isSigned ? "Assinado" : "Não assinado"}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("isSigned")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Date range filter
    if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
      const { startDate, endDate } = filters.dateRange;
      let rangeText = "Data: ";
      if (startDate && endDate) {
        rangeText += `${formatDate(new Date(startDate))} - ${formatDate(new Date(endDate))}`;
      } else if (startDate) {
        rangeText += `≥ ${formatDate(new Date(startDate))}`;
      } else if (endDate) {
        rangeText += `≤ ${formatDate(new Date(endDate))}`;
      }

      tags.push(
        <Badge key="dateRange" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("dateRange")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Item filter
    if (filters.itemIds && Array.isArray(filters.itemIds) && filters.itemIds.length > 0) {
      filters.itemIds.forEach((itemId: string) => {
        tags.push(
          <Badge key={`item-${itemId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconPackage size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>EPI: {itemId.substring(0, 8)}...</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("itemIds", itemId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
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
