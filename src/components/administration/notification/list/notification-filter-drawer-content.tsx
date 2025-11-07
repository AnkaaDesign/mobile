import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconBell, IconCalendarPlus, IconAlertCircle } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { NOTIFICATION_IMPORTANCE, NOTIFICATION_TYPE, NOTIFICATION_IMPORTANCE_LABELS, NOTIFICATION_TYPE_LABELS } from '../../../../constants';
import type { NotificationGetManyFormData } from '../../../../schemas';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';

interface NotificationFilterDrawerContentProps {
  filters: Partial<NotificationGetManyFormData>;
  onFiltersChange: (filters: Partial<NotificationGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  importance?: string[];
  types?: string[];
  unread?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  sentAfter?: Date;
  sentBefore?: Date;
}

export function NotificationFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: NotificationFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    importance: filters.importance || [],
    types: filters.types || [],
    unread: filters.unread,
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
    updatedAfter: filters.updatedAt?.gte,
    updatedBefore: filters.updatedAt?.lte,
    sentAfter: filters.sentAt?.gte,
    sentBefore: filters.sentAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<NotificationGetManyFormData> = {};

    if (localFilters.importance && localFilters.importance.length > 0) {
      newFilters.importance = localFilters.importance;
    }

    if (localFilters.types && localFilters.types.length > 0) {
      newFilters.types = localFilters.types;
    }

    if (localFilters.unread !== undefined) {
      newFilters.unread = localFilters.unread;
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

    if (localFilters.updatedAfter || localFilters.updatedBefore) {
      newFilters.updatedAt = {};
      if (localFilters.updatedAfter) {
        newFilters.updatedAt.gte = localFilters.updatedAfter;
      }
      if (localFilters.updatedBefore) {
        newFilters.updatedAt.lte = localFilters.updatedBefore;
      }
    }

    if (localFilters.sentAfter || localFilters.sentBefore) {
      newFilters.sentAt = {};
      if (localFilters.sentAfter) {
        newFilters.sentAt.gte = localFilters.sentAfter;
      }
      if (localFilters.sentBefore) {
        newFilters.sentAt.lte = localFilters.sentBefore;
      }
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const importanceOptions = useMemo(
    () =>
      Object.values(NOTIFICATION_IMPORTANCE).map((importance) => ({
        value: importance,
        label: NOTIFICATION_IMPORTANCE_LABELS[importance],
      })),
    []
  );

  const typeOptions = useMemo(
    () =>
      Object.values(NOTIFICATION_TYPE).map((type) => ({
        value: type,
        label: NOTIFICATION_TYPE_LABELS[type],
      })),
    []
  );

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
          <ThemedText style={styles.title}>Filtros de Notificações</ThemedText>
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
        {/* Importance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertCircle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Importância
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Importâncias
            </ThemedText>
            <Combobox
              options={importanceOptions}
              selectedValues={localFilters.importance || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, importance: values }))}
              placeholder="Todas as importâncias"
              searchPlaceholder="Buscar importâncias..."
              emptyText="Nenhuma importância encontrada"
            />
          </View>
        </View>

        {/* Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBell size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipos
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Tipos
            </ThemedText>
            <Combobox
              options={typeOptions}
              selectedValues={localFilters.types || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, types: values }))}
              placeholder="Todos os tipos"
              searchPlaceholder="Buscar tipos..."
              emptyText="Nenhum tipo encontrado"
            />
          </View>
        </View>

        {/* Read Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBell size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status de Leitura
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, unread: !prev.unread || undefined }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas não lidas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas notificações não lidas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.unread === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, unread: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.unread === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Date Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Envio
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Envio"
            value={{
              from: localFilters.sentAfter,
              to: localFilters.sentBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                sentAfter: range?.from,
                sentBefore: range?.to
              }))
            }
          />
        </View>

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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Atualização
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Atualização"
            value={{
              from: localFilters.updatedAfter,
              to: localFilters.updatedBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                updatedAfter: range?.from,
                updatedBefore: range?.to
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
