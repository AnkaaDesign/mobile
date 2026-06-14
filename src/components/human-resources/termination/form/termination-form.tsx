import { useMemo, useCallback, useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
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
import { useNav } from "@/contexts/nav";

import { terminationCreateSchema, terminationUpdateSchema } from "@/schemas/termination";
import type { TerminationCreateFormData, TerminationUpdateFormData } from "@/schemas/termination";
import type { Termination } from "@/types";
import { useTerminationMutations } from "@/hooks/useTermination";
import {
  TERMINATION_TYPE,
  NOTICE_TYPE,
  NOTICE_REDUCTION,
  STABILITY_TYPE,
} from "@/constants";
import {
  TERMINATION_TYPE_LABELS,
  NOTICE_TYPE_LABELS,
  NOTICE_REDUCTION_LABELS,
  STABILITY_TYPE_LABELS,
} from "@/constants/enum-labels";
import { getUsers } from "@/api-client";
import type { EmploymentContract } from "@/types/employment-contract";
import { formatDate } from "@/utils/date";

interface TerminationFormProps {
  mode: "create" | "update";
  termination?: Termination;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Modalities where an aviso prévio applies (notice section shown).
const NOTICE_RELEVANT_TYPES = new Set<string>([
  TERMINATION_TYPE.WITHOUT_CAUSE,
  TERMINATION_TYPE.RESIGNATION,
  TERMINATION_TYPE.INDIRECT,
  TERMINATION_TYPE.MUTUAL_AGREEMENT,
]);

// Modalities that, when applied to a contrato a prazo / experiência, can trigger
// art. 479/480 indemnities. Used for the contextual messaging block.
const FIXED_TERM_TYPES = new Set<string>([
  TERMINATION_TYPE.EXPERIENCE_END,
  TERMINATION_TYPE.EXPERIENCE_EARLY_EMPLOYER,
  TERMINATION_TYPE.EXPERIENCE_EARLY_EMPLOYEE,
  TERMINATION_TYPE.FIXED_TERM_EARLY_EMPLOYEE,
  TERMINATION_TYPE.INTERMITTENT_END,
]);

export function TerminationForm({ mode, termination, onSuccess, onCancel }: TerminationFormProps) {
  const nav = useNav();
  const goBack = () => nav.goBack();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useTerminationMutations();

  // Selected collaborator's current vínculo — used to surface estabilidade
  // and art. 481 (cláusula assecuratória) messaging at form time.
  const [currentContract, setCurrentContract] = useState<EmploymentContract | null>(
    (termination?.user?.currentContract as EmploymentContract | undefined) ?? null,
  );

  const createDefaults: TerminationCreateFormData = {
    userId: termination?.userId ?? "",
    type: "" as any,
    noticeType: null,
    noticeReduction: NOTICE_REDUCTION.NONE,
    noticeStartDate: null,
    terminationDate: new Date(),
    baseRemuneration: null,
    fgtsBalance: null,
    accruedVacationPeriods: 0,
    reason: "",
    justCauseArticle: "",
  } as any;

  const updateDefaults: TerminationUpdateFormData = mode === "update" && termination ? {
    noticeType: termination.noticeType ?? null,
    noticeReduction: termination.noticeReduction ?? NOTICE_REDUCTION.NONE,
    noticeDays: termination.noticeDays ?? null,
    noticeStartDate: termination.noticeStartDate ? new Date(termination.noticeStartDate) : null,
    lastWorkingDate: termination.lastWorkingDate ? new Date(termination.lastWorkingDate) : null,
    terminationDate: termination.terminationDate ? new Date(termination.terminationDate) : null,
    paymentDate: termination.paymentDate ? new Date(termination.paymentDate) : null,
    paidAmount: termination.paidAmount ?? null,
    baseRemuneration: termination.baseRemuneration ?? null,
    fgtsBalance: termination.fgtsBalance ?? null,
    accruedVacationPeriods: termination.accruedVacationPeriods ?? 0,
    reason: termination.reason ?? "",
    justCauseArticle: termination.justCauseArticle ?? "",
  } as any : {} as TerminationUpdateFormData;

  const form = useForm<TerminationCreateFormData | TerminationUpdateFormData>({
    resolver: zodResolver(mode === "create" ? terminationCreateSchema : terminationUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : updateDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    criteriaMode: "all",
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Watch type to drive conditional sections + messaging.
  const selectedType = (form.watch("type" as any) as string | undefined) ?? termination?.type;
  const selectedNoticeType = form.watch("noticeType" as any) as string | null | undefined;

  const showNoticeSection =
    !!selectedType && (NOTICE_RELEVANT_TYPES.has(selectedType) || mode === "update");

  // Estabilidade guard: WITHOUT_CAUSE is blocked while the worker is under a
  // stability window. We surface a blocking banner and disable submit.
  const underStability = useMemo(() => {
    if (!currentContract?.stabilityType) return false;
    const end = currentContract.stabilityEnd ? new Date(currentContract.stabilityEnd) : null;
    if (end && end.getTime() < Date.now()) return false;
    return true;
  }, [currentContract]);

  const stabilityBlocksDismissal =
    underStability && selectedType === TERMINATION_TYPE.WITHOUT_CAUSE;

  // ── Async collaborator loader ───────────────────────────────────────────────
  const buildUserQuery = useCallback((searchTerm: string, page: number) => {
    const pageSize = 50;
    const where: any = {};
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
      include: { position: true, currentContract: true },
    };
  }, []);

  const loadCollaboratorOptions = useCallback(
    async (searchTerm: string, page: number = 1) => {
      const response = await getUsers(buildUserQuery(searchTerm, page) as any);
      return {
        data: (response.data || []).map((user: any) => ({
          value: user.id,
          label: user.name + (user.position ? ` - ${user.position.name}` : ""),
          // Stash the contract so onValueChange can surface guard messaging.
          __contract: user.currentContract ?? null,
        })) as any,
        hasMore: response.meta?.hasNextPage || false,
      };
    },
    [buildUserQuery],
  );

  // When the selected collaborator changes, refresh its current contract so the
  // estabilidade / art. 481 messaging reflects the chosen worker.
  const onCollaboratorChange = useCallback(
    async (
      raw: string | string[] | null | undefined,
      onChange: (v: string) => void,
    ) => {
      const userId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
      onChange(userId);
      if (!userId) {
        setCurrentContract(null);
        return;
      }
      try {
        const response = await getUsers({
          where: { id: userId },
          include: { currentContract: true },
          take: 1,
        } as any);
        const user = (response.data || [])[0] as any;
        setCurrentContract((user?.currentContract as EmploymentContract) ?? null);
      } catch {
        setCurrentContract(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (mode === "update" && termination?.user?.currentContract) {
      setCurrentContract(termination.user.currentContract as EmploymentContract);
    }
  }, [mode, termination?.user?.currentContract]);

  const handleSubmit = async (data: TerminationCreateFormData | TerminationUpdateFormData) => {
    if (stabilityBlocksDismissal) return;
    try {
      if (mode === "create") {
        const result = await createAsync(data as TerminationCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          nav.replace(`/recursos-humanos/rescisoes/detalhes/${newId}` as any);
        } else {
          goBack();
        }
      } else if (termination) {
        await updateAsync({ id: termination.id, data: data as TerminationUpdateFormData });
        onSuccess?.();
        nav.replace(`/recursos-humanos/rescisoes/detalhes/${termination.id}` as any);
      }
    } catch {
      // Error toast surfaced by the axios interceptor.
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else goBack();
  };

  const typeOptions: ComboboxOption[] = Object.entries(TERMINATION_TYPE_LABELS).map(
    ([value, label]) => ({ value, label }),
  );
  const noticeTypeOptions: ComboboxOption[] = Object.entries(NOTICE_TYPE_LABELS).map(
    ([value, label]) => ({ value, label }),
  );
  const noticeReductionOptions: ComboboxOption[] = Object.entries(NOTICE_REDUCTION_LABELS).map(
    ([value, label]) => ({ value, label }),
  );

  const initialCollaboratorOptions: ComboboxOption[] = useMemo(() => {
    const u = termination?.user as any;
    if (u) {
      return [{ value: u.id, label: u.name + (u.position ? ` - ${u.position.name}` : "") }];
    }
    return [];
  }, [termination?.user]);

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  // ── Contextual messaging blocks ─────────────────────────────────────────────
  const messages: { tone: "info" | "warning" | "error"; text: string }[] = [];

  if (stabilityBlocksDismissal) {
    messages.push({
      tone: "error",
      text: `Colaborador sob estabilidade${currentContract?.stabilityType ? ` (${STABILITY_TYPE_LABELS[currentContract.stabilityType as STABILITY_TYPE]})` : ""}${currentContract?.stabilityEnd ? ` até ${formatDate(currentContract.stabilityEnd)}` : ""}. A dispensa sem justa causa está BLOQUEADA durante o período de estabilidade.`,
    });
  } else if (underStability) {
    messages.push({
      tone: "warning",
      text: `Atenção: colaborador sob estabilidade${currentContract?.stabilityType ? ` (${STABILITY_TYPE_LABELS[currentContract.stabilityType as STABILITY_TYPE]})` : ""}${currentContract?.stabilityEnd ? ` até ${formatDate(currentContract.stabilityEnd)}` : ""}.`,
    });
  }

  if (selectedType === TERMINATION_TYPE.FIXED_TERM_EARLY_EMPLOYEE) {
    messages.push({
      tone: "warning",
      text: "Art. 480 CLT: rescisão antecipada de contrato a prazo PELO EMPREGADO. Será lançada indenização DEVIDA PELO EMPREGADO, limitada a ½ da remuneração do restante do contrato (compensável no acerto).",
    });
  }

  if (selectedType === TERMINATION_TYPE.EXPERIENCE_EARLY_EMPLOYER) {
    messages.push({
      tone: "info",
      text: "Art. 479 CLT: rescisão antecipada pelo EMPREGADOR. Indenização de metade da remuneração devida até o término do contrato a prazo.",
    });
  }

  if (selectedType === TERMINATION_TYPE.INTERMITTENT_END) {
    messages.push({
      tone: "info",
      text: "Encerramento de contrato intermitente: as verbas rescisórias são apuradas sobre a média das competências trabalhadas no período.",
    });
  }

  if (currentContract?.hasArt481Clause && FIXED_TERM_TYPES.has(selectedType ?? "")) {
    messages.push({
      tone: "info",
      text: "Vínculo com cláusula assecuratória (art. 481 CLT): contrato a prazo com direito recíproco de rescisão antecipada. Aplica-se o regime do contrato por prazo indeterminado (aviso prévio + multa do FGTS).",
    });
  }

  const toneColor = (tone: "info" | "warning" | "error") =>
    tone === "error" ? colors.destructive : tone === "warning" ? "#f59e0b" : colors.primary;

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
            {/* Collaborator + modality */}
            <FormCard
              title="Rescisão"
              description="Selecione o colaborador e a modalidade da rescisão"
              icon="IconUserMinus"
            >
              {mode === "create" && (
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
                        onValueChange={(v) => onCollaboratorChange(v, onChange)}
                        placeholder="Selecione o colaborador"
                        searchPlaceholder="Buscar colaborador..."
                        disabled={isLoading}
                        searchable
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}

              {mode === "create" && (
                <FormFieldGroup
                  label="Modalidade"
                  required
                  helper="Tipo legal da rescisão (define as verbas)"
                  error={(form.formState.errors as any).type?.message}
                >
                  <Controller
                    control={form.control}
                    name={"type" as any}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        options={typeOptions}
                        value={value}
                        onValueChange={onChange}
                        placeholder="Selecione a modalidade"
                        disabled={isLoading}
                        searchable
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}

              {/* Contextual messaging (art.479/480/481, intermitente, estabilidade) */}
              {messages.map((m, i) => (
                <View
                  key={i}
                  style={[
                    styles.banner,
                    { borderColor: toneColor(m.tone), backgroundColor: toneColor(m.tone) + "14" },
                  ]}
                >
                  <ThemedText style={[styles.bannerText, { color: colors.foreground }]}>
                    {m.text}
                  </ThemedText>
                </View>
              ))}

              <FormRow>
                <FormFieldGroup
                  label="Data da Rescisão"
                  error={(form.formState.errors as any).terminationDate?.message}
                >
                  <Controller
                    control={form.control}
                    name={"terminationDate" as any}
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

                {mode === "update" && (
                  <FormFieldGroup
                    label="Último Dia Trabalhado"
                    error={(form.formState.errors as any).lastWorkingDate?.message}
                  >
                    <Controller
                      control={form.control}
                      name={"lastWorkingDate" as any}
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
              </FormRow>
            </FormCard>

            {/* Notice (aviso prévio) */}
            {showNoticeSection && (
              <FormCard
                title="Aviso Prévio"
                description="Tipo e redução de jornada do aviso prévio"
                icon="IconBell"
              >
                <FormRow>
                  <FormFieldGroup
                    label="Tipo de Aviso"
                    error={(form.formState.errors as any).noticeType?.message}
                  >
                    <Controller
                      control={form.control}
                      name={"noticeType" as any}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Combobox
                          options={noticeTypeOptions}
                          value={value || ""}
                          onValueChange={onChange}
                          placeholder="Selecione o tipo"
                          disabled={isLoading}
                          searchable={false}
                          clearable
                          error={error?.message}
                        />
                      )}
                    />
                  </FormFieldGroup>

                  <FormFieldGroup
                    label="Redução de Jornada"
                    error={(form.formState.errors as any).noticeReduction?.message}
                  >
                    <Controller
                      control={form.control}
                      name={"noticeReduction" as any}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Combobox
                          options={noticeReductionOptions}
                          value={value || NOTICE_REDUCTION.NONE}
                          onValueChange={onChange}
                          placeholder="Selecione"
                          disabled={isLoading || selectedNoticeType !== NOTICE_TYPE.WORKED}
                          searchable={false}
                          clearable={false}
                          error={error?.message}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormRow>

                <FormRow>
                  <FormFieldGroup
                    label="Início do Aviso"
                    error={(form.formState.errors as any).noticeStartDate?.message}
                  >
                    <Controller
                      control={form.control}
                      name={"noticeStartDate" as any}
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

                  {mode === "update" && (
                    <FormFieldGroup
                      label="Dias de Aviso"
                      error={(form.formState.errors as any).noticeDays?.message}
                    >
                      <Controller
                        control={form.control}
                        name={"noticeDays" as any}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input
                            value={value != null ? String(value) : ""}
                            onChangeText={(t) => onChange(t === "" ? null : Number(t))}
                            onBlur={onBlur}
                            placeholder="Ex.: 30"
                            keyboardType="numeric"
                            editable={!isLoading}
                          />
                        )}
                      />
                    </FormFieldGroup>
                  )}
                </FormRow>
              </FormCard>
            )}

            {/* Bases for the verbas engine */}
            <FormCard
              title="Bases de Cálculo"
              description="Valores base para o cálculo das verbas (o cálculo automático refina estes valores)"
              icon="IconCalculator"
            >
              <FormRow>
                <FormFieldGroup
                  label="Remuneração Base"
                  error={(form.formState.errors as any).baseRemuneration?.message}
                >
                  <Controller
                    control={form.control}
                    name={"baseRemuneration" as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value != null ? String(value) : ""}
                        onChangeText={(t) => onChange(t === "" ? null : Number(t))}
                        onBlur={onBlur}
                        placeholder="0,00"
                        keyboardType="numeric"
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="Saldo de FGTS"
                  error={(form.formState.errors as any).fgtsBalance?.message}
                >
                  <Controller
                    control={form.control}
                    name={"fgtsBalance" as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value != null ? String(value) : ""}
                        onChangeText={(t) => onChange(t === "" ? null : Number(t))}
                        onBlur={onBlur}
                        placeholder="0,00"
                        keyboardType="numeric"
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              <FormFieldGroup
                label="Períodos de Férias Vencidas"
                helper="Quantidade de períodos aquisitivos vencidos não gozados"
                error={(form.formState.errors as any).accruedVacationPeriods?.message}
              >
                <Controller
                  control={form.control}
                  name={"accruedVacationPeriods" as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value != null ? String(value) : "0"}
                      onChangeText={(t) => onChange(t === "" ? 0 : Number(t))}
                      onBlur={onBlur}
                      placeholder="0"
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>

            {/* Reason / justa causa */}
            <FormCard
              title="Motivo"
              description="Justificativa da rescisão e, se aplicável, o artigo da justa causa"
              icon="IconNote"
            >
              <FormFieldGroup
                label="Motivo"
                error={(form.formState.errors as any).reason?.message}
              >
                <Controller
                  control={form.control}
                  name={"reason" as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Textarea
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Descreva o motivo da rescisão"
                      numberOfLines={4}
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>

              {(selectedType === TERMINATION_TYPE.WITH_CAUSE ||
                selectedType === TERMINATION_TYPE.INDIRECT) && (
                <FormFieldGroup
                  label="Artigo da Justa Causa"
                  helper="Ex.: CLT art. 482, alínea 'b'"
                  error={(form.formState.errors as any).justCauseArticle?.message}
                >
                  <Controller
                    control={form.control}
                    name={"justCauseArticle" as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="CLT art. 482..."
                        editable={!isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}
            </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid && !stabilityBlocksDismissal}
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
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
