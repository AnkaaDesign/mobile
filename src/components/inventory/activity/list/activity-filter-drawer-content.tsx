import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconActivity, IconPackage, IconUser, IconHash, IconCalendar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useItems, useUsers } from "@/hooks";
import {_LABELS,_LABELS } from "@/constants";
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { DateRangeFilter } from '@/components/common/filters';
import type { ActivityGetManyFormData } from '../../../../schemas';

interface ActivityFilterDrawerContentProps {
  filters: Partial<ActivityGetManyFormData>;
  onFiltersChange: (filters: Partial<ActivityGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  operations?: string[];
  reasons?: string[];
  itemIds?: string[];
  userIds?: string[];
  showPaintProduction?: boolean;
  hasUser?: 'both' | 'with' | 'without';
  quantityRange?: { min?: number; max?: number };
  createdAfter?: Date;
  createdBefore?: Date;
}

export function ActivityFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: ActivityFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  const { data: itemsData } = useItems({ limit: 100 });
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
    operations: filters.operations || [],
    reasons: filters.reasons || [],
    itemIds: filters.itemIds || [],
    userIds: filters.userIds || [],
    showPaintProduction: filters.showPaintProduction !== undefined ? filters.showPaintProduction : true,
    hasUser: filters.hasUser || 'both',
    quantityRange: filters.quantityRange,
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<ActivityGetManyFormData> = {};

    if (localFilters.operations && localFilters.operations.length > 0) {
      newFilters.operations = localFilters.operations as any;
    }

    if (localFilters.reasons && localFilters.reasons.length > 0) {
      newFilters.reasons = localFilters.reasons as any;
    }

    if (localFilters.itemIds && localFilters.itemIds.length > 0) {
      newFilters.itemIds = localFilters.itemIds;
    }

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.showPaintProduction !== undefined) {
      newFilters.showPaintProduction = localFilters.showPaintProduction;
    }

    if (localFilters.hasUser && localFilters.hasUser !== 'both') {
      newFilters.hasUser = localFilters.hasUser as any;
    }

    if (localFilters.quantityRange?.min !== undefined || localFilters.quantityRange?.max !== undefined) {
      newFilters.quantityRange = localFilters.quantityRange;
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

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const operationOptions = useMemo(
    () => Object.entries(ACTIVITY_OPERATION_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
    []
  );

  const reasonOptions = useMemo(
    () => Object.entries(ACTIVITY_REASON_LABELS).map(([value, label]) => ({
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
          <ThemedText style={styles.title}>Filtros de Atividades</ThemedText>
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
        {/* Operations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconActivity size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Operação
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Operações
            </ThemedText>
            <Combobox
              options={operationOptions}
              selectedValues={localFilters.operations || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, operations: values }))}
              placeholder="Todas as operações"
              searchPlaceholder="Buscar operações..."
              emptyText="Nenhuma operação encontrada"
              showBadges={false}
            />
          </View>
        </View>

        {/* Reasons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconActivity size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Motivo
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Motivos
            </ThemedText>
            <Combobox
              options={reasonOptions}
              selectedValues={localFilters.reasons || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, reasons: values }))}
              placeholder="Todos os motivos"
              searchPlaceholder="Buscar motivos..."
              emptyText="Nenhum motivo encontrado"
              showBadges={false}
            />
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

        {/* Paint Production Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconActivity size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Produção de Tinta
            </ThemedText>
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={[styles.switchLabel, { color: colors.foreground }]}>
              Mostrar produções de tinta
            </ThemedText>
            <RNSwitch
              value={localFilters.showPaintProduction ?? true}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, showPaintProduction: value }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Attribution Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUser size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Atribuição
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Filtrar por usuário atribuído
            </ThemedText>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  {
                    backgroundColor: localFilters.hasUser === 'both' ? colors.primary : colors.card,
                    borderColor: localFilters.hasUser === 'both' ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setLocalFilters((prev) => ({ ...prev, hasUser: 'both' }))}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.radioText,
                  { color: localFilters.hasUser === 'both' ? colors.primaryForeground : colors.foreground }
                ]}>
                  Ambos
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOption,
                  {
                    backgroundColor: localFilters.hasUser === 'with' ? colors.primary : colors.card,
                    borderColor: localFilters.hasUser === 'with' ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setLocalFilters((prev) => ({ ...prev, hasUser: 'with' }))}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.radioText,
                  { color: localFilters.hasUser === 'with' ? colors.primaryForeground : colors.foreground }
                ]}>
                  Com usuário
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOption,
                  {
                    backgroundColor: localFilters.hasUser === 'without' ? colors.primary : colors.card,
                    borderColor: localFilters.hasUser === 'without' ? colors.primary : colors.border
                  }
                ]}
                onPress={() => setLocalFilters((prev) => ({ ...prev, hasUser: 'without' }))}
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.radioText,
                  { color: localFilters.hasUser === 'without' ? colors.primaryForeground : colors.foreground }
                ]}>
                  Sem usuário
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quantity Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconHash size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Quantidade
            </ThemedText>
          </View>

          <View style={styles.rangeGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Faixa de Quantidade
            </ThemedText>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mínimo"
                value={localFilters.quantityRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    quantityRange: {
                      ...prev.quantityRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeSeparator, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máximo"
                value={localFilters.quantityRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    quantityRange: {
                      ...prev.quantityRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
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
  rangeGroup: {
    marginBottom: 12,
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  radioOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  radioText: {
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
