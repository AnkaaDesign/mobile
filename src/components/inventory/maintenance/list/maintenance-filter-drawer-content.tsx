import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconTool, IconCalendar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { MAINTENANCE_STATUS, MAINTENANCE_STATUS_LABELS } from '../../../../constants';
import { DateRangeFilter } from '@/components/common/filters';
import type { MaintenanceGetManyParams } from '../../../../types';

interface MaintenanceFilterDrawerContentProps {
  filters: Partial<MaintenanceGetManyParams>;
  onFiltersChange: (filters: Partial<MaintenanceGetManyParams>) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

interface FilterState {
  statusIds?: string[];
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  finishedAfter?: Date;
  finishedBefore?: Date;
}

export function MaintenanceFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: MaintenanceFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    statusIds: ((filters.where?.status as any)?.in || []) as string[],
    scheduledAfter: (filters.where?.scheduledFor as any)?.gte,
    scheduledBefore: (filters.where?.scheduledFor as any)?.lte,
    finishedAfter: (filters.where?.finishedAt as any)?.gte,
    finishedBefore: (filters.where?.finishedAt as any)?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<MaintenanceGetManyParams> = {
      where: {},
    };

    if (localFilters.statusIds && localFilters.statusIds.length > 0) {
      newFilters.where!.status = { in: localFilters.statusIds } as any;
    }

    if (localFilters.scheduledAfter || localFilters.scheduledBefore) {
      newFilters.where!.scheduledFor = {} as any;
      if (localFilters.scheduledAfter) {
        (newFilters.where!.scheduledFor as any).gte = localFilters.scheduledAfter;
      }
      if (localFilters.scheduledBefore) {
        (newFilters.where!.scheduledFor as any).lte = localFilters.scheduledBefore;
      }
    }

    if (localFilters.finishedAfter || localFilters.finishedBefore) {
      newFilters.where!.finishedAt = {} as any;
      if (localFilters.finishedAfter) {
        (newFilters.where!.finishedAt as any).gte = localFilters.finishedAfter;
      }
      if (localFilters.finishedBefore) {
        (newFilters.where!.finishedAt as any).lte = localFilters.finishedBefore;
      }
    }

    // Clean up empty where object
    if (Object.keys(newFilters.where || {}).length === 0) {
      delete newFilters.where;
    }

    onFiltersChange(newFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

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
          <ThemedText style={styles.title}>Filtros de Manutenção</ThemedText>
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
            <IconTool size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          {Object.entries(MAINTENANCE_STATUS).map(([key, value], index, arr) => {
            const label = MAINTENANCE_STATUS_LABELS[value as keyof typeof MAINTENANCE_STATUS_LABELS];
            const isChecked = (localFilters.statusIds || []).includes(value);

            return (
              <View key={key} style={[styles.filterItem, { borderBottomWidth: index === arr.length - 1 ? 0 : 1, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.filterTouchable}
                  onPress={() => {
                    const currentStatuses = localFilters.statusIds || [];
                    if (isChecked) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: currentStatuses.filter((s) => s !== value)
                      }));
                    } else {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: [...currentStatuses, value]
                      }));
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.filterLabel}>{label}</ThemedText>
                </TouchableOpacity>
                <RNSwitch
                  value={isChecked}
                  onValueChange={(checked) => {
                    const currentStatuses = localFilters.statusIds || [];
                    if (checked) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: [...currentStatuses, value]
                      }));
                    } else {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: currentStatuses.filter((s) => s !== value)
                      }));
                    }
                  }}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={isChecked ? colors.primaryForeground : "#f4f3f4"}
                  ios_backgroundColor={colors.muted}
                />
              </View>
            );
          })}
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Datas
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <DateRangeFilter
              label="Data Agendada"
              value={{
                from: localFilters.scheduledAfter,
                to: localFilters.scheduledBefore
              }}
              onChange={(range) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  scheduledAfter: range?.from,
                  scheduledBefore: range?.to
                }))
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <DateRangeFilter
              label="Data de Conclusão"
              value={{
                from: localFilters.finishedAfter,
                to: localFilters.finishedBefore
              }}
              onChange={(range) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  finishedAfter: range?.from,
                  finishedBefore: range?.to
                }))
              }
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
  },
  inputGroup: {
    marginBottom: 10,
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
