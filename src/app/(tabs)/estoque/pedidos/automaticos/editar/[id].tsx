import { useState, useCallback, useEffect } from "react";
import { View, ScrollView, Alert, KeyboardAvoidingView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderSchedule, useOrderScheduleMutations } from "@/hooks";
import { orderScheduleUpdateSchema, mapOrderScheduleToFormData, type OrderScheduleUpdateFormData, type OrderScheduleInclude } from '../../../../../../schemas';
import type { OrderSchedule } from '../../../../../../types';
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS, SECTOR_PRIVILEGES, routes } from "@/constants";
import { hasPrivilege } from "@/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  ThemedView,
  ThemedText,
  Card,
  Button,
  Input,
  
  Switch,
  LoadingScreen,
  ErrorScreen,
} from "@/components/ui";
import { FormHeader } from "@/components/ui/form-header";
import { FormSection } from "@/components/ui/form-section";
import { ItemMultiSelector } from "@/components/inventory/item/item-multi-selector";
import { FrequencySelector } from "@/components/inventory/order/schedule/frequency-selector";
import { ScheduleConfigurationForm } from "@/components/inventory/order/schedule/schedule-configuration-form";
import { useTheme } from "@/lib/theme";
import { routeToMobilePath } from '@/utils/route-mapper';

