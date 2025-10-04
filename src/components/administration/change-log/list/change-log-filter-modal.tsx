import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Button } from "@/components/ui/button";
import { IconX, IconFilter, IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { spacing } from "@/constants/design-system";
import {
  CHANGE_LOG_ACTION,
  CHANGE_LOG_ACTION_LABELS,
  CHANGE_LOG_ENTITY_TYPE,
  CHANGE_LOG_ENTITY_TYPE_LABELS,
} from '../../../../constants';
import { useUsers } from '../../../../hooks';
import type { ChangeLogGetManyFormData } from '../../../../schemas';

interface ChangeLogFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ChangeLogGetManyFormData>) => void;
  currentFilters: Partial<ChangeLogGetManyFormData>;
}

export const ChangeLogFilterModal = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}: ChangeLogFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<Partial<ChangeLogGetManyFormData>>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fetch users for filter
  const { data: usersData } = useUsers({ limit: 100 });

  const users = useMemo(() =>
    usersData?.data?.map(user => ({
      value: user.id,
      label: user.name
    })) || [],
    [usersData]
  );

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Handle action filter
  const handleActionChange = useCallback((action: string, checked: boolean) => {
    setFilters(prev => {
      const actions = prev.actions || [];
      if (checked) {
        return { ...prev, actions: [...actions, action as any] };
      } else {
        return { ...prev, actions: actions.filter(a => a !== action) };
      }
    });
  }, []);

  // Handle entity type filter
  const handleEntityTypeChange = useCallback((entityType: string, checked: boolean) => {
    setFilters(prev => {
      const entityTypes = prev.entityTypes || [];
      if (checked) {
        return { ...prev, entityTypes: [...entityTypes, entityType as any] };
      } else {
        return { ...prev, entityTypes: entityTypes.filter(et => et !== entityType) };
      }
    });
  }, []);

  // Clear all filters
  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  // Apply filters
  const handleApply = useCallback(() => {
    onApply(filters);
  }, [filters, onApply]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.actions && filters.actions.length > 0) count += filters.actions.length;
    if (filters.entityTypes && filters.entityTypes.length > 0) count += filters.entityTypes.length;
    if (filters.userIds && filters.userIds.length > 0) count += filters.userIds.length;
    if (filters.createdAt?.gte || filters.createdAt?.lte) count += 1;
    return count;
  }, [filters]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.border }])}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.headerTitle}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <View style={StyleSheet.flatten([styles.badge, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
                  {activeFilterCount}
                </ThemedText>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Action Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("action")}
            >
              <ThemedText style={styles.sectionTitle}>Ação</ThemedText>
              {expandedSections.has("action") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("action") && (
              <View style={styles.sectionContent}>
                {Object.entries(CHANGE_LOG_ACTION_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.checkboxRow}
                    onPress={() => handleActionChange(key, !filters.actions?.includes(key as any))}
                  >
                    <Checkbox
                      checked={filters.actions?.includes(key as any) || false}
                      onCheckedChange={(checked) => handleActionChange(key, checked as boolean)}
                    />
                    <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Entity Type Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("entityType")}
            >
              <ThemedText style={styles.sectionTitle}>Tipo de Entidade</ThemedText>
              {expandedSections.has("entityType") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("entityType") && (
              <ScrollView
                style={styles.scrollableSection}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.sectionContent}>
                  {Object.entries(CHANGE_LOG_ENTITY_TYPE_LABELS).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.checkboxRow}
                      onPress={() => handleEntityTypeChange(key, !filters.entityTypes?.includes(key as any))}
                    >
                      <Checkbox
                        checked={filters.entityTypes?.includes(key as any) || false}
                        onCheckedChange={(checked) => handleEntityTypeChange(key, checked as boolean)}
                      />
                      <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* User Filter */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("users")}
            >
              <ThemedText style={styles.sectionTitle}>Usuário</ThemedText>
              {expandedSections.has("users") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("users") && (
              <View style={styles.sectionContent}>
                <Combobox
                  options={users}
                  value={filters.userIds?.[0]}
                  onValueChange={(value) => {
                    setFilters(prev => ({
                      ...prev,
                      userIds: value ? [value] : undefined
                    }));
                  }}
                  placeholder="Selecione um usuário"
                  searchable
                  clearable
                />
              </View>
            )}
          </View>

          {/* Date Range */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection("date")}
            >
              <ThemedText style={styles.sectionTitle}>Período</ThemedText>
              {expandedSections.has("date") ? (
                <IconChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <IconChevronDown size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {expandedSections.has("date") && (
              <View style={styles.sectionContent}>
                <View style={styles.dateInputs}>
                  <View style={styles.dateInput}>
                    <Label>Data inicial</Label>
                    <DatePicker
                      value={filters.createdAt?.gte}
                      onChange={(date) => {
                        setFilters(prev => ({
                          ...prev,
                          createdAt: {
                            ...prev.createdAt,
                            gte: date,
                          },
                        }));
                      }}
                      type="date"
                    />
                  </View>
                  <View style={styles.dateInput}>
                    <Label>Data final</Label>
                    <DatePicker
                      value={filters.createdAt?.lte}
                      onChange={(date) => {
                        setFilters(prev => ({
                          ...prev,
                          createdAt: {
                            ...prev.createdAt,
                            lte: date,
                          },
                        }));
                      }}
                      type="date"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={StyleSheet.flatten([styles.footer, { borderTopColor: colors.border }])}>
          <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
            <ThemedText>Limpar</ThemedText>
          </Button>
          <Button onPress={handleApply} style={styles.footerButton}>
            <IconCheck size={18} color={colors.primaryForeground} />
            <ThemedText style={{ color: colors.primaryForeground }}>
              Aplicar Filtros
            </ThemedText>
          </Button>
        </View>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  scrollableSection: {
    maxHeight: 300,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  dateInputs: {
    gap: spacing.md,
  },
  dateInput: {
    gap: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
