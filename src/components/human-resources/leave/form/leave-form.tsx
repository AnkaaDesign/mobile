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
import { routes } from "@/constants";
import { useNav } from "@/contexts/nav";

import { leaveCreateSchema, leaveUpdateSchema } from "@/schemas/leave";
import type { LeaveCreateFormData, LeaveUpdateFormData } from "@/schemas/leave";
import type { Leave } from "@/types";
import { useLeaveMutations } from "@/hooks/useLeave";
import { LEAVE_STATUS, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, INSS_BENEFIT_SPECIES_LABELS } from "@/constants";
import { getUsers } from "@/api-client";

interface LeaveFormProps {
  mode: "create" | "update";
  leave?: Leave;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeaveForm({ mode, leave, onSuccess, onCancel }: LeaveFormProps) {
  const nav = useNav();
  const goBack = () => nav.goBack();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useLeaveMutations();

  // Default values for create mode
  const createDefaults: LeaveCreateFormData = {
    userId: "",
    type: "" as any,
    status: LEAVE_STATUS.SCHEDULED,
    startDate: new Date(),
    expectedEndDate: null,
    actualEndDate: null,
    cid: null,
    inssBenefitSpecies: null,
    inssBenefitNumber: null,
    returnExamRequired: false,
    notes: null,
    fileIds: [],
  };

  const updateDefaults: LeaveUpdateFormData = mode === "update" && leave ? {
    userId: leave.userId,
    type: leave.type,
    status: leave.status,
    startDate: leave.startDate ? new Date(leave.startDate) : new Date(),
    expectedEndDate: leave.expectedEndDate ? new Date(leave.expectedEndDate) : null,
    actualEndDate: leave.actualEndDate ? new Date(leave.actualEndDate) : null,
    cid: leave.cid ?? null,
    inssBenefitSpecies: leave.inssBenefitSpecies ?? null,
    inssBenefitNumber: leave.inssBenefitNumber ?? null,
    returnExamRequired: leave.returnExamRequired ?? false,
    notes: leave.notes ?? null,
    fileIds: leave.files?.map((f: any) => f.id) || [],
  } : {} as LeaveUpdateFormData;

  const form = useForm<LeaveCreateFormData | LeaveUpdateFormData>({
    resolver: zodResolver(mode === "create" ? leaveCreateSchema : leaveUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : updateDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    criteriaMode: "all",
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Async user loader mirrors the web/collaborator-select: active users, search by name, paginated.
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

  const handleSubmit = async (data: LeaveCreateFormData | LeaveUpdateFormData) => {
    try {
      if (mode === "create") {
        const result = await createAsync(data as LeaveCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          nav.replace(mobileRoute(routes.humanResources.occupationalHealth.leaves.details(newId)));
        } else {
          goBack();
        }
      } else if (leave) {
        await updateAsync({
          id: leave.id,
          data: data as LeaveUpdateFormData,
        });
        onSuccess?.();
        nav.replace(mobileRoute(routes.humanResources.occupationalHealth.leaves.details(leave.id)));
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

  const typeOptions: ComboboxOption[] = Object.entries(LEAVE_TYPE_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  const statusOptions: ComboboxOption[] = Object.entries(LEAVE_STATUS_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  const speciesOptions: ComboboxOption[] = Object.entries(INSS_BENEFIT_SPECIES_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Get initial options for the async collaborator combobox in edit mode
  const initialCollaboratorOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && leave?.user) {
      return [{
        value: leave.user.id,
        label: leave.user.name + (leave.user.position ? ` - ${leave.user.position.name}` : ""),
      }];
    }
    return [];
  }, [mode, leave?.user]);

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
          {/* Basic Information Card */}
          <FormCard
            title="Informações do Afastamento"
            description="Preencha os detalhes do afastamento do colaborador"
            icon="IconCalendarOff"
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
          </FormCard>

          {/* Dates Card */}
          <FormCard
            title="Datas"
            description="Defina as datas do afastamento"
            icon="IconCalendar"
          >
            <FormFieldGroup
              label="Data de Início"
              required
              error={form.formState.errors.startDate?.message}
            >
              <Controller
                control={form.control}
                name="startDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    value={value || undefined}
                    onChange={onChange}
                    placeholder="Selecione a data de início"
                    disabled={isLoading}
                  />
                )}
              />
            </FormFieldGroup>

            <FormRow>
              <FormFieldGroup
                label="Término Previsto"
                error={form.formState.errors.expectedEndDate?.message}
              >
                <Controller
                  control={form.control}
                  name="expectedEndDate"
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
                label="Retorno Efetivo"
                error={form.formState.errors.actualEndDate?.message}
              >
                <Controller
                  control={form.control}
                  name="actualEndDate"
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

          {/* Restricted / clinical information Card */}
          <FormCard
            title="Informações Restritas"
            description="Dados clínicos e previdenciários — campo de acesso restrito"
            icon="IconStethoscope"
          >
            <FormFieldGroup
              label="CID"
              helper="Campo restrito (dado clínico)."
              error={(form.formState.errors as any).cid?.message}
            >
              <Controller
                control={form.control}
                name={"cid" as any}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ex: M54.5"
                    editable={!isLoading}
                  />
                )}
              />
            </FormFieldGroup>

            <FormRow>
              <FormFieldGroup
                label="Espécie do Benefício"
                error={(form.formState.errors as any).inssBenefitSpecies?.message}
              >
                <Controller
                  control={form.control}
                  name={"inssBenefitSpecies" as any}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={speciesOptions}
                      value={value || ""}
                      onValueChange={(v) => onChange(v || null)}
                      placeholder="Selecione a espécie"
                      disabled={isLoading}
                      searchable={false}
                      clearable
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup
                label="Nº do Benefício INSS"
                error={(form.formState.errors as any).inssBenefitNumber?.message}
              >
                <Controller
                  control={form.control}
                  name={"inssBenefitNumber" as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Número do benefício"
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormRow>
          </FormCard>

          {/* Follow-up and Notes Card */}
          <FormCard
            title="Acompanhamento"
            description="Exame de retorno e observações"
            icon="IconNotes"
          >
            <FormFieldGroup
              label="Exame de Retorno"
              helper="Exige exame médico de retorno ao trabalho"
            >
              <View style={styles.switchRow}>
                <Controller
                  control={form.control}
                  name="returnExamRequired"
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

            <FormFieldGroup
              label="Observações"
              error={(form.formState.errors as any).notes?.message}
            >
              <Controller
                control={form.control}
                name={"notes" as any}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Textarea
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Observações sobre o afastamento"
                    numberOfLines={4}
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
