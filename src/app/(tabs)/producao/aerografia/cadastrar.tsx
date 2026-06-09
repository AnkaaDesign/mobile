import React from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAirbrushingMutations, useTasks } from "@/hooks";
import { useFormFlow } from "@/hooks/use-form-flow";
import { airbrushingCreateSchema, type AirbrushingCreateFormData } from "../../../../schemas";
import {
  AIRBRUSHING_STATUS,
  AIRBRUSHING_STATUS_LABELS,
  AIRBRUSHING_PAYMENT_STATUS,
  AIRBRUSHING_PAYMENT_STATUS_LABELS,
  SECTOR_PRIVILEGES,
  routes,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { FormScreen } from "@/components/screens/form-screen";
import { PainterSelector } from "@/components/production/airbrushing/form/painter-selector";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { IconBrush, IconClock, IconTag, IconFileText } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCurrency } from "@/utils";

export default function AirbrushingCreateScreen() {
  const { colors } = useTheme();
  const { createAsync } = useAirbrushingMutations();

  const tasksQuery = useTasks({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, fantasyName: true } },
      truck: { select: { id: true, plate: true } },
    },
    where: { airbrushing: null },
  });

  const tasks = tasksQuery.data?.data || [];

  const form = useForm<AirbrushingCreateFormData>({
    resolver: zodResolver(airbrushingCreateSchema),
    defaultValues: {
      status: AIRBRUSHING_STATUS.PENDING,
      paymentStatus: AIRBRUSHING_PAYMENT_STATUS.PENDING,
      price: null,
      startDate: null,
      finishDate: null,
      startedAt: null,
      finishedAt: null,
      painterId: null,
    },
    mode: "onChange",
  });

  const flow = useFormFlow<AirbrushingCreateFormData, any>({
    form,
    mutation: async (data) =>
      createAsync({
        ...data,
        price:
          typeof data.price === "string" ? parseFloat(data.price) || null : data.price,
      }),
    successRoute: (result) => {
      const newId = (result as any)?.data?.id || (result as any)?.id;
      return mobileRoute(
        newId
          ? routes.production.airbrushings.details(newId)
          : routes.production.airbrushings.root,
      );
    },
    successAction: "replace",
    cancelFallback: mobileRoute(routes.production.airbrushings.root),
  });

  const watchedPrice = form.watch("price");
  // Payment status is only editable once the airbrushing is completed.
  // Uses form.watch (never useState) so it stays reactive to form resets.
  const watchedStatus = form.watch("status");
  const isPaymentStatusEnabled = watchedStatus === AIRBRUSHING_STATUS.COMPLETED;
  const errors = form.formState.errors;

  return (
    <FormScreen<AirbrushingCreateFormData, any>
      mode="create"
      title="Criar Airbrushing"
      form={form}
      flow={flow}
      privilege={{ any: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.ADMIN] }}
      submittingLabel="Criando..."
      submitLabel="Criar"
      loadQuery={tasksQuery as any}
    >
      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Novo Airbrushing</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={{ fontSize: 14, color: colors.muted }}>
            Preencha as informações para criar um novo airbrushing
          </ThemedText>
        </View>
      </Card>

      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconTag size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Tarefa</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <Label style={{ marginBottom: spacing.xs }}>Tarefa *</Label>
          <Controller
            control={form.control}
            name="taskId"
            render={({ field }) => (
              <Combobox
                value={field.value}
                onValueChange={field.onChange}
                options={tasks.map((task: any) => ({
                  value: task.id,
                  label: `${task.name} - ${task.customer?.fantasyName} - ${task.truck?.plate}`,
                }))}
                placeholder="Selecione uma tarefa"
                emptyText="Nenhuma tarefa disponível"
              />
            )}
          />
          {errors.taskId && (
            <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
              {errors.taskId.message as any}
            </ThemedText>
          )}
        </View>
      </Card>

      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Preço e Pintor</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Label style={{ marginBottom: spacing.xs }}>Preço (R$)</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <Input
                    value={field.value?.toString() || ""}
                    onChangeText={(text) => {
                      const cleanText = String(text || "")
                        .replace(/[^0-9.,]/g, "")
                        .replace(",", ".");
                      const numValue = cleanText ? parseFloat(cleanText) : null;
                      field.onChange(numValue);
                    }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                )}
              />
            </View>
            <View style={styles.rowItem}>
              <Controller
                control={form.control}
                name="painterId"
                render={({ field }) => (
                  <PainterSelector
                    label="Pintor"
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.painterId?.message as any}
                  />
                )}
              />
            </View>
          </View>
          {watchedPrice ? (
            <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
              {formatCurrency(watchedPrice)}
            </ThemedText>
          ) : null}
          {errors.price && (
            <ThemedText style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}>
              {errors.price.message as any}
            </ThemedText>
          )}
        </View>
      </Card>

      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconFileText size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Status</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View>
            <Label style={{ marginBottom: spacing.xs }}>Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={Object.values(AIRBRUSHING_STATUS).map((status) => ({
                    value: status,
                    label:
                      AIRBRUSHING_STATUS_LABELS[
                        status as keyof typeof AIRBRUSHING_STATUS_LABELS
                      ],
                  }))}
                  placeholder="Selecione o status"
                />
              )}
            />
          </View>
          <View>
            <Label style={{ marginBottom: spacing.xs }}>Status de Pagamento</Label>
            <Controller
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={Object.values(AIRBRUSHING_PAYMENT_STATUS).map((paymentStatus) => ({
                    value: paymentStatus,
                    label: AIRBRUSHING_PAYMENT_STATUS_LABELS[paymentStatus],
                  }))}
                  placeholder="Selecione o status de pagamento"
                  disabled={!isPaymentStatusEnabled}
                />
              )}
            />
            {!isPaymentStatusEnabled && (
              <ThemedText style={{ fontSize: 12, color: colors.muted, marginTop: spacing.xs }}>
                Disponível apenas quando o status for Concluído
              </ThemedText>
            )}
          </View>
        </View>
      </Card>

      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconClock size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Datas</ThemedText>
          </View>
        </View>
        <View style={[styles.content, { gap: spacing.md }]}>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Label style={{ marginBottom: spacing.xs }}>Início Previsto</Label>
              <Controller
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Selecione a data"
                  />
                )}
              />
            </View>
            <View style={styles.rowItem}>
              <Label style={{ marginBottom: spacing.xs }}>Término Previsto</Label>
              <Controller
                control={form.control}
                name="finishDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Selecione a data"
                  />
                )}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Label style={{ marginBottom: spacing.xs }}>Iniciado em</Label>
              <Controller
                control={form.control}
                name="startedAt"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Selecione a data"
                  />
                )}
              />
            </View>
            <View style={styles.rowItem}>
              <Label style={{ marginBottom: spacing.xs }}>Finalizado em</Label>
              <Controller
                control={form.control}
                name="finishedAt"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Selecione a data"
                  />
                )}
              />
            </View>
          </View>
        </View>
      </Card>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
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
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
});
