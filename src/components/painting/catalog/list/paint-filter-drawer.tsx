import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Badge } from '@/components/ui/badge';
import { ColorPicker } from '@/components/ui/color-picker';
import { Slider } from '@/components/ui/slider';
import { Combobox } from '@/components/ui/combobox';
import {
  PAINT_FINISH,
  TRUCK_MANUFACTURER,
  PAINT_FINISH_LABELS,
  TRUCK_MANUFACTURER_LABELS,
} from '@/constants';
import { usePaintTypes, usePaintBrands } from '@/hooks';

interface PaintFilterDrawerProps {
  filters: {
    paintTypeIds?: string[];
    paintBrandIds?: string[];
    finishes?: string[];
    manufacturers?: string[];
    hasFormulas?: boolean;
    similarColor?: string;
    similarColorThreshold?: number;
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function PaintFilterDrawer({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PaintFilterDrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});
  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  // Fetch paint types and brands
  const { data: paintTypesData } = usePaintTypes({ orderBy: { name: "asc" } });
  const { data: paintBrandsData } = usePaintBrands({ orderBy: { name: "asc" } });

  const paintTypeOptions = useMemo(() => {
    return (
      paintTypesData?.data?.map((type) => ({
        value: type?.id,
        label: type?.name,
      })) || []
    );
  }, [paintTypesData]);

  const paintBrandOptions = useMemo(() => {
    return (
      paintBrandsData?.data?.map((brand) => ({
        value: brand?.id,
        label: brand?.name,
      })) || []
    );
  }, [paintBrandsData]);

  const finishOptions = Object.values(PAINT_FINISH).map((finish) => ({
    value: finish,
    label: PAINT_FINISH_LABELS[finish] || finish,
  }));

  const manufacturerOptions = Object.values(TRUCK_MANUFACTURER).map((manufacturer) => ({
    value: manufacturer,
    label: TRUCK_MANUFACTURER_LABELS[manufacturer] || manufacturer,
  }));

  const handleToggle = useCallback((key: string, value: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleChange = useCallback((key: string, value: any) => {
    setLocalFilters((prev) => {
      const currentFilters = prev || {};

      // Special handling for similarColor - validate hex format
      if (key === "similarColor") {
        const isValidHex = typeof value === 'string' &&
                           value !== '' &&
                           value !== '#000000' &&
                           /^#[0-9A-Fa-f]{6}$/.test(value);
        if (!isValidHex) {
          // Remove similarColor and its threshold if invalid
          const { similarColor: _, similarColorThreshold: __, ...rest } = currentFilters;
          return rest;
        }
        // Valid color - set it
        return {
          ...currentFilters,
          [key]: value.toUpperCase(),
        };
      }

      // Standard handling for other fields
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        const { [key]: _, ...rest } = currentFilters;
        return rest;
      }
      return {
        ...currentFilters,
        [key]: value,
      };
    });
  }, []);

  const handleApply = useCallback(() => {
    const cleanedFilters = { ...(localFilters || {}) };

    // Helper to validate hex color format (API requires exactly #RRGGBB format)
    const isValidHex = (hex: string | undefined): boolean => {
      if (!hex) return false;
      return /^#[0-9A-Fa-f]{6}$/.test(hex);
    };

    // CRITICAL: Validate and normalize similarColor before sending to API
    // API schema requires: /^#[0-9A-Fa-f]{6}$/ format
    // Check if similarColor exists and is valid
    const hasSimilarColor = cleanedFilters.similarColor &&
      cleanedFilters.similarColor !== "" &&
      cleanedFilters.similarColor !== "#000000" &&
      isValidHex(cleanedFilters.similarColor);

    if (hasSimilarColor) {
      // Ensure uppercase for consistency with API
      cleanedFilters.similarColor = cleanedFilters.similarColor!.toUpperCase();
    } else {
      // Remove invalid/empty similarColor and its threshold
      delete cleanedFilters.similarColor;
      delete cleanedFilters.similarColorThreshold;
    }

    // Remove any empty values
    Object.keys(cleanedFilters).forEach((key) => {
      const value = cleanedFilters[key as keyof typeof cleanedFilters];
      if (
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete cleanedFilters[key as keyof typeof cleanedFilters];
      }
    });

    onFiltersChange(cleanedFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header]}>
        <View style={styles.headerContent}>
          <IconFilter size={24} color={colors.foreground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Filtros</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.badgeText, { color: '#fff' }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* All filters in a single flat list */}
        <View style={styles.filterGroup}>
          <Combobox
            mode="multiple"
            options={paintTypeOptions}
            value={localFilters.paintTypeIds || []}
            onValueChange={(values) => handleChange("paintTypeIds", values)}
            placeholder="Tipo de Tinta"
            searchPlaceholder="Buscar tipos..."
            emptyText="Nenhum tipo encontrado"
          />
        </View>

        <View style={styles.filterGroup}>
          <Combobox
            mode="multiple"
            options={paintBrandOptions}
            value={localFilters.paintBrandIds || []}
            onValueChange={(values) => handleChange("paintBrandIds", values)}
            placeholder="Marca"
            searchPlaceholder="Buscar marcas..."
            emptyText="Nenhuma marca encontrada"
          />
        </View>

        <View style={styles.filterGroup}>
          <Combobox
            mode="multiple"
            options={finishOptions}
            value={localFilters.finishes || []}
            onValueChange={(values) => handleChange("finishes", values)}
            placeholder="Acabamento"
            searchPlaceholder="Buscar acabamentos..."
            emptyText="Nenhum acabamento encontrado"
          />
        </View>

        <View style={styles.filterGroup}>
          <Combobox
            mode="multiple"
            options={manufacturerOptions}
            value={localFilters.manufacturers || []}
            onValueChange={(values) => handleChange("manufacturers", values)}
            placeholder="Montadora"
            searchPlaceholder="Buscar montadoras..."
            emptyText="Nenhuma montadora encontrada"
          />
        </View>

        {/* Has Formulas Toggle */}
        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <ThemedText style={[styles.toggleLabel, { color: colors.foreground }]}>Apenas com fórmulas</ThemedText>
          <RNSwitch
            value={!!localFilters.hasFormulas}
            onValueChange={(value) => handleToggle('hasFormulas', value)}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={localFilters.hasFormulas ? colors.primaryForeground : "#f4f3f4"}
            ios_backgroundColor={colors.muted}
          />
        </View>

        {/* Color Similarity Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={[styles.filterLabel, { color: colors.foreground }]}>Cor Similar</ThemedText>
          <ColorPicker
            color={localFilters.similarColor || "#000000"}
            onColorChange={(color) => handleChange("similarColor", color === "#000000" ? undefined : color)}
          />

          {localFilters.similarColor && localFilters.similarColor !== "#000000" && (
            <View style={styles.thresholdContainer}>
              <View style={styles.thresholdHeader}>
                <ThemedText style={[styles.filterLabel, { color: colors.foreground }]}>
                  Limiar
                </ThemedText>
                <Badge variant="secondary">
                  <ThemedText style={{ fontSize: 12 }}>
                    {localFilters.similarColorThreshold || 15}
                  </ThemedText>
                </Badge>
              </View>
              <Slider
                value={localFilters.similarColorThreshold || 15}
                onValueChange={(value) => handleChange("similarColorThreshold", value)}
                minimumValue={0}
                maximumValue={100}
                step={5}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.buttonText, { color: colors.foreground }]}>
            {activeFiltersCount > 0 ? `Limpar (${activeFiltersCount})` : 'Limpar'}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1 }]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.buttonText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  filterGroup: {
    marginBottom: 0,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  thresholdContainer: {
    marginTop: 16,
  },
  thresholdHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  thresholdDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaintFilterDrawer;
