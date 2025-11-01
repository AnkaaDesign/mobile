import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useItemBrands, useItemCategories, useSuppliers } from '../../../../hooks';
import {
  MEASURE_UNIT,
  MEASURE_TYPE,
  STOCK_LEVEL,
  STOCK_LEVEL_LABELS,
  MEASURE_UNIT_LABELS,
  MEASURE_TYPE_LABELS,
  ITEM_CATEGORY_TYPE,
  ITEM_CATEGORY_TYPE_LABELS,
} from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import type { ItemGetManyFormData } from '../../../../schemas';

interface ItemFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ItemGetManyFormData>) => void;
  currentFilters: Partial<ItemGetManyFormData>;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  // Status filters
  isActive?: boolean;
  shouldAssignToUser?: boolean;

  // Stock status filters - now using stock levels
  stockLevels?: string[];

  // Entity filters
  brandIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];

  // Range filters
  quantityRange?: FilterRange;
  totalPriceRange?: FilterRange;
  icmsRange?: FilterRange;
  ipiRange?: FilterRange;
  monthlyConsumptionRange?: FilterRange;
  measureValueRange?: FilterRange;

  // Measure filters
  measureUnits?: string[];
  measureTypes?: string[];

  // Date filters
  createdDateRange?: { start?: Date; end?: Date };
  updatedDateRange?: { start?: Date; end?: Date };
}

// Helper function to get stock level colors (matching web version)
const getStockLevelColor = (level: string, colors: any) => {
  switch (level) {
    case STOCK_LEVEL.NEGATIVE_STOCK:
      return "#737373"; // neutral-500
    case STOCK_LEVEL.OUT_OF_STOCK:
      return "#ef4444"; // red-500
    case STOCK_LEVEL.CRITICAL:
      return "#f97316"; // orange-500
    case STOCK_LEVEL.LOW:
      return "#eab308"; // yellow-500
    case STOCK_LEVEL.OPTIMAL:
      return "#22c55e"; // green-500
    case STOCK_LEVEL.OVERSTOCKED:
      return "#8b5cf6"; // violet-500
    default:
      return colors.foreground;
  }
};

