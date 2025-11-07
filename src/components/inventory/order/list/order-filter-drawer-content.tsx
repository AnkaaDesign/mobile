import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconPackage, IconBuilding, IconCalendar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { useSuppliers } from '../../../../hooks';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../../../constants';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import type { OrderGetManyFormData } from '../../../../schemas';

interface OrderFilterDrawerContentProps {
  filters: Partial<OrderGetManyFormData>;
  onFiltersChange: (filters: Partial<OrderGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  status?: string[];
  supplierIds?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  forecastAfter?: Date;
  forecastBefore?: Date;
}

export function OrderFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: OrderFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();
  const handleClose = onClose || closeFilterDrawer;

  const { data: suppliersResponse } = useSuppliers({ limit: 100 });
  const suppliers = suppliersResponse?.data || [];

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    status: filters.status || [],
    supplierIds: filters.supplierIds || [],
    createdAfter: filters.createdAt?.gte ? new Date(filters.createdAt.gte) : undefined,
    createdBefore: filters.createdAt?.lte ? new Date(filters.createdAt.lte) : undefined,
    forecastAfter: filters.forecastRange?.gte ? new Date(filters.forecastRange.gte) : undefined,
    forecastBefore: filters.forecastRange?.lte ? new Date(filters.forecastRange.lte) : undefined,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<OrderGetManyFormData> = {};

    if (localFilters.status && localFilters.status.length > 0) {
      newFilters.status = localFilters.status as any;
    }

    if (localFilters.supplierIds && localFilters.supplierIds.length > 0) {
      newFilters.supplierIds = localFilters.supplierIds;
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

    if (localFilters.forecastAfter || localFilters.forecastBefore) {
      newFilters.forecastRange = {};
      if (localFilters.forecastAfter) {
        newFilters.forecastRange.gte = localFilters.forecastAfter;
      }
      if (localFilters.forecastBefore) {
        newFilters.forecastRange.lte = localFilters.forecastBefore;
      }
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const statusOptions = useMemo(
    () => Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
    []
  );

  const supplierOptions = useMemo(
    () => suppliers.map(supplier => ({
      label: supplier.fantasyName,
      value: supplier.id,
    })),
    [suppliers]
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
          <ThemedText style={styles.title}>Filtros de Pedidos</ThemedText>
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
        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
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
              selectedValues={localFilters.status || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, status: values }))}
              placeholder="Todos os status"
              searchPlaceholder="Buscar status..."
              emptyText="Nenhum status encontrado"
              showBadges={false}
            />
          </View>
        </View>

        {/* Suppliers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBuilding size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Fornecedores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Fornecedores
            </ThemedText>
            <Combobox
              options={supplierOptions}
              selectedValues={localFilters.supplierIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, supplierIds: values }))}
              placeholder="Todos os fornecedores"
              searchPlaceholder="Buscar fornecedores..."
              emptyText="Nenhum fornecedor encontrado"
              showBadges={false}
            />
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Datas
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <DateRangeFilter
              label="Data de Criação"
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

          <View style={styles.inputGroup}>
            <DateRangeFilter
              label="Previsão de Entrega"
              value={{
                from: localFilters.forecastAfter,
                to: localFilters.forecastBefore
              }}
              onChange={(range) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  forecastAfter: range?.from,
                  forecastBefore: range?.to
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
