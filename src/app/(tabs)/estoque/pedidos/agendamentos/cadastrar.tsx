import { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useCreateOrderSchedule } from "@/hooks";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useTheme } from "@/lib/theme";
import {
  orderScheduleCreateSchema,
  type OrderScheduleCreateFormData,
} from "@/schemas";
import { SCHEDULE_FREQUENCY } from "@/constants";
import { SCHEDULE_FREQUENCY_LABELS } from "@/constants/enum-labels";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { IconCalendarPlus } from "@tabler/icons-react-native";

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

export default function OrderScheduleCreateScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  const router = useRouter();
  const { goBack } = useNavigationHistory();
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
      setIsSubmitting(true);
      try {
        await createSchedule.mutateAsync(data);
        Alert.alert("Sucesso", "Agendamento criado com sucesso", [
          { text: "OK", onPress: () => goBack() },
        ]);
      } catch (error: any) {
        Alert.alert(
          "Erro",
          error?.message || "Erro ao criar agendamento"
        );
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

              <Controller
                control={form.control}
                name="frequencyCount"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
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
                    <View style={styles.field}>
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

              {frequencyGroups.needsDayOfMonth && (
                <Controller
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field, fieldState }) => (
                    <View style={styles.field}>
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
              )}

              {frequencyGroups.needsMonth && (
                <>
                  <Controller
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field, fieldState }) => (
                      <View style={styles.field}>
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
                      <View style={styles.field}>
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
                    <View style={styles.field}>
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
                    <View style={styles.field}>
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
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
