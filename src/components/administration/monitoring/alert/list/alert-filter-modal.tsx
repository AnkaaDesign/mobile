import React, { useState, useEffect, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronUp, IconChevronDown, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { NOTIFICATION_IMPORTANCE, NOTIFICATION_IMPORTANCE_LABELS, ALERT_TYPE, ALERT_TYPE_LABELS } from '../../../../../constants';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";

export interface AlertFilters {
  // Severity filters
  severities?: NOTIFICATION_IMPORTANCE[];

  // Type filters
  types?: ALERT_TYPE[];

  // Status filters
  showAcknowledged?: boolean;
  showResolved?: boolean;
  showUnresolved?: boolean;

  // Source filter
  sources?: string[];

  // Date filters
  dateRange?: { start?: Date; end?: Date };
}

interface AlertFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: AlertFilters) => void;
  currentFilters: AlertFilters;
}

const getSeverityColor = (severity: NOTIFICATION_IMPORTANCE) => {
  switch (severity) {
    case NOTIFICATION_IMPORTANCE.URGENT:
      return "#ef4444"; // red
    case NOTIFICATION_IMPORTANCE.HIGH:
      return "#f59e0b"; // amber
    case NOTIFICATION_IMPORTANCE.NORMAL:
      return "#3b82f6"; // blue
    case NOTIFICATION_IMPORTANCE.LOW:
      return "#6b7280"; // gray
    default:
      return "#6b7280";
  }
};

export function AlertFilterModal({ visible, onClose, onApply, currentFilters }: AlertFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<AlertFilters>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["severity", "status"]));

  // Reset filters when modal opens
  useEffect(() => {
    setFilters(currentFilters || {});
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.severities?.length) count++;
    if (filters.types?.length) count++;
    if (filters.showAcknowledged !== undefined) count++;
    if (filters.showResolved !== undefined) count++;
    if (filters.showUnresolved !== undefined) count++;
    if (filters.sources?.length) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;

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

  const handleToggle = (key: keyof AlertFilters, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleArrayChange = (key: keyof AlertFilters, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  };

  const handleDateRangeChange = (field: "start" | "end", value: Date | undefined) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value,
      },
    }));
  };

  const handleClearAll = () => {
    setFilters({});
  };

  const handleApply = () => {
    onApply(filters);
  };

  const renderSection = (title: string, sectionKey: string, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {isExpanded ? (
            <IconChevronUp size={20} color={colors.foreground} />
          ) : (
            <IconChevronDown size={20} color={colors.foreground} />
          )}
        </TouchableOpacity>

        {isExpanded && <View style={styles.sectionContent}>{content}</View>}
      </View>
    );
  };

  // Prepare severity options
  const severityOptions = Object.values(NOTIFICATION_IMPORTANCE).map((severity) => ({
    value: severity,
    label: NOTIFICATION_IMPORTANCE_LABELS[severity],
  }));

  // Prepare alert type options (grouped by category)
  const alertTypeOptions = Object.values(ALERT_TYPE).map((type) => ({
    value: type,
    label: ALERT_TYPE_LABELS[type] || type,
  }));

  // Common sources
  const sourceOptions = [
    { value: "Sistema", label: "Sistema" },
    { value: "Serviços", label: "Serviços" },
    { value: "Backup", label: "Backup" },
    { value: "Rede", label: "Rede" },
    { value: "Hardware", label: "Hardware" },
    { value: "Estoque", label: "Estoque" },
    { value: "Pedidos", label: "Pedidos" },
    { value: "Tarefas", label: "Tarefas" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Filtros de Alertas</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="default" style={styles.filterBadge}>
                <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Severity Section */}
          {renderSection(
            "Severidade",
            "severity",
            <View style={styles.filterGroup}>
              <MultiCombobox
                options={severityOptions}
                selectedValues={filters.severities || []}
                onValueChange={(values) => handleArrayChange("severities", values)}
                placeholder="Selecionar severidades..."
                renderBadge={(option, _onRemove) => {
                  const severity = option.value as NOTIFICATION_IMPORTANCE;
                  return (
                    <Badge style={{ backgroundColor: getSeverityColor(severity) }}>
                      <ThemedText style={styles.badgeText}>
                        {NOTIFICATION_IMPORTANCE_LABELS[severity]}
                      </ThemedText>
                    </Badge>
                  );
                }}
              />
            </View>
          )}

          {/* Alert Type Section */}
          {renderSection(
            "Tipo de Alerta",
            "type",
            <View style={styles.filterGroup}>
              <MultiCombobox
                options={alertTypeOptions}
                selectedValues={filters.types || []}
                onValueChange={(values) => handleArrayChange("types", values)}
                placeholder="Selecionar tipos..."
              />
            </View>
          )}

          {/* Status Section */}
          {renderSection(
            "Status",
            "status",
            <View style={styles.filterGroup}>
              <View style={styles.switchRow}>
                <Label>Exibir Reconhecidos</Label>
                <Switch
                  checked={filters.showAcknowledged ?? false}
                  onCheckedChange={(value) => handleToggle("showAcknowledged", value)}
                />
              </View>
              <Separator />
              <View style={styles.switchRow}>
                <Label>Exibir Resolvidos</Label>
                <Switch
                  checked={filters.showResolved ?? false}
                  onCheckedChange={(value) => handleToggle("showResolved", value)}
                />
              </View>
              <Separator />
              <View style={styles.switchRow}>
                <Label>Apenas Não Resolvidos</Label>
                <Switch
                  checked={filters.showUnresolved ?? true}
                  onCheckedChange={(value) => handleToggle("showUnresolved", value)}
                />
              </View>
            </View>
          )}

          {/* Source Section */}
          {renderSection(
            "Origem",
            "source",
            <View style={styles.filterGroup}>
              <MultiCombobox
                options={sourceOptions}
                selectedValues={filters.sources || []}
                onValueChange={(values) => handleArrayChange("sources", values)}
                placeholder="Selecionar origens..."
              />
            </View>
          )}

          {/* Date Range Section */}
          {renderSection(
            "Período",
            "dateRange",
            <View style={styles.filterGroup}>
              <View style={styles.dateRangeGroup}>
                <View style={styles.dateField}>
                  <Label>Data Inicial</Label>
                  <DatePicker
                    value={filters.dateRange?.start}
                    onChange={(date) => handleDateRangeChange("start", date)}
                    placeholder="Selecionar data"
                  />
                </View>
                <View style={styles.dateField}>
                  <Label>Data Final</Label>
                  <DatePicker
                    value={filters.dateRange?.end}
                    onChange={(date) => handleDateRangeChange("end", date)}
                    placeholder="Selecionar data"
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
          <Button variant="outline" onPress={handleClearAll} style={styles.footerButton}>
            Limpar Tudo
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            Aplicar Filtros
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  filterBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterGroup: {
    gap: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  dateRangeGroup: {
    gap: 12,
  },
  dateField: {
    gap: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
});
