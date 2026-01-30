import { useMemo, useEffect, useRef } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

import { userCreateSchema, userUpdateSchema } from "@/schemas/user";
import type { UserCreateFormData, UserUpdateFormData } from "@/schemas/user";
import type { User } from "@/types";
import { useUserMutations } from "@/hooks/useUser";
import { useSectors } from "@/hooks/useSector";
import { usePositions } from "@/hooks/usePosition";
import { USER_STATUS, SHIRT_SIZE, BOOT_SIZE, PANTS_SIZE, SLEEVES_SIZE, MASK_SIZE, GLOVES_SIZE, RAIN_BOOTS_SIZE } from "@/constants";
import { USER_STATUS_LABELS, SHIRT_SIZE_LABELS, BOOT_SIZE_LABELS, PANTS_SIZE_LABELS, SLEEVES_SIZE_LABELS, MASK_SIZE_LABELS, GLOVES_SIZE_LABELS, RAIN_BOOTS_SIZE_LABELS } from "@/constants/enum-labels";

interface CollaboratorFormProps {
  mode: "create" | "update";
  user?: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BRAZIL_STATES: ComboboxOption[] = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export function CollaboratorForm({ mode, user, onSuccess, onCancel }: CollaboratorFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useUserMutations();

  const { data: sectors } = useSectors({ orderBy: { name: "asc" } });
  const { data: positions } = usePositions({ orderBy: { name: "asc" } });

  const getDefaultBirthDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  };

  // Helper function to safely convert date strings to Date objects
  const toDate = (value: string | Date | null | undefined): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;

    // Parse ISO date string and interpret the date component in local timezone
    const dateStr = typeof value === 'string' ? value.split('T')[0] : null;
    if (!dateStr) return null;

    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return null;

