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
  SECTOR_PRIVILEGES,
  routes,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { FormScreen } from "@/components/screens/form-screen";

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
      price: null,
      startDate: null,
      finishDate: null,
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
            <IconFileText size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Status</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
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
      </Card>

      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconClock size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Datas</ThemedText>
          </View>
        </View>
        <View style={[styles.content, { gap: spacing.md }]}>
          <View>
            <Label style={{ marginBottom: spacing.xs }}>Data de Início</Label>
            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  placeholder="Selecione a data de início"
                />
              )}
            />
          </View>
          <View>
            <Label style={{ marginBottom: spacing.xs }}>Data de Finalização</Label>
            <Controller
              control={form.control}
              name="finishDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  placeholder="Selecione a data de finalização"
                />
              )}
            />
          </View>
        </View>
      </Card>

      <Card style={[styles.card, { marginBottom: spacing.md }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconTag size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Preço</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
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
});
