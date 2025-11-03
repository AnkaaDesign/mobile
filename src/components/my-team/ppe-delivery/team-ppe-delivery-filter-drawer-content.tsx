import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconUsers, IconCalendarCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangeFilter } from '@/components/common/filters';
import { PPE_DELIVERY_STATUS } from '../../../constants';
import type { User } from '../../../types';

export interface TeamPpeDeliveryFilters {
  userIds?: string[];
  statuses?: string[];
  startDate?: Date;
  endDate?: Date;
  hasScheduledDate?: boolean;
}

interface TeamPpeDeliveryFilterDrawerContentProps {
  filters: TeamPpeDeliveryFilters;
  onFiltersChange: (filters: TeamPpeDeliveryFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  teamMembers: User[];
}

const STATUS_LABELS: Record<string, string> = {
  [PPE_DELIVERY_STATUS.PENDING]: "Pendente",
  [PPE_DELIVERY_STATUS.APPROVED]: "Aprovado",
  [PPE_DELIVERY_STATUS.DELIVERED]: "Entregue",
  [PPE_DELIVERY_STATUS.REPROVED]: "Reprovado",
  [PPE_DELIVERY_STATUS.CANCELLED]: "Cancelado",
};

export function TeamPpeDeliveryFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  teamMembers,
}: TeamPpeDeliveryFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<TeamPpeDeliveryFilters>(() => ({
    userIds: filters.userIds || [],
    statuses: filters.statuses || [],
    startDate: filters.startDate,
    endDate: filters.endDate,
    hasScheduledDate: filters.hasScheduledDate,
  }));

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

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

  const handleUserChange = useCallback((userId: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const userIds = prev.userIds || [];
      if (checked) {
        return { ...prev, userIds: [...userIds, userId] };
      } else {
        return { ...prev, userIds: userIds.filter((id) => id !== userId) };
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
          <ThemedText style={styles.title}>Filtros de Entregas de EPI</ThemedText>
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

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconUsers size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Colaboradores
              </ThemedText>
            </View>

            <View style={styles.checkboxGroup}>
              {teamMembers.map((member) => (
                <View key={member.id} style={styles.checkboxRow}>
                  <Checkbox
                    checked={localFilters.userIds?.includes(member.id) ?? false}
                    onCheckedChange={(checked) => handleUserChange(member.id, checked)}
                  />
                  <ThemedText style={styles.checkboxLabel}>{member.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Scheduled Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data Programada
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasScheduledDate: prev.hasScheduledDate === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas com Data Programada</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas entregas com data programada
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasScheduledDate === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasScheduledDate: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasScheduledDate === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasScheduledDate: prev.hasScheduledDate === false ? undefined : false }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas sem Data Programada</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas entregas sem data programada
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasScheduledDate === false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasScheduledDate: value ? false : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasScheduledDate === false ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
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
