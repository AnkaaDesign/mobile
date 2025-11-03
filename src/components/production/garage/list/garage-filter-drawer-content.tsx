import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconRuler, IconMapPin } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import type { GarageGetManyFormData } from '../../../../schemas';

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  widthRange?: FilterRange;
  lengthRange?: FilterRange;
  location?: string;
  hasLanes?: boolean;
  hasTrucks?: boolean;
}

interface GarageFilterDrawerContentProps {
  filters: Partial<GarageGetManyFormData>;
  onFiltersChange: (filters: Partial<GarageGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

export function GarageFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: GarageFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    widthRange: filters.widthRange,
    lengthRange: filters.lengthRange,
    location: filters.where?.location?.contains as string | undefined,
    hasLanes: filters.hasLanes,
    hasTrucks: filters.hasTrucks,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<GarageGetManyFormData> = {};

    if (localFilters.widthRange?.min !== undefined || localFilters.widthRange?.max !== undefined) {
      newFilters.widthRange = localFilters.widthRange;
    }

    if (localFilters.lengthRange?.min !== undefined || localFilters.lengthRange?.max !== undefined) {
      newFilters.lengthRange = localFilters.lengthRange;
    }

    if (localFilters.location) {
      newFilters.where = {
        location: {
          contains: localFilters.location,
          mode: 'insensitive' as const,
        },
      };
    }

    if (localFilters.hasLanes !== undefined) {
      newFilters.hasLanes = localFilters.hasLanes;
    }

    if (localFilters.hasTrucks !== undefined) {
      newFilters.hasTrucks = localFilters.hasTrucks;
    }

    onFiltersChange(newFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleToggle = useCallback((key: keyof FilterState, value: boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  const handleRangeChange = useCallback((key: keyof FilterState, field: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setLocalFilters((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as FilterRange) || {}),
        [field]: numValue,
      },
    }));
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      location: value || undefined,
    }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: 18
      }]}>
        <View style={styles.headerContent}>
          <IconFilter size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Filtros de Garagens</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={closeFilterDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Dimensions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconRuler size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Dimensões
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Largura (metros)
            </ThemedText>
            <View style={styles.rangeInputs}>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Mínimo</ThemedText>
                <Input
                  placeholder="0"
                  value={localFilters.widthRange?.min?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("widthRange", "min", value)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Máximo</ThemedText>
                <Input
                  placeholder="100"
                  value={localFilters.widthRange?.max?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("widthRange", "max", value)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Comprimento (metros)
            </ThemedText>
            <View style={styles.rangeInputs}>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Mínimo</ThemedText>
                <Input
                  placeholder="0"
                  value={localFilters.lengthRange?.min?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("lengthRange", "min", value)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Máximo</ThemedText>
                <Input
                  placeholder="100"
                  value={localFilters.lengthRange?.max?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("lengthRange", "max", value)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconMapPin size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Localização
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Local
            </ThemedText>
            <Input
              placeholder="Digite o local"
              value={localFilters.location || ""}
              onChangeText={handleLocationChange}
            />
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFilter size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Características
            </ThemedText>
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui Faixas</Label>
            <RNSwitch
              value={!!localFilters.hasLanes}
              onValueChange={(value) => handleToggle("hasLanes", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasLanes ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui Caminhões</Label>
            <RNSwitch
              value={!!localFilters.hasTrucks}
              onValueChange={(value) => handleToggle("hasTrucks", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasTrucks ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.footerBtnText}>Limpar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    minHeight: 44,
  },
  filterLabel: {
    fontSize: 15,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  rangeInputs: {
    flexDirection: "row",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
