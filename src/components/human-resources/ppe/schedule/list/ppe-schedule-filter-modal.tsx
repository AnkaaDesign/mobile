// apps/mobile/src/components/human-resources/ppe/schedule/list/ppe-schedule-filter-modal.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useUsers, useItems, useItemCategories } from '../../../../../hooks';
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS } from '../../../../../constants';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import type { PpeDeliveryScheduleGetManyFormData } from '../../../../../schemas';

interface PpeScheduleFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<PpeDeliveryScheduleGetManyFormData>) => void;
  currentFilters: Partial<PpeDeliveryScheduleGetManyFormData>;
}

interface FilterState {
  userIds?: string[];
  itemIds?: string[];
  categoryIds?: string[];
  frequencies?: string[];
  isActive?: boolean;
  overdueOnly?: boolean;
}

export function PpeScheduleFilterModal({ visible, onClose, onApply, currentFilters }: PpeScheduleFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

  // Load filter options
  const { data: usersData } = useUsers({
    limit: 100,
    orderBy: { name: "asc" },
    where: { status: "ACTIVE" }
  });
  const { data: itemsData } = useItems({
    limit: 100,
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      category: { type: "EPI" }
    },
  });
  const { data: categoriesData } = useItemCategories({
    limit: 100,
    orderBy: { name: "asc" },
    where: { type: "EPI" },
  });

  const users = usersData?.data || [];
  const items = itemsData?.data || [];
  const categories = categoriesData?.data || [];

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.userIds?.length) count++;
    if (filters.itemIds?.length) count++;
    if (filters.categoryIds?.length) count++;
    if (filters.frequencies?.length) count++;
    if (filters.isActive !== undefined) count++;
    if (filters.overdueOnly) count++;
    return count;
  }, [filters]);

  // Filter handlers
  const handleToggle = (key: keyof FilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleArrayChange = (key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setFilters({});
  };

  const handleApply = () => {
    // Build query filters
    const queryFilters: Partial<PpeDeliveryScheduleGetManyFormData> = {};

    if (filters.userIds?.length) {
      queryFilters.userIds = filters.userIds;
    }

    if (filters.itemIds?.length) {
      queryFilters.itemIds = filters.itemIds;
    }

    if (filters.categoryIds?.length) {
      queryFilters.categoryIds = filters.categoryIds;
    }

    if (filters.frequencies?.length) {
      queryFilters.frequencies = filters.frequencies as any;
    }

    if (filters.isActive !== undefined) {
      queryFilters.isActive = filters.isActive;
    }

    // Handle overdue filter - schedules with nextRun in the past
    if (filters.overdueOnly) {
      queryFilters.where = {
        ...queryFilters.where,
        nextRun: {
          lt: new Date(),
        },
        isActive: true,
      };
    }

    onApply(queryFilters);
    onClose();
  };

  // Frequency options
  const frequencyOptions = Object.entries(SCHEDULE_FREQUENCY).map(([key, value]) => ({
    value,
    label: SCHEDULE_FREQUENCY_LABELS[value as keyof typeof SCHEDULE_FREQUENCY_LABELS],
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom || 16 }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.title}>Filtrar Agendamentos</ThemedText>
              {activeFilterCount > 0 && (
                <Badge variant="default" style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
                </Badge>
              )}
            </View>
            <Button variant="ghost" size="icon" onPress={onClose}>
              <IconX size={24} color={colors.foreground} />
            </Button>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Status Section */}
            <View style={styles.section}>
              <Button
                variant="ghost"
                onPress={() => toggleSection("status")}
                style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
              >
                <ThemedText style={styles.sectionTitle}>Status</ThemedText>
                {expandedSections.has("status") ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </Button>

              {expandedSections.has("status") && (
                <View style={styles.sectionContent}>
                  <View style={styles.switchRow}>
                    <Label>Apenas Ativos</Label>
                    <Switch checked={filters.isActive === true} onCheckedChange={(value) => handleToggle("isActive", value)} />
                  </View>

                  <View style={styles.switchRow}>
                    <Label>Apenas Atrasados</Label>
                    <Switch checked={filters.overdueOnly === true} onCheckedChange={(value) => handleToggle("overdueOnly", value)} />
                  </View>
                </View>
              )}
            </View>

            <Separator />

            {/* Employee Section */}
            <View style={styles.section}>
              <Button
                variant="ghost"
                onPress={() => toggleSection("employees")}
                style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
              >
                <View style={styles.sectionTitleContainer}>
                  <ThemedText style={styles.sectionTitle}>Funcionários</ThemedText>
                  {filters.userIds && filters.userIds.length > 0 && (
                    <Badge variant="secondary" size="sm">
                      <ThemedText style={styles.countBadgeText}>{filters.userIds.length}</ThemedText>
                    </Badge>
                  )}
                </View>
                {expandedSections.has("employees") ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </Button>

              {expandedSections.has("employees") && (
                <View style={styles.sectionContent}>
                  <MultiCombobox
                    options={users.map((user) => ({ value: user.id, label: user.name }))}
                    value={filters.userIds || []}
                    onChange={(value) => handleArrayChange("userIds", value)}
                    placeholder="Selecionar funcionários..."
                    searchPlaceholder="Buscar funcionário..."
                  />
                </View>
              )}
            </View>

            <Separator />

            {/* PPE Items Section */}
            <View style={styles.section}>
              <Button
                variant="ghost"
                onPress={() => toggleSection("items")}
                style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
              >
                <View style={styles.sectionTitleContainer}>
                  <ThemedText style={styles.sectionTitle}>Itens de EPI</ThemedText>
                  {filters.itemIds && filters.itemIds.length > 0 && (
                    <Badge variant="secondary" size="sm">
                      <ThemedText style={styles.countBadgeText}>{filters.itemIds.length}</ThemedText>
                    </Badge>
                  )}
                </View>
                {expandedSections.has("items") ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </Button>

              {expandedSections.has("items") && (
                <View style={styles.sectionContent}>
                  <MultiCombobox
                    options={items.map((item) => ({ value: item.id, label: item.name }))}
                    value={filters.itemIds || []}
                    onChange={(value) => handleArrayChange("itemIds", value)}
                    placeholder="Selecionar itens..."
                    searchPlaceholder="Buscar item..."
                  />
                </View>
              )}
            </View>

            <Separator />

            {/* Categories Section */}
            <View style={styles.section}>
              <Button
                variant="ghost"
                onPress={() => toggleSection("categories")}
                style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
              >
                <View style={styles.sectionTitleContainer}>
                  <ThemedText style={styles.sectionTitle}>Categorias</ThemedText>
                  {filters.categoryIds && filters.categoryIds.length > 0 && (
                    <Badge variant="secondary" size="sm">
                      <ThemedText style={styles.countBadgeText}>{filters.categoryIds.length}</ThemedText>
                    </Badge>
                  )}
                </View>
                {expandedSections.has("categories") ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </Button>

              {expandedSections.has("categories") && (
                <View style={styles.sectionContent}>
                  <MultiCombobox
                    options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                    value={filters.categoryIds || []}
                    onChange={(value) => handleArrayChange("categoryIds", value)}
                    placeholder="Selecionar categorias..."
                    searchPlaceholder="Buscar categoria..."
                  />
                </View>
              )}
            </View>

            <Separator />

            {/* Frequency Section */}
            <View style={styles.section}>
              <Button
                variant="ghost"
                onPress={() => toggleSection("frequency")}
                style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
              >
                <View style={styles.sectionTitleContainer}>
                  <ThemedText style={styles.sectionTitle}>Frequência</ThemedText>
                  {filters.frequencies && filters.frequencies.length > 0 && (
                    <Badge variant="secondary" size="sm">
                      <ThemedText style={styles.countBadgeText}>{filters.frequencies.length}</ThemedText>
                    </Badge>
                  )}
                </View>
                {expandedSections.has("frequency") ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
              </Button>

              {expandedSections.has("frequency") && (
                <View style={styles.sectionContent}>
                  <MultiCombobox
                    options={frequencyOptions}
                    value={filters.frequencies || []}
                    onChange={(value) => handleArrayChange("frequencies", value)}
                    placeholder="Selecionar frequências..."
                    searchPlaceholder="Buscar frequência..."
                  />
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button variant="outline" onPress={handleClearAll} style={styles.footerButton}>
              <ThemedText>Limpar Tudo</ThemedText>
            </Button>
            <Button onPress={handleApply} style={styles.footerButton}>
              <ThemedText style={{ color: colors.primaryForeground }}>Aplicar Filtros</ThemedText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  countBadgeText: {
    fontSize: fontSize.xs,
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
