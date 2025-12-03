import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconCalendar, IconDeviceFloppy, IconAlertTriangle } from "@tabler/icons-react-native";
import { useMaintenanceSchedules, useMaintenanceScheduleBatchMutations } from "@/hooks";
import {
  ThemedView,
  ThemedText,
  Button,
  LoadingScreen,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  DateTimePicker,
} from "@/components/ui";
import { BatchOperationResultDialog } from "@/components/common/batch-operation-result-dialog";
import { useTheme } from "@/lib/theme";
import { routes, MAINTENANCE_SCHEDULE_STATUS, MAINTENANCE_SCHEDULE_STATUS_LABELS, RESCHEDULE_REASON } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
// import { toast } from "@/lib/toast";

interface BatchEditData {
  // Fields that can be batch edited
  status?: string;
  isActive?: boolean;
  nextRun?: Date | null;
  rescheduleReason?: string | null;
  lastRescheduleDate?: Date | null;
}

// Status options for maintenance schedules
const STATUS_OPTIONS = [
  { value: MAINTENANCE_SCHEDULE_STATUS.PENDING, label: MAINTENANCE_SCHEDULE_STATUS_LABELS[MAINTENANCE_SCHEDULE_STATUS.PENDING] },
  { value: MAINTENANCE_SCHEDULE_STATUS.FINISHED, label: MAINTENANCE_SCHEDULE_STATUS_LABELS[MAINTENANCE_SCHEDULE_STATUS.FINISHED] },
  { value: MAINTENANCE_SCHEDULE_STATUS.CANCELLED, label: MAINTENANCE_SCHEDULE_STATUS_LABELS[MAINTENANCE_SCHEDULE_STATUS.CANCELLED] },
];

// Reschedule reason options
const RESCHEDULE_REASON_OPTIONS = [
  { value: RESCHEDULE_REASON.LOW_FUNDS, label: "Falta de Recursos" },
  { value: RESCHEDULE_REASON.SUPPLIER_DELAY, label: "Atraso do Fornecedor" },
  { value: RESCHEDULE_REASON.OPERATIONAL_ISSUE, label: "Problema Operacional" },
  { value: RESCHEDULE_REASON.PRIORITY_CHANGE, label: "Mudança de Prioridade" },
  { value: RESCHEDULE_REASON.SEASONAL_ADJUSTMENT, label: "Ajuste Sazonal" },
  { value: RESCHEDULE_REASON.EMERGENCY, label: "Emergência" },
  { value: RESCHEDULE_REASON.OTHER, label: "Outro" },
];

