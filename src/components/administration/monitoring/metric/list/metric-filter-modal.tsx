import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

export type MetricCategory = "cpu" | "memory" | "disk" | "network" | "system" | "temperature";

export interface MetricFilters {
  categories?: MetricCategory[];
  timeRange?: "1h" | "6h" | "12h" | "24h" | "7d" | "30d";
  minUsage?: number;
  maxUsage?: number;
}

interface MetricFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: MetricFilters) => void;
  currentFilters: MetricFilters;
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

export function MetricFilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
}: MetricFilterModalProps) {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<MetricCategory[]>(
    currentFilters.categories || []
  );
  const [timeRange, setTimeRange] = useState<MetricFilters["timeRange"]>(
    currentFilters.timeRange || "24h"
  );
  const [minUsage, setMinUsage] = useState<number | undefined>(
    currentFilters.minUsage
  );
  const [maxUsage, setMaxUsage] = useState<number | undefined>(
    currentFilters.maxUsage
  );

  const toggleCategory = useCallback((category: MetricCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const setUsageRange = useCallback((min?: number, max?: number) => {
    setMinUsage(min);
    setMaxUsage(max);
  }, []);

  const handleApply = useCallback(() => {
    const filters: MetricFilters = {
      categories: categories.length > 0 ? categories : undefined,
      timeRange,
      minUsage,
      maxUsage,
    };
    onApply(filters);
    onClose();
  }, [categories, timeRange, minUsage, maxUsage, onApply, onClose]);

  const handleClear = useCallback(() => {
    setCategories([]);
    setTimeRange("24h");
    setMinUsage(undefined);
    setMaxUsage(undefined);
  }, []);

  const activeFiltersCount =
    (categories.length > 0 ? 1 : 0) +
    (timeRange !== "24h" ? 1 : 0) +
    (minUsage !== undefined || maxUsage !== undefined ? 1 : 0);

  return (
    <Drawer
      visible={visible}
      onClose={onClose}
      title="Filtros de Métricas"
      position="right"
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Categoria</ThemedText>
          <View style={styles.chipContainer}>
            {CATEGORIES.map((category) => {
              const isSelected = categories.includes(category.value);
              return (
                <TouchableOpacity
                  key={category.value}
                  onPress={() => toggleCategory(category.value)}
                >
                  <Badge
                    style={StyleSheet.flatten([
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.muted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ])}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.chipText,
                        {
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ])}
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
          <ThemedText style={styles.sectionTitle}>Período</ThemedText>
          <View style={styles.chipContainer}>
            {TIME_RANGES.map((range) => {
              const isSelected = timeRange === range.value;
              return (
                <TouchableOpacity
                  key={range.value}
                  onPress={() => setTimeRange(range.value)}
                >
                  <Badge
                    style={StyleSheet.flatten([
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.muted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ])}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.chipText,
                        {
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ])}
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
          <ThemedText style={styles.sectionTitle}>Uso</ThemedText>
          <View style={styles.chipContainer}>
            {USAGE_RANGES.map((range, index) => {
              const isSelected =
                minUsage === range.min && maxUsage === range.max;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setUsageRange(range.min, range.max)}
                >
                  <Badge
                    style={StyleSheet.flatten([
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.muted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ])}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.chipText,
                        {
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ])}
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

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={handleClear}
          style={styles.clearButton}
        >
          <ThemedText>Limpar</ThemedText>
        </Button>
        <Button onPress={handleApply} style={styles.applyButton}>
          <ThemedText style={{ color: colors.primaryForeground }}>
            Aplicar{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
          </ThemedText>
        </Button>
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
