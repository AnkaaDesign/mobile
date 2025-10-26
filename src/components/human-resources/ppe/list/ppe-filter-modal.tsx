import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Platform, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useItemCategories } from '../../../../hooks';
import { PPE_TYPE, PPE_TYPE_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import type { ItemGetManyFormData } from '../../../../schemas';

interface PpeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ItemGetManyFormData>) => void;
  currentFilters: Partial<ItemGetManyFormData>;
}

interface FilterState {
  // PPE-specific filters
  ppeTypes?: string[];
  categoryIds?: string[];
  hasDeliveries?: boolean;
  hasActiveSchedules?: boolean;
}

export function PpeFilterModal({ visible, onClose, onApply, currentFilters }: PpeFilterModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ppeType: true,
    category: false,
    deliveries: false,
  });

  // Initialize filter state from current filters
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const where = currentFilters.where || {};
    return {
      ppeTypes: Array.isArray(where.ppeType?.in) ? where.ppeType.in : [],
      categoryIds: Array.isArray(where.categoryId?.in) ? where.categoryId.in : [],
      hasDeliveries: undefined,
      hasActiveSchedules: undefined,
    };
  });

  // Load categories for filtering
  const { data: categoriesResponse } = useItemCategories({
    perPage: 100,
    orderBy: { name: "asc" },
  });
  const categories = categoriesResponse?.data || [];

  // PPE type options
  const ppeTypeOptions = useMemo(
    () =>
      Object.values(PPE_TYPE).map((type) => ({
        value: type,
        label: PPE_TYPE_LABELS[type as keyof typeof PPE_TYPE_LABELS],
      })),
    [],
  );

  // Category options
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories],
  );

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle filter changes
  const handlePpeTypeChange = (values: string[]) => {
    setFilterState((prev) => ({ ...prev, ppeTypes: values }));
  };

  const handleCategoryChange = (values: string[]) => {
    setFilterState((prev) => ({ ...prev, categoryIds: values }));
  };

  const handleHasDeliveriesChange = (value: boolean) => {
    setFilterState((prev) => ({ ...prev, hasDeliveries: value || undefined }));
  };

  // Apply filters
  const handleApply = () => {
    const where: any = {
      ppeType: { not: null }, // Always filter for PPE items
    };

    // Add PPE type filter
    if (filterState.ppeTypes && filterState.ppeTypes.length > 0) {
      where.ppeType = { in: filterState.ppeTypes };
    }

    // Add category filter
    if (filterState.categoryIds && filterState.categoryIds.length > 0) {
      where.categoryId = { in: filterState.categoryIds };
    }

    // Add deliveries filter
    if (filterState.hasDeliveries !== undefined) {
      where.ppeDeliveries = {
        some: {},
      };
    }

    onApply({
      ...currentFilters,
      where,
    });
  };

  // Clear all filters
  const handleClear = () => {
    setFilterState({
      ppeTypes: [],
      categoryIds: [],
      hasDeliveries: undefined,
      hasActiveSchedules: undefined,
    });
  };

  // Count active filters
  const activeFiltersCount = [
    filterState.ppeTypes?.length || 0,
    filterState.categoryIds?.length || 0,
    filterState.hasDeliveries ? 1 : 0,
    filterState.hasActiveSchedules ? 1 : 0,
  ].reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 16,
              maxHeight: Dimensions.get("window").height - insets.top - 40,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.headerTitle}>Filtrar EPIs</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconX size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Active filters badge */}
          {activeFiltersCount > 0 && (
            <View style={styles.activeFiltersContainer}>
              <Badge variant="secondary">
                <ThemedText style={styles.activeFiltersText}>{activeFiltersCount} filtro(s) ativo(s)</ThemedText>
              </Badge>
            </View>
          )}

          {/* Filters */}
          <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
            {/* PPE Type Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("ppeType")}>
                <Label style={styles.sectionLabel}>Tipo de EPI</Label>
                {expandedSections.ppeType ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </TouchableOpacity>
              {expandedSections.ppeType && (
                <View style={styles.sectionContent}>
                  <MultiCombobox options={ppeTypeOptions} value={filterState.ppeTypes || []} onChange={handlePpeTypeChange} placeholder="Selecione os tipos..." />
                </View>
              )}
            </View>

            <Separator />

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("category")}>
                <Label style={styles.sectionLabel}>Categoria</Label>
                {expandedSections.category ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </TouchableOpacity>
              {expandedSections.category && (
                <View style={styles.sectionContent}>
                  <MultiCombobox options={categoryOptions} value={filterState.categoryIds || []} onChange={handleCategoryChange} placeholder="Selecione as categorias..." />
                </View>
              )}
            </View>

            <Separator />

            {/* Deliveries Filter */}
            <View style={styles.filterSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("deliveries")}>
                <Label style={styles.sectionLabel}>Entregas</Label>
                {expandedSections.deliveries ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </TouchableOpacity>
              {expandedSections.deliveries && (
                <View style={styles.sectionContent}>
                  <View style={styles.switchRow}>
                    <Label>Com entregas ativas</Label>
                    <Switch checked={filterState.hasDeliveries || false} onCheckedChange={handleHasDeliveriesChange} />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
              <ThemedText>Limpar</ThemedText>
            </Button>
            <Button onPress={handleApply} style={styles.footerButton}>
              <ThemedText style={{ color: colors.primaryForeground }}>Aplicar</ThemedText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  activeFiltersContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  activeFiltersText: {
    fontSize: fontSize.sm,
  },
  filtersContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  filterSection: {
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  sectionContent: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
