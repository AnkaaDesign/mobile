import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import {
  IconX,
  IconSearch,
  IconPhoto,
  IconPackage,
  IconFileText,
  IconMail,
  IconWorld,
  IconBuilding,
  IconMapPin,
  IconId,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BRAZILIAN_STATES } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface SupplierFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function SupplierFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: SupplierFilterTagsProps) {
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

    // Status filters
    if (filters.hasLogo === true) {
      tags.push(
        <Badge key="hasLogo" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconPhoto size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com logo</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasLogo")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.hasItems === true) {
      tags.push(
        <Badge key="hasItems" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconPackage size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com produtos</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasItems")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.hasOrders === true) {
      tags.push(
        <Badge key="hasOrders" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconFileText size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com pedidos</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasOrders")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.hasActiveOrders === true) {
      tags.push(
        <Badge key="hasActiveOrders" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconFileText size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com pedidos ativos</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasActiveOrders")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.hasCnpj === true) {
      tags.push(
        <Badge key="hasCnpj" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconId size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com CNPJ</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasCnpj")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.hasEmail === true) {
      tags.push(
        <Badge key="hasEmail" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconMail size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com email</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasEmail")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.hasSite === true) {
      tags.push(
        <Badge key="hasSite" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconWorld size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Com site</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasSite")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // States filters
    if (filters.states && Array.isArray(filters.states) && filters.states.length > 0) {
      filters.states.forEach((state: string) => {
        tags.push(
          <Badge key={`state-${state}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconMapPin size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Estado: {state}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("states", state)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Item count range filter
    if (filters.itemCount && (filters.itemCount.min !== undefined || filters.itemCount.max !== undefined)) {
      const { min, max } = filters.itemCount;
      let rangeText = "Produtos: ";
      if (min !== undefined && max !== undefined) {
        rangeText += `${min} - ${max}`;
      } else if (min !== undefined) {
        rangeText += `≥ ${min}`;
      } else if (max !== undefined) {
        rangeText += `≤ ${max}`;
      }

      tags.push(
        <Badge key="itemCount" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconPackage size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("itemCount")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Order count range filter
    if (filters.orderCount && (filters.orderCount.min !== undefined || filters.orderCount.max !== undefined)) {
      const { min, max } = filters.orderCount;
      let rangeText = "Pedidos: ";
      if (min !== undefined && max !== undefined) {
        rangeText += `${min} - ${max}`;
      } else if (min !== undefined) {
        rangeText += `≥ ${min}`;
      } else if (max !== undefined) {
        rangeText += `≤ ${max}`;
      }

      tags.push(
        <Badge key="orderCount" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconFileText size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>{rangeText}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("orderCount")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
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
    paddingHorizontal: 8, // Match search container padding
    paddingVertical: 2, // Minimal vertical padding
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
    minHeight: 24, // Match tag height
    borderRadius: borderRadius.md,
    minWidth: 60, // Further reduced width
  },
  clearButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * 1.2,
  },
});
