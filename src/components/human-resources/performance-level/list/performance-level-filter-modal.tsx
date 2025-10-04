import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { usePositions, useSectors } from '../../../../hooks';
import { USER_STATUS, USER_STATUS_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import type { UserGetManyFormData } from '../../../../schemas';

interface PerformanceLevelFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<UserGetManyFormData>) => void;
  currentFilters: Partial<UserGetManyFormData>;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  // Status filters
  statuses?: string[];

  // Entity filters
  positionIds?: string[];
  sectorIds?: string[];

  // Performance level range
  performanceLevelRange?: FilterRange;

  // Boolean filters
  isActive?: boolean;
}

export function PerformanceLevelFilterModal({ visible, onClose, onApply, currentFilters }: PerformanceLevelFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status", "entities", "performance"]));

  // Load filter options
  const { data: positionsData } = usePositions({ limit: 100, orderBy: { name: "asc" } });
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: "asc" } });

  const positions = positionsData?.data || [];
  const sectors = sectorsData?.data || [];

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.statuses?.length) count++;
    if (filters.positionIds?.length) count++;
    if (filters.sectorIds?.length) count++;
    if (filters.performanceLevelRange?.min !== undefined || filters.performanceLevelRange?.max !== undefined) count++;
    if (filters.isActive === false) count++;

    return count;
  }, [filters]);

  // Filter handlers
  const handleToggle = (key: keyof FilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'isActive' ? value : (value || undefined),
    }));
  };

  const handleArrayChange = (key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  };

  const handleRangeChange = (key: keyof FilterState, field: "min" | "max", value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    // Clamp performance level between 0-5
    const clampedValue = numValue !== undefined ? Math.max(0, Math.min(5, numValue)) : undefined;

    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as FilterRange) || {}),
        [field]: clampedValue,
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

    // Transform performance level range to where clause
    if (filters.performanceLevelRange?.min !== undefined || filters.performanceLevelRange?.max !== undefined) {
      cleanFilters.where = {
        ...(cleanFilters.where || {}),
        performanceLevel: {
          ...(filters.performanceLevelRange.min !== undefined && { gte: filters.performanceLevelRange.min }),
          ...(filters.performanceLevelRange.max !== undefined && { lte: filters.performanceLevelRange.max }),
        },
      };
      delete cleanFilters.performanceLevelRange;
    }

    // Transform status array to where clause
    if (filters.statuses?.length) {
      cleanFilters.where = {
        ...(cleanFilters.where || {}),
        status: { in: filters.statuses },
      };
      delete cleanFilters.statuses;
    }

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

  const renderRangeInputs = (key: keyof FilterState, label: string, minPlaceholder: string, maxPlaceholder: string) => {
    const range = (filters[key] as FilterRange) || {};

    return (
      <View style={styles.rangeSection}>
        <Label style={styles.rangeLabel}>{label}</Label>
        <View style={styles.rangeInputs}>
          <View style={styles.rangeInputWrapper}>
            <Input
              placeholder={minPlaceholder}
              value={range.min?.toString() || ""}
              onChangeText={(value) => handleRangeChange(key, "min", value)}
              keyboardType="number-pad"
              style={styles.rangeInput}
            />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.rangeTo, { color: colors.mutedForeground }])}>até</ThemedText>
          <View style={styles.rangeInputWrapper}>
            <Input
              placeholder={maxPlaceholder}
              value={range.max?.toString() || ""}
              onChangeText={(value) => handleRangeChange(key, "max", value)}
              keyboardType="number-pad"
              style={styles.rangeInput}
            />
          </View>
        </View>
        <ThemedText style={styles.rangeHint}>Valores entre 0 e 5</ThemedText>
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
              "Status",
              <View style={styles.optionList}>
                {renderSwitchOption("isActive", "Incluir apenas funcionários ativos", filters.isActive !== false)}
                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Status do Funcionário</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={Object.values(USER_STATUS).map((status) => ({
                        label: USER_STATUS_LABELS[status as keyof typeof USER_STATUS_LABELS] || status,
                        value: status,
                      }))}
                      selectedValues={filters.statuses || []}
                      onValueChange={(value) => handleArrayChange("statuses", value)}
                      placeholder="Selecione os status"
                      showBadges={false}
                    />
                  </View>
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Performance Level Range */}
            {renderSection(
              "performance",
              "Nível de Performance",
              <View style={styles.performanceContainer}>
                {renderRangeInputs("performanceLevelRange", "Faixa de Nível (0-5)", "Mín", "Máx")}
                <View style={styles.performanceInfo}>
                  <ThemedText style={styles.performanceInfoText}>
                    • 0: Não Avaliado{"\n"}
                    • 1: Ruim{"\n"}
                    • 2: Regular{"\n"}
                    • 3: Bom{"\n"}
                    • 4-5: Excelente
                  </ThemedText>
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Entity Filters */}
            {renderSection(
              "entities",
              "Cargos e Setores",
              <View style={styles.entityContainer}>
                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Cargos</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={positions.map((position) => ({ label: position.name, value: position.id }))}
                      selectedValues={filters.positionIds || []}
                      onValueChange={(value) => handleArrayChange("positionIds", value)}
                      placeholder={positions.length === 0 ? "Carregando cargos..." : "Selecione os cargos"}
                      showBadges={false}
                      disabled={positions.length === 0}
                    />
                  </View>
                </View>

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
    minHeight: screenHeight * 0.6,
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
  performanceContainer: {
    gap: spacing.lg,
  },
  performanceInfo: {
    padding: spacing.md,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  performanceInfoText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: "#1e40af",
  },
  rangeSection: {
    marginBottom: spacing.md,
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
  },
  rangeInput: {
    flex: 1,
  },
  rangeTo: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.xs,
  },
  rangeHint: {
    fontSize: fontSize.xs,
    color: "#6b7280",
    marginTop: spacing.xs,
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
