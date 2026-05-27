import { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useCreateOrderSchedule } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useTheme } from "@/lib/theme";
import {
  orderScheduleCreateSchema,
  type OrderScheduleCreateFormData,
} from "@/schemas";
import { SCHEDULE_FREQUENCY, MONTH_OCCURRENCE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { SCHEDULE_FREQUENCY_LABELS } from "@/constants/enum-labels";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { IconCalendarPlus } from "@tabler/icons-react-native";
import { OrderMultiItemSelector } from "@/components/inventory/order/form/multi-item-selector";

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

export default function OrderScheduleCreateScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <OrderScheduleCreateScreenInner />
    </PrivilegeGate>
  );
}

function OrderScheduleCreateScreenInner() {
  useScreenReady();
  const formKey = useFormScreenKey();
  const nav = useNav();
  const goBack = () =>
    nav.goBack({ fallback: mobileRoute(routes.inventory.orders.schedules.root) });
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSchedule = useCreateOrderSchedule();

  const form = useForm<OrderScheduleCreateFormData>({
    resolver: zodResolver(orderScheduleCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: SCHEDULE_FREQUENCY.MONTHLY,
      frequencyCount: 1,
      isActive: true,
      items: [],
    },
  });

  const watchedFrequency = form.watch("frequency");
  const watchedFrequencyCount = form.watch("frequencyCount");
  const watchedItems = form.watch("items") || [];
  const watchedDayOfMonth = form.watch("dayOfMonth");
  const watchedMonthlySchedule = form.watch("monthlySchedule");

  // Mutual-exclusion flags for the monthly day config: a filled fixed day
  // disables the positional pair (occurrence + dayOfWeek) and vice-versa.
  const fixedFilled =
    watchedDayOfMonth != null && String(watchedDayOfMonth) !== "";
  const positionalFilled =
    !!watchedMonthlySchedule?.occurrence || !!watchedMonthlySchedule?.dayOfWeek;

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
    async (data: OrderScheduleCreateFormData) => {
      const freq = data.frequency;
      const isMonthlyType =
        freq === SCHEDULE_FREQUENCY.MONTHLY ||
        freq === SCHEDULE_FREQUENCY.BIMONTHLY ||
        freq === SCHEDULE_FREQUENCY.QUARTERLY ||
        freq === SCHEDULE_FREQUENCY.TRIANNUAL ||
        freq === SCHEDULE_FREQUENCY.QUADRIMESTRAL ||
        freq === SCHEDULE_FREQUENCY.SEMI_ANNUAL;

      const hasFixed = data.dayOfMonth != null && String(data.dayOfMonth) !== "";
      const hasOccurrence = !!data.monthlySchedule?.occurrence;
      const hasPosDayOfWeek = !!data.monthlySchedule?.dayOfWeek;
      const hasAnyPositional = hasOccurrence || hasPosDayOfWeek;

      // Enforce EITHER a fixed day-of-month OR a complete positional pair.
      if (isMonthlyType) {
        if (!hasFixed && !hasAnyPositional) {
          Alert.alert(
            "Validacao",
            "Informe o dia do mes ou a ocorrencia + dia da semana",
          );
          return;
        }
        if (hasAnyPositional && !(hasOccurrence && hasPosDayOfWeek)) {
          Alert.alert(
            "Validacao",
            "Selecione a ocorrencia e o dia da semana",
          );
          return;
        }
      }

      // Normalize the payload to carry exactly one branch: a fixed dayOfMonth
      // XOR a positional monthlySchedule.
      if (hasFixed) {
        data.monthlySchedule = undefined as any;
      } else if (hasAnyPositional) {
        data.dayOfMonth = undefined as any;
      }

      setIsSubmitting(true);
      try {
        await createSchedule.mutateAsync(data);
        // Success toast is shown automatically by the API client interceptor
        goBack();
      } catch (error: any) {
        // Error toast is shown automatically by the API client interceptor
        console.error("Error creating order schedule:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSchedule, goBack]
  );

  const onSubmit = form.handleSubmit(handleSubmit, (errors) => {
    const firstError = Object.values(errors)[0];
    const message = firstError?.message || "Verifique os campos do formulario";
    Alert.alert("Validacao", message as string);
  });

  return (
    <KeyboardAvoidingView
      key={formKey}
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
              <IconCalendarPlus size={24} color={colors.primary} />
              <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
                Novo Agendamento
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
                      Frequencia *
                    </ThemedText>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      options={FREQUENCY_OPTIONS}
                      placeholder="Selecione a frequencia"
                    />
                  </View>
                )}
              />

              {/* Date-config fields for the selected frequency, reflowed into a
                  single wrapping row. */}
              <View style={styles.dateConfigRow}>
              <Controller
                control={form.control}
                name="frequencyCount"
                render={({ field, fieldState }) => (
                  <View style={[styles.field, styles.dateConfigItem]}>
                    <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                      Contagem
                    </ThemedText>
                    <Input
                      value={String(field.value || 1)}
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
                    <View style={[styles.field, styles.dateConfigItem]}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Dia da Semana *
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

              {/* Monthly (non-ANNUAL) day config: fixed day-of-month AND the
                  positional pair (occurrence + weekday) are shown together; filling
                  one side disables the other (mutual exclusion). */}
              {frequencyGroups.needsDayOfMonth && (
                <Controller
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field, fieldState }) => (
                    <View style={[styles.field, styles.dateConfigItem]}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Dia do Mes (1-31) *
                      </ThemedText>
                      <Input
                        value={field.value != null ? String(field.value) : ""}
                        onChangeText={(text: string) => {
                          const num = parseInt(text);
                          field.onChange(isNaN(num) ? undefined : Math.min(31, Math.max(1, num)));
                        }}
                        keyboardType="numeric"
                        placeholder="Ex: 15"
                        disabled={positionalFilled}
                        error={!!fieldState.error}
                      />
                    </View>
                  )}
                />
              )}

              {frequencyGroups.needsDayOfMonth && (
                <>
                  <Controller
                    control={form.control}
                    name="monthlySchedule.occurrence"
                    render={({ field, fieldState }) => (
                      <View style={[styles.field, styles.dateConfigItem]}>
                        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                          Ocorrencia
                        </ThemedText>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          options={MONTH_OCCURRENCE_OPTIONS}
                          placeholder="Selecione a ocorrencia"
                          disabled={fixedFilled}
                        />
                      </View>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="monthlySchedule.dayOfWeek"
                    render={({ field, fieldState }) => (
                      <View style={[styles.field, styles.dateConfigItem]}>
                        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                          Dia da Semana
                        </ThemedText>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          options={DAY_OF_WEEK_OPTIONS}
                          placeholder="Selecione o dia"
                          disabled={fixedFilled}
                        />
                      </View>
                    )}
                  />
                  <ThemedText style={[styles.helperText, styles.dateConfigHelper, { color: colors.mutedForeground }]}>
                    Informe o dia do mes OU a ocorrencia + dia da semana
                  </ThemedText>
                </>
              )}

              {frequencyGroups.needsMonth && (
                <>
                  <Controller
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field, fieldState }) => (
                      <View style={[styles.field, styles.dateConfigItem]}>
                        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                          Dia do Mes (1-31) *
                        </ThemedText>
                        <Input
                          value={field.value != null ? String(field.value) : ""}
                          onChangeText={(text: string) => {
                            const num = parseInt(text);
                            field.onChange(isNaN(num) ? undefined : Math.min(31, Math.max(1, num)));
                          }}
                          keyboardType="numeric"
                          placeholder="Ex: 15"
                          error={!!fieldState.error}
                        />
                      </View>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="month"
                    render={({ field, fieldState }) => (
                      <View style={[styles.field, styles.dateConfigItem]}>
                        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                          Mes *
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
                </>
              )}

              {frequencyGroups.needsSpecificDate && (
                <Controller
                  control={form.control}
                  name="specificDate"
                  render={({ field, fieldState }) => (
                    <View style={[styles.field, styles.dateConfigItem]}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Data Especifica *
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
                    <View style={[styles.field, styles.dateConfigItem]}>
                      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                        Primeira Execucao
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
              </View>
            </Card>

            {/* Items */}
            <Card style={styles.card}>
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Itens do Agendamento
              </ThemedText>

              <Controller
                control={form.control}
                name="items"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
                    <OrderMultiItemSelector
                      value={field.value || []}
                      onValueChange={(v) => field.onChange(v || [])}
                      label="Itens"
                      description="Selecione os itens que este agendamento irá pedir automaticamente."
                      placeholder="Selecione os itens"
                      error={fieldState.error?.message}
                    />
                  </View>
                )}
              />
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
                  {isSubmitting ? "Salvando..." : "Criar Agendamento"}
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
  // Single wrapping row holding the frequency-specific date-config fields so the
  // fields visible for the selected frequency sit horizontally and wrap on small
  // screens. (Layout only — field names/validation unchanged.)
  dateConfigRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  // Each field grows to fill the row but is allowed to wrap once it hits its
  // minimum, keeping things readable on narrow devices.
  dateConfigItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
    minWidth: 140,
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
  helperText: {
    fontSize: fontSize.xs,
  },
  // The mutual-exclusion helper sits on its own full-width line below the
  // wrapping field row.
  dateConfigHelper: {
    flexBasis: "100%",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
