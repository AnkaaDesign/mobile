import { useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { mobileRoute } from "@/constants/routes.types";
import { routes, LEAVE_TYPE, LEAVE_TYPE_LABELS, WORK_ACCIDENT_REPORT_TYPE_LABELS, CONTRACT_STATUS } from "@/constants";
import { useNav } from "@/contexts/nav";

import {
  workAccidentReportCreateSchema,
  workAccidentReportUpdateSchema,
  type WorkAccidentReportCreateFormData,
  type WorkAccidentReportUpdateFormData,
} from "@/schemas/work-accident";
import type { WorkAccidentReport } from "@/types";
import { useWorkAccidentReportMutations } from "@/hooks/useWorkAccident";
import { getUsers, getLeaves } from "@/api-client";

interface WorkAccidentFormProps {
  mode: "create" | "update";
  workAccident?: WorkAccidentReport;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const typeOptions: ComboboxOption[] = Object.entries(WORK_ACCIDENT_REPORT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function WorkAccidentForm({ mode, workAccident, onSuccess, onCancel }: WorkAccidentFormProps) {
  const nav = useNav();
  const goBack = () => nav.goBack();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useWorkAccidentReportMutations();

  const createDefaults: WorkAccidentReportCreateFormData = {
    userId: "",
    leaveId: null,
    type: "" as any,
    catNumber: "",
    accidentDate: null,
    emissionDate: null,
    description: "",
    confirmStability: false,
  } as WorkAccidentReportCreateFormData;

  const updateDefaults: WorkAccidentReportUpdateFormData = mode === "update" && workAccident ? {
    leaveId: workAccident.leaveId ?? null,
    type: workAccident.type,
    catNumber: workAccident.catNumber ?? "",
    accidentDate: workAccident.accidentDate ? new Date(workAccident.accidentDate) : null,
    emissionDate: workAccident.emissionDate ? new Date(workAccident.emissionDate) : null,
    description: workAccident.description ?? "",
    confirmStability: false,
  } as WorkAccidentReportUpdateFormData : {} as WorkAccidentReportUpdateFormData;

  const form = useForm<WorkAccidentReportCreateFormData | WorkAccidentReportUpdateFormData>({
    resolver: zodResolver(mode === "create" ? workAccidentReportCreateSchema : workAccidentReportUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : updateDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    criteriaMode: "all",
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // In update mode userId is not part of the schema; resolve it from the report.
  const watchedUserId = mode === "create" ? (form.watch("userId" as any) as string | undefined) : undefined;
  const effectiveUserId = mode === "update" ? workAccident?.userId : watchedUserId;

  // Async collaborator loader (create mode only). Mirrors warning-form.
  const buildUserQuery = useCallback((searchTerm: string, page: number) => {
    const pageSize = 50;
    const where: any = { currentContractStatus: CONTRACT_STATUS.ACTIVE };
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
        data: (response.data || []).map((user: any) => ({
          value: user.id,
          label: user.name + (user.position ? ` - ${user.position.name}` : ""),
        })),
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [buildUserQuery]
  );

  // Async leave loader — WORK_ACCIDENT-type leaves of the selected collaborator.
  // Degrades gracefully: returns empty until a collaborator is chosen.
  const loadLeaveOptions = useCallback(
    async (searchTerm: string, page: number = 1) => {
      if (!effectiveUserId) return { data: [] as ComboboxOption[], hasMore: false };
      const pageSize = 50;
      const where: any = { userId: effectiveUserId, type: LEAVE_TYPE.WORK_ACCIDENT };
      const params: any = {
        take: pageSize,
        skip: (page - 1) * pageSize,
        where,
        orderBy: { startDate: "desc" as const },
      };
      if (searchTerm && searchTerm.trim()) params.searchingFor = searchTerm.trim();
      const response = await getLeaves(params);
      return {
        data: (response.data || []).map((leave: any) => ({
          value: leave.id,
          label: `${LEAVE_TYPE_LABELS[leave.type as keyof typeof LEAVE_TYPE_LABELS] || leave.type} — ${new Date(leave.startDate).toLocaleDateString("pt-BR")}`,
        })),
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [effectiveUserId]
  );

  const initialCollaboratorOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && workAccident?.user) {
      return [{
        value: workAccident.user.id,
        label: workAccident.user.name + (workAccident.user.position ? ` - ${workAccident.user.position.name}` : ""),
      }];
    }
    return [];
  }, [mode, workAccident?.user]);

  const initialLeaveOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && workAccident?.leave) {
      const leave = workAccident.leave as any;
      return [{
        value: leave.id,
        label: `${LEAVE_TYPE_LABELS[leave.type as keyof typeof LEAVE_TYPE_LABELS] || leave.type} — ${new Date(leave.startDate).toLocaleDateString("pt-BR")}`,
      }];
    }
    return [];
  }, [mode, workAccident?.leave]);

  const handleSubmit = async (data: WorkAccidentReportCreateFormData | WorkAccidentReportUpdateFormData) => {
    try {
      const payload: any = {
        ...data,
        catNumber: (data as any).catNumber?.trim() ? (data as any).catNumber.trim() : null,
        description: (data as any).description?.trim() ? (data as any).description.trim() : null,
        leaveId: (data as any).leaveId || null,
      };
      if (mode === "create") {
        const result = await createAsync(payload as WorkAccidentReportCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          nav.replace(mobileRoute(routes.personnelDepartment.occupationalHealth.workAccidents.details(newId)));
        } else {
          goBack();
        }
      } else if (workAccident) {
        // update schema omits userId — never send it.
        delete payload.userId;
        await updateAsync({
          id: workAccident.id,
          data: payload as WorkAccidentReportUpdateFormData,
        });
        onSuccess?.();
        nav.replace(mobileRoute(routes.personnelDepartment.occupationalHealth.workAccidents.details(workAccident.id)));
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
            {/* CAT Information Card */}
            <FormCard
              title="Comunicação de Acidente de Trabalho (CAT)"
              description="Registre a CAT do colaborador. A estabilidade acidentária (12 meses) é aplicada a partir do retorno do afastamento vinculado."
              icon="clipboard-list"
            >
              {/* Collaborator */}
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
                        onValueChange={(newValue) => {
                          onChange(newValue);
                          // Reset linked leave when collaborator changes.
                          form.setValue("leaveId" as any, null);
                        }}
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
                  <Combobox
                    options={initialCollaboratorOptions}
                    value={workAccident?.userId || ""}
                    onValueChange={() => {}}
                    placeholder="Colaborador"
                    disabled
                    searchable={false}
                    clearable={false}
                  />
                </FormFieldGroup>
              )}

              {/* Type */}
              <FormFieldGroup
                label="Tipo de CAT"
                required={mode === "create"}
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

              {/* CAT number */}
              <FormFieldGroup
                label="Nº da CAT"
                error={(form.formState.errors as any).catNumber?.message}
              >
                <Controller
                  control={form.control}
                  name="catNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Número da CAT"
                      editable={!isLoading}
                      maxLength={50}
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Dates */}
              <FormRow>
                <FormFieldGroup
                  label="Data do Acidente"
                  error={(form.formState.errors as any).accidentDate?.message}
                >
                  <Controller
                    control={form.control}
                    name="accidentDate"
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
                  label="Data de Emissão"
                  error={(form.formState.errors as any).emissionDate?.message}
                >
                  <Controller
                    control={form.control}
                    name="emissionDate"
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

              {/* Linked leave */}
              <FormFieldGroup
                label="Afastamento vinculado"
                helper="Afastamento por acidente de trabalho deste colaborador (opcional). A estabilidade de 12 meses é calculada a partir do retorno."
                error={(form.formState.errors as any).leaveId?.message}
              >
                <Controller
                  control={form.control}
                  name="leaveId"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      async
                      queryFn={loadLeaveOptions as any}
                      initialOptions={initialLeaveOptions}
                      minSearchLength={0}
                      value={value ?? ""}
                      onValueChange={(newValue) => onChange(newValue || null)}
                      placeholder={effectiveUserId ? "Selecione o afastamento (opcional)" : "Selecione um colaborador primeiro"}
                      searchPlaceholder="Buscar afastamento..."
                      disabled={isLoading || !effectiveUserId}
                      searchable
                      clearable
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Description */}
              <FormFieldGroup
                label="Descrição do acidente"
                error={(form.formState.errors as any).description?.message}
              >
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Textarea
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Descreva como ocorreu o acidente..."
                      numberOfLines={4}
                      editable={!isLoading}
                      maxLength={2000}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>

            {/* Stability Card — create only */}
            {mode === "create" && (
              <FormCard
                title="Estabilidade Acidentária"
                description="Aplica a estabilidade de 12 meses quando houver afastamento vinculado."
                icon="shield-check"
              >
                <FormFieldGroup
                  label="Aplicar estabilidade acidentária (12 meses)"
                  helper="Aplica estabilidade acidentária (12 meses)"
                >
                  <View style={styles.switchRow}>
                    <Controller
                      control={form.control}
                      name="confirmStability"
                      render={({ field: { onChange, value } }) => (
                        <Switch
                          checked={value || false}
                          onCheckedChange={onChange}
                          disabled={isLoading}
                        />
                      )}
                    />
                  </View>
                </FormFieldGroup>
              </FormCard>
            )}
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
