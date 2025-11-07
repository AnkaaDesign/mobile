import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconCalendarEvent, IconBeach, IconUser } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { VACATION_STATUS, VACATION_STATUS_LABELS } from '@/constants';

interface MyVacationFilterDrawerContentProps {
  filters: {
    status?: string;
    year?: number;
    isCollective?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function MyVacationFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: MyVacationFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});
  const [yearInput, setYearInput] = useState(filters.year?.toString() || "");

  const handleToggle = useCallback((key: string, value: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      status: prev.status === status ? undefined : status
    }));
  }, []);

  const handleApply = useCallback(() => {
    // Parse year if provided
    const updatedFilters = { ...localFilters };
    if (yearInput.trim()) {
      const yearNum = parseInt(yearInput, 10);
      if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100) {
        updatedFilters.year = yearNum;
      }
    } else {
      delete updatedFilters.year;
    }

    onFiltersChange(updatedFilters);
    onClose?.();
  }, [localFilters, yearInput, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    setYearInput("");
    onClear();
  }, [onClear]);

  // Status options
  const statusOptions = useMemo(() => {
    return [
      { key: VACATION_STATUS.PENDING, label: VACATION_STATUS_LABELS.PENDING },
      { key: VACATION_STATUS.APPROVED, label: VACATION_STATUS_LABELS.APPROVED },
      { key: VACATION_STATUS.REJECTED, label: VACATION_STATUS_LABELS.REJECTED },
      { key: VACATION_STATUS.CANCELLED, label: VACATION_STATUS_LABELS.CANCELLED },
    ];
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
          <ThemedText style={styles.title}>Filtros de Férias</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            <IconBeach size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.filterItem, { borderBottomColor: colors.border }]}
              onPress={() => handleStatusChange(option.key)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.filterLabel}>{option.label}</ThemedText>
              <View
                style={[
                  styles.radioButton,
                  { borderColor: colors.border },
                  localFilters.status === option.key && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                {localFilters.status === option.key && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primaryForeground }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Year Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarEvent size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ano
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Filtrar por ano</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="Ex: 2024"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={yearInput}
              onChangeText={setYearInput}
              maxLength={4}
            />
          </View>
        </View>

        {/* Collective Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUser size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => handleToggle('isCollective', !localFilters.isCollective)}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Férias Coletivas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas férias coletivas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={!!localFilters.isCollective}
              onValueChange={(value) => handleToggle('isCollective', value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isCollective ? colors.primaryForeground : "#f4f3f4"}
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
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
