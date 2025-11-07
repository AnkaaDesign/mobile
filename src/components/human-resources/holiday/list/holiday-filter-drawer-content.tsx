import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconCalendar, IconCalendarPlus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { NumberInput } from '@/components/ui/number-input';
import { HOLIDAY_TYPE, HOLIDAY_TYPE_LABELS } from '../../../../constants';
import { Checkbox } from '@/components/ui/checkbox';

interface HolidayFilterDrawerContentProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  types?: HOLIDAY_TYPE[];
  year?: number;
  month?: number;
  isUpcoming?: boolean;
}

export function HolidayFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: HolidayFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    types: filters.types || [],
    year: filters.year,
    month: filters.month,
    isUpcoming: filters.isUpcoming,
  }));

  const handleApply = useCallback(() => {
    const newFilters: any = {};

    if (localFilters.types && localFilters.types.length > 0) {
      newFilters.types = localFilters.types;
    }

    if (localFilters.year !== undefined) {
      newFilters.year = localFilters.year;
    }

    if (localFilters.month !== undefined) {
      newFilters.month = localFilters.month;
    }

    if (localFilters.isUpcoming !== undefined) {
      newFilters.isUpcoming = localFilters.isUpcoming;
    }

    onFiltersChange(newFilters);
    if (onClose) {
      onClose();
    } else {
      closeFilterDrawer();
    }
  }, [localFilters, onFiltersChange, onClose, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const toggleType = (type: HOLIDAY_TYPE) => {
    const currentTypes = localFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t: HOLIDAY_TYPE) => t !== type)
      : [...currentTypes, type];

    setLocalFilters((prev) => ({
      ...prev,
      types: newTypes.length > 0 ? newTypes : undefined,
    }));
  };

  const currentYear = new Date().getFullYear();

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
          <ThemedText style={styles.title}>Filtros de Feriados</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose || closeFilterDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Type filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Feriado
            </ThemedText>
          </View>

          <View style={styles.checkboxContainer}>
            {Object.values(HOLIDAY_TYPE).map((type) => (
              <View key={type} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.types?.includes(type) || false}
                  onCheckedChange={() => toggleType(type)}
                  label={HOLIDAY_TYPE_LABELS[type]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Year and Month filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Ano
            </ThemedText>
            <NumberInput
              value={localFilters.year}
              onChangeValue={(value) => setLocalFilters((prev) => ({ ...prev, year: value }))}
              placeholder={`Ex: ${currentYear}`}
              min={1900}
              max={2100}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Mês
            </ThemedText>
            <NumberInput
              value={localFilters.month}
              onChangeValue={(value) => setLocalFilters((prev) => ({ ...prev, month: value }))}
              placeholder="1-12"
              min={1}
              max={12}
            />
          </View>
        </View>

        {/* Upcoming filter */}
        <View style={styles.section}>
          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isUpcoming: !prev.isUpcoming }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas próximos feriados</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas feriados futuros
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isUpcoming || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isUpcoming: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isUpcoming ? colors.primaryForeground : "#f4f3f4"}
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
  checkboxContainer: {
    gap: 8,
  },
  checkboxRow: {
    marginBottom: 4,
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
