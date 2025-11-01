import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import type { GarageGetManyFormData } from "../../../../schemas";
import { BaseFilterDrawer, type FilterSectionConfig, StringFilter, BooleanFilter } from "@/components/common/filters";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";

interface GarageFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<GarageGetManyFormData>) => void;
  currentFilters: Partial<GarageGetManyFormData>;
}

export function GarageFilterDrawer({ visible, onClose, onApply, currentFilters }: GarageFilterDrawerProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<{
    widthMin?: number;
    widthMax?: number;
    lengthMin?: number;
    lengthMax?: number;
    location?: string;
    hasLanes?: boolean;
    hasTrucks?: boolean;
  }>({
    widthMin: currentFilters.widthRange?.min,
    widthMax: currentFilters.widthRange?.max,
    lengthMin: currentFilters.lengthRange?.min,
    lengthMax: currentFilters.lengthRange?.max,
    location: currentFilters.where?.location as string | undefined,
    hasLanes: currentFilters.hasLanes,
    hasTrucks: currentFilters.hasTrucks,
  });

  const handleApply = useCallback(() => {
    const formattedFilters: Partial<GarageGetManyFormData> = {};

    // Width range filter
    if (filters.widthMin !== undefined || filters.widthMax !== undefined) {
      formattedFilters.widthRange = {
        min: filters.widthMin,
        max: filters.widthMax,
      };
    }

    // Length range filter
    if (filters.lengthMin !== undefined || filters.lengthMax !== undefined) {
      formattedFilters.lengthRange = {
        min: filters.lengthMin,
        max: filters.lengthMax,
      };
    }

    // Location filter
    if (filters.location) {
      formattedFilters.where = {
        ...formattedFilters.where,
        location: { contains: filters.location, mode: "insensitive" },
      };
    }

    // Boolean filters
    if (filters.hasLanes !== undefined) {
      formattedFilters.hasLanes = filters.hasLanes;
    }

    if (filters.hasTrucks !== undefined) {
      formattedFilters.hasTrucks = filters.hasTrucks;
    }

    onApply(formattedFilters);
  }, [filters, onApply]);

  const handleClear = useCallback(() => {
    setFilters({});
    onApply({});
  }, [onApply]);

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null && value !== ""
  ).length;

  const filterSections: FilterSectionConfig[] = [
    {
      id: "dimensions",
      title: "Dimensões",
      defaultOpen: true,
      badge: (filters.widthMin !== undefined || filters.widthMax !== undefined || filters.lengthMin !== undefined || filters.lengthMax !== undefined) ? 1 : 0,
      content: (
        <>
          <View style={styles.filterGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Largura (m)</Text>
            <View style={styles.rangeInputs}>
              <Input
                value={filters.widthMin?.toString() || ""}
                onChangeText={(value) => setFilters((prev) => ({ ...prev, widthMin: value ? parseFloat(value) : undefined }))}
                placeholder="Mín"
                keyboardType="decimal-pad"
                style={styles.rangeInput}
              />
              <Text style={[styles.rangeSeparator, { color: colors.foreground }]}>até</Text>
              <Input
                value={filters.widthMax?.toString() || ""}
                onChangeText={(value) => setFilters((prev) => ({ ...prev, widthMax: value ? parseFloat(value) : undefined }))}
                placeholder="Máx"
                keyboardType="decimal-pad"
                style={styles.rangeInput}
              />
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Comprimento (m)</Text>
            <View style={styles.rangeInputs}>
              <Input
                value={filters.lengthMin?.toString() || ""}
                onChangeText={(value) => setFilters((prev) => ({ ...prev, lengthMin: value ? parseFloat(value) : undefined }))}
                placeholder="Mín"
                keyboardType="decimal-pad"
                style={styles.rangeInput}
              />
              <Text style={[styles.rangeSeparator, { color: colors.foreground }]}>até</Text>
              <Input
                value={filters.lengthMax?.toString() || ""}
                onChangeText={(value) => setFilters((prev) => ({ ...prev, lengthMax: value ? parseFloat(value) : undefined }))}
                placeholder="Máx"
                keyboardType="decimal-pad"
                style={styles.rangeInput}
              />
            </View>
          </View>
        </>
      ),
    },
    {
      id: "location",
      title: "Localização",
      defaultOpen: false,
      badge: filters.location ? 1 : 0,
      content: (
        <StringFilter
          label="Local"
          value={filters.location}
          onChange={(value) => setFilters((prev) => ({ ...prev, location: value as string | undefined }))}
          placeholder="Digite o local da garagem"
        />
      ),
    },
    {
      id: "relations",
      title: "Relações",
      defaultOpen: false,
      badge: (filters.hasLanes ? 1 : 0) + (filters.hasTrucks ? 1 : 0),
      content: (
        <>
          <BooleanFilter
            label="Possui Faixas"
            description="Mostrar apenas garagens com faixas cadastradas"
            value={!!filters.hasLanes}
            onChange={(value) => setFilters((prev) => ({ ...prev, hasLanes: value || undefined }))}
          />
          <BooleanFilter
            label="Possui Caminhões"
            description="Mostrar apenas garagens com caminhões alocados"
            value={!!filters.hasTrucks}
            onChange={(value) => setFilters((prev) => ({ ...prev, hasTrucks: value || undefined }))}
          />
        </>
      ),
    },
  ];

  return (
    <BaseFilterDrawer
      open={visible}
      onOpenChange={onClose}
      sections={filterSections}
      onApply={handleApply}
      onClear={handleClear}
      activeFiltersCount={activeFiltersCount}
      title="Filtros de Garagens"
      description="Configure os filtros para refinar sua busca"
    />
  );
}

const styles = StyleSheet.create({
  filterGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    fontSize: 12,
  },
});
