import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconBriefcase } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { Checkbox } from '@/components/ui/checkbox';
import { USER_STATUS } from '../../../constants';

export interface TeamUserFilters {
  statuses?: string[];
  positionIds?: string[];
}

interface TeamUserFilterDrawerContentProps {
  filters: TeamUserFilters;
  onFiltersChange: (filters: TeamUserFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  positions: Array<{ id: string; name: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  [USER_STATUS.EXPERIENCE_PERIOD_1]: "Experiência 1/2",
  [USER_STATUS.EXPERIENCE_PERIOD_2]: "Experiência 2/2",
  [USER_STATUS.CONTRACTED]: "Contratado",
  [USER_STATUS.DISMISSED]: "Desligado",
};

export function TeamUserFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  positions,
}: TeamUserFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<TeamUserFilters>(() => ({
    statuses: filters.statuses || [],
    positionIds: filters.positionIds || [],
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

  const handlePositionChange = useCallback((positionId: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const positionIds = prev.positionIds || [];
      if (checked) {
        return { ...prev, positionIds: [...positionIds, positionId] };
      } else {
        return { ...prev, positionIds: positionIds.filter((id) => id !== positionId) };
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
          <ThemedText style={styles.title}>Filtros de Usuários</ThemedText>
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

        {/* Positions */}
        {positions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconBriefcase size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Cargos
              </ThemedText>
            </View>

            <View style={styles.checkboxGroup}>
              {positions.map((position) => (
                <View key={position.id} style={styles.checkboxRow}>
                  <Checkbox
                    checked={localFilters.positionIds?.includes(position.id) ?? false}
                    onCheckedChange={(checked) => handlePositionChange(position.id, checked)}
                  />
                  <ThemedText style={styles.checkboxLabel}>{position.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
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
