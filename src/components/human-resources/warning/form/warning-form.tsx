import React, { useMemo, useState, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

import { warningCreateSchema, warningUpdateSchema } from "@/schemas/warning";
import type { WarningCreateFormData, WarningUpdateFormData } from "@/schemas/warning";
import type { Warning } from "@/types";
import { useWarningMutations } from "@/hooks/useWarning";
import { useUsers } from "@/hooks/useUser";
import { WARNING_SEVERITY, WARNING_CATEGORY, USER_STATUS } from "@/constants";
import { userService } from "@/api-client/services/user";

interface WarningFormProps {
  mode: "create" | "update";
  warning?: Warning;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SEVERITY_LABELS = {
  [WARNING_SEVERITY.LOW]: "Baixa",
  [WARNING_SEVERITY.MEDIUM]: "Média",
  [WARNING_SEVERITY.HIGH]: "Alta",
};

const CATEGORY_LABELS = {
  [WARNING_CATEGORY.ABSENCE]: "Ausência",
  [WARNING_CATEGORY.DELAY]: "Atraso",
  [WARNING_CATEGORY.BEHAVIOR]: "Comportamento",
  [WARNING_CATEGORY.SAFETY]: "Segurança",
  [WARNING_CATEGORY.QUALITY]: "Qualidade",
  [WARNING_CATEGORY.OTHER]: "Outro",
};

export function WarningForm({ mode, warning, onSuccess, onCancel }: WarningFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useWarningMutations();

  // Async data loading functions
  const loadCollaboratorOptions = useCallback(async (search: string, page: number = 1) => {
    const queryParams: any = {
      page,
      take: 50,
      where: { isActive: true },
      include: { position: true },
    };

    if (search && search.trim()) {
      queryParams.searchingFor = search.trim();
    }

    const response = await userService.getUsers(queryParams);

    return {
      data: (response.data || []).map((user: any) => ({
        value: user.id,
        label: user.name + (user.position ? ` - ${user.position.name}` : ""),
      })),
      hasMore: response.meta?.hasNextPage || false,
    };
  }, []);

  const loadSupervisorOptions = useCallback(async (search: string, page: number = 1) => {
    const queryParams: any = {
      page,
      take: 50,
      where: { isActive: true },
      include: { position: true },
    };

    if (search && search.trim()) {
      queryParams.searchingFor = search.trim();
    }

    const response = await userService.getUsers(queryParams);

    return {
      data: (response.data || []).map((user: any) => ({
        value: user.id,
        label: user.name + (user.position ? ` - ${user.position.name}` : ""),
      })),
      hasMore: response.meta?.hasNextPage || false,
    };
  }, []);

  const loadWitnessOptions = useCallback(async (search: string, page: number = 1) => {
    const collaboratorId = form.watch("collaboratorId");
    const supervisorId = form.watch("supervisorId");
    const excludeIds = [collaboratorId, supervisorId].filter(Boolean);

    const whereClause: any = { isActive: true };
    if (excludeIds.length > 0) {
      whereClause.id = { notIn: excludeIds };
    }

    const queryParams: any = {
      page,
      take: 50,
      where: whereClause,
      include: { position: true },
    };

    if (search && search.trim()) {
      queryParams.searchingFor = search.trim();
    }

    const response = await userService.getUsers(queryParams);

    return {
      data: (response.data || []).map((user: any) => ({
        value: user.id,
        label: user.name + (user.position ? ` - ${user.position.name}` : ""),
      })),
      hasMore: response.meta?.hasNextPage || false,
    };
  }, []);

  // Default values for create mode
  const createDefaults: WarningCreateFormData = {
    severity: undefined,
    category: undefined,
    reason: "",
    description: "",
    isActive: true,
    collaboratorId: "",
    supervisorId: "",
    followUpDate: new Date(),
    hrNotes: "",
    witnessIds: [],
    attachmentIds: [],
  };

  const updateDefaults: WarningUpdateFormData = mode === "update" && warning ? {
    severity: warning.severity,
    category: warning.category,
    reason: warning.reason,
    description: warning.description || "",
    isActive: warning.isActive,
    collaboratorId: warning.collaboratorId,
    supervisorId: warning.supervisorId,
    followUpDate: warning.followUpDate ? new Date(warning.followUpDate) : new Date(),
    hrNotes: warning.hrNotes || "",
    witnessIds: warning.witness?.map((w: any) => w.id) || [],
    attachmentIds: warning.attachments?.map((f: any) => f.id) || [],
    resolvedAt: warning.resolvedAt ? new Date(warning.resolvedAt) : undefined,
  } : {} as WarningUpdateFormData;

  const form = useForm<WarningCreateFormData | WarningUpdateFormData>({
    resolver: zodResolver(mode === "create" ? warningCreateSchema : warningUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : updateDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    criteriaMode: "all",
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: WarningCreateFormData | WarningUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as WarningCreateFormData);
      } else if (warning) {
        await updateAsync({
          id: warning.id,
          data: data as WarningUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar a advertência");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const severityOptions: ComboboxOption[] = Object.entries(SEVERITY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const categoryOptions: ComboboxOption[] = Object.entries(CATEGORY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  // Get initial options for async comboboxes in edit mode
  const initialCollaboratorOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && warning?.collaborator) {
      return [{
        value: warning.collaborator.id,
        label: warning.collaborator.name + (warning.collaborator.position ? ` - ${warning.collaborator.position.name}` : ""),
      }];
    }
    return [];
  }, [mode, warning?.collaborator]);

  const initialSupervisorOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && warning?.supervisor) {
      return [{
        value: warning.supervisor.id,
        label: warning.supervisor.name + (warning.supervisor.position ? ` - ${warning.supervisor.position.name}` : ""),
      }];
    }
    return [];
  }, [mode, warning?.supervisor]);

  const initialWitnessOptions: ComboboxOption[] = useMemo(() => {
    if (mode === "update" && warning?.witness) {
      return warning.witness.map((w: any) => ({
        value: w.id,
        label: w.name + (w.position ? ` - ${w.position.name}` : ""),
      }));
    }
    return [];
  }, [mode, warning?.witness]);

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
            title="Informações da Advertência"
            description="Preencha os detalhes da advertência ao colaborador"
          >
            {/* Reason - First field */}
            <FormFieldGroup
              label="Motivo"
              required
              error={form.formState.errors.reason?.message}
            >
              <Controller
                control={form.control}
                name="reason"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Motivo da advertência"
                    editable={!isLoading}
                    error={!!form.formState.errors.reason}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Severity and Category */}
            <FormRow>
              <FormFieldGroup
                label="Gravidade"
                required
                error={form.formState.errors.severity?.message}
              >
                <Controller
                  control={form.control}
                  name="severity"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={severityOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione a gravidade"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup
                label="Categoria"
                required
                error={form.formState.errors.category?.message}
              >
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={categoryOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione a categoria"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormRow>

            {/* Description */}
            <FormFieldGroup
              label="Descrição"
              error={form.formState.errors.description?.message}
            >
              <Controller
                control={form.control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Textarea
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Descrição detalhada do ocorrido"
                    numberOfLines={4}
                    editable={!isLoading}
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>

          {/* People Involved Card */}
          <FormCard
            title="Pessoas Envolvidas"
            description="Selecione o colaborador, supervisor e testemunhas"
          >
            {/* Collaborator and Supervisor */}
            <FormRow>
              <FormFieldGroup
                label="Colaborador"
                required
                error={form.formState.errors.collaboratorId?.message}
              >
                <Controller
                  control={form.control}
                  name="collaboratorId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      async
                      loadOptions={loadCollaboratorOptions}
                      initialOptions={initialCollaboratorOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione o colaborador"
                      searchPlaceholder="Buscar colaborador..."
                      disabled={isLoading}
                      searchable
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup
                label="Supervisor"
                required
                error={form.formState.errors.supervisorId?.message}
              >
                <Controller
                  control={form.control}
                  name="supervisorId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      async
                      loadOptions={loadSupervisorOptions}
                      initialOptions={initialSupervisorOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione o supervisor"
                      searchPlaceholder="Buscar supervisor..."
                      disabled={isLoading}
                      searchable
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormRow>

            {/* Witnesses - Multi-select */}
            <FormFieldGroup
              label="Testemunhas"
              helper="Pessoas que presenciaram o incidente (opcional)"
              error={form.formState.errors.witnessIds?.message}
            >
              <Controller
                control={form.control}
                name="witnessIds"
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    async
                    multiple
                    loadOptions={loadWitnessOptions}
                    initialOptions={initialWitnessOptions}
                    value={value || []}
                    onValueChange={onChange}
                    placeholder="Selecione as testemunhas"
                    searchPlaceholder="Buscar testemunhas..."
                    disabled={isLoading}
                    searchable
                    clearable
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>

          {/* Follow-up and Notes Card */}
          <FormCard
            title="Acompanhamento"
            description="Defina a data de acompanhamento e adicione observações"
          >
            {/* Follow-up Date and Active Status */}
            {mode === "create" ? (
              <FormFieldGroup
                label="Data de Acompanhamento"
                required
                error={form.formState.errors.followUpDate?.message}
              >
                <Controller
                  control={form.control}
                  name="followUpDate"
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
            ) : (
              <FormRow>
                <FormFieldGroup
                  label="Data de Acompanhamento"
                  error={form.formState.errors.followUpDate?.message}
                >
                  <Controller
                    control={form.control}
                    name="followUpDate"
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
                  label="Ativa"
                  helper="Advertência está ativa"
                >
                  <View style={styles.switchRow}>
                    <Controller
                      control={form.control}
                      name="isActive"
                      render={({ field: { onChange, value } }) => (
                        <Switch
                          value={value || false}
                          onValueChange={onChange}
                          disabled={isLoading}
                        />
                      )}
                    />
                  </View>
                </FormFieldGroup>
              </FormRow>
            )}

            {/* HR Notes */}
            <FormFieldGroup
              label="Observações de RH"
              error={form.formState.errors.hrNotes?.message}
            >
              <Controller
                control={form.control}
                name="hrNotes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Textarea
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Observações internas do RH"
                    numberOfLines={3}
                    editable={!isLoading}
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <SimpleFormActionBar
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
    paddingBottom: 0, // No spacing - action bar has its own margin
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
