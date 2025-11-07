import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconShield, IconCategory } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useItemCategories } from '../../../../hooks';
import { PPE_TYPE, PPE_TYPE_LABELS } from '../../../../constants';
import { Combobox } from '@/components/ui/combobox';
import type { ItemGetManyFormData } from '../../../../schemas';

interface PpeFilterDrawerContentProps {
  filters: Partial<ItemGetManyFormData>;
  onFiltersChange: (filters: Partial<ItemGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  ppeTypes?: string[];
  categoryIds?: string[];
  hasDeliveries?: boolean;
}

export function PpeFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PpeFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Load categories for filtering
  const { data: categoriesResponse } = useItemCategories({
    perPage: 100,
    orderBy: { name: "asc" },
  });
  const categories = categoriesResponse?.data || [];

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState<FilterState>(() => {
    const where = filters.where || {};
    return {
      ppeTypes: Array.isArray(where.ppeType?.in) ? where.ppeType.in : [],
      categoryIds: Array.isArray(where.categoryId?.in) ? where.categoryId.in : [],
      hasDeliveries: undefined,
    };
  });

  const handleApply = useCallback(() => {
    const where: any = {
      ppeType: { not: null }, // Always filter for PPE items
    };

    // Add PPE type filter
    if (localFilters.ppeTypes && localFilters.ppeTypes.length > 0) {
      where.ppeType = { in: localFilters.ppeTypes };
    }

    // Add category filter
    if (localFilters.categoryIds && localFilters.categoryIds.length > 0) {
      where.categoryId = { in: localFilters.categoryIds };
    }

    // Add deliveries filter
    if (localFilters.hasDeliveries !== undefined) {
      where.ppeDeliveries = {
        some: {},
      };
    }

    const newFilters: Partial<ItemGetManyFormData> = {
      ...filters,
      where,
    };

    onFiltersChange(newFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, filters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({
      ppeTypes: [],
      categoryIds: [],
      hasDeliveries: undefined,
    });
    onClear();
  }, [onClear]);

  const ppeTypeOptions = useMemo(
    () =>
      Object.values(PPE_TYPE).map((type) => ({
        value: type,
        label: PPE_TYPE_LABELS[type as keyof typeof PPE_TYPE_LABELS],
      })),
    []
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories]
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
          <ThemedText style={styles.title}>Filtros de EPIs</ThemedText>
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
        {/* PPE Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShield size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de EPI
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Tipos
            </ThemedText>
            <Combobox
              options={ppeTypeOptions}
              selectedValues={localFilters.ppeTypes || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, ppeTypes: values }))}
              placeholder="Todos os tipos"
              searchPlaceholder="Buscar tipos..."
              emptyText="Nenhum tipo encontrado"
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCategory size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Categoria
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Categorias
            </ThemedText>
            <Combobox
              options={categoryOptions}
              selectedValues={localFilters.categoryIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, categoryIds: values }))}
              placeholder="Todas as categorias"
              searchPlaceholder="Buscar categorias..."
              emptyText="Nenhuma categoria encontrada"
            />
          </View>
        </View>

        {/* Deliveries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShield size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Entregas
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasDeliveries: prev.hasDeliveries ? undefined : true }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Com entregas ativas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas EPIs com entregas registradas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasDeliveries || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasDeliveries: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasDeliveries ? colors.primaryForeground : "#f4f3f4"}
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
