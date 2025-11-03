import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconChartBar, IconClock } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Badge } from '@/components/ui/badge';

export type MetricCategory = "cpu" | "memory" | "disk" | "network" | "system" | "temperature";

export interface MetricFilters {
  categories?: MetricCategory[];
  timeRange?: "1h" | "6h" | "12h" | "24h" | "7d" | "30d";
  minUsage?: number;
  maxUsage?: number;
}

interface MetricFilterDrawerContentProps {
  filters: MetricFilters;
  onFiltersChange: (filters: MetricFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

interface FilterState {
  categories?: MetricCategory[];
  timeRange?: MetricFilters["timeRange"];
  minUsage?: number;
  maxUsage?: number;
}

const CATEGORIES: Array<{ value: MetricCategory; label: string }> = [
  { value: "cpu", label: "CPU" },
  { value: "memory", label: "Memória" },
  { value: "disk", label: "Disco" },
  { value: "network", label: "Rede" },
  { value: "system", label: "Sistema" },
  { value: "temperature", label: "Temperatura" },
];

const TIME_RANGES: Array<{ value: MetricFilters["timeRange"]; label: string }> = [
  { value: "1h", label: "Última hora" },
  { value: "6h", label: "Últimas 6 horas" },
  { value: "12h", label: "Últimas 12 horas" },
  { value: "24h", label: "Últimas 24 horas" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

const USAGE_RANGES: Array<{ min?: number; max?: number; label: string }> = [
  { label: "Todos", min: undefined, max: undefined },
  { label: "Baixo (0-50%)", min: 0, max: 50 },
  { label: "Médio (50-75%)", min: 50, max: 75 },
  { label: "Alto (75-90%)", min: 75, max: 90 },
  { label: "Crítico (90-100%)", min: 90, max: 100 },
];

export function MetricFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: MetricFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    categories: filters.categories || [],
    timeRange: filters.timeRange || "24h",
    minUsage: filters.minUsage,
    maxUsage: filters.maxUsage,
  }));

  const handleApply = useCallback(() => {
    const newFilters: MetricFilters = {
      categories: localFilters.categories && localFilters.categories.length > 0 ? localFilters.categories : undefined,
      timeRange: localFilters.timeRange,
      minUsage: localFilters.minUsage,
      maxUsage: localFilters.maxUsage,
    };

    onFiltersChange(newFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({
      categories: [],
      timeRange: "24h",
      minUsage: undefined,
      maxUsage: undefined,
    });
    onClear();
  }, [onClear]);

  const toggleCategory = useCallback((category: MetricCategory) => {
    setLocalFilters((prev) => {
      const currentCategories = prev.categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];
      return {
        ...prev,
        categories: newCategories,
      };
    });
  }, []);

  const setUsageRange = useCallback((min?: number, max?: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      minUsage: min,
      maxUsage: max,
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
          <ThemedText style={styles.title}>Filtros de Métricas</ThemedText>
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
        {/* Category Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChartBar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Categoria
            </ThemedText>
          </View>

          <View style={styles.chipContainer}>
            {CATEGORIES.map((category) => {
              const isSelected = localFilters.categories?.includes(category.value);
              return (
                <TouchableOpacity
                  key={category.value}
                  onPress={() => toggleCategory(category.value)}
                  activeOpacity={0.7}
                >
                  <Badge
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.muted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? colors.primaryForeground : colors.foreground,
                        },
                      ]}
                    >
                      {category.label}
                    </ThemedText>
                  </Badge>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time Range Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconClock size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <View style={styles.chipContainer}>
            {TIME_RANGES.map((range) => {
              const isSelected = localFilters.timeRange === range.value;
              return (
                <TouchableOpacity
                  key={range.value}
                  onPress={() => setLocalFilters((prev) => ({ ...prev, timeRange: range.value }))}
                  activeOpacity={0.7}
                >
                  <Badge
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.muted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? colors.primaryForeground : colors.foreground,
                        },
                      ]}
                    >
                      {range.label}
                    </ThemedText>
                  </Badge>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Usage Range Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChartBar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Uso
            </ThemedText>
          </View>

          <View style={styles.chipContainer}>
            {USAGE_RANGES.map((range, index) => {
              const isSelected =
                localFilters.minUsage === range.min && localFilters.maxUsage === range.max;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setUsageRange(range.min, range.max)}
                  activeOpacity={0.7}
                >
                  <Badge
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.muted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? colors.primaryForeground : colors.foreground,
                        },
                      ]}
                    >
                      {range.label}
                    </ThemedText>
                  </Badge>
                </TouchableOpacity>
              );
            })}
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
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
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
