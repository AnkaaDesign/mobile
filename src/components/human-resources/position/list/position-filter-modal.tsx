import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useSectors } from '../../../../hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import type { PositionGetManyFormData } from '../../../../schemas';

interface PositionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<PositionGetManyFormData>) => void;
  currentFilters: Partial<PositionGetManyFormData>;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  // Status filters
  bonifiable?: boolean;
  hasUsers?: boolean;

  // Entity filters
  sectorIds?: string[];

  // Range filters
  remunerationRange?: FilterRange;
}

export function PositionFilterModal({ visible, onClose, onApply, currentFilters }: PositionFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

  // Load filter options
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: "asc" } });

  const sectors = sectorsData?.data || [];

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Count each filter type
    if (filters.bonifiable !== undefined) count++;
    if (filters.hasUsers !== undefined) count++;
    if (filters.sectorIds?.length) count++;
    if (filters.remunerationRange?.min !== undefined || filters.remunerationRange?.max !== undefined) count++;

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

  const handleRangeChange = (key: keyof FilterState, field: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as FilterRange) || {}),
        [field]: numValue,
      },
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
    // Clean undefined values and empty objects
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) return acc;
        if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
          const cleanObj = Object.entries(value).reduce((objAcc, [objKey, objValue]) => {
            if (objValue !== undefined && objValue !== null && objValue !== "") {
              objAcc[objKey] = objValue;
            }
            return objAcc;
          }, {} as any);
          if (Object.keys(cleanObj).length > 0) {
            acc[key] = cleanObj;
          }
        } else if (value !== "") {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as any);

    onApply(cleanFilters);
  };

  const handleClear = () => {
    setFilters({});
  };

  const renderSection = (key: string, title: string, children: React.ReactNode, _defaultExpanded = false) => {
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

  const renderRangeInputs = (key: keyof FilterState, label: string, _placeholder: string, suffix?: string) => {
    const range = (filters[key] as FilterRange) || {};

    return (
      <View style={styles.rangeSection}>
        <Label style={styles.rangeLabel}>{label}</Label>
        <View style={styles.rangeInputs}>
          <View style={styles.rangeInputWrapper}>
            <Input
              placeholder={`Mín`}
              value={range.min?.toString() || ""}
              onChangeText={(value) => handleRangeChange(key, "min", value)}
              keyboardType="numeric"
              style={StyleSheet.flatten([styles.rangeInput, suffix && styles.rangeInputWithSuffix])}
            />
            {suffix && (
              <View style={styles.inputSuffixContainer}>
                <ThemedText style={StyleSheet.flatten([styles.inputSuffix, { color: colors.mutedForeground }])}>{suffix}</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={StyleSheet.flatten([styles.rangeTo, { color: colors.mutedForeground }])}>até</ThemedText>
          <View style={styles.rangeInputWrapper}>
            <Input
              placeholder={`Máx`}
              value={range.max?.toString() || ""}
              onChangeText={(value) => handleRangeChange(key, "max", value)}
              keyboardType="numeric"
              style={StyleSheet.flatten([styles.rangeInput, suffix && styles.rangeInputWithSuffix])}
            />
            {suffix && (
              <View style={styles.inputSuffixContainer}>
                <ThemedText style={StyleSheet.flatten([styles.inputSuffix, { color: colors.mutedForeground }])}>{suffix}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

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
            {/* Status Filters */}
            {renderSection(
              "status",
              "Características",
              <View style={styles.optionList}>
                {renderSwitchOption("bonifiable", "Apenas bonificáveis", filters.bonifiable)}
                {renderSwitchOption("hasUsers", "Apenas com usuários", filters.hasUsers)}
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Sector Filters */}
            {renderSection(
              "sectors",
              "Setores",
              <View style={styles.entityContainer}>
                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Setores</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={sectors.map((sector) => ({ label: sector.name, value: sector.id }))}
                      selectedValues={filters.sectorIds || []}
                      onValueChange={(value) => handleArrayChange("sectorIds", value)}
                      placeholder={sectors.length === 0 ? "Carregando setores..." : "Selecione os setores"}
                      showBadges={false}
                      disabled={sectors.length === 0}
                    />
                  </View>
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Range Filters */}
            {renderSection(
              "ranges",
              "Faixas de Valores",
              <View style={styles.rangeContainer}>{renderRangeInputs("remunerationRange", "Remuneração", "valor", "R$")}</View>,
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
    minHeight: screenHeight * 0.72,
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
  rangeContainer: {
    gap: spacing.lg,
  },
  rangeSection: {
    marginBottom: spacing.lg,
  },
  rangeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rangeInputWrapper: {
    flex: 1,
    position: "relative" as const,
  },
  rangeInput: {
    flex: 1,
  },
  rangeInputWithSuffix: {
    paddingRight: 35,
  },
  rangeTo: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.xs,
  },
  inputSuffixContainer: {
    position: "absolute" as const,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center" as const,
    paddingRight: spacing.md,
  },
  inputSuffix: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
