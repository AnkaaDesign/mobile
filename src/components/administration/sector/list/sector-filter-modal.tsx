import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { SECTOR_PRIVILEGES, SECTOR_PRIVILEGES_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import type { SectorGetManyFormData } from '../../../../types';

interface SectorFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<SectorGetManyFormData>) => void;
  currentFilters: Partial<SectorGetManyFormData>;
}

interface FilterState {
  // Privilege filter
  privileges?: string[];

  // Boolean filters
  hasUsers?: boolean;

  // Date filters
  createdDateRange?: { start?: Date; end?: Date };
  updatedDateRange?: { start?: Date; end?: Date };
}

export function SectorFilterModal({ visible, onClose, onApply, currentFilters }: SectorFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["privileges"]));

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.privileges?.length) count++;
    if (filters.hasUsers !== undefined) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) count++;

    return count;
  }, [filters]);

  // Filter handlers
  const handleArrayChange = (key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  };

  const handleToggle = (key: keyof FilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleDateRangeChange = (key: keyof FilterState, field: "start" | "end", value: Date | undefined) => {
    setFilters((prev) => {
      const currentRange = (prev[key] as { start?: Date; end?: Date }) || {};
      const newRange = {
        ...currentRange,
        [field]: value,
      };
      // Remove if both are undefined
      if (!newRange.start && !newRange.end) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: newRange,
      };
    });
  };

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

  const handleClear = () => {
    setFilters({});
  };

  const handleApply = () => {
    // Convert to API format
    const apiFilters: Partial<SectorGetManyFormData> = {};

    if (filters.privileges?.length) {
      apiFilters.where = {
        ...apiFilters.where,
        privileges: { in: filters.privileges as any[] },
      };
    }

    if (filters.hasUsers !== undefined) {
      apiFilters.hasUsers = filters.hasUsers;
    }

    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      apiFilters.createdAt = {
        ...(filters.createdDateRange.start && { gte: filters.createdDateRange.start }),
        ...(filters.createdDateRange.end && { lte: filters.createdDateRange.end }),
      };
    }

    if (filters.updatedDateRange?.start || filters.updatedDateRange?.end) {
      apiFilters.updatedAt = {
        ...(filters.updatedDateRange.start && { gte: filters.updatedDateRange.start }),
        ...(filters.updatedDateRange.end && { lte: filters.updatedDateRange.end }),
      };
    }

    onApply(apiFilters);
  };

  // Prepare privilege options
  const privilegeOptions = Object.values(SECTOR_PRIVILEGES).map((value) => ({
    label: SECTOR_PRIVILEGES_LABELS[value],
    value: value,
  }));

  const renderSectionHeader = (title: string, sectionKey: string, count?: number) => {
    const isExpanded = expandedSections.has(sectionKey);
    return (
      <TouchableOpacity
        onPress={() => toggleSection(sectionKey)}
        style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderContent}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {count !== undefined && count > 0 && (
            <Badge variant="destructive" size="sm">
              <ThemedText style={styles.badgeText}>{count}</ThemedText>
            </Badge>
          )}
        </View>
        {isExpanded ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.title}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="destructive">
                <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Privilege Section */}
          {renderSectionHeader("Nível de Privilégio", "privileges", filters.privileges?.length)}
          {expandedSections.has("privileges") && (
            <View style={styles.section}>
              <Label>Níveis de Privilégio</Label>
              <MultiCombobox
                options={privilegeOptions}
                selectedValues={filters.privileges || []}
                onValueChange={(value) => handleArrayChange("privileges", value)}
                placeholder="Selecione os níveis..."
              />
            </View>
          )}

          <Separator />

          {/* Status Section */}
          {renderSectionHeader("Status", "status", filters.hasUsers !== undefined ? 1 : 0)}
          {expandedSections.has("status") && (
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Label>Apenas com funcionários</Label>
                <Switch checked={filters.hasUsers || false} onCheckedChange={(value) => handleToggle("hasUsers", value)} />
              </View>
            </View>
          )}

          <Separator />

          {/* Date Filters Section */}
          {renderSectionHeader(
            "Datas",
            "dates",
            (filters.createdDateRange?.start || filters.createdDateRange?.end ? 1 : 0) +
              (filters.updatedDateRange?.start || filters.updatedDateRange?.end ? 1 : 0),
          )}
          {expandedSections.has("dates") && (
            <View style={styles.section}>
              <Label>Data de Criação</Label>
              <View style={styles.dateRangeRow}>
                <View style={styles.dateField}>
                  <ThemedText style={styles.dateLabel}>De:</ThemedText>
                  <DatePicker
                    value={filters.createdDateRange?.start}
                    onChange={(date) => handleDateRangeChange("createdDateRange", "start", date)}
                    placeholder="Data inicial"
                  />
                </View>
                <View style={styles.dateField}>
                  <ThemedText style={styles.dateLabel}>Até:</ThemedText>
                  <DatePicker
                    value={filters.createdDateRange?.end}
                    onChange={(date) => handleDateRangeChange("createdDateRange", "end", date)}
                    placeholder="Data final"
                  />
                </View>
              </View>

              <View style={styles.spacer} />

              <Label>Data de Atualização</Label>
              <View style={styles.dateRangeRow}>
                <View style={styles.dateField}>
                  <ThemedText style={styles.dateLabel}>De:</ThemedText>
                  <DatePicker
                    value={filters.updatedDateRange?.start}
                    onChange={(date) => handleDateRangeChange("updatedDateRange", "start", date)}
                    placeholder="Data inicial"
                  />
                </View>
                <View style={styles.dateField}>
                  <ThemedText style={styles.dateLabel}>Até:</ThemedText>
                  <DatePicker
                    value={filters.updatedDateRange?.end}
                    onChange={(date) => handleDateRangeChange("updatedDateRange", "end", date)}
                    placeholder="Data final"
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
          <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
            <ThemedText>Limpar</ThemedText>
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            <ThemedText>Aplicar</ThemedText>
          </Button>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  spacer: {
    height: spacing.md,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
