import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconAlertTriangle, IconPackage, IconCalendarPlus } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import { useItems } from '@/hooks';
import { PPE_DELIVERY_STATUS_LABELS } from '@/constants';

interface PersonalPpeDeliveryFilters {
  status?: string[];
  itemIds?: string[];
  scheduledDateRange?: {
    gte?: Date;
    lte?: Date;
  };
  actualDeliveryDateRange?: {
    gte?: Date;
    lte?: Date;
  };
}

interface PersonalPpeDeliveryFilterDrawerContentProps {
  filters: PersonalPpeDeliveryFilters;
  onFiltersChange: (filters: PersonalPpeDeliveryFilters) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function PersonalPpeDeliveryFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PersonalPpeDeliveryFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [localFilters, setLocalFilters] = useState<PersonalPpeDeliveryFilters>(() => filters);

  const { data: items } = useItems({
    where: {
      category: { type: "PPE" },
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    const handleClose = onClose || (() => {});
    handleClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const statusOptions = Object.entries(PPE_DELIVERY_STATUS_LABELS).map(([key, label]) => ({
    value: key,
    label: label,
  }));

  const itemOptions =
    items?.data?.map((item) => ({
      value: item.id,
      label: item.name + (item.ppeCA ? ` - CA: ${item.ppeCA}` : ""),
    })) || [];

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
        <TouchableOpacity onPress={onClose || (() => {})} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            {statusOptions.map((option) => (
              <View key={option.value} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.status?.includes(option.value) ?? false}
                  onCheckedChange={(checked) => {
                    const currentStatus = localFilters.status || [];
                    if (checked) {
                      setLocalFilters({
                        ...localFilters,
                        status: [...currentStatus, option.value],
                      });
                    } else {
                      setLocalFilters({
                        ...localFilters,
                        status: currentStatus.filter((s: string) => s !== option.value),
                      });
                    }
                  }}
                />
                <ThemedText style={styles.checkboxLabel}>{option.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Itens
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Item
            </ThemedText>
            <Combobox
              options={itemOptions}
              selectedValues={localFilters.itemIds || []}
              onValueChange={(values) => {
                if (values && values.length > 0) {
                  setLocalFilters({
                    ...localFilters,
                    itemIds: values,
                  });
                } else {
                  const newFilters = { ...localFilters };
                  delete newFilters.itemIds;
                  setLocalFilters(newFilters);
                }
              }}
              placeholder="Selecione um item"
              searchPlaceholder="Buscar itens..."
              emptyText="Nenhum item encontrado"
            />
          </View>
        </View>

        {/* Scheduled Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data Agendada
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Agendamento"
            value={{
              from: localFilters.scheduledDateRange?.gte,
              to: localFilters.scheduledDateRange?.lte
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                scheduledDateRange: {
                  gte: range?.from,
                  lte: range?.to,
                },
              }))
            }
          />
        </View>

        {/* Actual Delivery Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Entrega
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Entrega"
            value={{
              from: localFilters.actualDeliveryDateRange?.gte,
              to: localFilters.actualDeliveryDateRange?.lte
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                actualDeliveryDateRange: {
                  gte: range?.from,
                  lte: range?.to,
                },
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
