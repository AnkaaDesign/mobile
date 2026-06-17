import { useCallback, useMemo, useRef, useState } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useNav } from "@/contexts/nav";

import { userBenefitCreateSchema } from "@/schemas/benefit";
import type { UserBenefitCreateFormData, UserBenefitUpdateFormData } from "@/schemas/benefit";
import type { Benefit, UserBenefit, User } from "@/types";
import { useUserBenefitMutations } from "@/hooks/useUserBenefit";
import { getUsers, getBenefits } from "@/api-client";
import { BENEFIT_KIND, BENEFIT_KIND_LABELS, BENEFIT_ENROLLMENT_STATUS } from "@/constants";
import { getKindDiscountCap, getKindDiscountHelper } from "../discount-caps";
import { calculateBenefitSplit } from "@/utils/benefit-discount";
import { getPositionMonthlySalary } from "@/utils/overtime-cost";
import { formatCurrency } from "@/utils";

interface CreateModeProps {
  mode: "create";
}

interface UpdateModeProps {
  mode: "update";
  // Carregado com include { user: true, benefit: true }
  userBenefit: UserBenefit;
}

type UserBenefitFormProps = CreateModeProps | UpdateModeProps;

export function UserBenefitForm(props: UserBenefitFormProps) {
  const nav = useNav();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useUserBenefitMutations();

  // Cache de benefícios buscados para resolver kind/defaults na seleção.
  const benefitCacheRef = useRef<Map<string, Benefit>>(new Map());
  if (props.mode === "update" && props.userBenefit.benefit && !benefitCacheRef.current.has(props.userBenefit.benefit.id)) {
    benefitCacheRef.current.set(props.userBenefit.benefit.id, props.userBenefit.benefit);
  }

  // Cache de colaboradores para resolver o salário-base na seleção (a regra
  // percentual do VT desconta % do SALÁRIO-BASE, não do custo do VT).
  const userCacheRef = useRef<Map<string, User>>(new Map());
  if (props.mode === "update" && props.userBenefit.user && !userCacheRef.current.has(props.userBenefit.user.id)) {
    userCacheRef.current.set(props.userBenefit.user.id, props.userBenefit.user);
  }

  const kindRef = useRef<string | undefined>(props.mode === "update" ? props.userBenefit.benefit?.kind : undefined);
  const [selectedBenefitKind, setSelectedBenefitKind] = useState<string | undefined>(kindRef.current);

  // Schema: create compartilhado + regra XOR de desconto + tetos dinâmicos.
  const formSchema = useMemo(
    () =>
      userBenefitCreateSchema.superRefine((data, ctx) => {
        const bothMessage = "Informe o desconto em percentual OU em valor fixo, não ambos";
        if (
          data.employeeDiscountPercent !== null &&
          data.employeeDiscountPercent !== undefined &&
          data.employeeDiscountValue !== null &&
          data.employeeDiscountValue !== undefined
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["employeeDiscountPercent"], message: bothMessage });
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["employeeDiscountValue"], message: bothMessage });
        }

        if (data.employeeDiscountPercent !== null && data.employeeDiscountPercent !== undefined) {
          const cap = getKindDiscountCap(kindRef.current);
          if (data.employeeDiscountPercent > cap) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["employeeDiscountPercent"], message: getKindDiscountHelper(kindRef.current) });
          }
        }

        if (
          data.employeeDiscountValue !== null &&
          data.employeeDiscountValue !== undefined &&
          data.monthlyValue !== null &&
          data.monthlyValue !== undefined &&
          data.employeeDiscountValue > data.monthlyValue
        ) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["employeeDiscountValue"], message: "O desconto não pode exceder o valor mensal" });
        }
      }),
    [],
  );

  const form = useForm<UserBenefitCreateFormData>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues:
      props.mode === "create"
        ? {
            userId: undefined as any,
            benefitId: undefined as any,
            status: BENEFIT_ENROLLMENT_STATUS.ACTIVE,
            startDate: new Date(),
            endDate: null,
            monthlyValue: undefined as any,
            employeeDiscountValue: null,
            employeeDiscountPercent: null,
            dailyTickets: null,
            totalInstallments: null,
            currentInstallment: null,
            notes: null,
          }
        : {
            userId: props.userBenefit.userId,
            benefitId: props.userBenefit.benefitId,
            status: props.userBenefit.status,
            startDate: props.userBenefit.startDate ? new Date(props.userBenefit.startDate) : new Date(),
            endDate: props.userBenefit.endDate ? new Date(props.userBenefit.endDate) : null,
            monthlyValue: props.userBenefit.monthlyValue,
            employeeDiscountValue: props.userBenefit.employeeDiscountValue,
            employeeDiscountPercent: props.userBenefit.employeeDiscountPercent,
            dailyTickets: props.userBenefit.dailyTickets,
            totalInstallments: props.userBenefit.totalInstallments,
            currentInstallment: props.userBenefit.currentInstallment,
            notes: props.userBenefit.notes,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const discountCap = getKindDiscountCap(selectedBenefitKind);
  const discountHelper = getKindDiscountHelper(selectedBenefitKind);
  const showDailyTickets = selectedBenefitKind === BENEFIT_KIND.TRANSPORT_VOUCHER;

  // Preview ao vivo empresa × colaborador (regra canônica de folha).
  const watchedUserId = form.watch("userId");
  const watchedMonthlyValue = form.watch("monthlyValue");
  const watchedDiscountValue = form.watch("employeeDiscountValue");
  const watchedDiscountPercent = form.watch("employeeDiscountPercent");
  const selectedUser = watchedUserId ? userCacheRef.current.get(watchedUserId) : undefined;
  const selectedUserSalary = getPositionMonthlySalary(selectedUser?.position);
  const costSplit = calculateBenefitSplit(
    {
      monthlyValue: watchedMonthlyValue ?? 0,
      employeeDiscountValue: watchedDiscountValue,
      employeeDiscountPercent: watchedDiscountPercent,
      benefitKind: selectedBenefitKind,
    },
    selectedUserSalary,
  );
  const splitSalaryKnown = !costSplit.dependsOnSalary || selectedUserSalary !== null;

  // ===== Combobox de colaborador (async) =====
  const mapUserToOption = useCallback(
    (user: any): ComboboxOption => ({
      value: user.id,
      label: user.name + (user.position?.name ? ` - ${user.position.name}` : ""),
    }),
    [],
  );

  const loadUserOptions = useCallback(
    async (searchTerm: string, page: number = 1) => {
      const pageSize = 50;
      const where: any = { isActive: true };
      if (searchTerm && searchTerm.trim()) {
        where.name = { contains: searchTerm.trim(), mode: "insensitive" };
      }
      const response = await getUsers({
        take: pageSize,
        skip: (page - 1) * pageSize,
        where,
        orderBy: { name: "asc" as const },
        // remunerations = salário-base do cargo, usado no preview Empresa × Colaborador
        include: { position: { include: { remunerations: true } }, sector: true },
      } as any);
      const users = (response.data || []) as User[];
      users.forEach((u) => userCacheRef.current.set(u.id, u));
      return {
        data: users.map(mapUserToOption),
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [mapUserToOption],
  );

  const initialUserOptions: ComboboxOption[] = useMemo(
    () => (props.mode === "update" && props.userBenefit.user ? [mapUserToOption(props.userBenefit.user)] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ===== Combobox de benefício (async, ativos) =====
  const mapBenefitToOption = useCallback(
    (benefit: Benefit): ComboboxOption => ({
      value: benefit.id,
      label: benefit.name + (benefit.kind ? ` - ${BENEFIT_KIND_LABELS[benefit.kind] || benefit.kind}` : ""),
    }),
    [],
  );

  const loadBenefitOptions = useCallback(
    async (searchTerm: string, page: number = 1) => {
      const queryParams: any = { page, take: 50, isActive: true, orderBy: { name: "asc" } };
      if (searchTerm?.trim()) queryParams.searchingFor = searchTerm.trim();
      const response = await getBenefits(queryParams);
      const benefits = (response.data || []) as Benefit[];
      benefits.forEach((benefit) => benefitCacheRef.current.set(benefit.id, benefit));
      return {
        data: benefits.map(mapBenefitToOption),
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [mapBenefitToOption],
  );

  const initialBenefitOptions: ComboboxOption[] = useMemo(
    () => (props.mode === "update" && props.userBenefit.benefit ? [mapBenefitToOption(props.userBenefit.benefit)] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Auto-preenche monthlyValue / employeeDiscountPercent dos defaults do
  // benefício selecionado — apenas se os campos ainda estiverem vazios.
  const handleBenefitSelected = useCallback(
    (benefitId: string | undefined) => {
      const benefit = benefitId ? benefitCacheRef.current.get(benefitId) : undefined;
      kindRef.current = benefit?.kind;
      setSelectedBenefitKind(benefit?.kind);

      if (benefit?.kind !== BENEFIT_KIND.TRANSPORT_VOUCHER) {
        form.setValue("dailyTickets", null);
      }

      if (!benefit) return;

      if (benefit.defaultValue !== null && benefit.defaultValue !== undefined) {
        const monthlyValue = form.getValues("monthlyValue");
        if (monthlyValue === undefined || monthlyValue === null) {
          form.setValue("monthlyValue", benefit.defaultValue, { shouldValidate: true });
        }
      }

      if (benefit.defaultEmployeeDiscountPercent !== null && benefit.defaultEmployeeDiscountPercent !== undefined) {
        const percent = form.getValues("employeeDiscountPercent");
        const discountValue = form.getValues("employeeDiscountValue");
        if ((percent === undefined || percent === null) && (discountValue === undefined || discountValue === null)) {
          form.setValue("employeeDiscountPercent", benefit.defaultEmployeeDiscountPercent, { shouldValidate: true });
        }
      }
    },
    [form],
  );

  const handleSubmit = async (data: UserBenefitCreateFormData) => {
    try {
      if (props.mode === "create") {
        const result = await createAsync(data);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        if (newId) {
          nav.replace(`/recursos-humanos/beneficios/detalhes/${newId}` as any);
        } else {
          nav.goBack();
        }
      } else {
        await updateAsync({ id: props.userBenefit.id, data: data as UserBenefitUpdateFormData });
        nav.replace(`/recursos-humanos/beneficios/detalhes/${props.userBenefit.id}` as any);
      }
    } catch {
      // O toast de erro é exibido automaticamente pelo interceptor do api-client.
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
            {/* Informações da Adesão */}
            <FormCard title="Informações da Adesão" description="Vincule um colaborador a um benefício" icon="user">
              <FormFieldGroup label="Colaborador" required error={form.formState.errors.userId?.message}>
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      async
                      queryFn={loadUserOptions as any}
                      initialOptions={initialUserOptions}
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

              <FormFieldGroup label="Benefício" required error={form.formState.errors.benefitId?.message}>
                <Controller
                  control={form.control}
                  name="benefitId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      async
                      queryFn={loadBenefitOptions as any}
                      initialOptions={initialBenefitOptions}
                      minSearchLength={0}
                      value={value || ""}
                      onValueChange={(newValue) => {
                        onChange(newValue);
                        handleBenefitSelected(typeof newValue === "string" ? newValue : undefined);
                      }}
                      placeholder="Selecione o benefício"
                      searchPlaceholder="Buscar benefício..."
                      disabled={isLoading}
                      searchable
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>

            {/* Valores e Descontos */}
            <FormCard
              title="Valores e Descontos"
              description="Informe o desconto do colaborador em percentual OU em valor fixo — nunca ambos"
              icon="receipt"
            >
              <FormRow>
                <FormFieldGroup label="Valor Mensal" required error={form.formState.errors.monthlyValue?.message}>
                  <Controller
                    control={form.control}
                    name="monthlyValue"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        type="currency"
                        value={value ?? undefined}
                        onChange={onChange}
                        placeholder="0,00"
                        editable={!isLoading}
                        error={!!form.formState.errors.monthlyValue}
                      />
                    )}
                  />
                </FormFieldGroup>

                {showDailyTickets && (
                  <FormFieldGroup
                    label="Passagens por Dia"
                    helper="Quantidade de passagens diárias (Vale Transporte)"
                    error={(form.formState.errors as any).dailyTickets?.message}
                  >
                    <Controller
                      control={form.control}
                      name="dailyTickets"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          type="integer"
                          value={value ?? undefined}
                          onChange={onChange}
                          placeholder="0"
                          min={0}
                          editable={!isLoading}
                        />
                      )}
                    />
                  </FormFieldGroup>
                )}
              </FormRow>

              <FormRow>
                <FormFieldGroup
                  label="Desconto do Colaborador (%)"
                  helper={discountHelper}
                  error={form.formState.errors.employeeDiscountPercent?.message}
                >
                  <Controller
                    control={form.control}
                    name="employeeDiscountPercent"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        type="percentage"
                        value={value ?? undefined}
                        onChange={onChange}
                        placeholder="0"
                        min={0}
                        max={discountCap}
                        editable={!isLoading}
                        error={!!form.formState.errors.employeeDiscountPercent}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="Desconto do Colaborador (R$)" error={form.formState.errors.employeeDiscountValue?.message}>
                  <Controller
                    control={form.control}
                    name="employeeDiscountValue"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        type="currency"
                        value={value ?? undefined}
                        onChange={onChange}
                        placeholder="0,00"
                        editable={!isLoading}
                        error={!!form.formState.errors.employeeDiscountValue}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              {/* Preview empresa × colaborador (regra canônica de folha) */}
              <View style={[styles.splitBox, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
                <ThemedText style={[styles.splitLine, { color: colors.foreground }]}>
                  Custo total <ThemedText style={styles.splitStrong}>{formatCurrency(costSplit.monthlyValue)}</ThemedText>
                </ThemedText>
                {splitSalaryKnown ? (
                  <ThemedText style={[styles.splitLine, { color: colors.foreground }]}>
                    Empresa paga <ThemedText style={styles.splitStrong}>{formatCurrency(costSplit.companyShare)}</ThemedText>
                    {"  •  "}
                    Colaborador paga <ThemedText style={styles.splitStrong}>{formatCurrency(costSplit.employeeShare)}</ThemedText>
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.splitMuted, { color: colors.mutedForeground }]}>
                    Colaborador paga {watchedDiscountPercent}% do salário — selecione um colaborador com salário cadastrado para calcular
                  </ThemedText>
                )}
                {costSplit.dependsOnSalary && selectedUserSalary !== null && (
                  <ThemedText style={[styles.splitMuted, { color: colors.mutedForeground }]}>
                    Vale Transporte: {watchedDiscountPercent}% do salário-base de {formatCurrency(selectedUserSalary)}, limitado ao custo do VT.
                  </ThemedText>
                )}
                {(selectedBenefitKind === BENEFIT_KIND.TRANSPORT_VOUCHER ||
                  selectedBenefitKind === BENEFIT_KIND.MEAL_VOUCHER ||
                  selectedBenefitKind === BENEFIT_KIND.FOOD_VOUCHER) && (
                  <ThemedText style={[styles.splitMuted, { color: colors.mutedForeground }]}>{discountHelper}</ThemedText>
                )}
              </View>
            </FormCard>

            {/* Parcelamento (convênio) */}
            <FormCard
              title="Parcelamento (convênio)"
              description="Parcelamento opcional para convênios (ex.: farmácia, óptica) descontados em N folhas. Deixe em branco para desconto recorrente sem fim."
              icon="list"
            >
              <FormRow>
                <FormFieldGroup
                  label="Total de Parcelas"
                  helper="Número de folhas em que o convênio será descontado"
                  error={(form.formState.errors as any).totalInstallments?.message}
                >
                  <Controller
                    control={form.control}
                    name="totalInstallments"
                    render={({ field: { onChange, value } }) => (
                      <Input type="integer" value={value ?? undefined} onChange={onChange} placeholder="0" min={1} editable={!isLoading} />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="Parcela Atual"
                  helper="Parcela atual (ex.: 3 de 12)"
                  error={(form.formState.errors as any).currentInstallment?.message}
                >
                  <Controller
                    control={form.control}
                    name="currentInstallment"
                    render={({ field: { onChange, value } }) => (
                      <Input type="integer" value={value ?? undefined} onChange={onChange} placeholder="0" min={1} editable={!isLoading} />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>
            </FormCard>

            {/* Vigência e Observações */}
            <FormCard title="Vigência e Observações" icon="calendar">
              <FormRow>
                <FormFieldGroup label="Data de Início" error={form.formState.errors.startDate?.message}>
                  <Controller
                    control={form.control}
                    name="startDate"
                    render={({ field: { onChange, value } }) => (
                      <DatePicker value={value || undefined} onChange={onChange} placeholder="Selecione a data" disabled={isLoading} />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="Data de Fim"
                  helper="Opcional — preenchida ao encerrar a adesão"
                  error={form.formState.errors.endDate?.message}
                >
                  <Controller
                    control={form.control}
                    name="endDate"
                    render={({ field: { onChange, value } }) => (
                      <DatePicker value={value || undefined} onChange={(d) => onChange(d ?? null)} placeholder="Selecione a data" disabled={isLoading} />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              <FormFieldGroup label="Observações" error={form.formState.errors.notes?.message}>
                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Textarea
                      value={value || ""}
                      onChangeText={(text) => onChange(text || null)}
                      onBlur={onBlur}
                      placeholder="Observações sobre a adesão (opcional)"
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
          onCancel={() => nav.goBack()}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid}
          submitLabel={props.mode === "create" ? "Cadastrar" : "Atualizar"}
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
  splitBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  splitLine: {
    fontSize: fontSize.sm,
  },
  splitStrong: {
    fontWeight: fontWeight.semibold,
  },
  splitMuted: {
    fontSize: fontSize.xs,
  },
});
