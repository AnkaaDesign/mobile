import React, { useMemo } from "react";
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
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

import { userCreateSchema, userUpdateSchema } from "@/schemas/user";
import type { UserCreateFormData, UserUpdateFormData } from "@/schemas/user";
import type { User } from "@/types";
import { useUserMutations } from "@/hooks/useUser";
import { useSectors } from "@/hooks/useSector";
import { usePositions } from "@/hooks/usePosition";
import { USER_STATUS } from "@/constants";
import { USER_STATUS_LABELS } from "@/constants/enum-labels";

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

  const form = useForm<UserCreateFormData | UserUpdateFormData>({
    resolver: zodResolver(mode === "create" ? userCreateSchema : userUpdateSchema),
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
            managedSectorId: null,
            verified: false,
            performanceLevel: 0,
            address: "",
            addressNumber: "",
            addressComplement: "",
            neighborhood: "",
            city: "",
            state: "",
            zipCode: "",
          }
        : {
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            cpf: user?.cpf || "",
            pis: user?.pis || "",
            birth: user?.birth ? new Date(user.birth) : undefined,
            admissional: user?.admissional ? new Date(user.admissional) : undefined,
            dismissedAt: user?.dismissedAt ? new Date(user.dismissedAt) : undefined,
            status: user?.status || USER_STATUS.EXPERIENCE_PERIOD_1,
            sectorId: user?.sectorId || null,
            positionId: user?.positionId || null,
            managedSectorId: user?.managedSectorId || null,
            verified: user?.verified || false,
            performanceLevel: user?.performanceLevel || 0,
            address: user?.address || "",
            addressNumber: user?.addressNumber || "",
            addressComplement: user?.addressComplement || "",
            neighborhood: user?.neighborhood || "",
            city: user?.city || "",
            state: user?.state || "",
            zipCode: user?.zipCode || "",
            currentStatus: user?.status as USER_STATUS,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const watchedStatus = form.watch("status");

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
          subtitle="Dados básicos do colaborador"
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
                    value={value || ""}
                    onChangeText={onChange}
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
                    value={value || ""}
                    onChangeText={onChange}
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
                    value={value || ""}
                    onChangeText={onChange}
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

          {/* Birth Date */}
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
        </FormCard>

        {/* Work Information */}
        <FormCard
          title="Informações de Trabalho"
          subtitle="Cargo, setor e status do colaborador"
        >
          {/* Sector and Position Row */}
          <FormRow>
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
          </FormRow>

          {/* Status and Admissional Row */}
          <FormRow>
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

            <FormFieldGroup
              label="Data de Admissão"
              error={form.formState.errors.admissional?.message}
            >
              <Controller
                control={form.control}
                name="admissional"
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

          {/* Show dismissedAt only if status is DISMISSED */}
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
                    value={value}
                    onChange={onChange}
                    placeholder="Selecione a data"
                    disabled={isLoading}
                  />
                )}
              />
            </FormFieldGroup>
          )}

          {/* Managed Sector */}
          <FormFieldGroup
            label="Setor Gerenciado"
            helper="Se o colaborador é líder de um setor"
            error={form.formState.errors.managedSectorId?.message}
          >
            <Controller
              control={form.control}
              name="managedSectorId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  options={sectorOptions}
                  value={value || undefined}
                  onValueChange={onChange}
                  placeholder="Selecione o setor gerenciado"
                  disabled={isLoading}
                  searchable
                  clearable
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          {/* Verified Toggle */}
          <FormFieldGroup
            label="Verificado"
            helper="O colaborador já verificou o acesso ao sistema"
          >
            <View style={styles.switchRow}>
              <Controller
                control={form.control}
                name="verified"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value || false} onValueChange={onChange} disabled={isLoading} />
                )}
              />
            </View>
          </FormFieldGroup>
        </FormCard>

        {/* Address Information */}
        <FormCard
          title="Endereço"
          subtitle="Informações de localização do colaborador"
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
