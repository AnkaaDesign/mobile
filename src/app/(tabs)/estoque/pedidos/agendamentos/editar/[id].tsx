import { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useOrderSchedule, useUpdateOrderSchedule } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useTheme } from "@/lib/theme";
import {
  orderScheduleUpdateSchema,
  mapOrderScheduleToFormData,
  type OrderScheduleUpdateFormData,
} from "@/schemas";
import { SCHEDULE_FREQUENCY, MONTH_OCCURRENCE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { SCHEDULE_FREQUENCY_LABELS } from "@/constants/enum-labels";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ErrorScreen } from "@/components/ui";
import { IconCalendarEvent } from "@tabler/icons-react-native";

const DAY_OF_WEEK_OPTIONS = [
  { label: "Domingo", value: "SUNDAY" },
  { label: "Segunda-feira", value: "MONDAY" },
  { label: "Terca-feira", value: "TUESDAY" },
  { label: "Quarta-feira", value: "WEDNESDAY" },
  { label: "Quinta-feira", value: "THURSDAY" },
  { label: "Sexta-feira", value: "FRIDAY" },
  { label: "Sabado", value: "SATURDAY" },
];

const MONTH_OPTIONS = [
  { label: "Janeiro", value: "JANUARY" },
  { label: "Fevereiro", value: "FEBRUARY" },
  { label: "Marco", value: "MARCH" },
  { label: "Abril", value: "APRIL" },
  { label: "Maio", value: "MAY" },
  { label: "Junho", value: "JUNE" },
  { label: "Julho", value: "JULY" },
  { label: "Agosto", value: "AUGUST" },
  { label: "Setembro", value: "SEPTEMBER" },
  { label: "Outubro", value: "OCTOBER" },
  { label: "Novembro", value: "NOVEMBER" },
  { label: "Dezembro", value: "DECEMBER" },
];

const FREQUENCY_OPTIONS = Object.values(SCHEDULE_FREQUENCY).map((freq) => ({
  label: SCHEDULE_FREQUENCY_LABELS[freq] || freq,
  value: freq,
}));

// Portuguese labels for the positional weekday UX (MONTH_OCCURRENCE_LABELS in
// constants is English; UI stays Portuguese).
const MONTH_OCCURRENCE_OPTIONS = [
  { label: "Primeira", value: MONTH_OCCURRENCE.FIRST },
  { label: "Segunda", value: MONTH_OCCURRENCE.SECOND },
  { label: "Terceira", value: MONTH_OCCURRENCE.THIRD },
  { label: "Quarta", value: MONTH_OCCURRENCE.FOURTH },
  { label: "Ultima", value: MONTH_OCCURRENCE.LAST },
];

type MonthlyMode = "dayOfMonth" | "positional";

export default function OrderScheduleEditScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <OrderScheduleEditScreenInner />
    </PrivilegeGate>
  );
}

