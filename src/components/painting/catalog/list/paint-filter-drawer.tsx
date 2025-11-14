import { useState, useEffect, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight} from "@/constants/design-system";
import {
  PAINT_FINISH,
  COLOR_PALETTE,
  TRUCK_MANUFACTURER,
  PAINT_FINISH_LABELS,
  COLOR_PALETTE_LABELS,
  TRUCK_MANUFACTURER_LABELS,
} from "@/constants";
import { usePaintTypes, usePaintBrands } from "@/hooks";
import {
  IconFilter,
  IconPalette,
  IconPaint,
  IconTag,
  IconBrush,
  IconTruck,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";

interface PaintFilterDrawerProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onClose: () => void;
}

export function PaintFilterDrawer({ filters, onFilterChange, onClose }: PaintFilterDrawerProps) {
  const { colors } = useTheme();

  // Local state for filters
  const [localFilters, setLocalFilters] = useState(filters);

  // Fetch paint types and brands
  const { data: paintTypesData } = usePaintTypes({ orderBy: { name: "asc" } });
  const { data: paintBrandsData } = usePaintBrands({ orderBy: { name: "asc" } });

  const paintTypeOptions = useMemo(() => {
    return paintTypesData?.data?.map((type) => ({
      value: type.id,
      label: type.name,
    })) || [];
  }, [paintTypesData]);

  const paintBrandOptions = useMemo(() => {
    return paintBrandsData?.data?.map((brand) => ({
      value: brand.id,
      label: brand.name,
    })) || [];
  }, [paintBrandsData]);

  const finishOptions = Object.values(PAINT_FINISH).map((finish) => ({
    value: finish,
    label: PAINT_FINISH_LABELS[finish] || finish,
  }));

  const manufacturerOptions = Object.values(TRUCK_MANUFACTURER).map((manufacturer) => ({
    value: manufacturer,
    label: TRUCK_MANUFACTURER_LABELS[manufacturer] || manufacturer,
  }));

  const paletteOptions = Object.values(COLOR_PALETTE).map((palette) => ({
    value: palette,
    label: COLOR_PALETTE_LABELS[palette] || palette,
  }));

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.paintTypeIds?.length) count++;
    if (localFilters.paintBrandIds?.length) count++;
    if (localFilters.finishes?.length) count++;
    if (localFilters.manufacturers?.length) count++;
    if (localFilters.palettes?.length) count++;
    if (localFilters.hasFormulas !== undefined) count++;
    return count;
  }, [localFilters]);

  // Sync local filters with parent
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle filter changes
  const handleChange = (key: string, value: any) => {
    setLocalFilters((prev: any) => {
      if (value === undefined || value === null || value === "") {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  // Apply filters
  const handleApply = () => {
    const cleanedFilters = { ...localFilters };

    // Remove empty values
    Object.keys(cleanedFilters).forEach((key) => {
      const value = cleanedFilters[key];
      if (value === "" || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete cleanedFilters[key];
      }
    });

    onFilterChange(cleanedFilters);
    onClose();
  };

  // Reset filters
  const handleReset = () => {
    setLocalFilters({});
    onFilterChange({});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconFilter size={24} color={colors.primary} />
          <ThemedText style={styles.headerTitle}>Filtros</ThemedText>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" style={styles.filterCountBadge}>
              <ThemedText style={styles.filterCountText}>{activeFilterCount}</ThemedText>
            </Badge>
          )}
        </View>
        <Button
          variant="ghost"
          size="sm"
          onPress={onClose}
          style={styles.closeButton}
        >
          <IconX size={20} color={colors.foreground} />
        </Button>
      </View>

      {/* Filter Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Paint Types */}
        <View style={styles.filterSection}>
          <Label style={[styles.filterLabel, { color: colors.foreground }]}>
            <IconPaint size={16} color={colors.foreground} style={styles.labelIcon} />
            <ThemedText style={styles.labelText}>Tipos de Tinta</ThemedText>
          </Label>
          <Combobox
            mode="multiple"
            options={paintTypeOptions}
            selectedValues={localFilters.paintTypeIds || []}
            onValueChange={(values) => handleChange("paintTypeIds", values)}
            onCreate={() => {}}
            onSearchChange={() => {}}
            onEndReached={() => {}}
            placeholder="Selecione os tipos"
            selectedText="tipos selecionados"
            searchPlaceholder="Buscar tipos..."
            emptyText="Nenhum tipo encontrado"
          />
        </View>

        {/* Paint Brands */}
        <View style={styles.filterSection}>
          <Label style={[styles.filterLabel, { color: colors.foreground }]}>
            <IconTag size={16} color={colors.foreground} style={styles.labelIcon} />
            <ThemedText style={styles.labelText}>Marcas</ThemedText>
          </Label>
          <Combobox
            mode="multiple"
            options={paintBrandOptions}
            selectedValues={localFilters.paintBrandIds || []}
            onValueChange={(values) => handleChange("paintBrandIds", values)}
            onCreate={() => {}}
            onSearchChange={() => {}}
            onEndReached={() => {}}
            placeholder="Selecione as marcas"
            selectedText="marcas selecionadas"
            searchPlaceholder="Buscar marcas..."
            emptyText="Nenhuma marca encontrada"
          />
        </View>

        {/* Finishes */}
        <View style={styles.filterSection}>
          <Label style={[styles.filterLabel, { color: colors.foreground }]}>
            <IconBrush size={16} color={colors.foreground} style={styles.labelIcon} />
            <ThemedText style={styles.labelText}>Acabamentos</ThemedText>
          </Label>
          <Combobox
            mode="multiple"
            options={finishOptions}
            selectedValues={localFilters.finishes || []}
            onValueChange={(values) => handleChange("finishes", values)}
            onCreate={() => {}}
            onSearchChange={() => {}}
            onEndReached={() => {}}
            placeholder="Selecione os acabamentos"
            selectedText="acabamentos selecionados"
            searchPlaceholder="Buscar acabamentos..."
            emptyText="Nenhum acabamento encontrado"
          />
        </View>

        {/* Manufacturers */}
        <View style={styles.filterSection}>
          <Label style={[styles.filterLabel, { color: colors.foreground }]}>
            <IconTruck size={16} color={colors.foreground} style={styles.labelIcon} />
            <ThemedText style={styles.labelText}>Montadoras</ThemedText>
          </Label>
          <Combobox
            mode="multiple"
            options={manufacturerOptions}
            selectedValues={localFilters.manufacturers || []}
            onValueChange={(values) => handleChange("manufacturers", values)}
            onCreate={() => {}}
            onSearchChange={() => {}}
            onEndReached={() => {}}
            placeholder="Selecione as montadoras"
            selectedText="montadoras selecionadas"
            searchPlaceholder="Buscar montadoras..."
            emptyText="Nenhuma montadora encontrada"
          />
        </View>

        {/* Color Palettes */}
        <View style={styles.filterSection}>
          <Label style={[styles.filterLabel, { color: colors.foreground }]}>
            <IconPalette size={16} color={colors.foreground} style={styles.labelIcon} />
            <ThemedText style={styles.labelText}>Paletas de Cores</ThemedText>
          </Label>
          <Combobox
            mode="multiple"
            options={paletteOptions}
            selectedValues={localFilters.palettes || []}
            onValueChange={(values) => handleChange("palettes", values)}
            onCreate={() => {}}
            onSearchChange={() => {}}
            onEndReached={() => {}}
            placeholder="Selecione as paletas"
            selectedText="paletas selecionadas"
            searchPlaceholder="Buscar paletas..."
            emptyText="Nenhuma paleta encontrada"
          />
        </View>

        {/* Has Formulas */}
        <View style={[styles.filterSection, styles.switchSection]}>
          <View style={styles.switchLabelContainer}>
            <Label style={[styles.filterLabel, { color: colors.foreground }]}>
              <IconSparkles size={16} color={colors.foreground} style={styles.labelIcon} />
              <ThemedText style={styles.labelText}>Apenas com fórmulas</ThemedText>
            </Label>
            <ThemedText style={[styles.switchDescription, { color: colors.mutedForeground }]}>
              Mostrar apenas tintas que possuem fórmulas cadastradas
            </ThemedText>
          </View>
          <Switch
            checked={localFilters.hasFormulas === true}
            onCheckedChange={(checked) => handleChange("hasFormulas", checked ? true : undefined)}
          />
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          variant="outline"
          onPress={handleReset}
          style={styles.footerButton}
        >
          <IconX size={16} color={colors.foreground} />
          <ThemedText style={[styles.buttonText, { color: colors.foreground }]}>Limpar</ThemedText>
        </Button>
        <Button
          variant="default"
          onPress={handleApply}
          style={styles.footerButton}
        >
          <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>
            Aplicar Filtros
          </ThemedText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  filterCountBadge: {
    marginLeft: spacing.xs,
  },
  filterCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  filterSection: {
    gap: spacing.sm,
  },
  filterLabel: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  labelIcon: {
    marginRight: spacing.xs,
  },
  labelText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  switchSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchDescription: {
    fontSize: fontSize.sm,
    marginTop: spacing.xxs,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
