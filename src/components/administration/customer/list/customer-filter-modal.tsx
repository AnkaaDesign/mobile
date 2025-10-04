import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BRAZILIAN_STATES, BRAZILIAN_STATES_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import type { CustomerGetManyFormData } from '../../../../schemas';

interface CustomerFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<CustomerGetManyFormData>) => void;
  currentFilters: Partial<CustomerGetManyFormData>;
}

interface FilterState {
  // Location filters
  states?: string[];
  city?: string;

  // Tag filters
  tags?: string[];

  // Date filters
  createdDateRange?: { start?: Date; end?: Date };
  updatedDateRange?: { start?: Date; end?: Date };

  // Document filters
  hasCNPJ?: boolean;
  hasCPF?: boolean;
}

export function CustomerFilterModal({ visible, onClose, onApply, currentFilters }: CustomerFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["location"]));

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.states?.length) count++;
    if (filters.city) count++;
    if (filters.tags?.length) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) count++;
    if (filters.hasCNPJ) count++;
    if (filters.hasCPF) count++;

    return count;
  }, [filters]);

  // Section toggle
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Filter handlers
  const handleArrayChange = (key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  };

  const handleTextChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleDateRangeChange = (key: "createdDateRange" | "updatedDateRange", field: "start" | "end", date?: Date) => {
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: date,
      },
    }));
  };

  // Apply filters
  const handleApply = () => {
    const apiFilters: Partial<CustomerGetManyFormData> = {};

    // Build where clause
    const where: any = {};

    if (filters.states?.length) {
      where.state = { in: filters.states };
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: "insensitive" };
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.hasCNPJ) {
      where.cnpj = { not: null };
    }

    if (filters.hasCPF) {
      where.cpf = { not: null };
    }

    // Date filters
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      where.createdAt = {};
      if (filters.createdDateRange.start) {
        where.createdAt.gte = filters.createdDateRange.start;
      }
      if (filters.createdDateRange.end) {
        where.createdAt.lte = filters.createdDateRange.end;
      }
    }

    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) {
      where.updatedAt = {};
      if (filters.updatedDateRange.start) {
        where.updatedAt.gte = filters.updatedDateRange.start;
      }
      if (filters.updatedDateRange.end) {
        where.updatedAt.lte = filters.updatedDateRange.end;
      }
    }

    if (Object.keys(where).length > 0) {
      apiFilters.where = where;
    }

    onApply(apiFilters);
  };

  // Clear all filters
  const handleClear = () => {
    setFilters({});
    onApply({});
  };

  // State options
  const stateOptions = Object.values(BRAZILIAN_STATES).map((state) => ({
    value: state,
    label: BRAZILIAN_STATES_LABELS[state] || state,
  }));

  // Render section header
  const renderSectionHeader = (title: string, sectionKey: string) => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <TouchableOpacity
        style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {isExpanded ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.headerTitle}>Filtrar Clientes</ThemedText>
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText style={[styles.filterBadgeText, { color: colors.primaryForeground }]}>
                    {activeFilterCount}
                  </ThemedText>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconX size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Filters Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Location Section */}
            {renderSectionHeader("Localização", "location")}
            {expandedSections.has("location") && (
              <View style={styles.sectionContent}>
                <View style={styles.filterGroup}>
                  <Label>Estados</Label>
                  <MultiCombobox
                    value={filters.states || []}
                    onChange={(value) => handleArrayChange("states", value)}
                    options={stateOptions}
                    placeholder="Selecione estados..."
                    searchPlaceholder="Buscar estado..."
                  />
                </View>

                <View style={styles.filterGroup}>
                  <Label>Cidade</Label>
                  <Input
                    value={filters.city || ""}
                    onChangeText={(value) => handleTextChange("city", value)}
                    placeholder="Digite o nome da cidade..."
                  />
                </View>
              </View>
            )}

            <Separator />

            {/* Tags Section */}
            {renderSectionHeader("Tags", "tags")}
            {expandedSections.has("tags") && (
              <View style={styles.sectionContent}>
                <View style={styles.filterGroup}>
                  <Label>Tags</Label>
                  <Input
                    value={filters.tags?.join(", ") || ""}
                    onChangeText={(value) => handleArrayChange("tags", value ? value.split(",").map(t => t.trim()) : [])}
                    placeholder="Digite tags separadas por vírgula..."
                  />
                </View>
              </View>
            )}

            <Separator />

            {/* Date Filters Section */}
            {renderSectionHeader("Datas", "dates")}
            {expandedSections.has("dates") && (
              <View style={styles.sectionContent}>
                <View style={styles.filterGroup}>
                  <Label>Data de Cadastro</Label>
                  <View style={styles.dateRangeContainer}>
                    <View style={styles.dateInput}>
                      <Label>De</Label>
                      <DatePicker
                        value={filters.createdDateRange?.start}
                        onChange={(date) => handleDateRangeChange("createdDateRange", "start", date)}
                        placeholder="Selecione..."
                      />
                    </View>
                    <View style={styles.dateInput}>
                      <Label>Até</Label>
                      <DatePicker
                        value={filters.createdDateRange?.end}
                        onChange={(date) => handleDateRangeChange("createdDateRange", "end", date)}
                        placeholder="Selecione..."
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Label>Data de Atualização</Label>
                  <View style={styles.dateRangeContainer}>
                    <View style={styles.dateInput}>
                      <Label>De</Label>
                      <DatePicker
                        value={filters.updatedDateRange?.start}
                        onChange={(date) => handleDateRangeChange("updatedDateRange", "start", date)}
                        placeholder="Selecione..."
                      />
                    </View>
                    <View style={styles.dateInput}>
                      <Label>Até</Label>
                      <DatePicker
                        value={filters.updatedDateRange?.end}
                        onChange={(date) => handleDateRangeChange("updatedDateRange", "end", date)}
                        placeholder="Selecione..."
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
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
    maxHeight: "90%",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  filterBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  filterBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  filterGroup: {
    gap: spacing.sm,
  },
  dateRangeContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
    gap: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
