import { useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { mobileRoute } from "@/constants/routes.types";
import { routes } from "@/constants";
import { useNav } from "@/contexts/nav";

import { medicalExamCreateSchema, medicalExamUpdateSchema } from "@/schemas/medical-exam";
import type { MedicalExamCreateFormData, MedicalExamUpdateFormData } from "@/schemas/medical-exam";
import type { MedicalExam } from "@/types";
import { useMedicalExamMutations } from "@/hooks/useMedicalExam";
import {
  MEDICAL_EXAM_TYPE,
  MEDICAL_EXAM_STATUS,
  MEDICAL_EXAM_RESULT,
  MEDICAL_EXAM_TYPE_LABELS,
  MEDICAL_EXAM_STATUS_LABELS,
  MEDICAL_EXAM_RESULT_LABELS,
} from "@/constants";
import { getUsers } from "@/api-client";

interface MedicalExamFormProps {
  mode: "create" | "update";
  medicalExam?: MedicalExam;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MedicalExamForm({ mode, medicalExam, onSuccess, onCancel }: MedicalExamFormProps) {
  const nav = useNav();
  const goBack = () => nav.goBack();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useMedicalExamMutations();

  const createDefaults: MedicalExamCreateFormData = {
    userId: "",
    type: "" as any,
    status: MEDICAL_EXAM_STATUS.SCHEDULED,
    result: MEDICAL_EXAM_RESULT.PENDING,
    restrictions: null,
    periodicityMonths: null,
    scheduledAt: null,
    examDate: null,
    expiresAt: null,
    physicianName: null,
    crm: null,
    clinic: null,
    notes: null,
    fileId: null,
  };

  const updateDefaults: MedicalExamUpdateFormData = mode === "update" && medicalExam ? {
    userId: medicalExam.userId,
    type: medicalExam.type,
    status: medicalExam.status,
    result: medicalExam.result,
    restrictions: medicalExam.restrictions ?? null,
    periodicityMonths: medicalExam.periodicityMonths ?? null,
    scheduledAt: medicalExam.scheduledAt ? new Date(medicalExam.scheduledAt) : null,
    examDate: medicalExam.examDate ? new Date(medicalExam.examDate) : null,
    expiresAt: medicalExam.expiresAt ? new Date(medicalExam.expiresAt) : null,
    physicianName: medicalExam.physicianName ?? null,
    crm: medicalExam.crm ?? null,
    clinic: medicalExam.clinic ?? null,
    notes: medicalExam.notes ?? null,
    fileId: medicalExam.fileId ?? null,
  } : {} as MedicalExamUpdateFormData;

  const form = useForm<MedicalExamCreateFormData | MedicalExamUpdateFormData>({
    resolver: zodResolver(mode === "create" ? medicalExamCreateSchema : medicalExamUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : updateDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    criteriaMode: "all",
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const selectedType = form.watch("type");
  const selectedResult = form.watch("result");
  const isPeriodic = selectedType === MEDICAL_EXAM_TYPE.PERIODIC;
  const requiresRestrictions = selectedResult === MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS;

  // Async collaborator loader — mirrors warning-form's loadCollaboratorOptions.
  const buildUserQuery = useCallback(
    (searchTerm: string, page: number) => {
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
    },
    []
  );

  const mapUserToOption = useCallback(
    (user: any): ComboboxOption => ({
      value: user.id,
      label: user.name + (user.position ? ` - ${user.position.name}` : ""),
    }),
    []
  );

  const loadCollaboratorOptions = useCallback(
    async (searchTerm: string, page: number = 1) => {
      const response = await getUsers(buildUserQuery(searchTerm, page) as any);
      return {
        data: (response.data || []).map(mapUserToOption),
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [buildUserQuery, mapUserToOption]
  );

  const initialCollaboratorOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && medicalExam?.user) {
      return [{
        value: medicalExam.user.id,
        label: medicalExam.user.name + ((medicalExam.user as any).position ? ` - ${(medicalExam.user as any).position.name}` : ""),
      }];
    }
    return [];
  }, [mode, medicalExam?.user]);

  const handleSubmit = async (data: MedicalExamCreateFormData | MedicalExamUpdateFormData) => {
    // Restrições só fazem sentido com "Apto com restrições"; periodicidade só em periódicos.
    const payload: any = {
      ...data,
      restrictions: data.result === MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS ? data.restrictions || null : null,
      periodicityMonths: data.type === MEDICAL_EXAM_TYPE.PERIODIC ? data.periodicityMonths ?? null : null,
    };
    try {
      if (mode === "create") {
        const result = await createAsync(payload as MedicalExamCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          nav.replace(mobileRoute(routes.personnelDepartment.occupationalHealth.medicalExams.details(newId)));
        } else {
          goBack();
        }
      } else if (medicalExam) {
        await updateAsync({
          id: medicalExam.id,
          data: payload as MedicalExamUpdateFormData,
        });
        onSuccess?.();
        nav.replace(mobileRoute(routes.personnelDepartment.occupationalHealth.medicalExams.details(medicalExam.id)));
      }
    } catch {
      // Error toast is shown automatically by the axios response interceptor.
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      goBack();
    }
  };

  const typeOptions: ComboboxOption[] = Object.entries(MEDICAL_EXAM_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const statusOptions: ComboboxOption[] = Object.entries(MEDICAL_EXAM_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  const resultOptions: ComboboxOption[] = Object.entries(MEDICAL_EXAM_RESULT_LABELS).map(([value, label]) => ({ value, label }));

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

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
            {/* Exam Information Card */}
            <FormCard
              title="Informações do Exame"
              description="Dados do exame ocupacional (ASO)"
              icon="IconClipboardCheck"
            >
              {/* Collaborator */}
              <FormFieldGroup
                label="Colaborador"
                required
                error={form.formState.errors.userId?.message}
              >
                <Controller
                  control={form.control}
                  name="userId"
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

              {/* Type and Status */}
              <FormRow>
                <FormFieldGroup
                  label="Tipo"
                  required
                  error={form.formState.errors.type?.message}
                >
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        options={typeOptions}
                        value={value}
                        onValueChange={onChange}
                        placeholder="Selecione o tipo"
                        disabled={isLoading}
                        searchable={false}
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="Status"
                  error={form.formState.errors.status?.message}
                >
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        options={statusOptions}
                        value={value}
                        onValueChange={onChange}
                        placeholder="Selecione o status"
                        disabled={isLoading}
                        searchable={false}
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              {/* Result */}
              <FormFieldGroup
                label="Resultado"
                error={form.formState.errors.result?.message}
              >
                <Controller
                  control={form.control}
                  name="result"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={resultOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione o resultado"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Restrictions — only for FIT_WITH_RESTRICTIONS */}
              {requiresRestrictions && (
                <FormFieldGroup
                  label="Restrições"
                  helper="Descreva as restrições para o resultado 'Apto com restrições'"
                  error={(form.formState.errors as any).restrictions?.message}
                >
                  <Controller
                    control={form.control}
                    name="restrictions"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Textarea
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Ex.: não operar máquinas, evitar esforço físico..."
                        numberOfLines={3}
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}

              {/* Periodicity — only for PERIODIC */}
              {isPeriodic && (
                <FormFieldGroup
                  label="Periodicidade (meses)"
                  helper="12 (exposição a risco) ou 24 meses"
                  error={(form.formState.errors as any).periodicityMonths?.message}
                >
                  <Controller
                    control={form.control}
                    name="periodicityMonths"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        type="integer"
                        value={value ?? undefined}
                        onChange={onChange}
                        placeholder="12"
                        min={1}
                        max={120}
                        editable={!isLoading}
                        error={!!(form.formState.errors as any).periodicityMonths}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}
            </FormCard>

            {/* Dates Card */}
            <FormCard
              title="Datas"
              description="Agendamento, realização e validade do ASO"
              icon="IconCalendar"
            >
              <FormFieldGroup
                label="Agendamento"
                error={form.formState.errors.scheduledAt?.message}
              >
                <Controller
                  control={form.control}
                  name="scheduledAt"
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

              <FormRow>
                <FormFieldGroup
                  label="Data do Exame"
                  error={form.formState.errors.examDate?.message}
                >
                  <Controller
                    control={form.control}
                    name="examDate"
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
                  label="Validade"
                  error={form.formState.errors.expiresAt?.message}
                >
                  <Controller
                    control={form.control}
                    name="expiresAt"
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

            {/* Physician Card */}
            <FormCard
              title="Médico e Clínica"
              description="Responsável pela emissão do ASO"
              icon="IconStethoscope"
            >
              <FormRow>
                <FormFieldGroup
                  label="Médico"
                  error={form.formState.errors.physicianName?.message}
                >
                  <Controller
                    control={form.control}
                    name="physicianName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Nome do médico"
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="CRM"
                  error={form.formState.errors.crm?.message}
                >
                  <Controller
                    control={form.control}
                    name="crm"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="CRM do médico"
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              <FormFieldGroup
                label="Clínica"
                error={form.formState.errors.clinic?.message}
              >
                <Controller
                  control={form.control}
                  name="clinic"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Nome da clínica"
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup
                label="Observações"
                error={form.formState.errors.notes?.message}
              >
                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Textarea
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Observações internas"
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
          canSubmit={form.formState.isValid}
          submitLabel={mode === "create" ? "Cadastrar" : "Atualizar"}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0,
  },
  fieldGroup: {
    gap: spacing.lg,
  },
});
