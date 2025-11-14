
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX, IconSearch, IconUser, IconCheck, IconAlertTriangle } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useUsers } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface PpeSizeFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function PpeSizeFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: PpeSizeFilterTagsProps) {
  const { colors } = useTheme();

  // Load filter options for label lookup
  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.data || [];

  // Helper function to find user label by ID
  const getUserLabel = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user?.name || id;
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
        const userLabel = getUserLabel(userId);
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

    // Completeness filters
    if (filters.hasAllSizes === true) {
      tags.push(
        <Badge key="hasAllSizes" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCheck size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Completo</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("hasAllSizes")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.missingShirts === true) {
      tags.push(
        <Badge key="missingShirts" variant="destructive" style={styles.filterTag}>
          <View style={styles.tagContent}>
            <IconAlertTriangle size={12} color={colors.destructiveForeground} />
            <ThemedText style={{ ...styles.tagText, color: colors.destructiveForeground }}>Faltando camisa</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("missingShirts")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.destructiveForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.missingPants === true) {
      tags.push(
        <Badge key="missingPants" variant="destructive" style={styles.filterTag}>
          <View style={styles.tagContent}>
            <IconAlertTriangle size={12} color={colors.destructiveForeground} />
            <ThemedText style={{ ...styles.tagText, color: colors.destructiveForeground }}>Faltando calça</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("missingPants")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.destructiveForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    if (filters.missingBoots === true) {
      tags.push(
        <Badge key="missingBoots" variant="destructive" style={styles.filterTag}>
          <View style={styles.tagContent}>
            <IconAlertTriangle size={12} color={colors.destructiveForeground} />
            <ThemedText style={{ ...styles.tagText, color: colors.destructiveForeground }}>Faltando calçado</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("missingBoots")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.destructiveForeground} />
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
