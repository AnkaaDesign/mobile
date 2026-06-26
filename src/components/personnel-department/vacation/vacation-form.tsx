import { useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { ThemedText } from "@/components/ui/themed-text";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useNav } from "@/contexts/nav";

import { vacationUpdateSchema } from "@/schemas/vacation";
import type { VacationUpdateFormData } from "@/schemas/vacation";
import type { Vacation } from "@/types";
import { useVacationMutations, useVacationBatchMutations } from "@/hooks/useVacation";
import { getUsers } from "@/api-client";
import { entitledDaysForAbsences } from "@/components/personnel-department/vacation/vacation-utils";
import { PAYROLL_EMPLOYEE_TYPES } from "@/constants/enums";

// Sentinel value for the "Coletiva / Todos" picker option (selects every
// eligible active CLT collaborator at submit time).
const ALL_COLLABORATORS = "__ALL__";

// Create-form schema: one multiselect picker (userIds) + the shared taking
// fields. Submits as a batch (one Vacation per selected user) via /vacations/batch.
const vacationFormCreateSchema = z.object({
  userIds: z.array(z.string()).min(1, { message: "Selecione ao menos um colaborador" }),
  startDate: z.coerce.date({
    required_error: "A data de início do gozo é obrigatória",
    invalid_type_error: "data de início inválida",
  }),
  days: z.coerce.number().int().min(1, { message: "O gozo deve ter ao menos 1 dia" }).max(30, { message: "O gozo não pode exceder 30 dias" }),
  unjustifiedAbsencesInPeriod: z.coerce.number().int().min(0).optional(),
  abonoPecuniarioDays: z.coerce.number().int().min(0).max(10).optional(),
  soldThird: z.boolean().optional(),
  acquisitiveStart: z.coerce.date().optional(),
  acquisitiveEnd: z.coerce.date().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

type VacationFormCreateData = z.infer<typeof vacationFormCreateSchema>;

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
  const { updateAsync, updateMutation } = useVacationMutations();
  const { batchCreateAsync, isBatchCreating } = useVacationBatchMutations();

  const createDefaults: VacationFormCreateData = {
    userIds: [],
    // acquisitive* omitted → service derives from the current contract's
    // admissionDate. startDate is now required (create-and-schedule).
    startDate: undefined as unknown as Date,
    days: 30,
    unjustifiedAbsencesInPeriod: 0,
    abonoPecuniarioDays: 0,
    soldThird: false,
    notes: "",
  };

  const updateDefaults: VacationUpdateFormData =
    mode === "update" && vacation
      ? {
          startDate: vacation.startDate ? new Date(vacation.startDate) : null,
          days: vacation.days ?? undefined,
          unjustifiedAbsencesInPeriod: vacation.unjustifiedAbsencesInPeriod ?? 0,
          abonoPecuniarioDays: vacation.abonoPecuniarioDays ?? 0,
          soldThird: vacation.soldThird ?? false,
          acquisitiveStart: vacation.acquisitiveStart ? new Date(vacation.acquisitiveStart) : undefined,
          acquisitiveEnd: vacation.acquisitiveEnd ? new Date(vacation.acquisitiveEnd) : undefined,
          paymentDate: vacation.paymentDate ? new Date(vacation.paymentDate) : null,
          notes: vacation.notes || "",
        }
      : ({} as VacationUpdateFormData);

  const form = useForm<VacationFormCreateData | VacationUpdateFormData>({
    resolver: zodResolver(mode === "create" ? vacationFormCreateSchema : vacationUpdateSchema),
    defaultValues: mode === "create" ? (createDefaults as any) : updateDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    criteriaMode: "all",
  });

  const isLoading = isBatchCreating || updateMutation.isPending;

  // ---- entitledDays preview (art. 130 scale by faltas) ----
  const watchedAbsences = Number(form.watch("unjustifiedAbsencesInPeriod" as any)) || 0;
  const scaledEntitledDays = entitledDaysForAbsences(watchedAbsences);

  // ---- Collaborator async loader (create only) ----
  // Only eligible = active + CLT/payroll employeeType (the create gate is CLT-only).
  const buildUserQuery = useCallback((searchTerm: string, page: number) => {
    const pageSize = 50;
    const where: any = {
      status: { not: "DISMISSED" },
      currentEmployeeType: { in: [...PAYROLL_EMPLOYEE_TYPES] },
    };
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
      const options: ComboboxOption[] = (response.data || []).map(
        (u: any): ComboboxOption => ({
          value: u.id,
          label: u.name + (u.position ? ` - ${u.position.name}` : ""),
        })
      );
      // "Coletiva / Todos" is the FIRST option (only on the first page) and
      // selects every eligible active CLT collaborator at submit time.
      if (page === 1) {
        options.unshift({ value: ALL_COLLABORATORS, label: "Coletiva / Todos os elegíveis" });
      }
      return {
        data: options,
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [buildUserQuery]
  );

  const initialCollaboratorOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && vacation?.user) {
      return [{ value: vacation.user.id, label: vacation.user.name }];
    }
    return [{ value: ALL_COLLABORATORS, label: "Coletiva / Todos os elegíveis" }];
  }, [mode, vacation?.user]);

  // Resolves the picker selection to a concrete list of userIds. When the
  // "Coletiva / Todos" sentinel is chosen, fetch every eligible active CLT user.
  const resolveUserIds = useCallback(
    async (selected: string[]): Promise<string[]> => {
      if (!selected.includes(ALL_COLLABORATORS)) return selected;
      const ids = new Set(selected.filter((s) => s !== ALL_COLLABORATORS));
      let page = 1;
      // Paginate through all eligible collaborators.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await getUsers(buildUserQuery("", page) as any);
        (response.data || []).forEach((u: any) => ids.add(u.id));
        if (!response.meta?.hasNextPage) break;
        page += 1;
      }
      return Array.from(ids);
    },
    [buildUserQuery]
  );

  const handleSubmit = async (data: VacationFormCreateData | VacationUpdateFormData) => {
    try {
      if (mode === "create") {
        const create = data as VacationFormCreateData;
        const userIds = await resolveUserIds(create.userIds);
        if (userIds.length === 0) {
          form.setError("userIds" as any, { message: "Nenhum colaborador elegível selecionado" });
          return;
        }
        const shared = {
          startDate: create.startDate,
          days: create.days,
          unjustifiedAbsencesInPeriod: create.unjustifiedAbsencesInPeriod,
          abonoPecuniarioDays: create.abonoPecuniarioDays,
          soldThird: create.soldThird,
          acquisitiveStart: create.acquisitiveStart,
          acquisitiveEnd: create.acquisitiveEnd,
          notes: create.notes,
        };
        const result = await batchCreateAsync({
          vacations: userIds.map((userId) => ({ userId, ...shared })) as any,
        });
        onSuccess?.();
        // Single-create → jump straight to the new detail; batch → return to list.
        const created = (result as any)?.data?.success ?? [];
        if (userIds.length === 1 && created[0]?.id) {
          nav.replace(`/departamento-pessoal/ferias/detalhes/${created[0].id}` as any);
        } else {
          nav.replace(`/departamento-pessoal/ferias/listar` as any);
        }
      } else if (vacation) {
        await updateAsync({ id: vacation.id, data: data as VacationUpdateFormData });
        onSuccess?.();
        nav.replace(`/departamento-pessoal/ferias/detalhes/${vacation.id}` as any);
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
                  label="Colaboradores"
                  required
                  error={(form.formState.errors as any).userIds?.message}
                  helper='Selecione um ou mais colaboradores, ou "Coletiva / Todos" para todos os elegíveis.'
                >
                  <Controller
                    control={form.control}
                    name={"userIds" as any}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        async
                        mode="multiple"
                        queryFn={loadCollaboratorOptions as any}
                        initialOptions={initialCollaboratorOptions}
                        minSearchLength={0}
                        value={value || []}
                        onValueChange={onChange}
                        placeholder="Selecione os colaboradores"
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

            {/* Gozo (uma única tomada de férias) */}
            <FormCard
              title="Gozo"
              description="Período de gozo desta tomada. Crie outra tomada para fracionar o período aquisitivo."
              icon="IconCalendarTime"
            >
              <FormRow>
                <FormFieldGroup
                  label="Início do Gozo"
                  required
                  helper="Data de início das férias"
                  error={(form.formState.errors as any).startDate?.message}
                >
                  <Controller
                    control={form.control}
                    name={"startDate" as any}
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
                  label="Dias de Gozo"
                  required
                  helper="1 a 30 dias"
                  error={(form.formState.errors as any).days?.message}
                >
                  <Controller
                    control={form.control}
                    name={"days" as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value != null ? String(value) : ""}
                        onChangeText={(t) => onChange(t === "" ? undefined : Math.min(30, Number(t.replace(/[^0-9]/g, ""))))}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        placeholder="0"
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              {mode === "update" ? (
                <FormFieldGroup
                  label="Pago em"
                  helper="Data de pagamento do recibo de férias"
                  error={(form.formState.errors as any).paymentDate?.message}
                >
                  <Controller
                    control={form.control}
                    name={"paymentDate" as any}
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
});
