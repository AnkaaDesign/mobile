import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAirbrushingDetail, useAirbrushingMutations } from "@/hooks";
import { useFormFlow } from "@/hooks/use-form-flow";
import {
  airbrushingUpdateSchema,
  mapAirbrushingToFormData,
  type AirbrushingUpdateFormData,
} from "../../../../../schemas";
import {
  AIRBRUSHING_STATUS,
  AIRBRUSHING_STATUS_LABELS,
  AIRBRUSHING_PAYMENT_STATUS,
  AIRBRUSHING_PAYMENT_STATUS_LABELS,
  SECTOR_PRIVILEGES,
  routes,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { EDITABLE_AIRBRUSHING_STATUSES } from "@/constants/editable-statuses";
import { FormScreen } from "@/components/screens/form-screen";
import { PainterSelector } from "@/components/production/airbrushing/form/painter-selector";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  IconBrush,
  IconClock,
  IconTag,
  IconFileText,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCurrency } from "@/utils";

export default function AirbrushingEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AirbrushingEditScreenInner key={id} />;
}

function AirbrushingEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { updateAsync } = useAirbrushingMutations();

  const query = useAirbrushingDetail(id as string, {
    include: {
      task: {
        include: {
          customer: true,
          truck: true,
        },
      },
      painter: true,
    },
  });

  const airbrushing = query.data?.data;

  const form = useForm<AirbrushingUpdateFormData>({
    resolver: zodResolver(airbrushingUpdateSchema),
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

  useEffect(() => {
    if (airbrushing) {
      form.reset(mapAirbrushingToFormData(airbrushing));
    }
  }, [airbrushing, form]);

  const flow = useFormFlow<AirbrushingUpdateFormData, any>({
    form,
    mutation: async (data) =>
      updateAsync({
        id: id as string,
        data: {
          ...data,
          price:
            typeof data.price === "string"
              ? parseFloat(data.price) || null
              : data.price,
        },
      }),
    successRoute: () =>
      mobileRoute(routes.production.airbrushings.details(id as string)),
    successAction: "replace",
    cancelFallback: mobileRoute(routes.production.airbrushings.root),
    blockOnTerminalStatus: airbrushing
      ? { entity: airbrushing, editable: EDITABLE_AIRBRUSHING_STATUSES }
      : undefined,
  });

  const watchedPrice = form.watch("price");
  // Payment status is only editable once the airbrushing is completed.
  // Uses form.watch (never useState) so it stays reactive to form resets.
  const watchedStatus = form.watch("status");
  const isPaymentStatusEnabled = watchedStatus === AIRBRUSHING_STATUS.COMPLETED;
  const errors = form.formState.errors;

  return (
    <FormScreen<AirbrushingUpdateFormData, any>
      mode="edit"
      title="Editar Airbrushing"
      form={form}
      flow={flow}
      privilege={{ any: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.ADMIN] }}
      submittingLabel="Salvando..."
      submitLabel="Salvar"
      loadQuery={query as any}
      editGuard={{ editable: EDITABLE_AIRBRUSHING_STATUSES }}
    >
      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBrush size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Editar Airbrushing</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <ThemedText style={{ fontSize: 14, color: colors.muted }}>
            Edite as informações do airbrushing
          </ThemedText>
        </View>
      </Card>

      {airbrushing?.task && (
        <Card style={[styles.card, { marginBottom: spacing.md }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconTag size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Tarefa Vinculada</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View
              style={{
                backgroundColor: colors.muted + "20",
                padding: spacing.sm,
                borderRadius: 8,
              }}
            >
              <ThemedText style={{ fontWeight: "500" }}>
                {airbrushing.task.name}
              </ThemedText>
              {airbrushing.task.customer && (
                <ThemedText style={{ fontSize: 12, color: colors.muted }}>
                  Cliente: {airbrushing.task.customer.fantasyName}
                </ThemedText>
              )}
              {airbrushing.task.truck?.plate && (
                <ThemedText style={{ fontSize: 12, color: colors.muted }}>
                  Veículo: {airbrushing.task.truck.plate}
                </ThemedText>
              )}
            </View>
          </View>
        </Card>
      )}

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
                    initialPainter={airbrushing?.painter}
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
            <ThemedText
              style={{ color: colors.destructive, fontSize: 12, marginTop: spacing.xs }}
            >
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
