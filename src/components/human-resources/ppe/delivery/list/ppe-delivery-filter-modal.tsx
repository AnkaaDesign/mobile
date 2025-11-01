import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Button } from "@/components/ui/button";
import { IconX, IconFilter, IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { spacing } from "@/constants/design-system";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '../../../../../constants';
import { useUsers, useItems } from '../../../../../hooks';
import type { PpeDeliveryGetManyFormData } from '../../../../../schemas';

interface PpeDeliveryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<PpeDeliveryGetManyFormData>) => void;
  currentFilters: Partial<PpeDeliveryGetManyFormData>;
}

export const PpeDeliveryFilterModal = ({ visible, onClose, onApply, currentFilters }: PpeDeliveryFilterModalProps) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<Partial<PpeDeliveryGetManyFormData>>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["status"]));

  // Fetch data for selectors
  const { data: usersData } = useUsers({ perPage: 100, orderBy: { name: "asc" } });
  const { data: itemsData } = useItems({
    perPage: 100,
    orderBy: { name: "asc" },
    where: { isPpe: true }, // Only PPE items
  });

  const users = useMemo(
    () =>
      usersData?.data?.map((user) => ({
        value: user.id,
        label: user.name,
      })) || [],
    [usersData],
  );

  const items = useMemo(
    () =>
      itemsData?.data?.map((item) => ({
        value: item.id,
        label: `${item.name}${item.ppeSize ? ` - ${item.ppeSize}` : ""}`,
      })) || [],
    [itemsData],
  );

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Handle status filter
  const handleStatusChange = useCallback((status: string, checked: boolean) => {
    setFilters((prev) => {
      const statuses = prev.statuses || [];
      if (checked) {
        return { ...prev, statuses: [...statuses, status as keyof typeof PPE_DELIVERY_STATUS] };
      } else {
        return { ...prev, statuses: statuses.filter((s: PPE_DELIVERY_STATUS) => s !== status) };
      }
    });
  }, []);

  // Handle employee filter
  const handleUserChange = useCallback((userId: string) => {
    setFilters((prev) => {
      const userIds = prev.userIds || [];
      if (userIds.includes(userId)) {
        return { ...prev, userIds: userIds.filter((id: any /* TODO: Add proper type */) => id !== userId) };
      } else {
        return { ...prev, userIds: [...userIds, userId] };
      }
    });
  }, []);

  // Handle item filter
  const handleItemChange = useCallback((itemId: string) => {
    setFilters((prev) => {
      const itemIds = prev.itemIds || [];
      if (itemIds.includes(itemId)) {
        return { ...prev, itemIds: itemIds.filter((id: any /* TODO: Add proper type */) => id !== itemId) };
      } else {
        return { ...prev, itemIds: [...itemIds, itemId] };
      }
    });
  }, []);

  // Handle date range
  const handleDateRangeChange = useCallback((field: "startDate" | "endDate", date: Date | undefined) => {
    setFilters((prev) => {
      const dateRange = prev.dateRange || {};
      return {
        ...prev,
        dateRange: {
          ...dateRange,
          [field]: date,
        },
      };
    });
  }, []);

  // Handle signed status
  const handleSignedChange = useCallback((value: boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      isSigned: value,
    }));
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
    if (filters.statuses?.length) count++;
    if (filters.userIds?.length) count++;
    if (filters.itemIds?.length) count++;
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) count++;
    if (filters.isSigned !== undefined) count++;
    return count;
  }, [filters]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.border }])}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.headerTitle}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <View style={StyleSheet.flatten([styles.badge, { backgroundColor: colors.primary }])}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{activeFilterCount}</ThemedText>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("status")}>
              <ThemedText style={styles.sectionTitle}>Status</ThemedText>
              {expandedSections.has("status") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("status") && (
              <View style={styles.sectionContent}>
                {Object.entries(PPE_DELIVERY_STATUS_LABELS).map(([key, label]) => (
                  <TouchableOpacity key={key} style={styles.checkboxRow} onPress={() => handleStatusChange(key, !filters.statuses?.includes(key as keyof typeof PPE_DELIVERY_STATUS))}>
                    <Checkbox checked={filters.statuses?.includes(key as keyof typeof PPE_DELIVERY_STATUS) || false} onCheckedChange={(checked) => handleStatusChange(key, checked as boolean)} />
                    <ThemedText style={styles.checkboxLabel}>{label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Signed Status Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("signed")}>
              <ThemedText style={styles.sectionTitle}>Status de Assinatura</ThemedText>
              {expandedSections.has("signed") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("signed") && (
              <View style={styles.sectionContent}>
                <TouchableOpacity style={styles.checkboxRow} onPress={() => handleSignedChange(filters.isSigned === true ? undefined : true)}>
                  <Checkbox checked={filters.isSigned === true} onCheckedChange={(checked) => handleSignedChange(checked ? true : undefined)} />
                  <ThemedText style={styles.checkboxLabel}>Assinado</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.checkboxRow} onPress={() => handleSignedChange(filters.isSigned === false ? undefined : false)}>
                  <Checkbox checked={filters.isSigned === false} onCheckedChange={(checked) => handleSignedChange(checked ? false : undefined)} />
                  <ThemedText style={styles.checkboxLabel}>Não assinado</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Employee Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("employee")}>
              <ThemedText style={styles.sectionTitle}>Funcionário</ThemedText>
              {expandedSections.has("employee") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("employee") && (
              <View style={styles.sectionContent}>
                <Combobox
                  placeholder="Selecione funcionários"
                  options={users}
                  value={filters.userIds || []}
                  onChange={(value: string | undefined) => {
                    if (value) handleUserChange(value);
                  }}
                  multiple
                  searchable
                  emptyText="Nenhum funcionário encontrado"
                />
              </View>
            )}
          </View>

          {/* PPE Item Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("item")}>
              <ThemedText style={styles.sectionTitle}>EPI</ThemedText>
              {expandedSections.has("item") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("item") && (
              <View style={styles.sectionContent}>
                <Combobox placeholder="Selecione EPIs" options={items} value={filters.itemIds || []} onChange={(value: string | undefined) => {
                  if (value) handleItemChange(value);
                }} multiple searchable emptyText="Nenhum EPI encontrado" />
              </View>
            )}
          </View>

          {/* Date Range Filter */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("dateRange")}>
              <ThemedText style={styles.sectionTitle}>Período de Entrega</ThemedText>
              {expandedSections.has("dateRange") ? <IconChevronUp size={20} color={colors.mutedForeground} /> : <IconChevronDown size={20} color={colors.mutedForeground} />}
            </TouchableOpacity>

            {expandedSections.has("dateRange") && (
              <View style={styles.sectionContent}>
                <View style={styles.dateRangeRow}>
                  <View style={styles.dateField}>
                    <ThemedText style={styles.dateLabel}>Data Inicial</ThemedText>
                    <DatePicker value={filters.dateRange?.startDate ? new Date(filters.dateRange.startDate) : undefined} onChange={(date) => handleDateRangeChange("startDate", date)} />
                  </View>
                  <View style={styles.dateField}>
                    <ThemedText style={styles.dateLabel}>Data Final</ThemedText>
                    <DatePicker value={filters.dateRange?.endDate ? new Date(filters.dateRange.endDate) : undefined} onChange={(date) => handleDateRangeChange("endDate", date)} />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={StyleSheet.flatten([styles.footer, { borderTopColor: colors.border }])}>
          <Button variant="outline" onPress={handleClear} style={styles.footerButton}>
            <ThemedText>Limpar</ThemedText>
          </Button>
          <Button variant="default" onPress={handleApply} style={styles.footerButton}>
            <ThemedText style={{ color: colors.primaryForeground }}>Aplicar Filtros</ThemedText>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingVertical: spacing.sm,
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
  dateRangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
