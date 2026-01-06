import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconDatabase, IconCalendarPlus, IconCircleCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import type { BackupQueryParams } from '../../../../api-client';
import { Badge } from '@/components/ui/badge';
import { DateRangeFilter } from '@/components/common/filters';

interface BackupFilterDrawerContentProps {
  filters: BackupQueryParams;
  onFiltersChange: (filters: BackupQueryParams) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  type?: "database" | "files" | "full";
  statuses?: Array<"pending" | "in_progress" | "completed" | "failed">;
  createdAfter?: Date;
  createdBefore?: Date;
}

const statusOptions = [
  { value: "pending", label: "Pendente", color: "#737373" },
  { value: "in_progress", label: "Em Progresso", color: "#eab308" },
  { value: "completed", label: "Concluído", color: "#22c55e" },
  { value: "failed", label: "Falhou", color: "#ef4444" },
] as const;

const typeOptions = [
  { value: "database", label: "Banco de Dados" },
  { value: "files", label: "Arquivos" },
  { value: "full", label: "Completo" },
] as const;

export function BackupFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: BackupFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    type: filters.type,
    statuses: filters.status ? [filters.status] : undefined,
    createdAfter: undefined,
    createdBefore: undefined,
  }));

  const handleApply = useCallback(() => {
    const newFilters: BackupQueryParams = {};

    if (localFilters.type) {
      newFilters.type = localFilters.type;
    }

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      newFilters.status = localFilters.statuses[0];
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleTypeSelect = useCallback((type: "database" | "files" | "full") => {
    setLocalFilters((prev) => ({
      ...prev,
      type: prev.type === type ? undefined : type,
    }));
  }, []);

  const handleStatusToggle = useCallback((status: "pending" | "in_progress" | "completed" | "failed") => {
    setLocalFilters((prev) => {
      const currentStatuses = prev.statuses || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];

      return {
        ...prev,
        statuses: newStatuses.length > 0 ? newStatuses : undefined,
      };
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
          <ThemedText style={styles.title}>Filtros de Backup</ThemedText>
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
        {/* Status Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCircleCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status do Backup
            </ThemedText>
          </View>

          {statusOptions.map((option) => (
            <View key={option.value} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleStatusToggle(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.statusLabelContainer}>
                  <View style={[styles.statusIndicator, { backgroundColor: option.color }]} />
                  <ThemedText style={styles.filterLabel}>{option.label}</ThemedText>
                </View>
              </TouchableOpacity>
              <RNSwitch
                value={(localFilters.statuses || []).includes(option.value)}
                onValueChange={() => handleStatusToggle(option.value)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={(localFilters.statuses || []).includes(option.value) ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Type Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconDatabase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Backup
            </ThemedText>
          </View>

          <View style={styles.typeContainer}>
            {typeOptions.map((option) => {
              const isSelected = localFilters.type === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleTypeSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Badge
                    style={StyleSheet.flatten([
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.muted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ])}
                  >
                    <ThemedText
                      style={[
                        styles.typeChipText,
                        {
                          color: isSelected ? colors.primaryForeground : colors.foreground,
                        },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Badge>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Criação
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Criação"
            value={{
              from: localFilters.createdAfter,
              to: localFilters.createdBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                createdAfter: range?.from,
                createdBefore: range?.to
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
  statusLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "500",
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
