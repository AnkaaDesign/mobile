
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import {
  IconX,
  IconSearch,
  IconTruck,
  IconMapPin,
  IconTool,
  IconTractor,
  IconCalendar,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useGarages, useTasks } from '../../../../hooks';
import { TRUCK_MANUFACTURER_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";

interface TruckFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

export function TruckFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: TruckFilterTagsProps) {
  const { colors } = useTheme();

  // Load filter options for label lookup
  const { data: garagesData } = useGarages({ limit: 100 });
  const { data: tasksData } = useTasks({ limit: 100, orderBy: { name: "asc" } });

  const garages = garagesData?.data || [];
  const tasks = tasksData?.data || [];

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

    // Manufacturer filter
    if (filters.manufacturer && Array.isArray(filters.manufacturer) && filters.manufacturer.length > 0) {
      filters.manufacturer.forEach((manufacturerId: string) => {
        const label = TRUCK_MANUFACTURER_LABELS[manufacturerId as keyof typeof TRUCK_MANUFACTURER_LABELS] || manufacturerId;
        tags.push(
          <Badge key={`manufacturer-${manufacturerId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconTractor size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Fabricante: {label}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("manufacturer", manufacturerId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Garage filter
    if (filters.garageId && Array.isArray(filters.garageId) && filters.garageId.length > 0) {
      filters.garageId.forEach((garageId: string) => {
        const label = getOptionLabel(garages, garageId);
        tags.push(
          <Badge key={`garage-${garageId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconMapPin size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Garagem: {label}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("garageId", garageId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Task filter
    if (filters.taskId && Array.isArray(filters.taskId) && filters.taskId.length > 0) {
      filters.taskId.forEach((taskId: string) => {
        const label = getOptionLabel(tasks, taskId);
        tags.push(
          <Badge key={`task-${taskId}`} variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
            <View style={styles.tagContent}>
              <IconTool size={12} color={colors.mutedForeground} />
              <ThemedText style={styles.tagText}>Tarefa: {label}</ThemedText>
              <TouchableOpacity onPress={() => removeFilter("taskId", taskId)} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                <IconX size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Badge>,
        );
      });
    }

    // Model filter
    if (filters.model) {
      tags.push(
        <Badge key="model" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconTruck size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Modelo: {filters.model}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("model")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Plate filter
    if (filters.plate) {
      tags.push(
        <Badge key="plate" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconTruck size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Placa: {filters.plate}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("plate")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    // Date range filters
    if (filters.createdAt?.gte || filters.createdAt?.lte) {
      const dateRange = [];
      if (filters.createdAt?.gte) dateRange.push(`desde ${new Date(filters.createdAt.gte).toLocaleDateString("pt-BR")}`);
      if (filters.createdAt?.lte) dateRange.push(`até ${new Date(filters.createdAt.lte).toLocaleDateString("pt-BR")}`);

      tags.push(
        <Badge key="createdAt" variant="secondary" style={{ ...styles.filterTag, backgroundColor: colors.muted }}>
          <View style={styles.tagContent}>
            <IconCalendar size={12} color={colors.mutedForeground} />
            <ThemedText style={styles.tagText}>Criado: {dateRange.join(" ")}</ThemedText>
            <TouchableOpacity onPress={() => removeFilter("createdAt")} style={styles.removeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <IconX size={12} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Badge>,
      );
    }

    return tags;
  };

  const filterTags = renderFilterTags();
  const hasActiveFilters = filterTags.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tagsContainer}>{filterTags}</View>
      </ScrollView>

      {/* Clear all button */}
      <Button variant="ghost" size="sm" onPress={onClearAll} style={styles.clearButton}>
        <IconX size={16} color={colors.mutedForeground} />
        <ThemedText style={StyleSheet.flatten([styles.clearButtonText, { color: colors.mutedForeground }])}>Limpar</ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  scrollContent: {
    paddingRight: spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  filterTag: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: borderRadius.full,
    maxWidth: 200,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  removeButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  clearButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});