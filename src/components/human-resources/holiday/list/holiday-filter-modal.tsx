import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { HOLIDAY_TYPE, HOLIDAY_TYPE_LABELS } from '../../../../constants';
import { NumberInput } from "@/components/ui/number-input";

interface HolidayFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

export function HolidayFilterModal({ visible, onClose, onApply, currentFilters }: HolidayFilterModalProps) {
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = useState(currentFilters || {});

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onApply({});
    onClose();
  };

  const toggleType = (type: HOLIDAY_TYPE) => {
    const currentTypes = localFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t: HOLIDAY_TYPE) => t !== type)
      : [...currentTypes, type];

    setLocalFilters({
      ...localFilters,
      types: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const toggleUpcoming = () => {
    setLocalFilters({
      ...localFilters,
      isUpcoming: !localFilters.isUpcoming,
    });
  };

  const setYear = (year: number | undefined) => {
    setLocalFilters({
      ...localFilters,
      year,
    });
  };

  const setMonth = (month: number | undefined) => {
    setLocalFilters({
      ...localFilters,
      month,
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <Modal visible={visible} onClose={onClose} title="Filtrar Feriados" size="lg">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Type filters */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tipo de Feriado</ThemedText>
          {Object.values(HOLIDAY_TYPE).map((type) => (
            <View key={type} style={styles.checkboxRow}>
              <Checkbox
                checked={localFilters.types?.includes(type) || false}
                onCheckedChange={() => toggleType(type)}
                label={HOLIDAY_TYPE_LABELS[type]}
              />
            </View>
          ))}
        </View>

        {/* Year filter */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ano</ThemedText>
          <NumberInput
            value={localFilters.year}
            onChangeValue={setYear}
            placeholder={`Ex: ${currentYear}`}
            min={1900}
            max={2100}
          />
        </View>

        {/* Month filter */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Mês</ThemedText>
          <NumberInput
            value={localFilters.month}
            onChangeValue={setMonth}
            placeholder="1-12"
            min={1}
            max={12}
          />
        </View>

        {/* Upcoming filter */}
        <View style={styles.section}>
          <View style={styles.checkboxRow}>
            <Checkbox
              checked={localFilters.isUpcoming || false}
              onCheckedChange={toggleUpcoming}
              label="Apenas próximos feriados"
            />
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Button variant="outline" onPress={handleClear} style={styles.actionButton}>
          Limpar
        </Button>
        <Button variant="default" onPress={handleApply} style={styles.actionButton}>
          Aplicar Filtros
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 500,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  checkboxRow: {
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
