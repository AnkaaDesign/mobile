import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS, PPE_TYPE, PPE_TYPE_LABELS } from "@/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerInput } from "@/components/ui/date-picker-input";

interface MyPpeDeliveryFilterDrawerContentProps {
  filters: {
    status?: string[];
    ppeTypes?: string[];
    deliveryDateRange?: { start?: Date; end?: Date };
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

export function MyPpeDeliveryFilterDrawerContent({ filters, onFiltersChange, onClear, activeFiltersCount }: MyPpeDeliveryFilterDrawerContentProps) {
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleStatusToggle = (status: string) => {
    const currentStatus = localFilters.status || [];
    const newStatus = currentStatus.includes(status) ? currentStatus.filter((s) => s !== status) : [...currentStatus, status];

    setLocalFilters((prev) => ({
      ...prev,
      status: newStatus.length > 0 ? newStatus : undefined,
    }));
  };

  const handlePpeTypeToggle = (ppeType: string) => {
    const currentTypes = localFilters.ppeTypes || [];
    const newTypes = currentTypes.includes(ppeType) ? currentTypes.filter((t) => t !== ppeType) : [...currentTypes, ppeType];

    setLocalFilters((prev) => ({
      ...prev,
      ppeTypes: newTypes.length > 0 ? newTypes : undefined,
    }));
  };

  const handleDateRangeChange = (field: "start" | "end", date: Date | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      deliveryDateRange: {
        ...prev.deliveryDateRange,
        [field]: date,
      },
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  const statusOptions = [
    { value: PPE_DELIVERY_STATUS.PENDING, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.PENDING] },
    { value: PPE_DELIVERY_STATUS.APPROVED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.APPROVED] },
    { value: PPE_DELIVERY_STATUS.DELIVERED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.DELIVERED] },
    { value: PPE_DELIVERY_STATUS.REPROVED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.REPROVED] },
    { value: PPE_DELIVERY_STATUS.CANCELLED, label: PPE_DELIVERY_STATUS_LABELS[PPE_DELIVERY_STATUS.CANCELLED] },
  ];

  const ppeTypeOptions = Object.values(PPE_TYPE).map((type) => ({
    value: type,
    label: PPE_TYPE_LABELS[type] || type,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Filtros</ThemedText>
        {activeFiltersCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
            <ThemedText style={[styles.badgeText, { color: colors.destructiveForeground }]}>{activeFiltersCount}</ThemedText>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Filter */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>Status</ThemedText>
          {statusOptions.map((option) => (
            <View key={option.value} style={styles.checkboxRow}>
              <Checkbox
                checked={localFilters.status?.includes(option.value) || false}
                onCheckedChange={() => handleStatusToggle(option.value)}
                label={option.label}
              />
            </View>
          ))}
        </View>

        {/* PPE Type Filter */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>Tipo de EPI</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {ppeTypeOptions.map((option) => (
              <Button
                key={option.value}
                variant={localFilters.ppeTypes?.includes(option.value) ? "default" : "outline"}
                size="sm"
                onPress={() => handlePpeTypeToggle(option.value)}
                style={styles.chip}
              >
                {option.label}
              </Button>
            ))}
          </ScrollView>
        </View>

        {/* Delivery Date Range */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>Período de Entrega</ThemedText>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>De</ThemedText>
              <DatePickerInput
                value={localFilters.deliveryDateRange?.start}
                onChange={(date) => handleDateRangeChange("start", date)}
                placeholder="Início"
              />
            </View>
            <View style={styles.dateField}>
              <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>Até</ThemedText>
              <DatePickerInput
                value={localFilters.deliveryDateRange?.end}
                onChange={(date) => handleDateRangeChange("end", date)}
                placeholder="Fim"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button variant="outline" onPress={handleClear} style={styles.button}>
          Limpar
        </Button>
        <Button onPress={handleApply} style={styles.button}>
          Aplicar Filtros
        </Button>
      </View>
    </View>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  checkboxRow: {
    paddingVertical: spacing.xs,
  },
  chipScroll: {
    flexDirection: "row",
  },
  chip: {
    marginRight: spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
});