export function ItemFilterModal({ visible, onClose, onApply, currentFilters }: ItemFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status", "entities"]));

  // Load filter options
  const { data: brandsData } = useItemBrands({ limit: 100, orderBy: { name: "asc" } });
  const { data: categoriesData } = useItemCategories({ limit: 100, orderBy: { name: "asc" } });
  const { data: suppliersData } = useSuppliers({ limit: 100, orderBy: { fantasyName: "asc" } });

  const brands = brandsData?.data || [];
  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Count each filter type
    if (filters.isActive === false) count++;
    if (filters.shouldAssignToUser) count++;
    if (filters.stockLevels?.length) count++;
    if (filters.brandIds?.length) count++;
    if (filters.categoryIds?.length) count++;
    if (filters.supplierIds?.length) count++;
    if (filters.quantityRange?.min !== undefined || filters.quantityRange?.max !== undefined) count++;
    if (filters.totalPriceRange?.min !== undefined || filters.totalPriceRange?.max !== undefined) count++;
    if (filters.icmsRange?.min !== undefined || filters.icmsRange?.max !== undefined) count++;
    if (filters.ipiRange?.min !== undefined || filters.ipiRange?.max !== undefined) count++;
    if (filters.monthlyConsumptionRange?.min !== undefined || filters.monthlyConsumptionRange?.max !== undefined) count++;
    if (filters.measureValueRange?.min !== undefined || filters.measureValueRange?.max !== undefined) count++;
    if (filters.measureUnits?.length) count++;
    if (filters.measureTypes?.length) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) count++;

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

    // Transform date ranges to API format
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      cleanFilters.createdAt = {
        ...(filters.createdDateRange.start && { gte: filters.createdDateRange.start }),
        ...(filters.createdDateRange.end && { lte: filters.createdDateRange.end }),
      };
      delete cleanFilters.createdDateRange;
    }
    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) {
      cleanFilters.updatedAt = {
        ...(filters.updatedDateRange.start && { gte: filters.updatedDateRange.start }),
        ...(filters.updatedDateRange.end && { lte: filters.updatedDateRange.end }),
      };
      delete cleanFilters.updatedDateRange;
    }

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

  const renderDateRange = (startKey: "start" | "end", rangeKey: "createdDateRange" | "updatedDateRange") => {
    const range = filters[rangeKey] || {};

    return (
      <View style={styles.dateInputWrapper}>
        <DatePicker
          value={range[startKey as keyof typeof range]}
          onChange={(date) => {
            setFilters((prev) => ({
              ...prev,
              [rangeKey]: {
                ...prev[rangeKey],
                [startKey]: date,
              },
            }));
          }}
          label={startKey === "start" ? "Data inicial" : "Data final"}
        />
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
              "Status e Características",
              <View style={styles.optionList}>
                {renderSwitchOption("isActive", "Incluir apenas produtos ativos", filters.isActive !== false)}
                {renderSwitchOption("shouldAssignToUser", "Atribuir ao usuário", filters.shouldAssignToUser)}
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Stock Status Filters */}
            {renderSection(
              "stock",
              "Nível de Estoque",
              <View style={styles.stockLevelContainer}>
                {Object.values(STOCK_LEVEL).map((level) => {
                  const levelLabel = STOCK_LEVEL_LABELS[level as keyof typeof STOCK_LEVEL_LABELS];
                  if (!levelLabel) return null;

                  return (
                    <View key={level} style={styles.switchOption}>
                      <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: getStockLevelColor(level, colors) }])}>{levelLabel}</ThemedText>
                      <Switch
                        checked={(filters.stockLevels || []).includes(level)}
                        onCheckedChange={(value) => {
                          const currentLevels = filters.stockLevels || [];
                          if (value) {
                            handleArrayChange("stockLevels", [...currentLevels, level]);
                          } else {
                            handleArrayChange(
                              "stockLevels",
                              currentLevels.filter((l) => l !== level),
                            );
                          }
                        }}
                      />
                    </View>
                  );
                })}
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Entity Filters */}
            {renderSection(
              "entities",
              "Marcas, Categorias e Fornecedores",
              <View style={styles.entityContainer}>
                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Marcas</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={[{ label: "Sem marca", value: "null" }, ...brands.map((brand) => ({ label: brand.name, value: brand.id }))]}
                      selectedValues={filters.brandIds || []}
                      onValueChange={(value) => handleArrayChange("brandIds", value)}
                      placeholder={brands.length === 0 ? "Carregando marcas..." : "Selecione as marcas"}
                      showBadges={false}
                      disabled={brands.length === 0}
                    />
                  </View>
                </View>

                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Categorias</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={[
                        { label: "Sem categoria", value: "null" },
                        ...categories.map((category) => ({
                          label:
                            category.type === ITEM_CATEGORY_TYPE.PPE
                              ? `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[ITEM_CATEGORY_TYPE.PPE]})`
                              : `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[category.type]})`,
                          value: category.id,
                        })),
                      ]}
                      selectedValues={filters.categoryIds || []}
                      onValueChange={(value) => handleArrayChange("categoryIds", value)}
                      placeholder={categories.length === 0 ? "Carregando categorias..." : "Selecione as categorias"}
                      showBadges={false}
                      disabled={categories.length === 0}
                    />
                  </View>
                </View>

                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Fornecedores</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={[
                        { label: "Sem fornecedor", value: "null" },
                        ...suppliers.map((supplier) => ({
                          label: supplier.fantasyName,
                          value: supplier.id,
                        })),
                      ]}
                      selectedValues={filters.supplierIds || []}
                      onValueChange={(value) => handleArrayChange("supplierIds", value)}
                      placeholder={suppliers.length === 0 ? "Carregando fornecedores..." : "Selecione os fornecedores"}
                      showBadges={false}
                      disabled={suppliers.length === 0}
                    />
                  </View>
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Measure Units */}
            {renderSection(
              "measureUnits",
              "Unidades de Medida",
              <View style={styles.entityContainer}>
                <View style={styles.comboboxContainer}>
                  <MultiCombobox
                    options={Object.values(MEASURE_UNIT).map((unit) => ({
                      label: MEASURE_UNIT_LABELS[unit] || unit,
                      value: unit,
                    }))}
                    selectedValues={filters.measureUnits || []}
                    onValueChange={(value) => handleArrayChange("measureUnits", value)}
                    placeholder="Selecione as unidades de medida"
                    showBadges={false}
                  />
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Measure Types */}
            {renderSection(
              "measureTypes",
              "Tipos de Medida",
              <View style={styles.entityContainer}>
                <View style={styles.comboboxContainer}>
                  <MultiCombobox
                    options={Object.values(MEASURE_TYPE).map((type) => ({
                      label: MEASURE_TYPE_LABELS[type] || type,
                      value: type,
                    }))}
                    selectedValues={filters.measureTypes || []}
                    onValueChange={(value) => handleArrayChange("measureTypes", value)}
                    placeholder="Selecione os tipos de medida"
                    showBadges={false}
                  />
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Range Filters */}
            {renderSection(
              "ranges",
              "Faixas de Valores",
              <View style={styles.rangeContainer}>
                {renderRangeInputs("quantityRange", "Quantidade em Estoque", "quantidade")}
                {renderRangeInputs("totalPriceRange", "Preço Total", "preço", "R$")}
                {renderRangeInputs("icmsRange", "ICMS", "ICMS", "%")}
                {renderRangeInputs("ipiRange", "IPI", "IPI", "%")}
                {renderRangeInputs("monthlyConsumptionRange", "Consumo Mensal", "consumo")}
                {renderRangeInputs("measureValueRange", "Valor de Medida", "medida")}
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Date Filters */}
            {renderSection(
              "dates",
              "Datas",
              <View style={styles.dateContainer}>
                <View style={styles.dateRangeSection}>
                  <ThemedText style={styles.dateRangeLabel}>Data de Criação</ThemedText>
                  <View style={styles.dateRow}>
                    {renderDateRange("start", "createdDateRange")}
                    {renderDateRange("end", "createdDateRange")}
                  </View>
                </View>

                <View style={styles.dateRangeSection}>
                  <ThemedText style={styles.dateRangeLabel}>Data de Atualização</ThemedText>
                  <View style={styles.dateRow}>
                    {renderDateRange("start", "updatedDateRange")}
                    {renderDateRange("end", "updatedDateRange")}
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
    minHeight: 48, // Ensure proper touch target
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
  stockLevelContainer: {
    gap: spacing.md,
  },
  stockLevelLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    flex: 1,
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
  dateContainer: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  dateRangeSection: {
    gap: spacing.md,
  },
  dateRangeLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
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
    minHeight: 48, // Ensure minimum touch target (iOS/Android guidelines)
  },
});
