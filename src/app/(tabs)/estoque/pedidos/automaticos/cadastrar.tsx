import { useState, useCallback } from "react";
import { View, ScrollView, Alert, KeyboardAvoidingView , StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderScheduleMutations, useScreenReady} from '@/hooks';
import { orderScheduleCreateSchema} from '../../../../../schemas';
import type { OrderScheduleCreateFormData } from '../../../../../schemas';
import { SCHEDULE_FREQUENCY, SCHEDULE_FREQUENCY_LABELS } from "@/constants";
import {
  ThemedView,
  ThemedText,
  Card,
  Button,
  Input,

  Switch,
} from "@/components/ui";
import { FormHeader } from "@/components/ui/form-header";
import { FormSection } from "@/components/ui/form-section";
import { spacing, fontSize } from "@/constants/design-system";

import { ItemMultiSelector } from "@/components/inventory/item/item-multi-selector";
import { FrequencySelector } from "@/components/inventory/order/schedule/frequency-selector";
import { ScheduleConfigurationForm } from "@/components/inventory/order/schedule/schedule-configuration-form";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";


import { Skeleton } from "@/components/ui/skeleton";

export default function CreateAutomaticOrderScreen() {
  useScreenReady();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const canCreate = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<OrderScheduleCreateFormData>({
    resolver: zodResolver(orderScheduleCreateSchema),
    defaultValues: {
      frequency: SCHEDULE_FREQUENCY.MONTHLY,
      frequencyCount: 1,
      isActive: true,
      items: [],
    },
    mode: "onChange",
  });

  const { create: createOrderSchedule } = useOrderScheduleMutations({
    onCreateSuccess: (_data) => {
      Alert.alert("Sucesso", "Agendamento automático criado com sucesso", [
        {
          text: "OK",
          onPress: () => {
            router.push(routeToMobilePath(routes.inventory.orders.automatic.root) as any);
          },
        },
      ]);
    },
  });

  // Watch form values for dynamic behavior
  const watchedFrequency = watch("frequency");
  const watchedItems = watch("items");

  const onSubmit = useCallback(
    async (data: OrderScheduleCreateFormData) => {
      if (!canCreate) {
        Alert.alert("Sem permissão", "Você não tem permissão para criar agendamentos automáticos");
        return;
      }

      setIsSubmitting(true);
      try {
        await createOrderSchedule(data);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível criar o agendamento automático. Tente novamente.");
        console.error("Error creating order schedule:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createOrderSchedule, canCreate],
  );

  const handleCancel = useCallback(() => {
    Alert.alert("Cancelar", "Tem certeza que deseja cancelar? As alterações serão perdidas.", [
      { text: "Continuar Editando", style: "cancel" },
      { text: "Cancelar", style: "destructive", onPress: () => router.back() },
    ]);
  }, [router]);

  if (!canCreate) {
    return (
      <ThemedView style={styles.container}>
        <FormHeader
          title="Novo Agendamento Automático"
          onCancel={handleCancel}
          showActions={false}
        />
        <View style={styles.permissionContainer}>
          <ThemedText style={styles.permissionText}>
            Você não tem permissão para criar agendamentos automáticos
          </ThemedText>
          <Button variant="outline" onPress={() => router.back()}>
            <ThemedText>Voltar</ThemedText>
          </Button>
        </View>
      </ThemedView>
    );
  }

  if (isSubmitting) {
    return <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
        <Skeleton style={{ height: 24, width: '40%', borderRadius: 4 }} />
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '70%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
        </View>
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '80%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
        </View>
      </View>;
  }

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      <FormHeader
        title="Novo Agendamento Automático"
        onCancel={handleCancel}
        onSave={handleSubmit(onSubmit)}
        canSave={isValid && !isSubmitting}
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
                {errors.frequency && (
                  <ThemedText variant="destructive" size="xs" style={{ marginTop: 4 }}>
                    {errors.frequency.message}
                  </ThemedText>
                )}
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
                {errors.frequencyCount && (
                  <ThemedText variant="destructive" size="xs" style={{ marginTop: 4 }}>
                    {errors.frequencyCount.message}
                  </ThemedText>
                )}
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
                      value={value}
                      onValueChange={onChange}
                    />
                  )}
                />
                {errors.items && (
                  <ThemedText variant="destructive" size="xs" style={{ marginTop: 4 }}>
                    {errors.items.message}
                  </ThemedText>
                )}
                {watchedItems.length > 0 && (
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
                    {SCHEDULE_FREQUENCY_LABELS[watchedFrequency as SCHEDULE_FREQUENCY] || watchedFrequency}
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
                    {watchedItems.length} selecionado{watchedItems.length !== 1 ? "s" : ""}
                  </ThemedText>
                </View>
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
              disabled={!isValid || isSubmitting}
            >
              <ThemedText>{isSubmitting ? "Criando..." : "Criar Agendamento"}</ThemedText>
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
    padding: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
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