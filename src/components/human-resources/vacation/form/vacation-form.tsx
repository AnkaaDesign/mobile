import { useMemo, useCallback, useEffect, useRef } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
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

import { vacationCreateSchema, vacationUpdateSchema } from "@/schemas/vacation";
import type { VacationCreateFormData, VacationUpdateFormData } from "@/schemas/vacation";
import type { Vacation, User } from "@/types";
import { useVacationMutations } from "@/hooks/useVacation";
import { userService } from "@/api-client";
import { VACATION_TYPE, VACATION_STATUS, VACATION_TYPE_LABELS, VACATION_STATUS_LABELS } from "@/constants";

interface VacationFormProps {
  mode: "create" | "update";
  vacation?: Vacation;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<VacationCreateFormData | VacationUpdateFormData>;
  isSubmitting?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onFormStateChange?: (formState: { isValid: boolean; isDirty: boolean }) => void;
}

export function VacationForm({
  mode,
  vacation,
  onSuccess,
  onCancel,
  defaultValues,
  isSubmitting: externalIsSubmitting,
  onDirtyChange,
  onFormStateChange
}: VacationFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useVacationMutations();

  // Create a custom resolver based on mode
  const customResolver = useMemo(() => {
    if (mode === "create") {
      return zodResolver(vacationCreateSchema);
    }
    return zodResolver(vacationUpdateSchema);
  }, [mode]);

  // Default values for create mode
  const createDefaults: Partial<VacationCreateFormData> = {
    userId: null,
    startAt: new Date(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week later
    type: VACATION_TYPE.ANNUAL,
    status: VACATION_STATUS.PENDING,
    isCollective: false,
    ...defaultValues,
  };

  // Default values for update mode
  const updateDefaults: Partial<VacationUpdateFormData> = mode === "update" ? {
    userId: vacation?.userId || undefined,
    startAt: vacation?.startAt ? new Date(vacation.startAt) : undefined,
    endAt: vacation?.endAt ? new Date(vacation.endAt) : undefined,
    type: vacation?.type,
    status: vacation?.status,
    isCollective: vacation?.isCollective,
    ...defaultValues,
  } : {};

  const form = useForm<VacationCreateFormData | VacationUpdateFormData>({
    resolver: customResolver,
    defaultValues: mode === "create" ? createDefaults : updateDefaults,
    mode: "onTouched", // Validate only after field is touched to avoid premature validation
    reValidateMode: "onChange", // After first validation, check on every change
  });

  // Reset form when defaultValues change in update mode (e.g., new vacation data loaded)
  const defaultValuesRef = useRef(defaultValues);
  useEffect(() => {
    if (mode === "update" && defaultValues && defaultValues !== defaultValuesRef.current) {
      // Reset form with new defaults and mark form as untouched/pristine
      form.reset(updateDefaults, {
        keepDefaultValues: false,
      });
      defaultValuesRef.current = defaultValues;
    }
  }, [defaultValues, form, mode, updateDefaults]);

  // Access formState properties during render for proper subscription
  const { isValid, isDirty, errors } = form.formState;

  const finalIsSubmitting = externalIsSubmitting || createMutation.isPending || updateMutation.isPending;
  const isCollective = form.watch("isCollective");

  // Auto-sync date validation to prevent errors
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // If end date is before start date, show error
      if ((name === "startAt" || name === "endAt") && value.startAt && value.endAt) {
        const startDate = new Date(value.startAt);
        const endDate = new Date(value.endAt);

        if (endDate <= startDate) {
          form.setError("endAt", {
            type: "validate",
            message: "Data de término deve ser posterior à data de início",
          });
        } else {
          // Clear error if dates are valid
          form.clearErrors("endAt");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Debug validation errors in development
  useEffect(() => {
    if (__DEV__ && Object.keys(errors).length > 0) {
      console.log("Vacation form validation errors:", {
        errors,
        currentValues: form.getValues(),
      });
    }
  }, [errors, form]);

  // Track dirty state without triggering validation
  useEffect(() => {
    if (onDirtyChange && mode === "update") {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange, mode]);

  // Track form state changes for submit button
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange({
        isValid,
        isDirty,
      });
    }
  }, [isValid, isDirty, onFormStateChange]);

  // Async query function for users
  const userQueryFn = useCallback(async (search: string, page: number = 1) => {
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
    return { data: response.data || [], hasMore: response.meta?.hasNextPage || false };
  }, []);

  // Memoize initial user options for update mode
  const initialUserOptions = useMemo(() => {
    if (mode === "update" && vacation?.user) {
      return [vacation.user];
    }
    return [];
  }, [mode, vacation?.user?.id]);

  const handleSubmit = async (data: VacationCreateFormData | VacationUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as VacationCreateFormData);
      } else if (vacation) {
        await updateAsync({
          id: vacation.id,
          data: data as VacationUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar as férias");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // Type options
  const typeOptions: ComboboxOption[] = Object.entries(VACATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // Status options
  const statusOptions: ComboboxOption[] = Object.entries(VACATION_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // Callbacks for async combobox
  const getOptionLabel = useCallback((user: User) => user.name, []);
  const getOptionValue = useCallback((user: User) => user.id, []);
  const renderUserOption = useCallback(
    (user: User) => (
      <View>
        <Text style={{ fontWeight: "600" }}>{user.name}</Text>
        {(user.email || user.position?.name) && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {user.email && <Text style={{ fontSize: 12, opacity: 0.6 }}>{user.email}</Text>}
            {user.position?.name && <Text style={{ fontSize: 12, opacity: 0.6 }}>{user.position.name}</Text>}
          </View>
        )}
      </View>
    ),
    [],
  );

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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
          {/* Main Form Card */}
          <FormCard title="Informações das Férias" description="Preencha as informações do período de férias" icon="IconBeach">
          {/* Collective Toggle */}
          <FormFieldGroup label="Férias Coletivas" helper="Férias aplicadas a todos os colaboradores">
            <View style={styles.switchRow}>
              <Controller
                control={form.control}
                name="isCollective"
                render={({ field: { onChange, value } }) => (
                  <Switch checked={value || false} onCheckedChange={onChange} disabled={finalIsSubmitting} />
                )}
              />
            </View>
          </FormFieldGroup>

          {/* User Selection - Only if not collective */}
          {!isCollective && (
            <FormFieldGroup
              label="Colaborador"
              required
              helper="Selecione o colaborador que irá tirar férias"
              error={form.formState.errors.userId?.message}
            >
              <Controller
                control={form.control}
                name="userId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    value={value || ""}
                    onValueChange={onChange}
                    placeholder="Selecione um colaborador"
                    emptyText="Nenhum colaborador encontrado"
                    searchPlaceholder="Buscar colaborador..."
                    async={true}
                    minSearchLength={0}
                    queryKey={["users", "vacation"]}
                    queryFn={userQueryFn}
                    getOptionLabel={getOptionLabel}
                    getOptionValue={getOptionValue}
                    renderOption={renderUserOption}
                    initialOptions={initialUserOptions}
                    pageSize={50}
                    debounceMs={300}
                    searchable={true}
                    clearable={true}
                    disabled={finalIsSubmitting || mode === "update"}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          )}

          {/* Date Row - Start and End on same row */}
          <FormRow>
            {/* Start Date */}
            <FormFieldGroup
              label="Data de Início"
              required
              error={form.formState.errors.startAt?.message}
            >
              <Controller
                control={form.control}
                name="startAt"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    value={value}
                    onChange={onChange}
                    placeholder="Selecione a data"
                    disabled={finalIsSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            {/* End Date */}
            <FormFieldGroup
              label="Data de Término"
              required
              helper="Deve ser posterior à data de início"
              error={form.formState.errors.endAt?.message}
            >
              <Controller
                control={form.control}
                name="endAt"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    value={value}
                    onChange={onChange}
                    placeholder="Selecione a data"
                    disabled={finalIsSubmitting}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Type and Status Row */}
          <FormRow>
            {/* Type */}
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
                    placeholder="Selecione um tipo"
                    emptyText="Nenhum tipo encontrado"
                    searchPlaceholder="Buscar tipo..."
                    disabled={finalIsSubmitting}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Status */}
            <FormFieldGroup
              label="Status"
              required
              helper="Status atual do período de férias"
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
                    placeholder="Selecione um status"
                    emptyText="Nenhum status encontrado"
                    searchPlaceholder="Buscar status..."
                    disabled={finalIsSubmitting}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
        </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <SimpleFormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={finalIsSubmitting}
          canSubmit={isValid && (mode === "create" || isDirty)}
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
