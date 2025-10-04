import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useUsers } from '../../../../hooks';
import { WARNING_CATEGORY, WARNING_SEVERITY, WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import type { WarningGetManyFormData } from '../../../../schemas';

interface WarningFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<WarningGetManyFormData>) => void;
  currentFilters: Partial<WarningGetManyFormData>;
}

interface FilterState {
  // Status filters
  isActive?: boolean;

  // Entity filters
  collaboratorIds?: string[];
  supervisorIds?: string[];
  categories?: string[];
  severities?: string[];

  // Date filters
  createdDateRange?: { start?: Date; end?: Date };
  followUpDateRange?: { start?: Date; end?: Date };
}

export function WarningFilterModal({ visible, onClose, onApply, currentFilters }: WarningFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status", "entities"]));

  // Load filter options
  const { data: usersData } = useUsers({ limit: 100, orderBy: { name: "asc" } });
  const users = usersData?.data || [];

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Count each filter type
    if (filters.isActive === false) count++;
    if (filters.collaboratorIds?.length) count++;
    if (filters.supervisorIds?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.severities?.length) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.followUpDateRange?.start || filters.followUpDateRange?.end) count++;

    return count;
  }, [filters]);

  // Filter handlers
  const handleToggle = (key: keyof FilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "isActive" ? value : value || undefined,
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
    if (filters.followUpDateRange?.start || filters.followUpDateRange?.end) {
      cleanFilters.followUpDate = {
        ...(filters.followUpDateRange.start && { gte: filters.followUpDateRange.start }),
        ...(filters.followUpDateRange.end && { lte: filters.followUpDateRange.end }),
      };
      delete cleanFilters.followUpDateRange;
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

  const renderDateRange = (startKey: "start" | "end", rangeKey: "createdDateRange" | "followUpDateRange") => {
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
              <View style={styles.optionList}>{renderSwitchOption("isActive", "Incluir apenas advertências ativas", filters.isActive !== false)}</View>,
            )}

            <Separator style={styles.separator} />

            {/* Category Filters */}
            {renderSection(
              "categories",
              "Categorias",
              <View style={styles.entityContainer}>
                <View style={styles.comboboxContainer}>
                  <MultiCombobox
                    options={Object.values(WARNING_CATEGORY).map((category) => ({
                      label: WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS] || category,
                      value: category,
                    }))}
                    selectedValues={filters.categories || []}
                    onValueChange={(value) => handleArrayChange("categories", value)}
                    placeholder="Selecione as categorias"
                    showBadges={false}
                  />
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Severity Filters */}
            {renderSection(
              "severities",
              "Gravidades",
              <View style={styles.entityContainer}>
                <View style={styles.comboboxContainer}>
                  <MultiCombobox
                    options={Object.values(WARNING_SEVERITY).map((severity) => ({
                      label: WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity,
                      value: severity,
                    }))}
                    selectedValues={filters.severities || []}
                    onValueChange={(value) => handleArrayChange("severities", value)}
                    placeholder="Selecione as gravidades"
                    showBadges={false}
                  />
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* User Filters */}
            {renderSection(
              "entities",
              "Colaboradores e Supervisores",
              <View style={styles.entityContainer}>
                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Colaboradores</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={users.map((user) => ({ label: user.name, value: user.id }))}
                      selectedValues={filters.collaboratorIds || []}
                      onValueChange={(value) => handleArrayChange("collaboratorIds", value)}
                      placeholder={users.length === 0 ? "Carregando colaboradores..." : "Selecione os colaboradores"}
                      showBadges={false}
                      disabled={users.length === 0}
                    />
                  </View>
                </View>

                <View style={styles.entitySection}>
                  <Label style={styles.entityLabel}>Supervisores</Label>
                  <View style={styles.comboboxContainer}>
                    <MultiCombobox
                      options={users.map((user) => ({ label: user.name, value: user.id }))}
                      selectedValues={filters.supervisorIds || []}
                      onValueChange={(value) => handleArrayChange("supervisorIds", value)}
                      placeholder={users.length === 0 ? "Carregando supervisores..." : "Selecione os supervisores"}
                      showBadges={false}
                      disabled={users.length === 0}
                    />
                  </View>
                </View>
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Date Filters */}
            {renderSection(
              "dates",
              "Datas",
              <View style={styles.dateContainer}>
                <View style={styles.dateRangeSection}>
                  <ThemedText style={styles.dateRangeLabel}>Data de Emissão</ThemedText>
                  <View style={styles.dateRow}>
                    {renderDateRange("start", "createdDateRange")}
                    {renderDateRange("end", "createdDateRange")}
                  </View>
                </View>

                <View style={styles.dateRangeSection}>
                  <ThemedText style={styles.dateRangeLabel}>Data de Acompanhamento</ThemedText>
                  <View style={styles.dateRow}>
                    {renderDateRange("start", "followUpDateRange")}
                    {renderDateRange("end", "followUpDateRange")}
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
    minHeight: 48,
  },
});
