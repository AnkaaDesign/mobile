import { useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useNav } from "@/contexts/nav";

import { vacationCreateSchema, vacationUpdateSchema } from "@/schemas/vacation";
import type { VacationCreateFormData, VacationUpdateFormData } from "@/schemas/vacation";
import type { Vacation } from "@/types";
import { useVacationMutations, useVacationSetPeriods } from "@/hooks/useVacation";
import { getUsers } from "@/api-client";
import {
  entitledDaysForAbsences,
  validateFracionamento,
} from "@/components/human-resources/vacation/vacation-utils";

interface VacationFormProps {
  mode: "create" | "update";
  vacation?: Vacation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VacationForm({ mode, vacation, onSuccess, onCancel }: VacationFormProps) {
  const nav = useNav();
  const goBack = () => nav.goBack();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useVacationMutations();
  const setPeriods = useVacationSetPeriods();

  const createDefaults: VacationCreateFormData = {
    userId: "",
    // contractId/acquisitive* omitted → service derives from the current
    // contract's admissionDate.
    unjustifiedAbsencesInPeriod: 0,
    abonoPecuniarioDays: 0,
    soldThird: false,
    notes: "",
    periods: [],
  };

  const updateDefaults: VacationUpdateFormData =
    mode === "update" && vacation
      ? {
          unjustifiedAbsencesInPeriod: vacation.unjustifiedAbsencesInPeriod ?? 0,
          abonoPecuniarioDays: vacation.abonoPecuniarioDays ?? 0,
          soldThird: vacation.soldThird ?? false,
          acquisitiveStart: vacation.acquisitiveStart ? new Date(vacation.acquisitiveStart) : undefined,
          acquisitiveEnd: vacation.acquisitiveEnd ? new Date(vacation.acquisitiveEnd) : undefined,
          notes: vacation.notes || "",
        }
      : ({} as VacationUpdateFormData);

  const form = useForm<VacationCreateFormData | VacationUpdateFormData>({
    resolver: zodResolver(mode === "create" ? vacationCreateSchema : vacationUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : updateDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    criteriaMode: "all",
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || setPeriods.isPending;

  // ---- Fracionamento editor (≤3 períodos; one ≥14d; others ≥5d) ----
  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: "periods" as any,
  });

  const watchedPeriods = form.watch("periods" as any) as { startDate?: Date; days?: number }[] | undefined;
  const fracError = useMemo(
    () => validateFracionamento((watchedPeriods ?? []).map((p) => ({ days: Number(p?.days) || 0 }))),
    [watchedPeriods]
  );

  // ---- entitledDays preview (art. 130 scale by faltas) ----
  const watchedAbsences = Number(form.watch("unjustifiedAbsencesInPeriod" as any)) || 0;
  const scaledEntitledDays = entitledDaysForAbsences(watchedAbsences);

  // ---- Collaborator async loader (create only) ----
  const buildUserQuery = useCallback((searchTerm: string, page: number) => {
    const pageSize = 50;
    const where: any = { isActive: true };
    if (searchTerm && searchTerm.trim()) {
      where.OR = [
        { name: { contains: searchTerm.trim(), mode: "insensitive" } },
        { email: { contains: searchTerm.trim(), mode: "insensitive" } },
      ];
    }
    return {
      take: pageSize,
      skip: (page - 1) * pageSize,
      where,
      orderBy: { name: "asc" as const },
      include: { position: true },
    };
  }, []);

  const loadCollaboratorOptions = useCallback(
    async (searchTerm: string, page: number = 1) => {
      const response = await getUsers(buildUserQuery(searchTerm, page) as any);
      return {
        data: (response.data || []).map(
          (u: any): ComboboxOption => ({
            value: u.id,
            label: u.name + (u.position ? ` - ${u.position.name}` : ""),
          })
        ),
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [buildUserQuery]
  );

  const initialCollaboratorOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && vacation?.user) {
      return [{ value: vacation.user.id, label: vacation.user.name }];
    }
    return [];
  }, [mode, vacation?.user]);

  const handleSubmit = async (data: VacationCreateFormData | VacationUpdateFormData) => {
    if (fracError) return;
    try {
      if (mode === "create") {
        const result = await createAsync(data as VacationCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          nav.replace(`/recursos-humanos/ferias/detalhes/${newId}` as any);
        } else {
          goBack();
        }
      } else if (vacation) {
        const { periods, ...rest } = data as VacationUpdateFormData & {
          periods?: { startDate: Date; days: number }[];
        };
        await updateAsync({ id: vacation.id, data: rest as VacationUpdateFormData });
        // Persist fracionamento separately via the dedicated endpoint.
        if (Array.isArray(periods) && periods.length > 0) {
          await setPeriods.mutateAsync({
            id: vacation.id,
            data: { periods: periods.map((p) => ({ startDate: p.startDate, days: Number(p.days) })) },
          });
        }
        onSuccess?.();
        nav.replace(`/recursos-humanos/ferias/detalhes/${vacation.id}` as any);
      }
    } catch {
      // Error toast is shown automatically by the axios response interceptor.
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else goBack();
  };

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(
    () => ({
      onFieldLayout: handlers.handleFieldLayout,
      onFieldFocus: handlers.handleFieldFocus,
      onComboboxOpen: handlers.handleComboboxOpen,
      onComboboxClose: handlers.handleComboboxClose,
    }),
    [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={refs.scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            {/* Colaborador & período aquisitivo */}
            <FormCard
              title="Período Aquisitivo"
              description="Vínculo e janela aquisitiva. Quando o aquisitivo é omitido na criação, é derivado da admissão do vínculo atual."
              icon="IconCalendar"
            >
              {mode === "create" ? (
                <FormFieldGroup
                  label="Colaborador"
                  required
                  error={(form.formState.errors as any).userId?.message}
                >
                  <Controller
                    control={form.control}
                    name={"userId" as any}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        async
                        queryFn={loadCollaboratorOptions as any}
                        initialOptions={initialCollaboratorOptions}
                        minSearchLength={0}
                        value={value || ""}
                        onValueChange={onChange}
                        placeholder="Selecione o colaborador"
                        searchPlaceholder="Buscar colaborador..."
                        disabled={isLoading}
                        searchable
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              ) : (
                <FormFieldGroup label="Colaborador">
                  <ThemedText style={styles.readonlyValue}>{vacation?.user?.name ?? "—"}</ThemedText>
                </FormFieldGroup>
              )}

              <FormRow>
                <FormFieldGroup
                  label="Início do Aquisitivo"
                  helper={mode === "create" ? "Opcional — derivado da admissão" : undefined}
                  error={(form.formState.errors as any).acquisitiveStart?.message}
                >
                  <Controller
                    control={form.control}
                    name={"acquisitiveStart" as any}
                    render={({ field: { onChange, value } }) => (
                      <DatePicker
                        value={value || undefined}
                        onChange={onChange}
                        placeholder="Selecione a data"
                        disabled={isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="Fim do Aquisitivo"
                  helper={mode === "create" ? "Opcional — derivado" : undefined}
                  error={(form.formState.errors as any).acquisitiveEnd?.message}
                >
                  <Controller
                    control={form.control}
                    name={"acquisitiveEnd" as any}
                    render={({ field: { onChange, value } }) => (
                      <DatePicker
                        value={value || undefined}
                        onChange={onChange}
                        placeholder="Selecione a data"
                        disabled={isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>
            </FormCard>

            {/* Direito a férias (art. 130) */}
            <FormCard
              title="Direito a Férias"
              description="A escala do art. 130 reduz os dias conforme faltas injustificadas no período."
              icon="IconCalendarStats"
            >
              <FormFieldGroup
                label="Faltas Injustificadas no Período"
                error={(form.formState.errors as any).unjustifiedAbsencesInPeriod?.message}
                helper={`Dias de direito (art. 130): ${scaledEntitledDays} dias`}
              >
                <Controller
                  control={form.control}
                  name={"unjustifiedAbsencesInPeriod" as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value != null ? String(value) : ""}
                      onChangeText={(t) => onChange(t === "" ? 0 : Number(t.replace(/[^0-9]/g, "")))}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      placeholder="0"
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormRow>
                <FormFieldGroup
                  label="Abono Pecuniário (dias)"
                  helper="0 a 10 dias (art. 143)"
                  error={(form.formState.errors as any).abonoPecuniarioDays?.message}
                >
                  <Controller
                    control={form.control}
                    name={"abonoPecuniarioDays" as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value != null ? String(value) : ""}
                        onChangeText={(t) => onChange(t === "" ? 0 : Math.min(10, Number(t.replace(/[^0-9]/g, ""))))}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        placeholder="0"
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="Vender 1/3" helper="Converter o terço">
                  <View style={styles.switchRow}>
                    <Controller
                      control={form.control}
                      name={"soldThird" as any}
                      render={({ field: { onChange, value } }) => (
                        <Switch checked={!!value} onCheckedChange={onChange} disabled={isLoading} />
                      )}
                    />
                  </View>
                </FormFieldGroup>
              </FormRow>
            </FormCard>

            {/* Fracionamento (Reforma 2017) */}
            <FormCard
              title="Fracionamento"
              description="Até 3 períodos; um deve ter ≥14 dias e os demais ≥5 dias."
              icon="IconCalendarTime"
            >
              {fields.map((f, index) => (
                <View key={f.id} style={[styles.periodRow, { borderColor: colors.border }]}>
                  <View style={styles.periodFields}>
                    <FormFieldGroup label={`Período ${index + 1} — Início`}>
                      <Controller
                        control={form.control}
                        name={`periods.${index}.startDate` as any}
                        render={({ field: { onChange, value } }) => (
                          <DatePicker
                            value={value || undefined}
                            onChange={onChange}
                            placeholder="Início"
                            disabled={isLoading}
                          />
                        )}
                      />
                    </FormFieldGroup>
                    <FormFieldGroup label="Dias">
                      <Controller
                        control={form.control}
                        name={`periods.${index}.days` as any}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input
                            value={value != null ? String(value) : ""}
                            onChangeText={(t) => onChange(t === "" ? 0 : Number(t.replace(/[^0-9]/g, "")))}
                            onBlur={onBlur}
                            keyboardType="number-pad"
                            placeholder="0"
                            editable={!isLoading}
                          />
                        )}
                      />
                    </FormFieldGroup>
                  </View>
                  <Button variant="ghost" size="sm" onPress={() => remove(index)} disabled={isLoading}>
                    Remover
                  </Button>
                </View>
              ))}

              {fields.length < 3 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => append({ startDate: new Date(), days: 0 } as any)}
                  disabled={isLoading}
                  style={styles.addPeriodBtn}
                >
                  Adicionar período
                </Button>
              ) : null}

              {fracError ? (
                <ThemedText style={[styles.fracError, { color: colors.destructive }]}>{fracError}</ThemedText>
              ) : null}
            </FormCard>

            {/* Observações */}
            <FormCard title="Observações" icon="IconNote">
              <FormFieldGroup label="Notas" error={(form.formState.errors as any).notes?.message}>
                <Controller
                  control={form.control}
                  name={"notes" as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Textarea
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Observações sobre as férias"
                      numberOfLines={3}
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={!fracError}
          submitLabel={mode === "create" ? "Cadastrar" : "Atualizar"}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0,
  },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  readonlyValue: { fontSize: 16, fontWeight: "500" },
  periodRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  periodFields: { flexDirection: "row", gap: spacing.md },
  addPeriodBtn: { alignSelf: "flex-start" },
  fracError: { fontSize: 13, marginTop: spacing.xs },
});
