import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconBriefcase, IconBuilding, IconCalendar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { USER_STATUS } from '../../../../constants';
import { Checkbox } from '@/components/ui/checkbox';

interface TeamMemberFilters {
  statuses?: string[];
  positionIds?: string[];
  sectorIds?: string[];
  admissionalStart?: Date;
  admissionalEnd?: Date;
}

interface TeamMemberFilterDrawerContentProps {
  filters: TeamMemberFilters;
  onFiltersChange: (filters: TeamMemberFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  positions?: Array<{ id: string; name: string }>;
  sectors?: Array<{ id: string; name: string }>;
  onClose?: () => void;
}

const STATUS_OPTIONS = [
  { value: USER_STATUS.EXPERIENCE_PERIOD_1, label: "Experiência 1" },
  { value: USER_STATUS.EXPERIENCE_PERIOD_2, label: "Experiência 2" },
  { value: USER_STATUS.CONTRACTED, label: "Contratado" },
  { value: USER_STATUS.DISMISSED, label: "Desligado" },
];

export function TeamMemberFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  positions = [],
  sectors = [],
  onClose,
}: TeamMemberFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});
  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleStatusChange = useCallback((status: string, checked: boolean) => {
    setLocalFilters(prev => {
      const statuses = prev.statuses || [];
      if (checked) {
        return { ...prev, statuses: [...statuses, status] };
      } else {
        return { ...prev, statuses: statuses.filter(s => s !== status) };
      }
    });
  }, []);

  const handlePositionChange = useCallback((positionId: string, checked: boolean) => {
    setLocalFilters(prev => {
      const positionIds = prev.positionIds || [];
      if (checked) {
        return { ...prev, positionIds: [...positionIds, positionId] };
      } else {
        return { ...prev, positionIds: positionIds.filter(id => id !== positionId) };
      }
    });
  }, []);

  const handleSectorChange = useCallback((sectorId: string, checked: boolean) => {
    setLocalFilters(prev => {
      const sectorIds = prev.sectorIds || [];
      if (checked) {
        return { ...prev, sectorIds: [...sectorIds, sectorId] };
      } else {
        return { ...prev, sectorIds: sectorIds.filter(id => id !== sectorId) };
      }
    });
  }, []);

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const parseDateFromInput = (dateStr: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr);
  };

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
          <ThemedText style={styles.title}>Filtros de Membros</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Status Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={styles.checkboxGroup}>
            {STATUS_OPTIONS.map((option) => (
              <View key={option.value} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.statuses?.includes(option.value) ?? false}
                  onCheckedChange={(checked) => handleStatusChange(option.value, checked)}
                />
                <ThemedText style={styles.checkboxLabel}>{option.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Position Filter */}
        {positions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconBriefcase size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Cargo
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

        {/* Sector Filter */}
        {sectors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconBuilding size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Setor
              </ThemedText>
            </View>

            <View style={styles.checkboxGroup}>
              {sectors.map((sector) => (
                <View key={sector.id} style={styles.checkboxRow}>
                  <Checkbox
                    checked={localFilters.sectorIds?.includes(sector.id) ?? false}
                    onCheckedChange={(checked) => handleSectorChange(sector.id, checked)}
                  />
                  <ThemedText style={styles.checkboxLabel}>{sector.name}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Hire Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Admissão
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Data Inicial</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={formatDateForInput(localFilters.admissionalStart)}
              onChangeText={(value) => setLocalFilters(prev => ({
                ...prev,
                admissionalStart: parseDateFromInput(value)
              }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Data Final</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={formatDateForInput(localFilters.admissionalEnd)}
              onChangeText={(value) => setLocalFilters(prev => ({
                ...prev,
                admissionalEnd: parseDateFromInput(value)
              }))}
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
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
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
