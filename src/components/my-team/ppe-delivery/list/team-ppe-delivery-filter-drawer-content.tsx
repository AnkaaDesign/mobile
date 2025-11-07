import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconPackage, IconUser, IconCalendar, IconCircleCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '@/constants';

interface TeamPpeDeliveryFilterDrawerContentProps {
  filters: {
    status?: string[];
    itemName?: string;
    userName?: string;
    deliveryDateStart?: Date;
    deliveryDateEnd?: Date;
    hasReviewer?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function TeamPpeDeliveryFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: TeamPpeDeliveryFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleClose = onClose || (() => {});
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  const handleToggleStatus = useCallback((status: string) => {
    setLocalFilters(prev => {
      const currentStatuses = prev.status || [];
      const hasStatus = currentStatuses.includes(status);

      return {
        ...prev,
        status: hasStatus
          ? currentStatuses.filter(s => s !== status)
          : [...currentStatuses, status]
      };
    });
  }, []);

  const handleToggle = useCallback((key: string, value: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  // Status options
  const statusOptions = useMemo(() => [
    { value: PPE_DELIVERY_STATUS.PENDING, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.PENDING], color: '#f59e0b' },
    { value: PPE_DELIVERY_STATUS.APPROVED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.APPROVED], color: '#3b82f6' },
    { value: PPE_DELIVERY_STATUS.DELIVERED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.DELIVERED], color: '#10b981' },
    { value: PPE_DELIVERY_STATUS.REPROVED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.REPROVED], color: '#ef4444' },
    { value: PPE_DELIVERY_STATUS.CANCELLED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.CANCELLED], color: '#6b7280' },
  ], []);

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
          <ThemedText style={styles.title}>Filtros de Entregas</ThemedText>
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
              Status da Entrega
            </ThemedText>
          </View>

          {statusOptions.map((option) => {
            const isSelected = localFilters.status?.includes(option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  { borderColor: colors.border },
                  isSelected && { borderColor: option.color, backgroundColor: `${option.color}10` }
                ]}
                onPress={() => handleToggleStatus(option.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.statusIndicator, { backgroundColor: option.color }]} />
                <ThemedText style={[styles.statusLabel, { color: colors.foreground }]}>
                  {option.label}
                </ThemedText>
                {isSelected && <IconCircleCheck size={18} color={option.color} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Busca por Item
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Nome do Item EPI</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="Digite o nome do item..."
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.itemName || ""}
              onChangeText={(value) => setLocalFilters(prev => ({
                ...prev,
                itemName: value || undefined
              }))}
            />
          </View>
        </View>

        {/* User Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUser size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Busca por Funcionário
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Nome do Funcionário</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="Digite o nome do funcionário..."
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.userName || ""}
              onChangeText={(value) => setLocalFilters(prev => ({
                ...prev,
                userName: value || undefined
              }))}
            />
          </View>
        </View>

        {/* Date Range Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período de Entrega
            </ThemedText>
          </View>

          <View style={styles.dateInputs}>
            <View style={styles.dateInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>Data Inicial</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground
                }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.mutedForeground}
                value={localFilters.deliveryDateStart ? new Date(localFilters.deliveryDateStart).toLocaleDateString('pt-BR') : ""}
                editable={false}
              />
            </View>

            <View style={styles.dateInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>Data Final</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground
                }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.mutedForeground}
                value={localFilters.deliveryDateEnd ? new Date(localFilters.deliveryDateEnd).toLocaleDateString('pt-BR') : ""}
                editable={false}
              />
            </View>
          </View>
        </View>

        {/* Approval Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCircleCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Aprovação
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => handleToggle('hasReviewer', !localFilters.hasReviewer)}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Possui Aprovador</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Entregas que foram aprovadas por alguém
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={!!localFilters.hasReviewer}
              onValueChange={(value) => handleToggle('hasReviewer', value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasReviewer ? colors.primaryForeground : "#f4f3f4"}
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
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
  dateInputs: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 1,
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