function OrderScheduleEditScreenInner() {
  const params = useLocalSearchParams<{ id: string }>();
  const nav = useNav();
  const goBack = () =>
    nav.goBack({ fallback: mobileRoute(routes.inventory.orders.schedules.root) });
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>("dayOfMonth");

  const scheduleId = params.id!;

  const {
    data: response,
    isLoading,
    error,
  } = useOrderSchedule(scheduleId, {
    enabled: !!scheduleId,
    // Recurrence lives in scalar columns on each config (e.g.
    // monthlyConfig.occurrence + dayOfWeek). `true` returns them; the old nested
    // includes referenced non-existent relations and made Prisma throw.
    include: {
      weeklyConfig: true,
      monthlyConfig: true,
      yearlyConfig: true,
    },
  });

  const updateSchedule = useUpdateOrderSchedule(scheduleId);
  useScreenReady(!isLoading);

  const schedule = response?.data;

  const form = useForm<OrderScheduleUpdateFormData>({
    resolver: zodResolver(orderScheduleUpdateSchema),
  });

  // Populate form when data loads
  useEffect(() => {
    if (schedule) {
      const mapped = mapOrderScheduleToFormData(schedule);
      form.reset(mapped);
      // Initialize the monthly mode toggle to positional when the loaded
      // schedule round-tripped a positional config (occurrence + dayOfWeek).
      setMonthlyMode(
        mapped.monthlySchedule?.occurrence && mapped.monthlySchedule?.dayOfWeek
          ? "positional"
          : "dayOfMonth",
      );
    }
  }, [schedule]);

  const watchedFrequency = form.watch("frequency");

  const frequencyGroups = useMemo(() => {
    const freq = watchedFrequency;
    return {
      needsDayOfWeek:
        freq === SCHEDULE_FREQUENCY.WEEKLY ||
        freq === SCHEDULE_FREQUENCY.BIWEEKLY,
      needsDayOfMonth:
        freq === SCHEDULE_FREQUENCY.MONTHLY ||
        freq === SCHEDULE_FREQUENCY.BIMONTHLY ||
        freq === SCHEDULE_FREQUENCY.QUARTERLY ||
        freq === SCHEDULE_FREQUENCY.TRIANNUAL ||
        freq === SCHEDULE_FREQUENCY.QUADRIMESTRAL ||
        freq === SCHEDULE_FREQUENCY.SEMI_ANNUAL,
      needsMonth: freq === SCHEDULE_FREQUENCY.ANNUAL,
      needsSpecificDate:
        freq === SCHEDULE_FREQUENCY.ONCE ||
        freq === SCHEDULE_FREQUENCY.CUSTOM,
      needsNextRun:
        freq !== SCHEDULE_FREQUENCY.ONCE &&
        freq !== SCHEDULE_FREQUENCY.CUSTOM,
    };
  }, [watchedFrequency]);

  const handleSubmit = useCallback(
    async (data: OrderScheduleUpdateFormData) => {
      setIsSubmitting(true);
      try {
        await updateSchedule.mutateAsync(data);
        // Success toast is shown automatically by the API client interceptor
        goBack();
      } catch (error: any) {
        // Error toast is shown automatically by the API client interceptor
        console.error("Error updating order schedule:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateSchedule, scheduleId, goBack]
  );

  const onSubmit = form.handleSubmit(handleSubmit, (errors) => {
    const firstError = Object.values(errors)[0];
    const message = firstError?.message || "Verifique os campos do formulario";
    Alert.alert("Validacao", message as string);
  });

  if (isLoading) {
    return (
      <View style={[styles.scrollView, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !schedule) {
    return <ErrorScreen message="Agendamento nao encontrado" onRetry={() => goBack()} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header */}
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <IconCalendarEvent size={24} color={colors.primary} />
              <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
                Editar Agendamento
              </ThemedText>
            </View>
          </Card>

          <FormProvider {...form}>
            {/* General Info */}
            <Card style={styles.card}>
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Informacoes Gerais
              </ThemedText>

              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                      Nome
                    </ThemedText>
                    <Input
                      value={field.value || ""}
                      onChangeText={field.onChange}
                      placeholder="Nome do agendamento"
                      error={!!fieldState.error}
                    />
                  </View>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                      Descricao
                    </ThemedText>
                    <Input
                      value={field.value || ""}
                      onChangeText={field.onChange}
                      placeholder="Descricao opcional"
                      multiline
                      numberOfLines={3}
                      error={!!fieldState.error}
                    />
                  </View>
                )}
              />

              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <View style={[styles.field, styles.switchRow]}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                      Ativo
                    </ThemedText>
                    <Switch value={field.value} onValueChange={field.onChange} />
                  </View>
                )}
              />
            </Card>

            {/* Frequency Configuration */}
            <Card style={styles.card}>
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Configuracao de Frequencia
              </ThemedText>

              <Controller
                control={form.control}
                name="frequency"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                      Frequencia
                    </ThemedText>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      options={FREQUENCY_OPTIONS}
                      placeholder="Selecione a frequencia"
                    />
                  </View>
                )}
              />

              <Controller
                control={form.control}
                name="frequencyCount"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                      Contagem
                    </ThemedText>
                    <Input
                      value={field.value != null ? String(field.value) : "1"}
                      onChangeText={(text: string) => field.onChange(parseInt(text) || 1)}
                      keyboardType="numeric"
                      placeholder="1"
                      error={!!fieldState.error}
                    />
                  </View>
                )}
              />

              {frequencyGroups.needsDayOfWeek && (
                <Controller
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field, fieldState }) => (
                    <View style={styles.field}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Dia da Semana
                      </ThemedText>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        options={DAY_OF_WEEK_OPTIONS}
                        placeholder="Selecione o dia"
                      />
                    </View>
                  )}
                />
              )}

              {frequencyGroups.needsDayOfMonth && (
                <View style={styles.field}>
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    Configuracao do Mes
                  </ThemedText>
                  <View style={styles.modeToggleRow}>
                    <Button
                      variant={monthlyMode === "dayOfMonth" ? "default" : "outline"}
                      onPress={() => {
                        setMonthlyMode("dayOfMonth");
                        form.setValue("monthlySchedule", undefined);
                      }}
                      style={{ flex: 1 }}
                    >
                      <ThemedText
                        style={{
                          color:
                            monthlyMode === "dayOfMonth"
                              ? colors.primaryForeground
                              : colors.foreground,
                        }}
                      >
                        Dia fixo do mes
                      </ThemedText>
                    </Button>
                    <Button
                      variant={monthlyMode === "positional" ? "default" : "outline"}
                      onPress={() => {
                        setMonthlyMode("positional");
                        form.setValue("dayOfMonth", null);
                      }}
                      style={{ flex: 1 }}
                    >
                      <ThemedText
                        style={{
                          color:
                            monthlyMode === "positional"
                              ? colors.primaryForeground
                              : colors.foreground,
                        }}
                      >
                        Dia da semana
                      </ThemedText>
                    </Button>
                  </View>

                  {monthlyMode === "dayOfMonth" ? (
                    <Controller
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field, fieldState }) => (
                        <View style={styles.field}>
                          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                            Dia do Mes (1-31)
                          </ThemedText>
                          <Input
                            value={field.value != null ? String(field.value) : ""}
                            onChangeText={(text: string) => {
                              const num = parseInt(text);
                              field.onChange(isNaN(num) ? null : Math.min(31, Math.max(1, num)));
                            }}
                            keyboardType="numeric"
                            placeholder="Ex: 15"
                            error={!!fieldState.error}
                          />
                        </View>
                      )}
                    />
                  ) : (
                    <>
                      <Controller
                        control={form.control}
                        name="monthlySchedule.occurrence"
                        render={({ field, fieldState }) => (
                          <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                              Ocorrencia
                            </ThemedText>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                              options={MONTH_OCCURRENCE_OPTIONS}
                              placeholder="Selecione a ocorrencia"
                            />
                          </View>
                        )}
                      />
                      <Controller
                        control={form.control}
                        name="monthlySchedule.dayOfWeek"
                        render={({ field, fieldState }) => (
                          <View style={styles.field}>
                            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                              Dia da Semana
                            </ThemedText>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                              options={DAY_OF_WEEK_OPTIONS}
                              placeholder="Selecione o dia"
                            />
                          </View>
                        )}
                      />
                      <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                        Exemplo: "Primeira Segunda-feira" ou "Ultima Sexta-feira" do mes
                      </ThemedText>
                    </>
                  )}
                </View>
              )}

              {frequencyGroups.needsMonth && (
                <Controller
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field, fieldState }) => (
                    <View style={styles.field}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Dia do Mes (1-31)
                      </ThemedText>
                      <Input
                        value={field.value != null ? String(field.value) : ""}
                        onChangeText={(text: string) => {
                          const num = parseInt(text);
                          field.onChange(isNaN(num) ? null : Math.min(31, Math.max(1, num)));
                        }}
                        keyboardType="numeric"
                        placeholder="Ex: 15"
                        error={!!fieldState.error}
                      />
                    </View>
                  )}
                />
              )}

              {frequencyGroups.needsMonth && (
                <Controller
                  control={form.control}
                  name="month"
                  render={({ field, fieldState }) => (
                    <View style={styles.field}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Mes
                      </ThemedText>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        options={MONTH_OPTIONS}
                        placeholder="Selecione o mes"
                      />
                    </View>
                  )}
                />
              )}

              {frequencyGroups.needsSpecificDate && (
                <Controller
                  control={form.control}
                  name="specificDate"
                  render={({ field, fieldState }) => (
                    <View style={styles.field}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Data Especifica
                      </ThemedText>
                      <Input
                        value={field.value ? new Date(field.value).toLocaleDateString("pt-BR") : ""}
                        onChangeText={(text: string) => {
                          const parts = text.split("/");
                          if (parts.length === 3) {
                            const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                            if (!isNaN(date.getTime())) field.onChange(date);
                          }
                        }}
                        placeholder="DD/MM/AAAA"
                        keyboardType="numeric"
                        error={!!fieldState.error}
                      />
                    </View>
                  )}
                />
              )}

              {frequencyGroups.needsNextRun && (
                <Controller
                  control={form.control}
                  name="nextRun"
                  render={({ field, fieldState }) => (
                    <View style={styles.field}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Proxima Execucao
                      </ThemedText>
                      <Input
                        value={field.value ? new Date(field.value).toLocaleDateString("pt-BR") : ""}
                        onChangeText={(text: string) => {
                          const parts = text.split("/");
                          if (parts.length === 3) {
                            const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                            if (!isNaN(date.getTime())) field.onChange(date);
                          }
                        }}
                        placeholder="DD/MM/AAAA"
                        keyboardType="numeric"
                        error={!!fieldState.error}
                      />
                    </View>
                  )}
                />
              )}
            </Card>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Button
                variant="outline"
                onPress={() => goBack()}
                style={{ flex: 1 }}
              >
                <ThemedText>Cancelar</ThemedText>
              </Button>
              <Button
                onPress={onSubmit}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                <ThemedText style={{ color: colors.primaryForeground }}>
                  {isSubmitting ? "Salvando..." : "Salvar Alteracoes"}
                </ThemedText>
              </Button>
            </View>
          </FormProvider>

          <View style={{ height: spacing.xxl }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
