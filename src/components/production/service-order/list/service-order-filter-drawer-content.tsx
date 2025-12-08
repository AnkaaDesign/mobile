import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCalendarPlus, IconChecklist } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from '@/constants';
import type { ServiceOrderGetManyFormData } from '@/schemas';

interface ServiceOrderFilterDrawerContentProps {
  filters: Partial<ServiceOrderGetManyFormData>;
  onFiltersChange: (filters: Partial<ServiceOrderGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose: () => void;
}

interface FilterState {
  statusIn?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  startedAfter?: Date;
  startedBefore?: Date;
  finishedAfter?: Date;
  finishedBefore?: Date;
}

export function ServiceOrderFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: ServiceOrderFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    statusIn: filters.statusIn || [],
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
    startedAfter: filters.startedAt?.gte,
    startedBefore: filters.startedAt?.lte,
    finishedAfter: filters.finishedAt?.gte,
    finishedBefore: filters.finishedAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<ServiceOrderGetManyFormData> = {};

    if (localFilters.statusIn && localFilters.statusIn.length > 0) {
      newFilters.statusIn = localFilters.statusIn;
    }

    if (localFilters.createdAfter || localFilters.createdBefore) {
      newFilters.createdAt = {};
      if (localFilters.createdAfter) {
        newFilters.createdAt.gte = localFilters.createdAfter;
      }
      if (localFilters.createdBefore) {
        newFilters.createdAt.lte = localFilters.createdBefore;
      }
    }

    if (localFilters.startedAfter || localFilters.startedBefore) {
      newFilters.startedAt = {};
      if (localFilters.startedAfter) {
        newFilters.startedAt.gte = localFilters.startedAfter;
      }
      if (localFilters.startedBefore) {
        newFilters.startedAt.lte = localFilters.startedBefore;
      }
    }

    if (localFilters.finishedAfter || localFilters.finishedBefore) {
      newFilters.finishedAt = {};
      if (localFilters.finishedAfter) {
        newFilters.finishedAt.gte = localFilters.finishedAfter;
      }
      if (localFilters.finishedBefore) {
        newFilters.finishedAt.lte = localFilters.finishedBefore;
      }
    }

    onFiltersChange(newFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  // Status options for select
  const statusOptions = useMemo(() => {
    return Object.values(SERVICE_ORDER_STATUS).map(status => ({
      label: SERVICE_ORDER_STATUS_LABELS[status],
      value: status,
    }));
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
          <ThemedText style={styles.title}>Filtros de Ordens de Serviço</ThemedText>
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
        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconChecklist size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Status
            </ThemedText>
            <Combobox
              options={statusOptions}
              value={localFilters.statusIn || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, statusIn: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder="Todos os status"
              searchPlaceholder="Buscar status..."
              emptyText="Nenhum status encontrado"
            />
          </View>
        </View>

        {/* Created Date */}
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

        {/* Started Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Início
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Início"
            value={{
              from: localFilters.startedAfter,
              to: localFilters.startedBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                startedAfter: range?.from,
                startedBefore: range?.to
              }))
            }
          />
        </View>

        {/* Finished Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Finalização
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Finalização"
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
