import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Switch } from "react-native";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import type { PpeDeliveryGetManyFormData } from '../../../../schemas';

interface PpeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<PpeDeliveryGetManyFormData>) => void;
  currentFilters: Partial<PpeDeliveryGetManyFormData>;
}

export const PpeFilterModal: React.FC<PpeFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<Partial<PpeDeliveryGetManyFormData>>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleApply = () => {
    // Remove empty values
    const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "" &&
          (!Array.isArray(value) || value.length > 0)) {
        acc[key as keyof typeof filters] = value;
      }
      return acc;
    }, {} as Partial<any>);

    onApply(cleanedFilters);
  };

  const handleClear = () => {
    setFilters({});
  };


  const handleDateChange = (field: 'createdFrom' | 'createdTo', date: Date | undefined) => {
    if (!date) {
      const newFilters = { ...filters };
      delete newFilters[field as keyof typeof newFilters];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [field]: date });
    }
  };


  return (
    <Modal
      visible={visible}
      onClose={onClose}
     
    >
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Filtros</ThemedText>
        </View>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>



        {/* Date Filters */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Data de Criação</ThemedText>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <ThemedText style={styles.dateLabel}>De:</ThemedText>
              <DatePicker
                value={filters.createdFrom}
                onChange={(date) => handleDateChange('createdFrom', date)}
                placeholder="Selecionar"
              />
            </View>
            <View style={styles.dateField}>
              <ThemedText style={styles.dateLabel}>Até:</ThemedText>
              <DatePicker
                value={filters.createdTo}
                onChange={(date) => handleDateChange('createdTo', date)}
                placeholder="Selecionar"
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={handleClear}
            style={styles.button}
          >
            Limpar
          </Button>
          <Button
            onPress={handleApply}
            style={styles.button}
          >
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
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
  },
});