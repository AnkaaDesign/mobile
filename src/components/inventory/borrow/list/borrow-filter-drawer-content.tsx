import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconPackage, IconUser, IconCalendar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useItems, useUsers } from '../../../../hooks';
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../../constants';
import { Combobox } from '@/components/ui/combobox';
import { DateRangeFilter } from '@/components/common/filters';
import type { BorrowGetManyFormData } from '../../../../schemas';

interface BorrowFilterDrawerContentProps {
  filters: Partial<BorrowGetManyFormData>;
  onFiltersChange: (filters: Partial<BorrowGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  statusIds?: string[];
  itemIds?: string[];
  userIds?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  returnedAfter?: Date;
  returnedBefore?: Date;
}

export function BorrowFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: BorrowFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  const { data: itemsData } = useItems({ limit: 100, where: { category: { type: "TOOL" } } });
  const { data: usersData } = useUsers({ limit: 100 });

  const items = useMemo(() =>
    itemsData?.data?.map(item => ({
      value: item.id,
      label: `${item.name} (${item.uniCode})`
    })) || [],
    [itemsData]
  );

  const users = useMemo(() =>
    usersData?.data?.map(user => ({
      value: user.id,
      label: user.name
    })) || [],
    [usersData]
  );

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    statusIds: filters.statusIds || [BORROW_STATUS.ACTIVE],
    itemIds: filters.itemIds || [],
    userIds: filters.userIds || [],
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
    returnedAfter: filters.returnedAt?.gte,
    returnedBefore: filters.returnedAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<BorrowGetManyFormData> = {};

    if (localFilters.statusIds && localFilters.statusIds.length > 0) {
      newFilters.statusIds = localFilters.statusIds as any;
    }

    if (localFilters.itemIds && localFilters.itemIds.length > 0) {
      newFilters.itemIds = localFilters.itemIds;
    }

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
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

    if (localFilters.returnedAfter || localFilters.returnedBefore) {
      newFilters.returnedAt = {};
      if (localFilters.returnedAfter) {
        newFilters.returnedAt.gte = localFilters.returnedAfter;
      }
      if (localFilters.returnedBefore) {
        newFilters.returnedAt.lte = localFilters.returnedBefore;
      }
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({ statusIds: [BORROW_STATUS.ACTIVE] });
    onClear();
  }, [onClear]);

  const statusOptions = useMemo(
    () => Object.entries(BORROW_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
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
          <ThemedText style={styles.title}>Filtros de Empréstimos</ThemedText>
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

          {Object.entries(BORROW_STATUS_LABELS).map(([key, label], index, arr) => {
            const isChecked = (localFilters.statusIds || []).includes(key);

            return (
              <View key={key} style={[styles.filterItem, { borderBottomWidth: index === arr.length - 1 ? 0 : 1, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.filterTouchable}
                  onPress={() => {
                    const currentStatuses = localFilters.statusIds || [];
                    if (isChecked) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: currentStatuses.filter((s) => s !== key)
                      }));
                    } else {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: [...currentStatuses, key]
                      }));
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.filterLabel}>{label}</ThemedText>
                </TouchableOpacity>
                <RNSwitch
                  value={isChecked}
                  onValueChange={(value) => {
                    const currentStatuses = localFilters.statusIds || [];
                    if (value) {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: [...currentStatuses, key]
                      }));
                    } else {
                      setLocalFilters((prev) => ({
                        ...prev,
                        statusIds: currentStatuses.filter((s) => s !== key)
                      }));
                    }
                  }}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={isChecked ? colors.primaryForeground : "#f4f3f4"}
                  ios_backgroundColor={colors.muted}
                />
              </View>
            );
          })}
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
              Selecionar Itens
            </ThemedText>
            <Combobox
              options={items}
              selectedValues={localFilters.itemIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, itemIds: values }))}
              placeholder="Todos os itens"
              searchPlaceholder="Buscar itens..."
              emptyText="Nenhum item encontrado"
              showBadges={false}
            />
          </View>
        </View>

        {/* Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUser size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Usuários
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Usuários
            </ThemedText>
            <Combobox
              options={users}
              selectedValues={localFilters.userIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: values }))}
              placeholder="Todos os usuários"
              searchPlaceholder="Buscar usuários..."
              emptyText="Nenhum usuário encontrado"
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
              label="Data de Empréstimo"
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
              label="Data de Devolução"
              value={{
                from: localFilters.returnedAfter,
                to: localFilters.returnedBefore
              }}
              onChange={(range) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  returnedAfter: range?.from,
                  returnedBefore: range?.to
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