export default function MaintenanceScheduleBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [batchResult, setBatchResult] = useState<any | null>(null);

  // Track which fields are enabled for batch editing
  const [enabledFields, setEnabledFields] = useState<Record<keyof BatchEditData, boolean>>({
    status: false,
    isActive: false,
    nextRun: false,
    rescheduleReason: false,
    lastRescheduleDate: false,
  });

  // Batch edit data
  const [batchData, setBatchData] = useState<BatchEditData>({
    status: MAINTENANCE_SCHEDULE_STATUS.PENDING,
    isActive: true,
    nextRun: null,
    rescheduleReason: null,
    lastRescheduleDate: null,
  });

  // Get schedule IDs from URL params
  const scheduleIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch schedules to edit
  const {
    data: schedulesResponse,
    isLoading: isLoadingSchedules,
    error: schedulesError,
  } = useMaintenanceSchedules(
    {
      where: {
        id: { in: scheduleIds },
      },
      include: {
        item: true,
      },
    },
    {
      enabled: scheduleIds.length > 0,
    }
  );

  const { batchUpdateAsync: batchUpdate } = useMaintenanceScheduleBatchMutations();

  const schedules = schedulesResponse?.data || [];
  const hasValidSchedules = schedules.length > 0;
  const allSchedulesFound = schedules.length === scheduleIds.length;

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.inventory.maintenance.schedules.root) as any);
  };

  const toggleField = (field: keyof BatchEditData) => {
    setEnabledFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const updateBatchData = (field: keyof BatchEditData, value: any) => {
    setBatchData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateBatchData = (): string | null => {
    // Check if at least one field is enabled
    const hasEnabledField = Object.values(enabledFields).some((enabled) => enabled);
    if (!hasEnabledField) {
      return "Selecione pelo menos um campo para editar";
    }

    // Validate date fields
    if (enabledFields.nextRun && !batchData.nextRun) {
      return "Data de próxima execução é obrigatória quando selecionada";
    }

    if (enabledFields.rescheduleReason && !batchData.rescheduleReason) {
      return "Motivo do reagendamento é obrigatório quando selecionado";
    }

    // If reschedule reason is set, should also set lastRescheduleDate
    if (enabledFields.rescheduleReason && !enabledFields.lastRescheduleDate) {
      return "Ao definir motivo de reagendamento, defina também a data do reagendamento";
    }

    return null;
  };

  const handleSubmit = () => {
    // Validate before showing confirmation
    const validationError = validateBatchData();
    if (validationError) {
      Alert.alert("Erro", validationError);
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "Confirmar Edição em Lote",
      `Você está prestes a atualizar ${schedules.length} agendamento${schedules.length !== 1 ? "s" : ""} de manutenção. Esta ação não pode ser desfeita. Deseja continuar?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: performBatchUpdate,
        },
      ]
    );
  };

  const performBatchUpdate = async () => {
    setIsSubmitting(true);
    try {
      // Build the update data for each schedule
      const updateData: any = {};

      if (enabledFields.status) {
        updateData.status = batchData.status;
      }
      if (enabledFields.isActive) {
        updateData.isActive = batchData.isActive;
      }
      if (enabledFields.nextRun) {
        updateData.nextRun = batchData.nextRun;
      }
      if (enabledFields.rescheduleReason) {
        updateData.rescheduleReason = batchData.rescheduleReason;
        // Auto-increment reschedule count
        updateData.rescheduleCount = { increment: 1 };
      }
      if (enabledFields.lastRescheduleDate) {
        updateData.lastRescheduleDate = batchData.lastRescheduleDate || new Date();
      }

      // Create batch update payload
      const payload = {
        maintenanceSchedules: scheduleIds.map((id) => ({
          id,
          data: updateData,
        })),
      };

      const result = await batchUpdate(payload);

      if (result?.data) {
        // Transform to BatchOperationResult format (for dialog)
        const batchOperationResult = {
          success: result.data.totalFailed === 0,
          successCount: result.data.totalSuccess,
          failedCount: result.data.totalFailed,
          errors:
            result.data.failed?.map(
              (f: { id?: string; error: string }) => `${schedules.find((s) => s.id === f.id)?.name || "Agendamento"}: ${f.error}`
            ) || [],
        };

        setBatchResult(batchOperationResult);
        setShowResultDialog(true);

        // Show alert notification
        if (result.data.totalSuccess > 0) {
          Alert.alert(
            "Sucesso",
            `${result.data.totalSuccess} agendamento${result.data.totalSuccess !== 1 ? "s" : ""} atualizado${result.data.totalSuccess !== 1 ? "s" : ""} com sucesso`
          );
        }

        if (result.data.totalFailed > 0) {
          Alert.alert(
            "Erro",
            `${result.data.totalFailed} agendamento${result.data.totalFailed !== 1 ? "s" : ""} falhou ao atualizar`
          );
        }
      }
    } catch (error) {
      console.error("Batch update error:", error);
      // API client already shows error alert

      // Show error in dialog
      setBatchResult({
        success: false,
        successCount: 0,
        failedCount: scheduleIds.length,
        errors: ["Erro ao processar a atualização em lote"],
      });
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    if (batchResult?.success || (batchResult?.successCount ?? 0) > 0) {
      // Navigate back to list if there were any successes
      router.push(routeToMobilePath(routes.inventory.maintenance.schedules.root) as any);
    }
  };

  // Loading and error states
  if (scheduleIds.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconCalendar size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhum Agendamento Selecionado
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Nenhum agendamento foi selecionado para edição em lote.
          </ThemedText>
          <Button variant="outline" onPress={handleCancel} style={styles.button}>
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isLoadingSchedules) {
    return <LoadingScreen message="Carregando agendamentos..." />;
  }

  if (schedulesError || !hasValidSchedules) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconAlertTriangle size={48} color={colors.destructive} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Erro ao Carregar Agendamentos
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            {schedulesError
              ? "Ocorreu um erro ao carregar os agendamentos selecionados."
              : "Os agendamentos selecionados não foram encontrados."}
          </ThemedText>
          {!allSchedulesFound && schedules.length > 0 && (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: colors.warning + "20", borderColor: colors.warning },
              ]}
            >
              <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                Apenas {schedules.length} de {scheduleIds.length} agendamentos foram encontrados.
              </ThemedText>
            </View>
          )}
          <Button variant="outline" onPress={handleCancel} style={styles.button}>
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Editar Agendamentos em Lote
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {schedules.length} agendamento{schedules.length !== 1 ? "s" : ""} selecionado
            {schedules.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        {/* Info Card */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          <ThemedText style={[styles.infoText, { color: colors.mutedForeground }]}>
            Selecione os campos que deseja alterar e defina os novos valores. As alterações serão
            aplicadas a todos os agendamentos selecionados.
          </ThemedText>
        </View>

        {/* Batch Edit Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Campos para Edição
          </ThemedText>

          {/* Status Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch checked={enabledFields.status} onCheckedChange={() => toggleField("status")} />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Status
              </ThemedText>
            </View>
            {enabledFields.status && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.status || undefined}
                  onValueChange={(value) => updateBatchData("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label} />
                    ))}
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          {/* Active Status Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.isActive}
                onCheckedChange={() => toggleField("isActive")}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Agendamento Ativo
              </ThemedText>
            </View>
            {enabledFields.isActive && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.isActive ? "true" : "false"}
                  onValueChange={(value) => updateBatchData("isActive", value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" label="Ativo" />
                    <SelectItem value="false" label="Inativo" />
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          {/* Next Run Date Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch checked={enabledFields.nextRun} onCheckedChange={() => toggleField("nextRun")} />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Próxima Execução
              </ThemedText>
            </View>
            {enabledFields.nextRun && (
              <View style={styles.fieldInput}>
                <DateTimePicker
                  value={batchData.nextRun || new Date()}
                  onChange={(date) => updateBatchData("nextRun", date)}
                  minimumDate={new Date()}
                />
              </View>
            )}
          </View>

          {/* Reschedule Reason Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.rescheduleReason}
                onCheckedChange={() => toggleField("rescheduleReason")}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Motivo do Reagendamento
              </ThemedText>
            </View>
            {enabledFields.rescheduleReason && (
              <View style={styles.fieldInput}>
                <Select
                  value={batchData.rescheduleReason || undefined}
                  onValueChange={(value) => updateBatchData("rescheduleReason", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESCHEDULE_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label} />
                    ))}
                  </SelectContent>
                </Select>
                {enabledFields.rescheduleReason && (
                  <View
                    style={[
                      styles.infoCard,
                      { backgroundColor: colors.muted, borderColor: colors.border, marginTop: 8 },
                    ]}
                  >
                    <ThemedText style={[styles.infoTextSmall, { color: colors.mutedForeground }]}>
                      Ao definir o motivo, a contagem de reagendamentos será incrementada
                      automaticamente.
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Last Reschedule Date Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Switch
                checked={enabledFields.lastRescheduleDate}
                onCheckedChange={() => toggleField("lastRescheduleDate")}
              />
              <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
                Data do Reagendamento
              </ThemedText>
            </View>
            {enabledFields.lastRescheduleDate && (
              <View style={styles.fieldInput}>
                <DateTimePicker
                  value={batchData.lastRescheduleDate || new Date()}
                  onChange={(date) => updateBatchData("lastRescheduleDate", date)}
                  maximumDate={new Date()}
                />
              </View>
            )}
          </View>
        </View>

        {/* Selected Schedules List */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Agendamentos Selecionados
          </ThemedText>
          <View style={styles.schedulesList}>
            {schedules.map((schedule, index) => (
              <View
                key={schedule.id}
                style={[
                  styles.scheduleItem,
                  { borderBottomColor: colors.border },
                  index === schedules.length - 1 && styles.scheduleItemLast,
                ]}
              >
                <ThemedText style={[styles.scheduleName, { color: colors.foreground }]}>
                  {schedule.name}
                </ThemedText>
                {schedule.item && (
                  <ThemedText style={[styles.scheduleItem, { color: colors.mutedForeground }]}>
                    Item: {schedule.item.name}
                  </ThemedText>
                )}
                <ThemedText style={[styles.scheduleStatus, { color: colors.mutedForeground }]}>
                  Status Atual: {MAINTENANCE_SCHEDULE_STATUS_LABELS[schedule.status as keyof typeof MAINTENANCE_SCHEDULE_STATUS_LABELS] || schedule.status}
                  {" • "}
                  {schedule.isActive ? "Ativo" : "Inativo"}
                </ThemedText>
                {schedule.nextRun && (
                  <ThemedText style={[styles.scheduleDate, { color: colors.mutedForeground }]}>
                    Próxima Execução:{" "}
                    {new Date(schedule.nextRun).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={styles.footerButton}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onPress={handleSubmit}
            disabled={isSubmitting}
            icon={<IconDeviceFloppy size={20} color={colors.primaryForeground} />}
            style={styles.footerButton}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ScrollView>

      {/* Batch Operation Result Dialog */}
      <BatchOperationResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        result={batchResult}
        onConfirm={handleResultDialogClose}
        itemType="agendamentos"
        itemTypeSingular="agendamento"
        title="Resultado da Edição em Lote"
        description="Resumo da operação de atualização"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoTextSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    minWidth: 120,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  fieldInput: {
    marginLeft: 44,
  },
  schedulesList: {
    gap: 0,
  },
  scheduleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scheduleItemLast: {
    borderBottomWidth: 0,
  },
  scheduleName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  scheduleStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  scheduleDate: {
    fontSize: 11,
    marginTop: 2,
  },
  warningCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  footerButton: {
    flex: 1,
  },
});
