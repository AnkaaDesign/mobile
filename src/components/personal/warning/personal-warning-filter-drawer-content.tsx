import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconTag, IconCalendarPlus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangeFilter } from '@/components/common/filters';
import { WARNING_CATEGORY, WARNING_SEVERITY, WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../constants';

export interface PersonalWarningFilters {
  categories?: string[];
  severities?: string[];
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface PersonalWarningFilterDrawerContentProps {
  filters: PersonalWarningFilters;
  onFiltersChange: (filters: PersonalWarningFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

export function PersonalWarningFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: PersonalWarningFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<PersonalWarningFilters>(() => ({
    categories: filters.categories || [],
    severities: filters.severities || [],
    isActive: filters.isActive,
    startDate: filters.startDate,
    endDate: filters.endDate,
  }));

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleSeverityChange = useCallback((severity: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const severities = prev.severities || [];
      if (checked) {
        return { ...prev, severities: [...severities, severity] };
      } else {
        return { ...prev, severities: severities.filter((s) => s !== severity) };
      }
    });
  }, []);

  const handleCategoryChange = useCallback((category: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const categories = prev.categories || [];
      if (checked) {
        return { ...prev, categories: [...categories, category] };
      } else {
        return { ...prev, categories: categories.filter((c) => c !== category) };
      }
    });
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
          <ThemedText style={styles.title}>Filtros de Minhas Advertências</ThemedText>
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
        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isActive: prev.isActive === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Ativas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas advertências ativas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isActive === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isActive: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isActive === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isActive: prev.isActive === false ? undefined : false }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Resolvidas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas advertências resolvidas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isActive === false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isActive: value ? false : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isActive === false ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Severity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Gravidade
            </ThemedText>
          </View>

          <View style={styles.checkboxGroup}>
            {Object.values(WARNING_SEVERITY).map((severity) => (
              <View key={severity} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.severities?.includes(severity) ?? false}
                  onCheckedChange={(checked) => handleSeverityChange(severity, checked)}
                />
                <ThemedText style={styles.checkboxLabel}>
                  {WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS]}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconTag size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Categoria
            </ThemedText>
          </View>

          <View style={styles.checkboxGroup}>
            {Object.values(WARNING_CATEGORY).map((category) => (
              <View key={category} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.categories?.includes(category) ?? false}
                  onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                />
                <ThemedText style={styles.checkboxLabel}>
                  {WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS]}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período"
            value={{
              from: localFilters.startDate,
              to: localFilters.endDate
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                startDate: range?.from,
                endDate: range?.to
              }))
            }
          />
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
  checkboxGroup: {
    gap: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  checkboxLabel: {
    fontSize: 14,
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
