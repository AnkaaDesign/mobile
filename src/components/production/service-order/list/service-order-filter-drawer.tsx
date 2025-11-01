import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Switch as RNSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Drawer } from "@/components/ui/drawer";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from '../../../../constants';
import type { ServiceOrderGetManyFormData } from '../../../../schemas';

interface ServiceOrderFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ServiceOrderGetManyFormData>) => void;
  currentFilters: Partial<ServiceOrderGetManyFormData>;
}

interface FilterDateRange {
  start?: Date;
  end?: Date;
}

interface FilterState {
  status?: string[];
  createdDateRange?: FilterDateRange;
  startedDateRange?: FilterDateRange;
  finishedDateRange?: FilterDateRange;
}

type SectionKey = "status" | "dates";

interface FilterSection {
  key: SectionKey;
  title: string;
  component: React.ReactNode;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case SERVICE_ORDER_STATUS.PENDING:
      return "#eab308"; // yellow
    case SERVICE_ORDER_STATUS.IN_PROGRESS:
      return "#3b82f6"; // blue
    case SERVICE_ORDER_STATUS.COMPLETED:
      return "#15803d"; // green
    case SERVICE_ORDER_STATUS.CANCELLED:
      return "#737373"; // gray
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

export function ServiceOrderFilterDrawer({ visible, onClose, onApply, currentFilters }: ServiceOrderFilterDrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status"])
  );

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.startedDateRange?.start || filters.startedDateRange?.end) count++;
    if (filters.finishedDateRange?.start || filters.finishedDateRange?.end) count++;
    return count;
  }, [filters]);

  const handleArrayChange = useCallback((key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
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

    // Transform date ranges to the format expected by the API
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      cleanFilters.where = {
        ...cleanFilters.where,
        createdAt: {
          ...(filters.createdDateRange.start && { gte: filters.createdDateRange.start.toISOString() }),
          ...(filters.createdDateRange.end && { lte: filters.createdDateRange.end.toISOString() }),
        },
      };
      delete cleanFilters.createdDateRange;
    }
    if (filters.startedDateRange?.start || filters.startedDateRange?.end) {
      cleanFilters.where = {
        ...cleanFilters.where,
        startedAt: {
          ...(filters.startedDateRange.start && { gte: filters.startedDateRange.start.toISOString() }),
          ...(filters.startedDateRange.end && { lte: filters.startedDateRange.end.toISOString() }),
        },
      };
      delete cleanFilters.startedDateRange;
    }
    if (filters.finishedDateRange?.start || filters.finishedDateRange?.end) {
      cleanFilters.where = {
        ...cleanFilters.where,
        finishedAt: {
          ...(filters.finishedDateRange.start && { gte: filters.finishedDateRange.start.toISOString() }),
          ...(filters.finishedDateRange.end && { lte: filters.finishedDateRange.end.toISOString() }),
        },
      };
      delete cleanFilters.finishedDateRange;
    }

    // Transform status array to where clause
    if (filters.status && filters.status.length > 0) {
      cleanFilters.where = {
        ...cleanFilters.where,
        status: filters.status.length === 1 ? filters.status[0] : { in: filters.status },
      };
      delete cleanFilters.status;
    }

    onApply(cleanFilters);
  }, [filters, onApply]);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  const sections: FilterSection[] = useMemo(() => [
    {
      key: "status" as const,
      title: "Status",
      component: (
        <View style={styles.sectionContent}>
          {Object.values(SERVICE_ORDER_STATUS).map((status) => {
            const statusLabel = SERVICE_ORDER_STATUS_LABELS[status];
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
      key: "dates" as const,
      title: "Datas",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Data de Criação</Label>
            <View style={styles.rangeRow}>
              <Input
                placeholder="Data inicial"
                value={filters.createdDateRange?.start?.toLocaleDateString("pt-BR") || ""}
                onChangeText={() => {}}
                style={styles.rangeInput}
                editable={false}
              />
              <ThemedText style={[styles.rangeText, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Data final"
                value={filters.createdDateRange?.end?.toLocaleDateString("pt-BR") || ""}
                onChangeText={() => {}}
                style={styles.rangeInput}
                editable={false}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Data de Início</Label>
            <View style={styles.rangeRow}>
              <Input
                placeholder="Data inicial"
                value={filters.startedDateRange?.start?.toLocaleDateString("pt-BR") || ""}
                onChangeText={() => {}}
                style={styles.rangeInput}
                editable={false}
              />
              <ThemedText style={[styles.rangeText, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Data final"
                value={filters.startedDateRange?.end?.toLocaleDateString("pt-BR") || ""}
                onChangeText={() => {}}
                style={styles.rangeInput}
                editable={false}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Data de Finalização</Label>
            <View style={styles.rangeRow}>
              <Input
                placeholder="Data inicial"
                value={filters.finishedDateRange?.start?.toLocaleDateString("pt-BR") || ""}
                onChangeText={() => {}}
                style={styles.rangeInput}
                editable={false}
              />
              <ThemedText style={[styles.rangeText, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Data final"
                value={filters.finishedDateRange?.end?.toLocaleDateString("pt-BR") || ""}
                onChangeText={() => {}}
                style={styles.rangeInput}
                editable={false}
              />
            </View>
          </View>
        </View>
      ),
    },
  ], [filters, colors, handleArrayChange]);

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
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
  rangeText: {
    fontSize: 14,
    paddingHorizontal: 8,
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
