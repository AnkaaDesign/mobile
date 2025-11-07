import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconShield, IconUsers, IconCalendarPlus, IconFileCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUsers, useItems } from '../../../../../hooks';
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '../../../../../constants';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import type { PpeDeliveryGetManyFormData } from '../../../../../schemas';

interface PpeDeliveryFilterDrawerContentProps {
  filters: Partial<PpeDeliveryGetManyFormData>;
  onFiltersChange: (filters: Partial<PpeDeliveryGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  statuses?: string[];
  userIds?: string[];
  itemIds?: string[];
  isSigned?: boolean;
  deliveryAfter?: Date;
  deliveryBefore?: Date;
}

export function PpeDeliveryFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PpeDeliveryFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Fetch data for selectors
  const { data: usersData } = useUsers({ perPage: 100, orderBy: { name: "asc" } });
  const { data: itemsData } = useItems({
    perPage: 100,
    orderBy: { name: "asc" },
    where: { isPpe: true },
  });

  const users = usersData?.data || [];
  const items = itemsData?.data || [];

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    statuses: filters.statuses || [],
    userIds: filters.userIds || [],
    itemIds: filters.itemIds || [],
    isSigned: filters.isSigned,
    deliveryAfter: filters.dateRange?.startDate,
    deliveryBefore: filters.dateRange?.endDate,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<PpeDeliveryGetManyFormData> = {};

    if (localFilters.statuses && localFilters.statuses.length > 0) {
      newFilters.statuses = localFilters.statuses as Array<keyof typeof PPE_DELIVERY_STATUS>;
    }

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.itemIds && localFilters.itemIds.length > 0) {
      newFilters.itemIds = localFilters.itemIds;
    }

    if (localFilters.isSigned !== undefined) {
      newFilters.isSigned = localFilters.isSigned;
    }

    if (localFilters.deliveryAfter || localFilters.deliveryBefore) {
      newFilters.dateRange = {
        startDate: localFilters.deliveryAfter,
        endDate: localFilters.deliveryBefore,
      };
    }

    onFiltersChange(newFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [users]
  );

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: `${item.name}${item.ppeSize ? ` - ${item.ppeSize}` : ""}`,
      })),
    [items]
  );

  const statusOptions = useMemo(
    () =>
      Object.entries(PPE_DELIVERY_STATUS_LABELS).map(([key, label]) => ({
        value: key,
        label,
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
            <IconShield size={18} color={colors.mutedForeground} />
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
              selectedValues={localFilters.statuses || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, statuses: values }))}
              placeholder="Todos os status"
              searchPlaceholder="Buscar status..."
              emptyText="Nenhum status encontrado"
            />
          </View>
        </View>

        {/* Signed Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFileCheck size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status de Assinatura
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isSigned: prev.isSigned === true ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Assinado</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas entregas assinadas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isSigned === true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isSigned: value ? true : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isSigned === true ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, isSigned: prev.isSigned === false ? undefined : false }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Não assinado</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas entregas não assinadas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isSigned === false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, isSigned: value ? false : undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isSigned === false ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Employees */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Funcionários
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Funcionários
            </ThemedText>
            <Combobox
              options={userOptions}
              selectedValues={localFilters.userIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: values }))}
              placeholder="Todos os funcionários"
              searchPlaceholder="Buscar funcionários..."
              emptyText="Nenhum funcionário encontrado"
            />
          </View>
        </View>

        {/* PPE Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShield size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              EPIs
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar EPIs
            </ThemedText>
            <Combobox
              options={itemOptions}
              selectedValues={localFilters.itemIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, itemIds: values }))}
              placeholder="Todos os EPIs"
              searchPlaceholder="Buscar EPIs..."
              emptyText="Nenhum EPI encontrado"
            />
          </View>
        </View>

        {/* Delivery Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período de Entrega
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Entrega"
            value={{
              from: localFilters.deliveryAfter,
              to: localFilters.deliveryBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                deliveryAfter: range?.from,
                deliveryBefore: range?.to
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