export default function EditAutomaticOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);

  const scheduleId = params.id!;

  const include: OrderScheduleInclude = {
    weeklyConfig: { include: { daysOfWeek: true } },
    monthlyConfig: { include: { occurrences: true } },
    yearlyConfig: { include: { monthlyConfigs: true } },
  };

  const {
    data: response,
    isLoading: isLoadingSchedule,
    error: scheduleError,
    refetch,
  } = useOrderSchedule(scheduleId, {
    include,
  });

  const schedule = response?.data as OrderSchedule | undefined;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<OrderScheduleUpdateFormData>({
    resolver: zodResolver(orderScheduleUpdateSchema),
    defaultValues: {
      frequency: SCHEDULE_FREQUENCY.MONTHLY,
      frequencyCount: 1,
      isActive: true,
      items: [],
    },
    mode: "onChange",
  });

  const { update: updateOrderSchedule } = useOrderScheduleMutations({
    onUpdateSuccess: (_data) => {
      Alert.alert("Sucesso", "Agendamento automático atualizado com sucesso", [
        {
          text: "OK",
          onPress: () => {
            router.push(routeToMobilePath(routes.inventory.orders.automatic.details(scheduleId)) as any);
          },
        },
      ]);
    },
  });

  // Initialize form with schedule data
  useEffect(() => {
    if (schedule && !isFormReady) {
      const formData = mapOrderScheduleToFormData(schedule);
      reset(formData);
      setIsFormReady(true);
    }
  }, [schedule, reset, isFormReady]);

  // Watch form values for dynamic behavior
  const watchedFrequency = watch("frequency");
  const watchedItems = watch("items") as string[] | undefined;

  const onSubmit = useCallback(
    async (data: OrderScheduleUpdateFormData) => {
      if (!canEdit) {
        Alert.alert("Sem permissão", "Você não tem permissão para editar agendamentos automáticos");
        return;
      }

      if (!isDirty) {
        Alert.alert("Sem alterações", "Nenhuma alteração foi feita para salvar.");
        return;
      }

      setIsSubmitting(true);
      try {
        await updateOrderSchedule({ id: scheduleId, data });
      } catch (error) {
        Alert.alert("Erro", "Não foi possível atualizar o agendamento automático. Tente novamente.");
        console.error("Error updating order schedule:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateOrderSchedule, scheduleId, canEdit, isDirty],
  );

  const handleCancel = useCallback(() => {
    if (isDirty) {
      Alert.alert("Cancelar", "Tem certeza que deseja cancelar? As alterações serão perdidas.", [
        { text: "Continuar Editando", style: "cancel" },
        { text: "Cancelar", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [router, isDirty]);

  if (!canEdit) {
    return (
      <ThemedView style={styles.container}>
        <FormHeader
          title="Editar Agendamento"
          onCancel={() => router.back()}
          showActions={false}
        />
        <View style={styles.permissionContainer}>
          <ThemedText style={styles.permissionText}>
            Você não tem permissão para editar agendamentos automáticos
          </ThemedText>
          <Button variant="outline" onPress={() => router.back()}>
            <ThemedText>Voltar</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isLoadingSchedule) {
    return <LoadingScreen message="Carregando agendamento..." />;
  }

  if (scheduleError) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar agendamento"
          detail={scheduleError.message}
          onRetry={() => refetch()}
        />
      </ThemedView>
    );
  }

  if (!schedule) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Agendamento não encontrado"
          detail="O agendamento automático solicitado não foi encontrado"
          onRetry={() => router.back()}
        />
      </ThemedView>
    );
  }

  if (isSubmitting) {
    return <LoadingScreen message="Atualizando agendamento automático..." />;
  }

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      <FormHeader
        title="Editar Agendamento"
        onCancel={handleCancel}
        onSave={handleSubmit(onSubmit)}
        canSave={isValid && isDirty && !isSubmitting}
        isSaving={isSubmitting}
      />

      <KeyboardAvoidingView style={styles.keyboardAvoidingView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Configuration */}
          <FormSection title="Configuração Básica" icon="settings">
            <Card style={styles.card}>
              {/* Frequency Selection */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.fieldLabel}>Frequência *</ThemedText>
                <Controller
                  control={control}
                  name="frequency"
                  render={({ field: { onChange, value } }) => (
                    <FrequencySelector
                      value={value as SCHEDULE_FREQUENCY}
                      onValueChange={onChange}
                    />
                  )}
                />
                {errors.frequency && <ThemedText variant="destructive" size="sm">{errors.frequency.message}</ThemedText>}
              </View>

              {/* Frequency Count */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.fieldLabel}>A cada (números) *</ThemedText>
                <Controller
                  control={control}
                  name="frequencyCount"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={String(value || '')}
                      onChangeText={(text) => onChange(parseInt(String(text ?? ''), 10) || 1)}
                      placeholder="1"
                      keyboardType="numeric"
                      error={!!errors.frequencyCount}
                    />
                  )}
                />
                {errors.frequencyCount && <ThemedText variant="destructive" size="sm">{errors.frequencyCount.message}</ThemedText>}
              </View>

              {/* Active Status */}
              <View style={styles.fieldContainer}>
                <View style={styles.switchRow}>
                  <View style={styles.switchContent}>
                    <ThemedText style={styles.fieldLabel}>Ativar Automaticamente</ThemedText>
                    <ThemedText style={styles.fieldHelper}>
                      O agendamento será executado automaticamente quando ativo
                    </ThemedText>
                  </View>
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field: { onChange, value } }) => (
                      <Switch checked={value} onCheckedChange={onChange} />
                    )}
                  />
                </View>
              </View>
            </Card>
          </FormSection>

          {/* Schedule Configuration */}
          <FormSection title="Configuração de Horário" icon="calendar">
            <Card style={styles.card}>
              <Controller
                control={control}
                name="specificDate"
                render={({ field: { onChange, value } }) => (
                  <ScheduleConfigurationForm
                    frequency={watchedFrequency as SCHEDULE_FREQUENCY}
                    value={{
                      specificDate: value,
                      dayOfMonth: watch("dayOfMonth"),
                      dayOfWeek: watch("dayOfWeek"),
                      month: watch("month"),
                      customMonths: watch("customMonths"),
                    }}
                    onValueChange={(newValue) => {
                      if (newValue.specificDate !== undefined) onChange(newValue.specificDate);
                      if (newValue.dayOfMonth !== undefined) setValue("dayOfMonth", newValue.dayOfMonth);
                      if (newValue.dayOfWeek !== undefined) setValue("dayOfWeek", newValue.dayOfWeek);
                      if (newValue.month !== undefined) setValue("month", newValue.month);
                      if (newValue.customMonths !== undefined) setValue("customMonths", newValue.customMonths);
                    }}
                  />
                )}
              />
            </Card>
          </FormSection>

          {/* Items Selection */}
          <FormSection title="Itens" icon="package">
            <Card style={styles.card}>
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.fieldLabel}>Itens para Pedido *</ThemedText>
                <ThemedText style={styles.fieldHelper}>
                  Selecione os itens que serão incluídos automaticamente nos pedidos
                </ThemedText>
                <Controller
                  control={control}
                  name="items"
                  render={({ field: { onChange, value } }) => (
                    <ItemMultiSelector
                      value={(value as string[]) || []}
                      onValueChange={onChange}
                      supplierId={undefined}
                    />
                  )}
                />
                {errors.items && <ThemedText variant="destructive" size="sm">{errors.items.message}</ThemedText>}
                {watchedItems && watchedItems.length > 0 && (
                  <ThemedText style={styles.selectedItemsText}>
                    {watchedItems.length} item{watchedItems.length > 1 ? "ns" : ""} selecionado{watchedItems.length > 1 ? "s" : ""}
                  </ThemedText>
                )}
              </View>
            </Card>
          </FormSection>

          {/* Summary */}
          <FormSection title="Resumo" icon="info">
            <Card style={styles.card}>
              <View style={styles.summaryContainer}>
                <ThemedText style={styles.summaryTitle}>Configuração do Agendamento</ThemedText>

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Frequência:</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {SCHEDULE_FREQUENCY_LABELS[watchedFrequency as keyof typeof SCHEDULE_FREQUENCY_LABELS] || watchedFrequency}
                  </ThemedText>
                </View>

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>A cada:</ThemedText>
                  <ThemedText style={styles.summaryValue}>{watch("frequencyCount") || 1} vez(es)</ThemedText>
                </View>

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Status:</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {watch("isActive") ? "Ativo" : "Inativo"}
                  </ThemedText>
                </View>

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Itens:</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {(watchedItems || []).length} selecionado{(watchedItems || []).length !== 1 ? "s" : ""}
                  </ThemedText>
                </View>

                {isDirty && (
                  <View style={StyleSheet.flatten([styles.summaryRow, styles.changedIndicator])}>
                    <ThemedText style={StyleSheet.flatten([styles.summaryLabel, { color: colors.primary }])}>
                      ⚠️ Alterações pendentes
                    </ThemedText>
                  </View>
                )}
              </View>
            </Card>
          </FormSection>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <Button
              variant="default"
              style={styles.actionButton}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || !isDirty || isSubmitting}
            >
              <ThemedText>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</ThemedText>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    gap: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  fieldHelper: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  selectedItemsText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  infoContainer: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  summaryContainer: {
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  changedIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  permissionText: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.7,
  },
});