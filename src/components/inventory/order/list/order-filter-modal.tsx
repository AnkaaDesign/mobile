import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { DatePickerInput } from "@/components/ui/date-picker";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../../../constants';
import type { OrderGetManyFormData } from '../../../../schemas';
import { useSuppliers } from '../../../../hooks';

interface OrderFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<OrderGetManyFormData>) => void;
  currentFilters: Partial<OrderGetManyFormData>;
}

export const OrderFilterModal: React.FC<OrderFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const { colors } = useTheme();
  const { data: suppliersResponse } = useSuppliers({ limit: 100 });
  const suppliers = suppliersResponse?.data || [];

  // Local state for filters
  const [status, setStatus] = useState<ORDER_STATUS[]>([]);
  const [supplierIds, setSupplierIds] = useState<string[]>([]);
  const [createdAfter, setCreatedAfter] = useState<Date | undefined>(undefined);
  const [createdBefore, setCreatedBefore] = useState<Date | undefined>(undefined);
  const [forecastAfter, setForecastAfter] = useState<Date | undefined>(undefined);
  const [forecastBefore, setForecastBefore] = useState<Date | undefined>(undefined);

  // Initialize filters when modal opens
  useEffect(() => {
    if (visible) {
      setStatus(currentFilters.status || []);
      setSupplierIds(currentFilters.supplierIds || []);
      setCreatedAfter(currentFilters.createdAt?.gte ? new Date(currentFilters.createdAt.gte) : undefined);
      setCreatedBefore(currentFilters.createdAt?.lte ? new Date(currentFilters.createdAt.lte) : undefined);
      setForecastAfter(currentFilters.forecastRange?.gte ? new Date(currentFilters.forecastRange.gte) : undefined);
      setForecastBefore(currentFilters.forecastRange?.lte ? new Date(currentFilters.forecastRange.lte) : undefined);
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    const filters: Partial<OrderGetManyFormData> = {};

    if (status.length > 0) {
      filters.status = status;
    }

    if (supplierIds.length > 0) {
      filters.supplierIds = supplierIds;
    }

    if (createdAfter || createdBefore) {
      filters.createdAt = {};
      if (createdAfter) filters.createdAt.gte = createdAfter;
      if (createdBefore) filters.createdAt.lte = createdBefore;
    }

    if (forecastAfter || forecastBefore) {
      filters.forecastRange = {};
      if (forecastAfter) filters.forecastRange.gte = forecastAfter;
      if (forecastBefore) filters.forecastRange.lte = forecastBefore;
    }

    onApply(filters);
  };

  const handleClear = () => {
    setStatus([]);
    setSupplierIds([]);
    setCreatedAfter(undefined);
    setCreatedBefore(undefined);
    setForecastAfter(undefined);
    setForecastBefore(undefined);
  };

  const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
    label,
    value,
  }));

  const supplierOptions = suppliers.map(supplier => ({
    label: supplier.fantasyName,
    value: supplier.id,
  }));

  return (
    <Modal visible={visible} onClose={onClose}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Modal Title */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Filtros de Pedidos</ThemedText>
        </View>
        {/* Status Filter */}
        <View style={styles.section}>
          <Label>Status</Label>
          <MultiCombobox
            selectedValues={status}
            onValueChange={(values) => setStatus(values as ORDER_STATUS[])}
            options={statusOptions}
            placeholder="Selecione os status"
          />
        </View>

        {/* Supplier Filter */}
        <View style={styles.section}>
          <Label>Fornecedores</Label>
          <MultiCombobox
            selectedValues={supplierIds}
            onValueChange={setSupplierIds}
            options={supplierOptions}
            placeholder="Selecione os fornecedores"
          />
        </View>

        {/* Created Date Range */}
        <View style={styles.section}>
          <Label>Data de Criação</Label>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <ThemedText style={styles.dateLabel}>De:</ThemedText>
              <DatePickerInput
                value={createdAfter}
                onChange={setCreatedAfter}
                placeholder="Data inicial"
              />
            </View>
            <View style={styles.dateField}>
              <ThemedText style={styles.dateLabel}>Até:</ThemedText>
              <DatePickerInput
                value={createdBefore}
                onChange={setCreatedBefore}
                placeholder="Data final"
              />
            </View>
          </View>
        </View>

        {/* Forecast Date Range */}
        <View style={styles.section}>
          <Label>Previsão de Entrega</Label>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <ThemedText style={styles.dateLabel}>De:</ThemedText>
              <DatePickerInput
                value={forecastAfter}
                onChange={setForecastAfter}
                placeholder="Data inicial"
              />
            </View>
            <View style={styles.dateField}>
              <ThemedText style={styles.dateLabel}>Até:</ThemedText>
              <DatePickerInput
                value={forecastBefore}
                onChange={setForecastBefore}
                placeholder="Data final"
              />
            </View>
          </View>
        </View>


        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button variant="outline" onPress={handleClear} style={styles.actionButton}>
            Limpar
          </Button>
          <Button onPress={handleApply} style={styles.actionButton}>
            Aplicar
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  section: {
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
    opacity: 0.7,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceField: {
    flex: 1,
  },
  priceSeparator: {
    fontSize: 16,
    opacity: 0.5,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});