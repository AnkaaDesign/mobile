import React, { useMemo } from "react";
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

  const { data: users } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
    include: { position: true },
  });

  const form = useForm<WarningCreateFormData | WarningUpdateFormData>({
    resolver: zodResolver(mode === "create" ? warningCreateSchema : warningUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            severity: WARNING_SEVERITY.LOW,
            category: WARNING_CATEGORY.OTHER,
            reason: "",
            description: null,
            isActive: true,
            collaboratorId: "",
            supervisorId: "",
            witnessIds: [],
            attachmentIds: [],
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            hrNotes: null,
            resolvedAt: null,
          }
        : {
            severity: warning?.severity,
            category: warning?.category,
            reason: warning?.reason,
            description: warning?.description,
            isActive: warning?.isActive,
            collaboratorId: warning?.collaboratorId,
            supervisorId: warning?.supervisorId,
            witnessIds: warning?.witness?.map((w) => w.id) || [],
            attachmentIds: warning?.attachments?.map((a) => a.id) || [],
            followUpDate: warning?.followUpDate,
            hrNotes: warning?.hrNotes,
            resolvedAt: warning?.resolvedAt,
          },
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

  const userOptions: ComboboxOption[] =
    users?.data?.map((user) => ({
      value: user.id,
      label: user.name + (user.position ? ` - ${user.position.name}` : ""),
    })) || [];

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
          <FormCard title="Informações da Advertência">
          {/* Collaborator */}
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
                  options={userOptions}
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

          {/* Supervisor */}
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
                  options={userOptions}
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

          {/* Reason */}
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

          {/* Follow-up Date */}
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

          {/* Resolved At */}
          {mode === "update" && (
            <FormFieldGroup
              label="Data de Resolução"
              error={form.formState.errors.resolvedAt?.message}
            >
              <Controller
                control={form.control}
                name="resolvedAt"
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
          )}

          {/* Is Active */}
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
          </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <SimpleFormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid}
          submitLabel={mode === "create" ? "Criar" : "Salvar"}
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
