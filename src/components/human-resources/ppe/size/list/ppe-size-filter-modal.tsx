import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useUsers } from '../../../../../hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import type { PpeSizeGetManyFormData } from '../../../../../schemas';

interface PpeSizeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<PpeSizeGetManyFormData>) => void;
  currentFilters: Partial<PpeSizeGetManyFormData>;
}

interface FilterState {
  // Employee filters
  userIds?: string[];

  // Completeness filters
  hasAllSizes?: boolean;
  missingShirts?: boolean;
  missingPants?: boolean;
  missingBoots?: boolean;
}

export function PpeSizeFilterModal({ visible, onClose, onApply, currentFilters }: PpeSizeFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["employees", "completeness"]));

  // Load filter options
  const { data: usersData } = useUsers({
    limit: 100,
    orderBy: { name: "asc" },
    where: { status: "ACTIVE" }
  });

  const users = usersData?.data || [];

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.userIds?.length) count++;
    if (filters.hasAllSizes !== undefined) count++;
    if (filters.missingShirts) count++;
    if (filters.missingPants) count++;
    if (filters.missingBoots) count++;

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

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    // Clean undefined values
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) return acc;
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    onApply(cleanFilters);
  };

  const handleClear = () => {
    setFilters({});
  };

  const renderSection = (key: string, title: string, children: React.ReactNode) => {
    const isExpanded = expandedSections.has(key);

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={{
            ...styles.sectionHeader,
            backgroundColor: colors.background,
          }}
          onPress={() => toggleSection(key)}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {isExpanded ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
        </TouchableOpacity>
        {isExpanded && <View style={styles.sectionContent}>{children}</View>}
      </View>
    );
  };

  const renderSwitchOption = (key: keyof FilterState, label: string, value?: boolean) => (
    <View style={styles.switchOption}>
      <Label style={styles.optionLabel}>{label}</Label>
      <Switch checked={!!value} onCheckedChange={(newValue) => handleToggle(key, newValue)} />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={StyleSheet.flatten([styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }])}>
        <View
          style={StyleSheet.flatten([
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ])}
        >
          {/* Header */}
          <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.border }])}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.title}>Filtros</ThemedText>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" size="sm" style={styles.filterBadge}>
                  {activeFilterCount.toString()}
                </Badge>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconX size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Employee Filters */}
            {renderSection(
              "employees",
              "Funcionários",
              <View style={styles.entityContainer}>
                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Funcionários</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={users.map((user) => ({
                        label: `${user.name}${user.cpf ? ` - ${user.cpf}` : ''}`,
                        value: user.id
                      }))}
                      selectedValues={filters.userIds || []}
                      onValueChange={(value) => handleArrayChange("userIds", value)}
                      placeholder={users.length === 0 ? "Carregando funcionários..." : "Selecione os funcionários"}
                      showBadges={false}
                      disabled={users.length === 0}
                    />
                  </View>
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Completeness Filters */}
            {renderSection(
              "completeness",
              "Status de Completude",
              <View style={styles.optionList}>
                {renderSwitchOption("hasAllSizes", "Todos os tamanhos cadastrados", filters.hasAllSizes)}
                {renderSwitchOption("missingShirts", "Faltando tamanho de camisa", filters.missingShirts)}
                {renderSwitchOption("missingPants", "Faltando tamanho de calça", filters.missingPants)}
                {renderSwitchOption("missingBoots", "Faltando tamanho de calçado", filters.missingBoots)}
              </View>,
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={StyleSheet.flatten([
              styles.footer,
              {
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ])}
          >
            <Button variant="outline" size="default" onPress={handleClear} style={styles.footerButton} disabled={activeFilterCount === 0}>
              {activeFilterCount > 0 ? `Limpar (${activeFilterCount})` : "Limpar"}
            </Button>
            <Button variant="default" size="default" onPress={handleApply} style={styles.footerButton}>
              Aplicar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.5,
    flexShrink: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  filterBadge: {
    minWidth: 24,
  },
  closeButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  section: {
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  optionList: {
    gap: spacing.md,
  },
  switchOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  optionLabel: {
    fontSize: fontSize.base,
    flex: 1,
  },
  entityContainer: {
    gap: spacing.lg,
  },
  entitySection: {
    gap: spacing.sm,
  },
  entityLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  comboboxContainer: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  separator: {
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
  },
});
