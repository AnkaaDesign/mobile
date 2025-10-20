import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Switch as RNSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Drawer } from "@/components/ui/drawer";
import { TASK_STATUS, TASK_STATUS_LABELS } from '../../../../constants';

interface TaskFilterDrawerV2Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

interface FilterState {
  status?: string[];
  sortBy?: "createdAt" | "term" | "priority";
  sortOrder?: "asc" | "desc";
}

type SectionKey = "status" | "sort";

interface FilterSection {
  key: SectionKey;
  title: string;
  component: React.ReactNode;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case TASK_STATUS.PENDING:
      return "#eab308"; // yellow
    case TASK_STATUS.IN_PRODUCTION:
      return "#3b82f6"; // blue
    case TASK_STATUS.COMPLETED:
      return "#15803d"; // green
    case TASK_STATUS.CANCELLED:
      return "#737373"; // gray
    case TASK_STATUS.ON_HOLD:
      return "#f97316"; // orange
    default:
      return "#737373";
  }
};

const SectionHeader = React.memo<{
  title: string;
  isExpanded: boolean;
  onPress: () => void;
  colors: any;
}>(({ title, isExpanded, onPress, colors }) => (
  <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    {isExpanded ? (
      <IconChevronDown size={20} color={colors.foreground} />
    ) : (
      <IconChevronRight size={20} color={colors.foreground} />
    )}
  </TouchableOpacity>
));

SectionHeader.displayName = "SectionHeader";

export function TaskFilterDrawerV2({ visible, onClose, onApply, currentFilters }: TaskFilterDrawerV2Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status", "sort"])
  );

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status?.length && filters.status.length !== Object.values(TASK_STATUS).length) count++;
    if (filters.sortBy && filters.sortBy !== "term") count++;
    if (filters.sortOrder && filters.sortOrder !== "asc") count++;
    return count;
  }, [filters]);

  const handleArrayChange = useCallback((key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  }, []);

  const handleValueChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const toggleSection = useCallback((sectionKey: SectionKey) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  const handleApply = useCallback(() => {
    onApply(filters);
    onClose();
  }, [filters, onApply, onClose]);

  const handleClear = useCallback(() => {
    const defaultFilters = {
      status: [TASK_STATUS.PENDING, TASK_STATUS.IN_PRODUCTION, TASK_STATUS.ON_HOLD],
      sortBy: "term" as const,
      sortOrder: "asc" as const,
    };
    setFilters(defaultFilters);
  }, []);

  const sections: FilterSection[] = useMemo(() => [
    {
      key: "status" as const,
      title: "Status",
      component: (
        <View style={styles.sectionContent}>
          {Object.values(TASK_STATUS).map((status) => {
            const statusLabel = TASK_STATUS_LABELS[status];
            if (!statusLabel) return null;
            const isChecked = (filters.status || []).includes(status);

            return (
              <View key={status} style={styles.row}>
                <ThemedText style={[styles.label, { color: getStatusColor(status) }]}>
                  {statusLabel}
                </ThemedText>
                <RNSwitch
                  value={isChecked}
                  onValueChange={(value) => {
                    const currentStatuses = filters.status || [];
                    if (value) {
                      handleArrayChange("status", [...currentStatuses, status]);
                    } else {
                      handleArrayChange("status", currentStatuses.filter((s) => s !== status));
                    }
                  }}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={isChecked ? colors.primaryForeground : "#f4f3f4"}
                  ios_backgroundColor={colors.muted}
                />
              </View>
            );
          })}
        </View>
      ),
    },
    {
      key: "sort" as const,
      title: "Ordenação",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Ordenar por</Label>
            <View style={styles.radioGroup}>
              {[
                { value: "term", label: "Prazo" },
                { value: "createdAt", label: "Data de Criação" },
                { value: "priority", label: "Prioridade" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => handleValueChange("sortBy", option.value)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.radioCircle,
                    { borderColor: colors.border }
                  ]}>
                    {filters.sortBy === option.value && (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <ThemedText style={styles.radioLabel}>{option.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Ordem</Label>
            <View style={styles.radioGroup}>
              {[
                { value: "asc", label: "Crescente" },
                { value: "desc", label: "Decrescente" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => handleValueChange("sortOrder", option.value)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.radioCircle,
                    { borderColor: colors.border }
                  ]}>
                    {filters.sortOrder === option.value && (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <ThemedText style={styles.radioLabel}>{option.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ),
    },
  ], [filters, colors, handleArrayChange, handleValueChange]);

  const renderSection = useCallback(({ item }: { item: FilterSection }) => {
    const isExpanded = expandedSections.has(item.key);

    return (
      <View>
        <SectionHeader
          title={item.title}
          isExpanded={isExpanded}
          onPress={() => toggleSection(item.key)}
          colors={colors}
        />
        {isExpanded && item.component}
        <Separator style={styles.separator} />
      </View>
    );
  }, [expandedSections, toggleSection, colors]);

  const keyExtractor = useCallback((item: FilterSection) => item.key, []);

  return (
    <Drawer
      open={visible}
      onOpenChange={onClose}
      side="right"
      width="90%"
      closeOnBackdropPress={true}
      closeOnSwipe={false}
      style={{ borderTopWidth: 0 }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 8
        }]}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.title}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listWrapper}>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 16)
        }]}>
          <Button
            variant="outline"
            size="default"
            onPress={handleClear}
            style={styles.btn}
            disabled={activeFilterCount === 0}
          >
            {activeFilterCount > 0 ? `Limpar (${activeFilterCount})` : "Limpar"}
          </Button>
          <Button variant="default" size="default" onPress={handleApply} style={styles.btn}>
            Aplicar
          </Button>
        </View>
      </View>
    </Drawer>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderTopWidth: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  listWrapper: {
    flex: 1,
  },
  list: {
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 36,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 16,
  },
  separator: {
    marginVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
  },
});
