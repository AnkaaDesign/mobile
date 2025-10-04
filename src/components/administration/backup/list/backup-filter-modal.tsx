import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import type { BackupQueryParams } from '../../../../api-client';

interface BackupFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: BackupQueryParams) => void;
  currentFilters: BackupQueryParams;
}

interface FilterState {
  // Type filter
  type?: "database" | "files" | "full";

  // Status filters
  statuses?: Array<"pending" | "in_progress" | "completed" | "failed">;

  // Date filters
  createdDateRange?: { start?: Date; end?: Date };

  // Boolean filters
  isManual?: boolean;
  isAutomatic?: boolean;
}

const statusOptions = [
  { value: "pending", label: "Pendente", color: "#737373" },
  { value: "in_progress", label: "Em Progresso", color: "#eab308" },
  { value: "completed", label: "Concluído", color: "#22c55e" },
  { value: "failed", label: "Falhou", color: "#ef4444" },
] as const;

const typeOptions = [
  { value: "database", label: "Banco de Dados" },
  { value: "files", label: "Arquivos" },
  { value: "full", label: "Completo" },
] as const;

export function BackupFilterModal({ visible, onClose, onApply, currentFilters }: BackupFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status", "type"]));

  // Reset filters when modal opens
  useEffect(() => {
    if (visible) {
      const initialFilters: FilterState = {
        type: currentFilters.type,
        statuses: currentFilters.status ? [currentFilters.status] : undefined,
      };
      setFilters(initialFilters);
    }
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.statuses?.length) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.isManual) count++;
    if (filters.isAutomatic) count++;
    return count;
  }, [filters]);

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
    const cleanFilters: BackupQueryParams = {};

    if (filters.type) {
      cleanFilters.type = filters.type;
    }

    // For now, we'll just use the first status if multiple are selected
    // The API currently only supports one status at a time
    if (filters.statuses && filters.statuses.length > 0) {
      cleanFilters.status = filters.statuses[0];
    }

    onApply(cleanFilters);
  };

  const handleClear = () => {
    setFilters({});
  };

  const handleTypeSelect = (type: "database" | "files" | "full") => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type === type ? undefined : type,
    }));
  };

  const handleStatusToggle = (status: "pending" | "in_progress" | "completed" | "failed") => {
    setFilters((prev) => {
      const currentStatuses = prev.statuses || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];

      return {
        ...prev,
        statuses: newStatuses.length > 0 ? newStatuses : undefined,
      };
    });
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
          {isExpanded ? (
            <IconChevronUp size={20} color={colors.foreground} />
          ) : (
            <IconChevronDown size={20} color={colors.foreground} />
          )}
        </TouchableOpacity>
        {isExpanded && <View style={styles.sectionContent}>{children}</View>}
      </View>
    );
  };

  const renderDateRange = (startKey: "start" | "end") => {
    const range = filters.createdDateRange || {};

    return (
      <View style={styles.dateInputWrapper}>
        <DatePicker
          value={range[startKey]}
          onChange={(date) => {
            setFilters((prev) => ({
              ...prev,
              createdDateRange: {
                ...prev.createdDateRange,
                [startKey]: date,
              },
            }));
          }}
          label={startKey === "start" ? "Data inicial" : "Data final"}
        />
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
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Status Filters */}
            {renderSection(
              "status",
              "Status do Backup",
              <View style={styles.optionList}>
                {statusOptions.map((option) => (
                  <View key={option.value} style={styles.switchOption}>
                    <View style={styles.statusLabelContainer}>
                      <View style={[styles.statusIndicator, { backgroundColor: option.color }]} />
                      <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                    </View>
                    <Switch
                      checked={(filters.statuses || []).includes(option.value)}
                      onCheckedChange={() => handleStatusToggle(option.value)}
                    />
                  </View>
                ))}
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Type Filters */}
            {renderSection(
              "type",
              "Tipo de Backup",
              <View style={styles.typeContainer}>
                {typeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.typeOption,
                      {
                        borderColor: colors.border,
                        backgroundColor: filters.type === option.value ? colors.primary + "20" : colors.card,
                      },
                    ]}
                    onPress={() => handleTypeSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.typeLabel,
                        {
                          color: filters.type === option.value ? colors.primary : colors.foreground,
                          fontWeight: filters.type === option.value ? fontWeight.semibold : fontWeight.normal,
                        },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>,
            )}

            <Separator style={styles.separator} />

            {/* Date Filters */}
            {renderSection(
              "dates",
              "Data de Criação",
              <View style={styles.dateContainer}>
                <View style={styles.dateRow}>
                  {renderDateRange("start")}
                  {renderDateRange("end")}
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
            <Button
              variant="outline"
              size="default"
              onPress={handleClear}
              style={styles.footerButton}
              disabled={activeFilterCount === 0}
            >
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
    maxHeight: screenHeight * 0.85,
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
  statusLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionLabel: {
    fontSize: fontSize.base,
    flex: 1,
  },
  typeContainer: {
    gap: spacing.sm,
  },
  typeOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
  },
  typeLabel: {
    fontSize: fontSize.base,
    textAlign: "center",
  },
  separator: {
    marginVertical: spacing.sm,
  },
  dateContainer: {
    gap: spacing.md,
    paddingTop: spacing.sm,
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
