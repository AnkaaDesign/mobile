import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconBeach, IconCalendarPlus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangeFilter } from '@/components/common/filters';
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from "@/constants";
import type { VacationGetManyFormData } from '../../../schemas';

interface TeamVacationFilterDrawerContentProps {
  filters: Partial<VacationGetManyFormData>;
  onFiltersChange: (filters: Partial<VacationGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  teamMemberIds?: string[];
  onClose?: () => void;
}

export function TeamVacationFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  teamMemberIds = [],
  onClose,
}: TeamVacationFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [localFilters, setLocalFilters] = useState<Partial<VacationGetManyFormData>>(() => filters);

  const handleApply = useCallback(() => {
    const filtersWithTeam = {
      ...localFilters,
      where: {
        ...localFilters.where,
        userId: { in: teamMemberIds },
      },
    };
    onFiltersChange(filtersWithTeam);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose, teamMemberIds]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleStatusChange = useCallback((status: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const currentStatuses = (prev.where?.status as any)?.in || [];
      if (checked) {
        return {
          ...prev,
          where: {
            ...prev.where,
            status: { in: [...currentStatuses, status] },
          },
        };
      } else {
        const newStatuses = currentStatuses.filter((s: string) => s !== status);
        return {
          ...prev,
          where: {
            ...prev.where,
            status: newStatuses.length > 0 ? { in: newStatuses } : undefined,
          },
        };
      }
    });
  }, []);

  const handleTypeChange = useCallback((type: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const currentTypes = (prev.where?.type as any)?.in || [];
      if (checked) {
        return {
          ...prev,
          where: {
            ...prev.where,
            type: { in: [...currentTypes, type] },
          },
        };
      } else {
        const newTypes = currentTypes.filter((t: string) => t !== type);
        return {
          ...prev,
          where: {
            ...prev.where,
            type: newTypes.length > 0 ? { in: newTypes } : undefined,
          },
        };
      }
    });
  }, []);

  const currentStatuses = (localFilters.where?.status as any)?.in || [];
  const currentTypes = (localFilters.where?.type as any)?.in || [];

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
          <ThemedText style={styles.title}>Filtros de Férias</ThemedText>
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
        {/* Quick filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFilter size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Filtros Rápidos
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, showCurrentOnly: !(prev as any).showCurrentOnly }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas férias em andamento</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas férias que estão acontecendo agora
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={(localFilters as any).showCurrentOnly || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, showCurrentOnly: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={(localFilters as any).showCurrentOnly ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, showConflictsOnly: !(prev as any).showConflictsOnly }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas conflitos de férias</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas férias com conflitos de período
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={(localFilters as any).showConflictsOnly || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, showConflictsOnly: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={(localFilters as any).showConflictsOnly ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={styles.checkboxGroup}>
            {Object.entries(VACATION_STATUS_LABELS).map(([key, label]) => (
              <View key={key} style={styles.checkboxRow}>
                <Checkbox
                  checked={currentStatuses.includes(key)}
                  onCheckedChange={(checked) => handleStatusChange(key, checked as boolean)}
                />
                <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBeach size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Férias
            </ThemedText>
          </View>

          <View style={styles.checkboxGroup}>
            {Object.entries(VACATION_TYPE_LABELS).map(([key, label]) => (
              <View key={key} style={styles.checkboxRow}>
                <Checkbox
                  checked={currentTypes.includes(key)}
                  onCheckedChange={(checked) => handleTypeChange(key, checked as boolean)}
                />
                <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
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
            label="Data inicial (a partir de)"
            value={{
              from: (localFilters.where?.startAt as any)?.gte,
              to: undefined
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                where: {
                  ...prev.where,
                  startAt: range?.from ? { gte: range.from } : undefined,
                },
              }))
            }
          />

          <View style={{ marginTop: 12 }}>
            <DateRangeFilter
              label="Data final (até)"
              value={{
                from: (localFilters.where?.endAt as any)?.lte,
                to: undefined
              }}
              onChange={(range) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  where: {
                    ...prev.where,
                    endAt: range?.from ? { lte: range.from } : undefined,
                  },
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
