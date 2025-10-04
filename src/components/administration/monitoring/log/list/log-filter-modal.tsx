import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";

interface LogFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: LogFilterState) => void;
  currentFilters: LogFilterState;
  availableServices?: string[];
}

export interface LogFilterState {
  levels?: string[];
  sources?: string[];
  dateRange?: { start?: Date; end?: Date };
  hasDetails?: boolean;
  hasStack?: boolean;
}

const LOG_LEVELS = [
  { value: "error", label: "ERROR", color: "#ef4444" },
  { value: "warning", label: "WARN", color: "#f97316" },
  { value: "info", label: "INFO", color: "#3b82f6" },
  { value: "debug", label: "DEBUG", color: "#737373" },
];

export function LogFilterModal({ visible, onClose, onApply, currentFilters, availableServices = [] }: LogFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<LogFilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["levels"]));

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.levels?.length) count++;
    if (filters.sources?.length) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.hasDetails) count++;
    if (filters.hasStack) count++;
    return count;
  }, [filters]);

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

  const handleLevelToggle = (level: string) => {
    setFilters((prev) => {
      const currentLevels = prev.levels || [];
      const newLevels = currentLevels.includes(level) ? currentLevels.filter((l) => l !== level) : [...currentLevels, level];
      return {
        ...prev,
        levels: newLevels.length > 0 ? newLevels : undefined,
      };
    });
  };

  const handleSourceToggle = (source: string) => {
    setFilters((prev) => {
      const currentSources = prev.sources || [];
      const newSources = currentSources.includes(source) ? currentSources.filter((s) => s !== source) : [...currentSources, source];
      return {
        ...prev,
        sources: newSources.length > 0 ? newSources : undefined,
      };
    });
  };

  const handleDateRangeChange = (field: "start" | "end", date: Date | undefined) => {
    setFilters((prev) => {
      const dateRange = prev.dateRange || {};
      const newDateRange = {
        ...dateRange,
        [field]: date,
      };

      // Remove date range if both are undefined
      if (!newDateRange.start && !newDateRange.end) {
        const { dateRange: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        dateRange: newDateRange,
      };
    });
  };

  const handleToggleFilter = (key: keyof LogFilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const renderSection = (title: string, sectionKey: string, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <View style={styles.section}>
        <TouchableOpacity style={[styles.sectionHeader, { borderBottomColor: colors.border }]} onPress={() => toggleSection(sectionKey)} activeOpacity={0.7}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {isExpanded ? <IconChevronUp size={20} color={colors.foreground} /> : <IconChevronDown size={20} color={colors.foreground} />}
        </TouchableOpacity>

        {isExpanded && <View style={styles.sectionContent}>{content}</View>}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <ThemedText style={styles.modalTitle}>Filtros de Logs</ThemedText>
              {activeFilterCount > 0 && (
                <Badge variant="default" style={{ backgroundColor: colors.primary }}>
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{activeFilterCount}</ThemedText>
                </Badge>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <IconX size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Filter Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Log Levels */}
            {renderSection(
              "Níveis de Log",
              "levels",
              <View style={styles.levelGrid}>
                {LOG_LEVELS.map((level) => {
                  const isSelected = filters.levels?.includes(level.value);
                  return (
                    <TouchableOpacity
                      key={level.value}
                      style={[styles.levelButton, { backgroundColor: isSelected ? level.color : colors.muted, borderColor: level.color, borderWidth: isSelected ? 2 : 0 }]}
                      onPress={() => handleLevelToggle(level.value)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={StyleSheet.flatten([styles.levelButtonText, { color: isSelected ? "white" : colors.foreground }])}>{level.label}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>,
            )}

            <Separator style={{ marginVertical: 8 }} />

            {/* Sources */}
            {availableServices.length > 0 &&
              renderSection(
                "Serviços",
                "sources",
                <View style={styles.sourceList}>
                  {availableServices.map((service) => {
                    const isSelected = filters.sources?.includes(service);
                    return (
                      <TouchableOpacity
                        key={service}
                        style={[styles.sourceItem, { backgroundColor: isSelected ? colors.primary : "transparent", borderColor: colors.border, borderWidth: 1, borderRadius: 8 }]}
                        onPress={() => handleSourceToggle(service)}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={StyleSheet.flatten([styles.sourceItemText, { color: isSelected ? colors.primaryForeground : colors.foreground }])}>{service}</ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>,
              )}

            {availableServices.length > 0 && <Separator style={{ marginVertical: 8 }} />}

            {/* Date Range */}
            {renderSection(
              "Período",
              "dateRange",
              <View style={styles.dateRangeContainer}>
                <View style={styles.datePickerRow}>
                  <Label style={styles.dateLabel}>Data Inicial:</Label>
                  <DatePicker value={filters.dateRange?.start} onChange={(date) => handleDateRangeChange("start", date)} placeholder="Selecione" maximumDate={filters.dateRange?.end || new Date()} />
                </View>

                <View style={styles.datePickerRow}>
                  <Label style={styles.dateLabel}>Data Final:</Label>
                  <DatePicker value={filters.dateRange?.end} onChange={(date) => handleDateRangeChange("end", date)} placeholder="Selecione" minimumDate={filters.dateRange?.start} maximumDate={new Date()} />
                </View>
              </View>,
            )}

            <Separator style={{ marginVertical: 8 }} />

            {/* Additional Filters */}
            {renderSection(
              "Filtros Adicionais",
              "additional",
              <View style={styles.additionalFilters}>
                <View style={styles.switchRow}>
                  <Label>Logs com detalhes</Label>
                  <Switch checked={filters.hasDetails || false} onCheckedChange={(checked) => handleToggleFilter("hasDetails", checked)} />
                </View>

                <View style={styles.switchRow}>
                  <Label>Logs com stack trace</Label>
                  <Switch checked={filters.hasStack || false} onCheckedChange={(checked) => handleToggleFilter("hasStack", checked)} />
                </View>
              </View>,
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
              <ThemedText>Limpar</ThemedText>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingTop: 16,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  levelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sourceList: {
    gap: 8,
  },
  sourceItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sourceItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateRangeContainer: {
    gap: 16,
  },
  datePickerRow: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  additionalFilters: {
    gap: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
