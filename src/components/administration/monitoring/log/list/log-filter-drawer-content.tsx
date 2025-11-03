import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconFileText, IconCalendarPlus, IconServer } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { Badge } from '@/components/ui/badge';

export interface LogFilterState {
  levels?: string[];
  sources?: string[];
  dateRange?: { start?: Date; end?: Date };
  hasDetails?: boolean;
  hasStack?: boolean;
}

interface LogFilterDrawerContentProps {
  filters: LogFilterState;
  onFiltersChange: (filters: LogFilterState) => void;
  onClear: () => void;
  activeFiltersCount: number;
  availableServices?: string[];
}

interface FilterState {
  levels?: string[];
  sources?: string[];
  dateAfter?: Date;
  dateBefore?: Date;
  hasDetails?: boolean;
  hasStack?: boolean;
}

const LOG_LEVELS = [
  { value: "error", label: "ERROR", color: "#ef4444" },
  { value: "warning", label: "WARN", color: "#f97316" },
  { value: "info", label: "INFO", color: "#3b82f6" },
  { value: "debug", label: "DEBUG", color: "#737373" },
];

export function LogFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  availableServices = [],
}: LogFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    levels: filters.levels || [],
    sources: filters.sources || [],
    dateAfter: filters.dateRange?.start,
    dateBefore: filters.dateRange?.end,
    hasDetails: filters.hasDetails,
    hasStack: filters.hasStack,
  }));

  const handleApply = useCallback(() => {
    const newFilters: LogFilterState = {};

    if (localFilters.levels && localFilters.levels.length > 0) {
      newFilters.levels = localFilters.levels;
    }

    if (localFilters.sources && localFilters.sources.length > 0) {
      newFilters.sources = localFilters.sources;
    }

    if (localFilters.dateAfter || localFilters.dateBefore) {
      newFilters.dateRange = {
        start: localFilters.dateAfter,
        end: localFilters.dateBefore,
      };
    }

    if (localFilters.hasDetails !== undefined) {
      newFilters.hasDetails = localFilters.hasDetails;
    }

    if (localFilters.hasStack !== undefined) {
      newFilters.hasStack = localFilters.hasStack;
    }

    onFiltersChange(newFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleLevelToggle = useCallback((level: string) => {
    setLocalFilters((prev) => {
      const currentLevels = prev.levels || [];
      const newLevels = currentLevels.includes(level)
        ? currentLevels.filter((l) => l !== level)
        : [...currentLevels, level];
      return {
        ...prev,
        levels: newLevels.length > 0 ? newLevels : undefined,
      };
    });
  }, []);

  const serviceOptions = useMemo(
    () =>
      availableServices.map((service) => ({
        value: service,
        label: service,
      })),
    [availableServices]
  );

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
          <ThemedText style={styles.title}>Filtros de Logs</ThemedText>
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
        {/* Log Levels */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFileText size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Níveis de Log
            </ThemedText>
          </View>

          <View style={styles.levelGrid}>
            {LOG_LEVELS.map((level) => {
              const isSelected = localFilters.levels?.includes(level.value);
              return (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => handleLevelToggle(level.value)}
                  activeOpacity={0.7}
                >
                  <Badge
                    style={[
                      styles.levelChip,
                      {
                        backgroundColor: isSelected ? level.color : colors.muted,
                        borderColor: isSelected ? level.color : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.levelChipText,
                        {
                          color: isSelected ? "white" : colors.foreground,
                        },
                      ]}
                    >
                      {level.label}
                    </ThemedText>
                  </Badge>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sources */}
        {availableServices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconServer size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Serviços
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
                Selecionar Serviços
              </ThemedText>
              <Combobox
                options={serviceOptions}
                selectedValues={localFilters.sources || []}
                onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, sources: values }))}
                placeholder="Todos os serviços"
                searchPlaceholder="Buscar serviços..."
                emptyText="Nenhum serviço encontrado"
              />
            </View>
          </View>
        )}

        {/* Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Logs"
            value={{
              from: localFilters.dateAfter,
              to: localFilters.dateBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                dateAfter: range?.from,
                dateBefore: range?.to
              }))
            }
          />
        </View>

        {/* Additional Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFileText size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Filtros Adicionais
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasDetails: !prev.hasDetails || undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Logs com detalhes</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas logs com informações detalhadas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasDetails || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasDetails: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasDetails ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasStack: !prev.hasStack || undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Logs com stack trace</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas logs com rastreamento de pilha
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasStack || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasStack: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasStack ? colors.primaryForeground : "#f4f3f4"}
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
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 2,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterTouchable: {
    flex: 1,
    paddingRight: 16,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  filterDescription: {
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
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
