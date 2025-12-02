import { useCallback, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { SkeletonCard } from "@/components/ui/loading";
import { showToast } from "@/components/ui/toast";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { usePpeDeliverySchedules, usePpeDeliveryScheduleBatchMutations } from "@/hooks";
import { routeToMobilePath } from "@/utils/route-mapper";
import { routes, SECTOR_PRIVILEGES, SCHEDULE_FREQUENCY_LABELS, RESCHEDULE_REASON } from "@/constants";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { IconAlertTriangle, IconCalendar, IconCheck } from "@tabler/icons-react-native";

// Schema for batch edit form
const schedulesBatchEditSchema = z.object({
  schedules: z.array(
    z.object({
      id: z.string(),
      data: z.object({
        nextRun: z.date().nullable(),
        isActive: z.boolean(),
        rescheduleReason: z.nativeEnum(RESCHEDULE_REASON).nullable().optional(),
      }),
    }),
  ),
});

type SchedulesBatchEditFormData = z.infer<typeof schedulesBatchEditSchema>;

// Reschedule reason labels
const RESCHEDULE_REASON_LABELS: Record<RESCHEDULE_REASON, string> = {
  [RESCHEDULE_REASON.LOW_FUNDS]: "Sem Fundos",
  [RESCHEDULE_REASON.SUPPLIER_DELAY]: "Atraso do Fornecedor",
  [RESCHEDULE_REASON.OPERATIONAL_ISSUE]: "Problema Operacional",
  [RESCHEDULE_REASON.PRIORITY_CHANGE]: "Mudança de Prioridade",
  [RESCHEDULE_REASON.SEASONAL_ADJUSTMENT]: "Ajuste Sazonal",
  [RESCHEDULE_REASON.EMERGENCY]: "Emergência",
  [RESCHEDULE_REASON.OTHER]: "Outro",
};

export default function BatchEditPpeSchedulesScreenWrapper() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]} requireAll={false}>
      <BatchEditPpeSchedulesScreen />
    </PrivilegeGuard>
  );
}

function BatchEditPpeSchedulesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ ids: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { batchUpdateAsync } = usePpeDeliveryScheduleBatchMutations();

  // Parse schedule IDs from URL params
  const scheduleIds = useMemo(() => {
    if (!params.ids) return [];
    return params.ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch schedules to edit
  const {
    data: response,
    isLoading,
    error,
  } = usePpeDeliverySchedules({
    where: {
      id: { in: scheduleIds },
    },
    include: {
      deliveries: true,
      autoOrders: true,
    },
  }, {
    enabled: scheduleIds.length > 0,
  });

  const schedules = response?.data || [];
  const hasValidSchedules = schedules.length > 0;
  const allSchedulesFound = schedules.length === scheduleIds.length;

  // Initialize form
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SchedulesBatchEditFormData>({
    resolver: zodResolver(schedulesBatchEditSchema),
    mode: "onChange",
    defaultValues: {
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        data: {
          nextRun: schedule.nextRun ? new Date(schedule.nextRun) : null,
          isActive: schedule.isActive,
          rescheduleReason: schedule.rescheduleReason || null,
        },
      })),
    },
  });

  // Watch all form values
  const watchedSchedules = watch("schedules");

  // Handle status change
  const handleStatusChange = useCallback(
    (index: number, newStatus: boolean) => {
      setValue(`schedules.${index}.data.isActive`, newStatus, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue]
  );

  // Handle date change
  const handleDateChange = useCallback(
    (index: number, newDate: Date | null | undefined) => {
      setValue(`schedules.${index}.data.nextRun`, newDate ?? null, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      // If changing the date, suggest setting a reschedule reason
      const currentSchedule = schedules[index];
      const originalDate = currentSchedule?.nextRun ? new Date(currentSchedule.nextRun) : null;

      if (newDate && originalDate && newDate.getTime() !== originalDate.getTime()) {
        // Date changed - user should provide a reason
        if (!watchedSchedules[index]?.data.rescheduleReason) {
          // Set a default reason or leave it empty for user to select
          setValue(`schedules.${index}.data.rescheduleReason`, RESCHEDULE_REASON.PRIORITY_CHANGE, {
            shouldDirty: true,
          });
        }
      }
    },
    [setValue, schedules, watchedSchedules]
  );

  // Submit handler
  const onSubmit = async (data: SchedulesBatchEditFormData) => {
    setIsSubmitting(true);
    try {
      // Filter only schedules that have changes
      const changedSchedules = data.schedules.filter((schedule, index) => {
        const original = schedules[index];
        const hasStatusChange = schedule.data.isActive !== original.isActive;
        const hasDateChange =
          schedule.data.nextRun?.getTime() !== (original.nextRun ? new Date(original.nextRun).getTime() : null);
        return hasStatusChange || hasDateChange;
      });

      if (changedSchedules.length === 0) {
        showToast({
          message: "Nenhuma alteração detectada",
          type: "info",
        });
        setIsSubmitting(false);
        return;
      }

      const updateSchedules = changedSchedules.map((schedule) => {
        const updateData: any = {
          isActive: schedule.data.isActive,
        };

        // Only include nextRun if it was changed
        const originalSchedule = schedules.find((s) => s.id === schedule.id);
        const originalDate = originalSchedule?.nextRun ? new Date(originalSchedule.nextRun).getTime() : null;
        const newDate = schedule.data.nextRun?.getTime() || null;

        if (originalDate !== newDate) {
          updateData.nextRun = schedule.data.nextRun;

          // Increment reschedule count and set reschedule reason
          updateData.rescheduleCount = (originalSchedule?.rescheduleCount || 0) + 1;
          updateData.lastRescheduleDate = new Date();
          updateData.rescheduleReason = schedule.data.rescheduleReason || RESCHEDULE_REASON.OTHER;

          // Store original date if not already set
          if (!originalSchedule?.originalDate) {
            updateData.originalDate = originalSchedule?.nextRun || new Date();
          }
        }

        return {
          id: schedule.id,
          data: updateData,
        };
      });

      const batchPayload = { ppeDeliverySchedules: updateSchedules };
      const result = await batchUpdateAsync(batchPayload);

      if (result?.data) {
        const { totalSuccess, totalFailed } = result.data;

        if (totalFailed === 0) {
          showToast({
            message: `${totalSuccess} agendamento(s) atualizado(s) com sucesso!`,
            type: "success",
          });
          router.replace(routeToMobilePath(routes.inventory.ppe.schedules.root) as any);
        } else {
          showToast({
            message: `${totalSuccess} sucesso(s), ${totalFailed} falha(s)`,
            type: "warning",
          });
        }
      } else {
        showToast({
          message: "Agendamentos atualizados com sucesso!",
          type: "success",
        });
        router.replace(routeToMobilePath(routes.inventory.ppe.schedules.root) as any);
      }
    } catch (error: any) {
      console.error("Error during batch update:", error);
      showToast({
        message: error.message || "Erro ao atualizar agendamentos",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        "Descartar Alterações?",
        "Você tem alterações não salvas. Deseja descartar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View>
              <ThemedText style={styles.title}>Carregando Agendamentos...</ThemedText>
              <View style={styles.skeletonContainer}>
                <SkeletonCard style={styles.skeleton} />
                <SkeletonCard style={styles.skeleton} />
              </View>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // No IDs provided
  if (scheduleIds.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={styles.errorTitle}>Nenhum Agendamento Selecionado</ThemedText>
              <ThemedText style={styles.errorDescription}>
                Nenhum agendamento foi selecionado para edição em lote.
              </ThemedText>
              <Button onPress={handleCancel} variant="outline" style={styles.button}>
                <ThemedText>Voltar para Lista</ThemedText>
              </Button>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // Error or no valid schedules
  if (error || !hasValidSchedules) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.errorContainer}>
              <IconAlertTriangle size={48} color={colors.destructive} />
              <ThemedText style={styles.errorTitle}>Erro ao Carregar Agendamentos</ThemedText>
              <ThemedText style={styles.errorDescription}>
                {error
                  ? "Ocorreu um erro ao carregar os agendamentos selecionados."
                  : "Os agendamentos selecionados não foram encontrados."}
              </ThemedText>
              {!allSchedulesFound && schedules.length > 0 && (
                <Card
                  style={StyleSheet.flatten([
                    styles.warningCard,
                    { backgroundColor: colors.warning + "20", borderColor: colors.warning },
                  ])}
                >
                  <View>
                    <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                      Apenas {schedules.length} de {scheduleIds.length} agendamentos foram encontrados. Os
                      agendamentos não encontrados podem ter sido excluídos.
                    </ThemedText>
                  </View>
                </Card>
              )}
              <Button onPress={handleCancel} variant="outline" style={styles.button}>
                <ThemedText>Voltar para Lista</ThemedText>
              </Button>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  }

  // Get status options
  const statusOptions = [
    { value: "true", label: "Ativo" },
    { value: "false", label: "Inativo" },
  ];

  // Get reschedule reason options
  const rescheduleReasonOptions = Object.entries(RESCHEDULE_REASON_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Info */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.pulseContainer}>
              <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>
                Editando {schedules.length} {schedules.length === 1 ? "agendamento" : "agendamentos"}
              </ThemedText>
              <ThemedText style={[styles.headerDescription, { color: colors.mutedForeground }]}>
                As alterações serão aplicadas a todos os agendamentos listados abaixo
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Schedule Items */}
        {schedules.map((schedule, index) => {
          const watchedSchedule = watchedSchedules[index];
          const currentStatus = watchedSchedule?.data.isActive ?? schedule.isActive;
          const currentNextRun = watchedSchedule?.data.nextRun || null;
          const originalNextRun = schedule.nextRun ? new Date(schedule.nextRun) : null;
          const hasDateChange =
            currentNextRun?.getTime() !== originalNextRun?.getTime();

          return (
            <Card key={schedule.id} style={styles.scheduleCard}>
              {/* Schedule Info */}
              <View style={styles.scheduleInfoContainer}>
                <ThemedText style={styles.scheduleFrequency}>
                  {SCHEDULE_FREQUENCY_LABELS[schedule.frequency] || schedule.frequency}
                </ThemedText>
                <ThemedText style={[styles.scheduleDetails, { color: colors.mutedForeground }]}>
                  Itens: {schedule.ppeItems?.length || 0}
                </ThemedText>
                <ThemedText style={[styles.scheduleDetails, { color: colors.mutedForeground }]}>
                  Reagendamentos: {schedule.rescheduleCount || 0}
                </ThemedText>
              </View>

              {/* Next Run Date Input */}
              <View style={styles.fieldContainer}>
                <Label>
                  Próxima Execução <ThemedText style={{ color: colors.mutedForeground }}>(Opcional)</ThemedText>
                </Label>
                <Controller
                  control={control}
                  name={`schedules.${index}.data.nextRun`}
                  render={({ field: { value } }) => (
                    <View>
                      <DatePicker
                        value={value ?? undefined}
                        onChange={(date) => handleDateChange(index, date)}
                        placeholder="Selecione uma data"
                        type="datetime"
                        error={errors.schedules?.[index]?.data?.nextRun?.message}
                      />
                      {errors.schedules?.[index]?.data?.nextRun && (
                        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                          {errors.schedules[index]?.data?.nextRun?.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* Reschedule Reason - Show only if date changed */}
              {hasDateChange && (
                <View style={styles.fieldContainer}>
                  <Label>
                    Motivo do Reagendamento <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                  </Label>
                  <Controller
                    control={control}
                    name={`schedules.${index}.data.rescheduleReason`}
                    render={({ field: { value } }) => (
                      <View>
                        <Combobox
                          value={value || ""}
                          onValueChange={(newValue) => {
                            if (newValue) {
                              setValue(`schedules.${index}.data.rescheduleReason`, newValue as RESCHEDULE_REASON, {
                                shouldDirty: true,
                              });
                            }
                          }}
                          options={rescheduleReasonOptions}
                          placeholder="Selecione o motivo"
                          searchable={false}
                          clearable={false}
                          error={errors.schedules?.[index]?.data?.rescheduleReason?.message}
                        />
                        {errors.schedules?.[index]?.data?.rescheduleReason && (
                          <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                            {errors.schedules[index]?.data?.rescheduleReason?.message}
                          </ThemedText>
                        )}
                      </View>
                    )}
                  />
                </View>
              )}

              {/* Status Selector */}
              <View style={styles.fieldContainer}>
                <Label>
                  Status <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                </Label>
                <Controller
                  control={control}
                  name={`schedules.${index}.data.isActive`}
                  render={({ field: { value } }) => (
                    <View>
                      <Combobox
                        value={value ? "true" : "false"}
                        onValueChange={(newValue) => {
                          if (newValue) {
                            handleStatusChange(index, newValue === "true");
                          }
                        }}
                        options={statusOptions}
                        placeholder="Selecione o status"
                        searchable={false}
                        clearable={false}
                        error={errors.schedules?.[index]?.data?.isActive?.message}
                      />
                      {errors.schedules?.[index]?.data?.isActive && (
                        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                          {errors.schedules[index]?.data?.isActive?.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </View>

              {/* Status Warnings */}
              {!currentStatus && schedule.isActive && (
                <Card
                  style={StyleSheet.flatten([
                    styles.statusWarningCard,
                    { backgroundColor: colors.warning + "10", borderColor: colors.warning },
                  ])}
                >
                  <View style={styles.statusWarningContent}>
                    <IconAlertTriangle size={20} color={colors.warning} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.warning }]}>
                        Atenção: Agendamento será desativado
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.warning }]}>
                        O agendamento não criará mais entregas automáticas até ser reativado.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              )}

              {currentStatus && !schedule.isActive && (
                <Card
                  style={StyleSheet.flatten([
                    styles.statusWarningCard,
                    { backgroundColor: colors.success + "10", borderColor: colors.success },
                  ])}
                >
                  <View style={styles.statusWarningContent}>
                    <IconCheck size={20} color={colors.success} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.success }]}>
                        Agendamento será ativado
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.success }]}>
                        O agendamento voltará a criar entregas automáticas conforme configurado.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              )}

              {hasDateChange && (
                <Card
                  style={StyleSheet.flatten([
                    styles.statusWarningCard,
                    { backgroundColor: colors.primary + "10", borderColor: colors.primary },
                  ])}
                >
                  <View style={styles.statusWarningContent}>
                    <IconCalendar size={20} color={colors.primary} />
                    <View style={styles.statusWarningTextContainer}>
                      <ThemedText style={[styles.statusWarningTitle, { color: colors.primary }]}>
                        Data de execução alterada
                      </ThemedText>
                      <ThemedText style={[styles.statusWarningText, { color: colors.primary }]}>
                        O contador de reagendamentos será incrementado e a data original será preservada.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              )}
            </Card>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            onPress={handleCancel}
            variant="outline"
            style={StyleSheet.flatten([styles.button, styles.cancelButton])}
            disabled={isSubmitting}
          >
            <ThemedText>Cancelar</ThemedText>
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={StyleSheet.flatten([styles.button, styles.submitButton])}
            disabled={isSubmitting || !isDirty}
          >
            <ThemedText style={{ color: "#fff" }}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </ThemedText>
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    marginBottom: spacing.lg,
  },
  skeletonContainer: {
    gap: spacing.lg,
  },
  skeleton: {
    height: 150,
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  warningCard: {
    padding: spacing.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  warningText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  headerCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  pulseContainer: {
    paddingTop: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  headerDescription: {
    fontSize: fontSize.xs,
  },
  scheduleCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  scheduleInfoContainer: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  scheduleFrequency: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  scheduleDetails: {
    fontSize: fontSize.sm,
  },
  fieldContainer: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statusWarningCard: {
    padding: spacing.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  statusWarningContent: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  statusWarningTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  statusWarningTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  statusWarningText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    minWidth: 100,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
