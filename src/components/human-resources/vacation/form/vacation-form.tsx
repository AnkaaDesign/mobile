import React from "react";
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
import { formSpacing, formTypography } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { vacationCreateSchema, vacationUpdateSchema } from "@/schemas/vacation";
import type { VacationCreateFormData, VacationUpdateFormData } from "@/schemas/vacation";
import type { Vacation } from "@/types";
import { useVacationMutations } from "@/hooks/useVacation";
import { useUsers } from "@/hooks/useUser";
import { VACATION_TYPE, VACATION_STATUS, USER_STATUS } from "@/constants";

interface VacationFormProps {
  mode: "create" | "update";
  vacation?: Vacation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VACATION_TYPE_LABELS = {
  [VACATION_TYPE.ANNUAL]: "Férias Anuais",
  [VACATION_TYPE.COLLECTIVE]: "Férias Coletivas",
  [VACATION_TYPE.SALE]: "Venda de Férias",
};

const VACATION_STATUS_LABELS = {
  [VACATION_STATUS.PENDING]: "Pendente",
  [VACATION_STATUS.APPROVED]: "Aprovado",
  [VACATION_STATUS.IN_PROGRESS]: "Em Andamento",
  [VACATION_STATUS.COMPLETED]: "Concluído",
  [VACATION_STATUS.REJECTED]: "Rejeitado",
  [VACATION_STATUS.CANCELLED]: "Cancelado",
};

export function VacationForm({ mode, vacation, onSuccess, onCancel }: VacationFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { createAsync, updateAsync, createMutation, updateMutation } = useVacationMutations();

  const { data: users } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
  });

  const form = useForm<VacationCreateFormData | VacationUpdateFormData>({
    resolver: zodResolver(mode === "create" ? vacationCreateSchema : vacationUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            userId: null,
            startAt: new Date(),
            endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
            type: VACATION_TYPE.ANNUAL,
            status: VACATION_STATUS.PENDING,
            isCollective: false,
          }
        : {
            userId: vacation?.userId,
            startAt: vacation?.startAt,
            endAt: vacation?.endAt,
            type: vacation?.type,
            status: vacation?.status,
            isCollective: vacation?.isCollective,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isCollective = form.watch("isCollective");

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

  const userOptions: ComboboxOption[] =
    users?.data?.map((user) => ({
      value: user.id,
      label: user.name,
    })) || [];

  const typeOptions: ComboboxOption[] = Object.entries(VACATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const statusOptions: ComboboxOption[] = Object.entries(VACATION_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView} keyboardVerticalOffset={0}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Main Form Card */}
        <FormCard
          title="Informações das Férias"
          subtitle="Preencha as informações do período de férias"
        >
          {/* Collective Toggle */}
          <FormFieldGroup label="Férias Coletivas" helper="Férias aplicadas a todos os colaboradores">
            <View style={styles.switchRow}>
              <Controller
                control={form.control}
                name="isCollective"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value || false} onValueChange={onChange} disabled={isLoading} />
                )}
              />
            </View>
          </FormFieldGroup>

          {/* User Selection - Only if not collective */}
          {!isCollective && (
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
                    options={userOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione o colaborador"
                    disabled={isLoading}
                    searchable
                    clearable={false}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    placeholder="Selecione o tipo"
                    disabled={isLoading}
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
        </ScrollView>

        {/* Standardized Action Bar */}
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
    paddingHorizontal: formSpacing.containerPaddingHorizontal, // 16px
    paddingTop: formSpacing.containerPaddingVertical, // 16px
    paddingBottom: 0, // No spacing - action bar has its own margin
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
