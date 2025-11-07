import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconScissors, IconFileText } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangeFilter } from '@/components/common/filters';
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from '../../../constants';

export interface TeamCuttingFilters {
  statuses?: string[];
  types?: string[];
  origins?: string[];
  startDate?: Date;
  endDate?: Date;
}

interface TeamCuttingFilterDrawerContentProps {
  filters: TeamCuttingFilters;
  onFiltersChange: (filters: TeamCuttingFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  [CUT_STATUS.PENDING]: "Pendente",
  [CUT_STATUS.CUTTING]: "Cortando",
  [CUT_STATUS.COMPLETED]: "Concluído",
};

const TYPE_LABELS: Record<string, string> = {
  [CUT_TYPE.VINYL]: "Adesivo",
  [CUT_TYPE.STENCIL]: "Espovo",
};

const ORIGIN_LABELS: Record<string, string> = {
  [CUT_ORIGIN.PLAN]: "Plano",
  [CUT_ORIGIN.REQUEST]: "Solicitação",
};

export function TeamCuttingFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: TeamCuttingFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [localFilters, setLocalFilters] = useState<TeamCuttingFilters>(() => ({
    statuses: filters.statuses || [],
    types: filters.types || [],
    origins: filters.origins || [],
    startDate: filters.startDate,
    endDate: filters.endDate,
  }));

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleStatusChange = useCallback((status: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const statuses = prev.statuses || [];
      if (checked) {
        return { ...prev, statuses: [...statuses, status] };
      } else {
        return { ...prev, statuses: statuses.filter((s) => s !== status) };
      }
    });
  }, []);

  const handleTypeChange = useCallback((type: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const types = prev.types || [];
      if (checked) {
        return { ...prev, types: [...types, type] };
      } else {
        return { ...prev, types: types.filter((t) => t !== type) };
      }
    });
  }, []);

  const handleOriginChange = useCallback((origin: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const origins = prev.origins || [];
      if (checked) {
        return { ...prev, origins: [...origins, origin] };
      } else {
        return { ...prev, origins: origins.filter((o) => o !== origin) };
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
          <ThemedText style={styles.title}>Filtros de Recortes</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose || (() => {})} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

          <View style={styles.checkboxGroup}>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <View key={status} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.statuses?.includes(status) ?? false}
                  onCheckedChange={(checked) => handleStatusChange(status, checked)}
                />
                <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconScissors size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo
            </ThemedText>
          </View>

          <View style={styles.checkboxGroup}>
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <View key={type} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.types?.includes(type) ?? false}
                  onCheckedChange={(checked) => handleTypeChange(type, checked)}
                />
                <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Origin */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFileText size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Origem
            </ThemedText>
          </View>

          <View style={styles.checkboxGroup}>
            {Object.entries(ORIGIN_LABELS).map(([origin, label]) => (
              <View key={origin} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.origins?.includes(origin) ?? false}
                  onCheckedChange={(checked) => handleOriginChange(origin, checked)}
                />
                <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
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
