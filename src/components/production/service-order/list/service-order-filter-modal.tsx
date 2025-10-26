import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Modal } from "@/components/ui/modal";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from '../../../../constants';
import type { ServiceOrderGetManyFormData } from '../../../../schemas';

interface ServiceOrderFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ServiceOrderGetManyFormData>) => void;
  currentFilters: Partial<ServiceOrderGetManyFormData>;
}

export const ServiceOrderFilterModal: React.FC<ServiceOrderFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = useState(currentFilters);

  // Status options for select
  const statusOptions = useMemo(() => {
    return Object.values(SERVICE_ORDER_STATUS).map(status => ({
      label: SERVICE_ORDER_STATUS_LABELS[status],
      value: status,
    }));
  }, []);

  const handleFilterChange = useCallback((key: string, value: Date | string[] | null | undefined) => {
    setLocalFilters(prev => {
      // Handle nested updates for date ranges
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.');
        const newFilters = { ...prev };

        // Type-safe handling for nested date range updates
        if (parentKey === 'createdAt' || parentKey === 'startedAt' || parentKey === 'finishedAt') {
          const currentValue = newFilters[parentKey as 'createdAt' | 'startedAt' | 'finishedAt'] || {};
          newFilters[parentKey as 'createdAt' | 'startedAt' | 'finishedAt'] = {
            ...currentValue,
            [childKey as 'gte' | 'lte']: value as Date | null | undefined,
          };
        }

        return newFilters;
      }

      // Handle statusIn array
      if (key === 'statusIn') {
        return {
          ...prev,
          statusIn: value as string[] | undefined,
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setLocalFilters({});
  }, []);

  const handleApply = useCallback(() => {
    onApply(localFilters);
  }, [localFilters, onApply]);

  // Reset local filters when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(currentFilters);
    }
  }, [visible, currentFilters]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
     
     
    >
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Filtros</ThemedText>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Status</ThemedText>
          <Select
            value={localFilters.statusIn?.[0] || ""}
            onValueChange={(value) => handleFilterChange("statusIn", value ? [value] : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} label={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>

        {/* Created Date Range */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Data de Criação</ThemedText>
          <View style={styles.dateRangeRow}>
            <View style={styles.dateRangeItem}>
              <ThemedText style={styles.dateLabel}>De:</ThemedText>
              <DatePicker
                value={localFilters.createdAt?.gte ? new Date(localFilters.createdAt.gte) : undefined}
                onChange={(date) => handleFilterChange("createdAt.gte", date)}
                placeholder="Data inicial"
                style={styles.datePicker}
              />
            </View>
            <View style={styles.dateRangeItem}>
              <ThemedText style={styles.dateLabel}>Até:</ThemedText>
              <DatePicker
                value={localFilters.createdAt?.lte ? new Date(localFilters.createdAt.lte) : undefined}
                onChange={(date) => handleFilterChange("createdAt.lte", date)}
                placeholder="Data final"
                style={styles.datePicker}
              />
            </View>
          </View>
        </View>

        {/* Started Date Range */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Data de Início</ThemedText>
          <View style={styles.dateRangeRow}>
            <View style={styles.dateRangeItem}>
              <ThemedText style={styles.dateLabel}>De:</ThemedText>
              <DatePicker
                value={localFilters.startedAt?.gte ? new Date(localFilters.startedAt.gte) : undefined}
                onChange={(date) => handleFilterChange("startedAt.gte", date)}
                placeholder="Data inicial"
                style={styles.datePicker}
              />
            </View>
            <View style={styles.dateRangeItem}>
              <ThemedText style={styles.dateLabel}>Até:</ThemedText>
              <DatePicker
                value={localFilters.startedAt?.lte ? new Date(localFilters.startedAt.lte) : undefined}
                onChange={(date) => handleFilterChange("startedAt.lte", date)}
                placeholder="Data final"
                style={styles.datePicker}
              />
            </View>
          </View>
        </View>

        {/* Finished Date Range */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Data de Finalização</ThemedText>
          <View style={styles.dateRangeRow}>
            <View style={styles.dateRangeItem}>
              <ThemedText style={styles.dateLabel}>De:</ThemedText>
              <DatePicker
                value={localFilters.finishedAt?.gte ? new Date(localFilters.finishedAt.gte) : undefined}
                onChange={(date) => handleFilterChange("finishedAt.gte", date)}
                placeholder="Data inicial"
                style={styles.datePicker}
              />
            </View>
            <View style={styles.dateRangeItem}>
              <ThemedText style={styles.dateLabel}>Até:</ThemedText>
              <DatePicker
                value={localFilters.finishedAt?.lte ? new Date(localFilters.finishedAt.lte) : undefined}
                onChange={(date) => handleFilterChange("finishedAt.lte", date)}
                placeholder="Data final"
                style={styles.datePicker}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={handleClearAll}
          style={styles.actionButton}
        >
          Limpar Tudo
        </Button>
        <Button
          onPress={handleApply}
          style={styles.actionButton}
        >
          Aplicar Filtros
        </Button>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    maxHeight: 400,
  },
  filterGroup: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateRangeItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  datePicker: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    flex: 1,
  },
});