    // Create date in local timezone (month is 0-indexed)
    const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    return localDate;
  };

  const form = useForm<UserCreateFormData | UserUpdateFormData>({
    resolver: zodResolver(mode === "create" ? userCreateSchema : userUpdateSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues:
      mode === "create"
        ? {
            name: "",
            email: "",
            phone: "",
            cpf: "",
            pis: "",
            birth: getDefaultBirthDate(),
            admissional: new Date(),
            status: USER_STATUS.EXPERIENCE_PERIOD_1,
            sectorId: null,
            positionId: null,
            isSectorLeader: false,
            verified: false,
            isActive: true,
            performanceLevel: 0,
            address: "",
            addressNumber: "",
            addressComplement: "",
            neighborhood: "",
            city: "",
            state: "",
            zipCode: "",
            payrollNumber: null,
            ppeSize: {
              shirts: null,
              boots: null,
              pants: null,
              shorts: null,
              sleeves: null,
              mask: null,
              gloves: null,
              rainBoots: null,
            },
            exp1StartAt: null,
            exp1EndAt: null,
            exp2StartAt: null,
            exp2EndAt: null,
            effectedAt: null,
            dismissedAt: null,
          }
        : {
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            cpf: user?.cpf || "",
            pis: user?.pis || "",
            birth: toDate(user?.birth) ?? undefined,
            admissional: toDate(user?.admissional) ?? undefined,
            status: user?.status || USER_STATUS.EXPERIENCE_PERIOD_1,
            sectorId: user?.sectorId || null,
            positionId: user?.positionId || null,
            isSectorLeader: Boolean(user?.managedSector?.id),
            verified: user?.verified || false,
            isActive: user?.isActive ?? true,
            performanceLevel: user?.performanceLevel || 0,
            address: user?.address || "",
            addressNumber: user?.addressNumber || "",
            addressComplement: user?.addressComplement || "",
            neighborhood: user?.neighborhood || "",
            city: user?.city || "",
            state: user?.state || "",
            zipCode: user?.zipCode || "",
            payrollNumber: user?.payrollNumber || null,
            ppeSize: user?.ppeSize ? {
              shirts: user.ppeSize.shirts || null,
              boots: user.ppeSize.boots || null,
              pants: user.ppeSize.pants || null,
              shorts: user.ppeSize.shorts || null,
              sleeves: user.ppeSize.sleeves || null,
              mask: user.ppeSize.mask || null,
              gloves: user.ppeSize.gloves || null,
              rainBoots: user.ppeSize.rainBoots || null,
            } : {
              shirts: null,
              boots: null,
              pants: null,
              shorts: null,
              sleeves: null,
              mask: null,
              gloves: null,
              rainBoots: null,
            },
            exp1StartAt: toDate(user?.exp1StartAt) ?? null,
            exp1EndAt: toDate(user?.exp1EndAt) ?? null,
            exp2StartAt: toDate(user?.exp2StartAt) ?? null,
            exp2EndAt: toDate(user?.exp2EndAt) ?? null,
            effectedAt: toDate(user?.effectedAt) ?? null,
            dismissedAt: toDate(user?.dismissedAt) ?? null,
            currentStatus: user?.status as USER_STATUS,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const watchedStatus = form.watch("status");
  const exp1StartAt = form.watch("exp1StartAt");
  const effectedAt = form.watch("effectedAt");

  // Track previous values to detect actual changes (not just initial mount)
  const prevExp1StartAtRef = useRef<Date | null | undefined>(undefined);
  const prevStatusRef = useRef<USER_STATUS | undefined>(undefined);
  const isFirstRenderRef = useRef(true);

  // Helper function to adjust date to Friday if it falls on weekend
  const adjustToFridayIfWeekend = (date: Date): Date => {
    const dayOfWeek = date.getDay();
    // Sunday = 0, Saturday = 6
    if (dayOfWeek === 0) {
      // Sunday -> move back to Friday (2 days)
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() - 2);
      return newDate;
    } else if (dayOfWeek === 6) {
      // Saturday -> move back to Friday (1 day)
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    }
    return date;
  };

  // Helper function to calculate status dates
  const calculateStatusDates = (startDate: Date | null) => {
    if (!startDate) {
      return {
        exp1EndAt: null,
        exp2StartAt: null,
        exp2EndAt: null,
        effectedAt: null,
      };
    }

    // Normalize to start of day
    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);

    // Calculate exp1 end date (45 days from start)
    const rawExp1EndAt = new Date(normalizedStart);
    rawExp1EndAt.setDate(rawExp1EndAt.getDate() + 45);
    const exp1EndAt = adjustToFridayIfWeekend(rawExp1EndAt);

    // exp2 starts the day after exp1 ends
    const exp2StartAt = new Date(exp1EndAt);
    exp2StartAt.setDate(exp2StartAt.getDate() + 1);

    // Calculate exp2 end date (45 days)
    const rawExp2EndAt = new Date(exp2StartAt);
    rawExp2EndAt.setDate(rawExp2EndAt.getDate() + 45);
    const exp2EndAt = adjustToFridayIfWeekend(rawExp2EndAt);

    // Effective hire date is 1 day after exp2 ends
    const effectedAt = new Date(exp2EndAt);
    effectedAt.setDate(effectedAt.getDate() + 1);

    return {
      exp1EndAt,
      exp2StartAt,
      exp2EndAt,
      effectedAt,
    };
  };

  // Auto-calculate dates when exp1StartAt changes
  useEffect(() => {
    // Skip on first render to avoid overwriting values loaded from API
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevExp1StartAtRef.current = exp1StartAt;
      return;
    }

    // Only recalculate if exp1StartAt actually changed
    const hasChanged = prevExp1StartAtRef.current?.getTime() !== exp1StartAt?.getTime();
    if (!hasChanged) return;

    prevExp1StartAtRef.current = exp1StartAt;

    if (exp1StartAt) {
      const dates = calculateStatusDates(exp1StartAt);

      // Recalculate these fields when user changes exp1StartAt
      form.setValue("exp1EndAt", dates.exp1EndAt, { shouldValidate: false, shouldDirty: true });
      form.setValue("exp2StartAt", dates.exp2StartAt, { shouldValidate: false, shouldDirty: true });
      form.setValue("exp2EndAt", dates.exp2EndAt, { shouldValidate: false, shouldDirty: true });
      form.setValue("effectedAt", dates.effectedAt, { shouldValidate: false, shouldDirty: true });
    } else {
      // Clear dates if exp1StartAt is cleared
      form.setValue("exp1EndAt", null, { shouldValidate: false, shouldDirty: true });
      form.setValue("exp2StartAt", null, { shouldValidate: false, shouldDirty: true });
      form.setValue("exp2EndAt", null, { shouldValidate: false, shouldDirty: true });
      form.setValue("effectedAt", null, { shouldValidate: false, shouldDirty: true });
    }
  }, [exp1StartAt, form]);

  // Update dates when status changes
  useEffect(() => {
    // Skip if this is the first render or status hasn't changed
    if (prevStatusRef.current === undefined) {
      prevStatusRef.current = watchedStatus;
      return;
    }

    const hasChanged = prevStatusRef.current !== watchedStatus;
    if (!hasChanged) return;

    prevStatusRef.current = watchedStatus;

    if (watchedStatus === USER_STATUS.EFFECTED && !effectedAt) {
      // Set effectedAt to today if transitioning to EFFECTED
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      form.setValue("effectedAt", today, { shouldValidate: false });
    }

    if (watchedStatus === USER_STATUS.DISMISSED && !form.getValues("dismissedAt")) {
      // Set dismissedAt to today if transitioning to DISMISSED
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      form.setValue("dismissedAt", today, { shouldValidate: false });
    }
  }, [watchedStatus, effectedAt, form]);

  const handleSubmit = async (data: UserCreateFormData | UserUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as UserCreateFormData);
      } else if (user) {
        await updateAsync({
          id: user.id,
          data: data as UserUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar o colaborador");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const sectorOptions: ComboboxOption[] =
    sectors?.data?.map((sector) => ({
      value: sector.id,
      label: sector.name,
    })) || [];

  const positionOptions: ComboboxOption[] =
    positions?.data?.map((position) => ({
      value: position.id,
      label: position.name,
    })) || [];

  const statusOptions: ComboboxOption[] = Object.entries(USER_STATUS_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const shirtSizeOptions: ComboboxOption[] = Object.entries(SHIRT_SIZE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const bootSizeOptions: ComboboxOption[] = Object.entries(BOOT_SIZE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const pantsSizeOptions: ComboboxOption[] = Object.entries(PANTS_SIZE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const sleevesSizeOptions: ComboboxOption[] = Object.entries(SLEEVES_SIZE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const maskSizeOptions: ComboboxOption[] = Object.entries(MASK_SIZE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const glovesSizeOptions: ComboboxOption[] = Object.entries(GLOVES_SIZE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const rainBootsSizeOptions: ComboboxOption[] = Object.entries(RAIN_BOOTS_SIZE_LABELS).map(
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
        {/* Personal Information */}
        <FormCard
          title="Informações Pessoais"
          icon="IconUser"
        >
          {/* Name */}
          <FormFieldGroup
            label="Nome Completo"
            required
            error={form.formState.errors.name?.message}
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Digite o nome completo"
                  editable={!isLoading}
                  error={!!form.formState.errors.name}
                />
              )}
            />
          </FormFieldGroup>

          {/* Email and Phone Row */}
          <FormRow>
            <FormFieldGroup
              label="E-mail"
              error={form.formState.errors.email?.message}
            >
              <Controller
                control={form.control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="email@exemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    error={!!form.formState.errors.email}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Telefone"
              error={form.formState.errors.phone?.message}
            >
              <Controller
                control={form.control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    type="phone"
                    value={value || ""}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    error={!!form.formState.errors.phone}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* CPF and PIS Row */}
          <FormRow>
            <FormFieldGroup
              label="CPF"
              error={form.formState.errors.cpf?.message}
            >
              <Controller
                control={form.control}
                name="cpf"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    type="cpf"
                    value={value || ""}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="000.000.000-00"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.cpf}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="PIS"
              error={form.formState.errors.pis?.message}
            >
              <Controller
                control={form.control}
                name="pis"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    type="pis"
                    value={value || ""}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="000.00000.00-0"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.pis}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Birth Date and Payroll Number Row */}
          <FormRow>
            <FormFieldGroup
              label="Data de Nascimento"
              required
              error={form.formState.errors.birth?.message}
            >
              <Controller
                control={form.control}
                name="birth"
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

            <FormFieldGroup
              label="Nº da Folha"
              error={form.formState.errors.payrollNumber?.message}
            >
              <Controller
                control={form.control}
                name="payrollNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || ""}
                    onChangeText={(text) => {
                      const num = text ? parseInt(text, 10) : null;
                      onChange(num);
                    }}
                    onBlur={onBlur}
                    placeholder="Nº"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.payrollNumber}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
        </FormCard>

        {/* Work Information */}
        <FormCard
          title="Informações de Trabalho"
          icon="IconBriefcase"
        >
          {/* Position */}
          <FormFieldGroup
            label="Cargo"
            error={form.formState.errors.positionId?.message}
          >
            <Controller
              control={form.control}
              name="positionId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  options={positionOptions}
                  value={value || undefined}
                  onValueChange={onChange}
                  placeholder="Selecione o cargo"
                  disabled={isLoading}
                  searchable
                  clearable
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          {/* Sector */}
          <FormFieldGroup
            label="Setor"
            error={form.formState.errors.sectorId?.message}
          >
            <Controller
              control={form.control}
              name="sectorId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  options={sectorOptions}
                  value={value || undefined}
                  onValueChange={onChange}
                  placeholder="Selecione o setor"
                  disabled={isLoading}
                  searchable
                  clearable
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

          {/* Status Tracking Dates */}
          {watchedStatus && [
            USER_STATUS.EXPERIENCE_PERIOD_1,
            USER_STATUS.EXPERIENCE_PERIOD_2,
            USER_STATUS.EFFECTED,
            USER_STATUS.DISMISSED,
          ].includes(watchedStatus) && (
            <>
              {/* Experience Period 1 Dates */}
              {[
                USER_STATUS.EXPERIENCE_PERIOD_1,
                USER_STATUS.EXPERIENCE_PERIOD_2,
                USER_STATUS.EFFECTED,
                USER_STATUS.DISMISSED,
              ].includes(watchedStatus) && (
                <FormRow>
                  <FormFieldGroup
                    label="Início da Experiência 1"
                    required
                    error={form.formState.errors.exp1StartAt?.message}
                  >
                    <Controller
                      control={form.control}
                      name="exp1StartAt"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          value={value ?? undefined}
                          onChange={onChange}
                          placeholder="Selecione a data"
                          disabled={isLoading}
                        />
                      )}
                    />
                  </FormFieldGroup>

                  <FormFieldGroup
                    label="Fim da Experiência 1"
                    error={form.formState.errors.exp1EndAt?.message}
                  >
                    <Controller
                      control={form.control}
                      name="exp1EndAt"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          value={value ?? undefined}
                          onChange={onChange}
                          placeholder="Calculado"
                          disabled={true}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormRow>
              )}

              {/* Experience Period 2 Dates */}
              {[
                USER_STATUS.EXPERIENCE_PERIOD_2,
                USER_STATUS.EFFECTED,
                USER_STATUS.DISMISSED,
              ].includes(watchedStatus) && (
                <FormRow>
                  <FormFieldGroup
                    label="Início da Experiência 2"
                    error={form.formState.errors.exp2StartAt?.message}
                  >
                    <Controller
                      control={form.control}
                      name="exp2StartAt"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          value={value ?? undefined}
                          onChange={onChange}
                          placeholder="Calculado"
                          disabled={true}
                        />
                      )}
                    />
                  </FormFieldGroup>

                  <FormFieldGroup
                    label="Fim da Experiência 2"
                    error={form.formState.errors.exp2EndAt?.message}
                  >
                    <Controller
                      control={form.control}
                      name="exp2EndAt"
                      render={({ field: { onChange, value } }) => (
                        <DatePicker
                          value={value ?? undefined}
                          onChange={onChange}
                          placeholder="Calculado"
                          disabled={true}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormRow>
              )}

              {/* Effective Date */}
              {[USER_STATUS.EFFECTED, USER_STATUS.DISMISSED].includes(watchedStatus) && (
                <FormFieldGroup
                  label="Data de Contratação Efetiva"
                  required
                  error={form.formState.errors.effectedAt?.message}
                >
                  <Controller
                    control={form.control}
                    name="effectedAt"
                    render={({ field: { onChange, value } }) => (
                      <DatePicker
                        value={value ?? undefined}
                        onChange={onChange}
                        placeholder="Calculado"
                        disabled={true}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}

              {/* Dismissed Date */}
              {watchedStatus === USER_STATUS.DISMISSED && (
                <FormFieldGroup
                  label="Data de Demissão"
                  required
                  error={form.formState.errors.dismissedAt?.message}
                >
                  <Controller
                    control={form.control}
                    name="dismissedAt"
                    render={({ field: { onChange, value } }) => (
                      <DatePicker
                        value={value ?? undefined}
                        onChange={onChange}
                        placeholder="Selecione a data"
                        disabled={isLoading}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}
            </>
          )}

          {/* Sector Leader Switch */}
          <FormFieldGroup
            label="Líder do Setor"
          >
            <Controller
              control={form.control}
              name="isSectorLeader"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Switch
                    checked={Boolean(value)}
                    onCheckedChange={onChange}
                    disabled={isLoading || !form.watch("sectorId")}
                  />
                </View>
              )}
            />
          </FormFieldGroup>

          {/* Verified Toggle */}
          <FormFieldGroup
            label="Verificado"
          >
            <Controller
              control={form.control}
              name="verified"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Switch
                    checked={Boolean(value)}
                    onCheckedChange={onChange}
                    disabled={isLoading}
                  />
                </View>
              )}
            />
          </FormFieldGroup>

          {/* Active Toggle */}
          <FormFieldGroup
            label="Ativo"
          >
            <Controller
              control={form.control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Switch
                    checked={Boolean(value)}
                    onCheckedChange={onChange}
                    disabled={isLoading}
                  />
                </View>
              )}
            />
          </FormFieldGroup>
        </FormCard>

        {/* Address Information */}
        <FormCard
          title="Endereço"
          icon="IconMapPin"
        >
          {/* Address */}
          <FormFieldGroup
            label="Logradouro"
            error={form.formState.errors.address?.message}
          >
            <Controller
              control={form.control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Rua, Avenida, etc."
                  editable={!isLoading}
                  error={!!form.formState.errors.address}
                />
              )}
            />
          </FormFieldGroup>

          {/* Number and Complement Row */}
          <FormRow>
            <FormFieldGroup
              label="Número"
              error={form.formState.errors.addressNumber?.message}
            >
              <Controller
                control={form.control}
                name="addressNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Nº"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.addressNumber}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Complemento"
              error={form.formState.errors.addressComplement?.message}
            >
              <Controller
                control={form.control}
                name="addressComplement"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Apto, Bloco, etc."
                    editable={!isLoading}
                    error={!!form.formState.errors.addressComplement}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Neighborhood and City Row */}
          <FormRow>
            <FormFieldGroup
              label="Bairro"
              error={form.formState.errors.neighborhood?.message}
            >
              <Controller
                control={form.control}
                name="neighborhood"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Nome do bairro"
                    editable={!isLoading}
                    error={!!form.formState.errors.neighborhood}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Cidade"
              error={form.formState.errors.city?.message}
            >
              <Controller
                control={form.control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Nome da cidade"
                    editable={!isLoading}
                    error={!!form.formState.errors.city}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* State and ZipCode Row */}
          <FormRow>
            <FormFieldGroup
              label="Estado"
              error={form.formState.errors.state?.message}
            >
              <Controller
                control={form.control}
                name="state"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={BRAZIL_STATES}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="CEP"
              error={form.formState.errors.zipCode?.message}
            >
              <Controller
                control={form.control}
                name="zipCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="00000-000"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.zipCode}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
        </FormCard>

        {/* PPE Sizes */}
        <FormCard
          title="Tamanhos de EPIs"
          icon="IconShirt"
        >
          {/* Shirts and Pants Row */}
          <FormRow>
            <FormFieldGroup
              label="Camisa"
              error={form.formState.errors.ppeSize?.shirts?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.shirts"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={shirtSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Calça"
              error={form.formState.errors.ppeSize?.pants?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.pants"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={pantsSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Bermuda"
              error={form.formState.errors.ppeSize?.shorts?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.shorts"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={pantsSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Boots and Rain Boots Row */}
          <FormRow>
            <FormFieldGroup
              label="Botas"
              error={form.formState.errors.ppeSize?.boots?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.boots"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={bootSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Galocha"
              error={form.formState.errors.ppeSize?.rainBoots?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.rainBoots"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={rainBootsSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Sleeves and Mask Row */}
          <FormRow>
            <FormFieldGroup
              label="Manguito"
              error={form.formState.errors.ppeSize?.sleeves?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.sleeves"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={sleevesSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Máscara"
              error={form.formState.errors.ppeSize?.mask?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.mask"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={maskSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Gloves Row */}
          <FormRow>
            <FormFieldGroup
              label="Luvas"
              error={form.formState.errors.ppeSize?.gloves?.message}
            >
              <Controller
                control={form.control}
                name="ppeSize.gloves"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={glovesSizeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Empty second column for consistency */}
            <View style={{ flex: 1 }} />
          </FormRow>
        </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid && (mode === "create" || form.formState.isDirty)}
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
