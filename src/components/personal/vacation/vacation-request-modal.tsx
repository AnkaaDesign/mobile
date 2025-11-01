import { useState } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { IconX, IconCalendar, IconInfoCircle } from "@tabler/icons-react-native";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { VACATION_TYPE, VACATION_TYPE_LABELS } from '../../../constants';
import { getDifferenceInDays } from '../../../utils';
import DateTimePicker from "@react-native-community/datetimepicker";

interface VacationRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { startAt: Date; endAt: Date; type: VACATION_TYPE }) => void;
  availableDays: number;
  isSubmitting?: boolean;
}

export function VacationRequestModal({ visible, onClose, onSubmit, availableDays, isSubmitting = false }: VacationRequestModalProps) {
  const { colors } = useTheme();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [vacationType, setVacationType] = useState<VACATION_TYPE>(VACATION_TYPE.ANNUAL);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vacationTypes = [
    { value: VACATION_TYPE.ANNUAL, label: VACATION_TYPE_LABELS[VACATION_TYPE.ANNUAL] },
    { value: VACATION_TYPE.MEDICAL, label: VACATION_TYPE_LABELS[VACATION_TYPE.MEDICAL] },
    { value: VACATION_TYPE.EMERGENCY, label: VACATION_TYPE_LABELS[VACATION_TYPE.EMERGENCY] },
    { value: VACATION_TYPE.STUDY, label: VACATION_TYPE_LABELS[VACATION_TYPE.STUDY] },
    { value: VACATION_TYPE.UNPAID, label: VACATION_TYPE_LABELS[VACATION_TYPE.UNPAID] },
    { value: VACATION_TYPE.OTHER, label: VACATION_TYPE_LABELS[VACATION_TYPE.OTHER] },
  ];

  const calculateDays = () => {
    if (endDate <= startDate) return 0;
    return getDifferenceInDays(endDate, startDate) + 1;
  };

  const requestedDays = calculateDays();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (endDate <= startDate) {
      newErrors.endDate = "Data de término deve ser posterior à data de início";
    }

    if (requestedDays > availableDays && vacationType === VACATION_TYPE.ANNUAL) {
      newErrors.days = `Você não tem dias suficientes. Disponível: ${availableDays} dias`;
    }

    if (requestedDays > 30) {
      newErrors.days = "Férias não podem exceder 30 dias consecutivos";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      newErrors.startDate = "Data de início não pode ser no passado";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      startAt: startDate,
      endAt: endDate,
      type: vacationType,
    });
  };

  const handleStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);
      setErrors({});
    }
  };

  const handleEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDate(selectedDate);
      setErrors({});
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={StyleSheet.flatten([styles.modalContainer, { backgroundColor: colors.background }])}>
          {/* Header */}
          <View style={StyleSheet.flatten([styles.header, { borderBottomColor: colors.border }])}>
            <ThemedText style={styles.title}>Solicitar Férias</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconX size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Available Days Info */}
            <View style={StyleSheet.flatten([styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary }])}>
              <IconInfoCircle size={20} color={colors.primary} />
              <View style={styles.infoText}>
                <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.primary }])}>Dias disponíveis</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.primary }])}>{availableDays} dias</ThemedText>
              </View>
            </View>

            {/* Vacation Type */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Tipo de Férias</ThemedText>
              <View style={styles.typeGrid}>
                {vacationTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={StyleSheet.flatten([
                      styles.typeButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      vacationType === type.value && StyleSheet.flatten([styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }]),
                    ])}
                    onPress={() => setVacationType(type.value)}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.typeButtonText,
                        vacationType === type.value && StyleSheet.flatten([styles.typeButtonTextActive, { color: colors.primaryForeground }]),
                      ])}
                    >
                      {type.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Período</ThemedText>

              {/* Start Date */}
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.dateInput,
                  { backgroundColor: colors.card, borderColor: errors.startDate ? colors.destructive : colors.border },
                ])}
                onPress={() => setShowStartPicker(true)}
              >
                <IconCalendar size={20} color={colors.foreground} />
                <View style={styles.dateInputContent}>
                  <ThemedText style={styles.dateInputLabel}>Data de Início</ThemedText>
                  <ThemedText style={styles.dateInputValue}>{startDate.toLocaleDateString("pt-BR")}</ThemedText>
                </View>
              </TouchableOpacity>
              {errors.startDate && <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>{errors.startDate}</ThemedText>}

              {showStartPicker && (
                <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} minimumDate={new Date()} />
              )}

              {/* End Date */}
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.dateInput,
                  { backgroundColor: colors.card, borderColor: errors.endDate ? colors.destructive : colors.border },
                ])}
                onPress={() => setShowEndPicker(true)}
              >
                <IconCalendar size={20} color={colors.foreground} />
                <View style={styles.dateInputContent}>
                  <ThemedText style={styles.dateInputLabel}>Data de Término</ThemedText>
                  <ThemedText style={styles.dateInputValue}>{endDate.toLocaleDateString("pt-BR")}</ThemedText>
                </View>
              </TouchableOpacity>
              {errors.endDate && <ThemedText style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>{errors.endDate}</ThemedText>}

              {showEndPicker && (
                <DateTimePicker value={endDate} mode="date" display="default" onChange={handleEndDateChange} minimumDate={startDate} />
              )}
            </View>

            {/* Days Summary */}
            {requestedDays > 0 && (
              <View style={StyleSheet.flatten([styles.summaryCard, { backgroundColor: colors.muted + "30" }])}>
                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Total de dias solicitados:</ThemedText>
                  <ThemedText style={styles.summaryValue}>{requestedDays} dias</ThemedText>
                </View>
                {vacationType === VACATION_TYPE.ANNUAL && (
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Dias restantes após:</ThemedText>
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.summaryValue,
                        { color: availableDays - requestedDays < 0 ? colors.destructive : colors.success },
                      ])}
                    >
                      {availableDays - requestedDays} dias
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {errors.days && (
              <View style={StyleSheet.flatten([styles.errorCard, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive }])}>
                <IconInfoCircle size={20} color={colors.destructive} />
                <ThemedText style={StyleSheet.flatten([styles.errorCardText, { color: colors.destructive }])}>{errors.days}</ThemedText>
              </View>
            )}

            {/* Info Message */}
            <View style={StyleSheet.flatten([styles.infoMessage, { backgroundColor: colors.muted + "20" }])}>
              <IconInfoCircle size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.infoMessageText}>
                Sua solicitação será enviada para aprovação. Você receberá uma notificação quando houver uma resposta.
              </ThemedText>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={StyleSheet.flatten([styles.footer, { borderTopColor: colors.border }])}>
            <Button variant="outline" onPress={onClose} style={styles.footerButton} disabled={isSubmitting}>
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <Button onPress={handleSubmit} style={styles.footerButton} disabled={isSubmitting}>
              <ThemedText style={{ color: colors.primaryForeground }}>{isSubmitting ? "Enviando..." : "Solicitar"}</ThemedText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: "90%",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  typeButtonTextActive: {
    fontWeight: fontWeight.bold,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  dateInputContent: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginBottom: 2,
  },
  dateInputValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: fontSize.sm,
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorCardText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  infoMessage: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  infoMessageText: {
    flex: 1,
    fontSize: fontSize.sm,
    opacity: 0.8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
