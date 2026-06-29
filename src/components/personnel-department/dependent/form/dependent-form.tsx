import { useMemo } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { CpfInput } from "@/components/ui/cpf-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing, fontSize } from "@/constants/design-system";
import { CONTRACT_STATUS } from "@/constants";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { ThemedText } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useNav } from "@/contexts/nav";

import { dependentCreateSchema, dependentUpdateSchema } from "@/schemas/dependent";
import type { DependentCreateFormData, DependentUpdateFormData } from "@/schemas/dependent";
import type { Dependent } from "@/types";
import { useDependentMutations } from "@/hooks/useDependent";
import { useUsers } from "@/hooks/useUser";
import { useUserBenefits } from "@/hooks/useUserBenefit";
import { DEPENDENT_RELATIONSHIP_LABELS } from "@/constants/enum-labels";
import { BENEFIT_KIND, BENEFIT_ENROLLMENT_STATUS } from "@/constants/enums";

interface DependentFormProps {
  mode: "create" | "update";
  dependent?: Dependent;
  /** Pre-selected collaborator (locks the user field when provided). */
  userId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RELATIONSHIP_OPTIONS: ComboboxOption[] = Object.entries(DEPENDENT_RELATIONSHIP_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function DependentForm({ mode, dependent, userId, onSuccess, onCancel }: DependentFormProps) {
  const nav = useNav();
  const goBack = () => nav.goBack();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useDependentMutations();

  const { data: users } = useUsers({
    // Only active collaborators (ACTIVE current vínculo) can have dependents registered.
    contractStatuses: [CONTRACT_STATUS.ACTIVE],
    orderBy: { name: "asc" },
    include: { position: true },
  });

  const lockUser = !!userId && mode === "create";

  const form = useForm<DependentCreateFormData | DependentUpdateFormData>({
    resolver: zodResolver(mode === "create" ? dependentCreateSchema : dependentUpdateSchema),
    mode: "onTouched",
    defaultValues:
      mode === "create"
        ? {
            userId: userId ?? "",
            name: "",
            cpf: null,
            birthDate: undefined as any,
            relationship: "" as any,
            irrfDeduction: true,
            salarioFamilia: false,
            healthPlanBenefitId: null,
            healthPlanValue: null,
            notes: "",
          }
        : {
            userId: dependent?.userId,
            name: dependent?.name,
            cpf: dependent?.cpf ?? null,
            birthDate: dependent?.birthDate ? new Date(dependent.birthDate) : undefined,
            relationship: dependent?.relationship,
            irrfDeduction: dependent?.irrfDeduction,
            salarioFamilia: dependent?.salarioFamilia,
            healthPlanBenefitId: dependent?.healthPlanBenefitId ?? null,
            healthPlanValue: dependent?.healthPlanValue ?? null,
            notes: dependent?.notes ?? "",
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // The collaborator whose ACTIVE health-plan enrollments power the dropdown.
  const selectedUserId = form.watch("userId");
  const selectedHealthPlanBenefitId = form.watch("healthPlanBenefitId");

  // Titular's ACTIVE health-plan enrollments — options for enrolling a dependent.
  const { data: benefitsResponse } = useUserBenefits(
    {
      userIds: selectedUserId ? [selectedUserId] : [],
      statuses: [BENEFIT_ENROLLMENT_STATUS.ACTIVE],
      kinds: [BENEFIT_KIND.HEALTH_PLAN],
      include: { benefit: true },
      limit: 50,
    } as any,
    { enabled: !!selectedUserId },
  );

  const healthPlanOptions: ComboboxOption[] = useMemo(
    () =>
      (benefitsResponse?.data || []).map((e: any) => ({
        value: e.id,
        label: e.benefit?.name || "Plano de Saúde",
      })),
    [benefitsResponse],
  );

  const userOptions: ComboboxOption[] =
    users?.data?.map((user) => ({
      value: user.id,
      label: user.name + (user.position ? ` - ${user.position.name}` : ""),
    })) || [];

  const handleSubmit = async (data: DependentCreateFormData | DependentUpdateFormData) => {
    const cleaned = {
      ...data,
      cpf: data.cpf?.trim() ? data.cpf : null,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      healthPlanBenefitId: data.healthPlanBenefitId || null,
      // No plan selected → no per-dependent cost
      healthPlanValue: data.healthPlanBenefitId ? (data.healthPlanValue ?? null) : null,
    };

    try {
      if (mode === "create") {
        const result = await createAsync(cleaned as DependentCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          nav.replace(`/departamento-pessoal/dependentes/detalhes/${newId}` as any);
        } else {
          goBack();
        }
      } else if (dependent) {
        await updateAsync({
          id: dependent.id,
          data: cleaned as DependentUpdateFormData,
        });
        onSuccess?.();
        nav.replace(`/departamento-pessoal/dependentes/detalhes/${dependent.id}` as any);
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

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(
    () => ({
      onFieldLayout: handlers.handleFieldLayout,
      onFieldFocus: handlers.handleFieldFocus,
      onComboboxOpen: handlers.handleComboboxOpen,
      onComboboxClose: handlers.handleComboboxClose,
    }),
    [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose],
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
            {/* Collaborator Section */}
            <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="IconUser" size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Colaborador</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <FormFieldGroup label="Colaborador" required error={form.formState.errors.userId?.message}>
                  <Controller
                    control={form.control}
                    name="userId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        options={userOptions}
                        value={value ?? ""}
                        onValueChange={onChange}
                        placeholder="Selecione um funcionário"
                        searchPlaceholder="Buscar funcionário..."
                        disabled={isLoading || lockUser}
                        searchable
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              </View>
            </Card>

            {/* Identification Section */}
            <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="IconId" size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Identificação</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <FormFieldGroup label="Nome" required error={form.formState.errors.name?.message}>
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        type="text"
                        value={value ?? ""}
                        onChangeText={onChange}
                        placeholder="Nome completo do dependente"
                        editable={!isLoading}
                        maxLength={200}
                        error={!!form.formState.errors.name}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormRow>
                  <FormFieldGroup label="CPF" error={form.formState.errors.cpf?.message}>
                    <Controller
                      control={form.control}
                      name="cpf"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <CpfInput
                          value={value ?? undefined}
                          onChange={onChange}
                          onBlur={onBlur}
                          error={!!form.formState.errors.cpf}
                          containerStyle={{ marginBottom: 0 }}
                        />
                      )}
                    />
                  </FormFieldGroup>

                  <FormFieldGroup label="Data de Nascimento" required error={form.formState.errors.birthDate?.message}>
                    <Controller
                      control={form.control}
                      name="birthDate"
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <DatePicker
                          mode="date"
                          value={value instanceof Date ? value : value ? new Date(value) : undefined}
                          onChange={onChange}
                          placeholder="dd/mm/aaaa"
                          disabled={isLoading}
                          disableFutureDates
                          error={error?.message}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormRow>

                <FormFieldGroup label="Parentesco" required error={form.formState.errors.relationship?.message}>
                  <Controller
                    control={form.control}
                    name="relationship"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        options={RELATIONSHIP_OPTIONS}
                        value={value ?? ""}
                        onValueChange={onChange}
                        placeholder="Selecione o parentesco"
                        disabled={isLoading}
                        searchable={false}
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              </View>
            </Card>

            {/* Eligibility Section */}
            <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="IconReceiptTax" size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Elegibilidade</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <Controller
                  control={form.control}
                  name="irrfDeduction"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.switchRow}>
                      <View style={styles.switchLabel}>
                        <ThemedText style={styles.switchTitle}>Dedução IRRF</ThemedText>
                        <ThemedText style={[styles.switchDescription, { color: colors.mutedForeground }]}>
                          Elegível à dedução de IRRF
                        </ThemedText>
                      </View>
                      <Switch value={!!value} onValueChange={onChange} disabled={isLoading} />
                    </View>
                  )}
                />

                <Controller
                  control={form.control}
                  name="salarioFamilia"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.switchRow}>
                      <View style={styles.switchLabel}>
                        <ThemedText style={styles.switchTitle}>Salário-Família</ThemedText>
                        <ThemedText style={[styles.switchDescription, { color: colors.mutedForeground }]}>
                          Elegível ao salário-família
                        </ThemedText>
                      </View>
                      <Switch value={!!value} onValueChange={onChange} disabled={isLoading} />
                    </View>
                  )}
                />
              </View>
            </Card>

            {/* Health Plan Section */}
            <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="IconHeartHandshake" size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Plano de Saúde</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <FormFieldGroup label="Adesão ao plano" error={form.formState.errors.healthPlanBenefitId?.message}>
                  <Controller
                    control={form.control}
                    name="healthPlanBenefitId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        options={healthPlanOptions}
                        value={value ?? ""}
                        onValueChange={(val) => onChange(val || null)}
                        placeholder={
                          !selectedUserId
                            ? "Selecione o colaborador primeiro"
                            : healthPlanOptions.length === 0
                            ? "Nenhum plano de saúde ativo do titular"
                            : "Não inscrito"
                        }
                        disabled={isLoading || !selectedUserId || healthPlanOptions.length === 0}
                        searchable={false}
                        clearable
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>

                {selectedHealthPlanBenefitId && (
                  <>
                    <FormFieldGroup label="Custo do dependente" error={form.formState.errors.healthPlanValue?.message}>
                      <Controller
                        control={form.control}
                        name="healthPlanValue"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            type="currency"
                            value={value ?? undefined}
                            onChange={onChange}
                            placeholder="0,00"
                            editable={!isLoading}
                            error={!!form.formState.errors.healthPlanValue}
                          />
                        )}
                      />
                    </FormFieldGroup>
                    <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                      Este valor compõe a dedução de IRRF do titular.
                    </Text>
                  </>
                )}
              </View>
            </Card>

            {/* Notes Section */}
            <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Icon name="IconNotes" size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Observações</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <FormFieldGroup label="Observações" error={form.formState.errors.notes?.message}>
                  <Controller
                    control={form.control}
                    name="notes"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        type="text"
                        value={value ?? ""}
                        onChangeText={onChange}
                        placeholder="Observações sobre o dependente (opcional)"
                        editable={!isLoading}
                        maxLength={1000}
                        multiline
                        numberOfLines={3}
                        error={!!form.formState.errors.notes}
                      />
                    )}
                  />
                </FormFieldGroup>
              </View>
            </Card>
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
    gap: formSpacing.cardMarginBottom,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  switchLabel: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.md,
  },
  switchTitle: {
    fontSize: fontSize.base,
    fontWeight: "500",
  },
  switchDescription: {
    fontSize: fontSize.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
