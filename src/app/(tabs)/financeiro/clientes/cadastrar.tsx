import { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCustomerMutations, useKeyboardAwareScroll } from "@/hooks";
import { useCnpjLookup } from "@/hooks/use-cnpj-lookup";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import { customerCreateSchema, type CustomerCreateFormData } from "@/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getEconomicActivities, createEconomicActivity } from "@/api-client/economic-activity";
// import { showToast } from "@/components/ui/toast";
import { Input, Combobox, Button } from "@/components/ui";
import { FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useTheme } from "@/lib/theme";
import { routes, BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES, REGISTRATION_STATUS_OPTIONS, STREET_TYPE_OPTIONS } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { formatCPF, formatCNPJ, cleanCPF, cleanCNPJ, formatCEP, cleanCEP } from "@/utils";
import { PhoneManager } from "@/components/administration/customer/form/phone-manager";
import { TagManager } from "@/components/administration/customer/form/tag-manager";
import { Text } from "@/components/ui/text";
import { spacing, fontSize } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { IconBuilding, IconFileText, IconMapPin, IconPhone, IconTag } from "@tabler/icons-react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

export default function FinancialCustomerCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cnpj");
  const [economicActivityInitialOptions, setEconomicActivityInitialOptions] = useState<Array<{ value: string; label: string }>>([]);
  const queryClient = useQueryClient();

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<CustomerCreateFormData>({
    resolver: zodResolver(customerCreateSchema),
    mode: "onChange",
    defaultValues: {
      fantasyName: "",
      cnpj: null,
      cpf: null,
      corporateName: null,
      email: null,
      address: null,
      addressNumber: null,
      addressComplement: null,
      neighborhood: null,
      city: null,
      state: null,
      zipCode: null,
      site: null,
      phones: [],
      tags: [],
      logoId: null,
      situacaoCadastral: null,
      inscricaoEstadual: null,
      economicActivityId: null,
      logradouro: null,
    },
  });

  const { createAsync } = useCustomerMutations();

  // CNPJ Lookup Hook
  const { lookupCnpj } = useCnpjLookup({
    onSuccess: async (data) => {
      // Autofill company info fields from Brasil API
      setValue("fantasyName", data.fantasyName, { shouldDirty: true, shouldValidate: true });
      if (data.corporateName) {
        setValue("corporateName", data.corporateName, { shouldDirty: true, shouldValidate: true });
      }
      if (data.email) {
        setValue("email", data.email, { shouldDirty: true, shouldValidate: true });
      }

      // Only set CEP from CNPJ - the CEP lookup will fill the rest of the address fields
      // This ensures more accurate address data from the postal code API
      if (data.zipCode) {
        setValue("zipCode", data.zipCode, { shouldDirty: true, shouldValidate: true });
      }

      // Only set address number and complement from CNPJ (CEP API doesn't have these)
      if (data.addressNumber) {
        setValue("addressNumber", data.addressNumber, { shouldDirty: true, shouldValidate: true });
      }
      if (data.addressComplement) {
        setValue("addressComplement", data.addressComplement, { shouldDirty: true, shouldValidate: true });
      }

      if (data.phones && data.phones.length > 0) {
        setValue("phones", data.phones, { shouldDirty: true, shouldValidate: true });
      }
      if (data.registrationStatus) {
        setValue("situacaoCadastral", data.registrationStatus, { shouldDirty: true, shouldValidate: true });
      }

      // Handle economic activity (CNAE)
      if (data.economicActivityCode && data.economicActivityDescription) {
        try {
          const response = await createEconomicActivity({
            code: data.economicActivityCode,
            description: data.economicActivityDescription,
          });
          if (response.data) {
            setValue("economicActivityId", response.data.id, { shouldDirty: true, shouldValidate: true });

            // Set initial options for the combobox
            setEconomicActivityInitialOptions([{
              value: response.data.id,
              label: `${response.data.code} - ${response.data.description}`,
            }]);

            queryClient.invalidateQueries({ queryKey: ["economic-activities"] });
          }
        } catch (error) {
          console.error("Error handling economic activity:", error);
        }
      }
    },
  });

  // CEP Lookup Hook
  const { lookupCep } = useCepLookup({
    onSuccess: (data) => {
      if (data.streetType) {
        setValue("logradouro", data.streetType, { shouldDirty: true, shouldValidate: true });
      }
      if (data.logradouro) {
        setValue("address", data.logradouro, { shouldDirty: true, shouldValidate: true });
      }
      if (data.bairro) {
        setValue("neighborhood", data.bairro, { shouldDirty: true, shouldValidate: true });
      }
      if (data.localidade) {
        setValue("city", data.localidade, { shouldDirty: true, shouldValidate: true });
      }
      if (data.uf) {
        setValue("state", data.uf, { shouldDirty: true, shouldValidate: true });
      }
    },
  });

  // Watch CNPJ field and trigger lookup
  const cnpjValue = watch("cnpj");
  useEffect(() => {
    if (cnpjValue) {
      lookupCnpj(cnpjValue);
    }
  }, [cnpjValue, lookupCnpj]);

  // Watch CEP field and trigger lookup
  const cepValue = watch("zipCode");
  useEffect(() => {
    if (cepValue) {
      lookupCep(cepValue);
    }
  }, [cepValue, lookupCep]);

  // Economic Activity mutation
  const { mutateAsync: createActivityAsync } = useMutation({
    mutationFn: (data: { code: string; description: string }) =>
      createEconomicActivity(data, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["economic-activities"] });
    },
  });

  const onSubmit = async (data: CustomerCreateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createAsync(data);

      if (result?.data) {
        // API client already shows success alert
        router.replace(routeToMobilePath(routes.financial.customers.details(result.data?.id || '')) as any);
      } else {
        Alert.alert("Erro", "Erro ao criar cliente");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar cliente. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert("Descartar Cadastro", "Deseja descartar o cadastro do cliente?", [
      { text: "Continuar Editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => router.push(routeToMobilePath(routes.financial.customers.root) as any) },
    ]);
  };

  const handleDocumentTypeChange = (type: "cpf" | "cnpj") => {
    setDocumentType(type);
    if (type === "cpf") {
      setValue("cnpj", null);
    } else {
      setValue("cpf", null);
    }
  };

  const stateOptions = BRAZILIAN_STATES.map((state) => ({
    label: BRAZILIAN_STATE_NAMES[state],
    value: state,
  }));

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
        {/* Basic Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBuilding size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações Básicas</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
          <FormFieldGroup label="Tipo de Documento" required error={errors.cnpj?.message || errors.cpf?.message}>
            <View style={styles.documentRow}>
              <View style={styles.documentTypeContainer}>
                <Button
                  variant={documentType === "cnpj" ? "default" : "outline"}
                  onPress={() => handleDocumentTypeChange("cnpj")}
                  size="sm"
                  style={styles.documentTypeButton}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.buttonText, documentType === "cnpj" && { color: colors.primaryForeground }]}>CNPJ</Text>
                </Button>
                <Button
                  variant={documentType === "cpf" ? "default" : "outline"}
                  onPress={() => handleDocumentTypeChange("cpf")}
                  size="sm"
                  style={styles.documentTypeButton}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.buttonText, documentType === "cpf" && { color: colors.primaryForeground }]}>CPF</Text>
                </Button>
              </View>

              <View style={styles.documentInputField}>
                {documentType === "cnpj" ? (
                  <Controller
                    control={control}
                    name="cnpj"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value ? formatCNPJ(String(value)) : ""}
                        onChangeText={(text) => onChange(cleanCNPJ(String(text || "")) || "")}
                        onBlur={onBlur}
                        placeholder="00.000.000/0000-00"
                        keyboardType="numeric"
                        maxLength={18}
                        error={!!errors.cnpj}
                        editable={!isSubmitting}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    control={control}
                    name="cpf"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value ? formatCPF(String(value)) : ""}
                        onChangeText={(text) => onChange(cleanCPF(String(text || "")) || "")}
                        onBlur={onBlur}
                        placeholder="000.000.000-00"
                        keyboardType="numeric"
                        maxLength={14}
                        error={!!errors.cpf}
                        editable={!isSubmitting}
                      />
                    )}
                  />
                )}
              </View>
            </View>
          </FormFieldGroup>

          <FormFieldGroup
            label="Nome Fantasia"
            required
            error={errors.fantasyName?.message}
          >
            <Controller
              control={control}
              name="fantasyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: Empresa LTDA"
                  maxLength={200}
                  error={!!errors.fantasyName}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Razão Social" error={errors.corporateName?.message}>
            <Controller
              control={control}
              name="corporateName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: Empresa LTDA ME"
                  maxLength={200}
                  error={!!errors.corporateName}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Email" error={errors.email?.message}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="email@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  maxLength={100}
                  error={!!errors.email}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Situação Cadastral" error={errors.situacaoCadastral?.message}>
            <Controller
              control={control}
              name="situacaoCadastral"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={onChange}
                  options={[...REGISTRATION_STATUS_OPTIONS]}
                  placeholder="Selecione a situação cadastral"
                  searchPlaceholder="Pesquisar situação..."
                  emptyText="Nenhuma situação encontrada"
                  searchable={true}
                  clearable={true}
                  disabled={isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Inscrição Estadual" error={errors.inscricaoEstadual?.message}>
            <Controller
              control={control}
              name="inscricaoEstadual"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: 123.456.789.012"
                  error={!!errors.inscricaoEstadual}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="CNAE (Atividade Econômica)" error={errors.economicActivityId?.message}>
            <Controller
              control={control}
              name="economicActivityId"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={onChange}
                  async
                  queryKey={["economic-activities"]}
                  queryFn={async (searchTerm: string) => {
                    const response = await getEconomicActivities({
                      where: searchTerm
                        ? {
                            OR: [
                              { code: { contains: searchTerm } },
                              { description: { contains: searchTerm, mode: "insensitive" } },
                            ],
                          }
                        : undefined,
                      take: 20,
                      orderBy: { code: "asc" },
                    });

                    return {
                      data: response.data?.map((activity) => ({
                        value: activity.id,
                        label: `${activity.code} - ${activity.description}`,
                      })) || [],
                      hasMore: false,
                    };
                  }}
                  initialOptions={economicActivityInitialOptions}
                  minSearchLength={0}
                  allowCreate
                  onCreate={async (searchTerm: string) => {
                    try {
                      const codeMatch = searchTerm.match(/^(\d{4}-?\d\/?\d{2})/);
                      const code = codeMatch ? codeMatch[1].replace(/[^\d]/g, "") : searchTerm;

                      const result = await createActivityAsync({
                        code: code,
                        description: searchTerm,
                      });

                      if (result?.data?.id) {
                        setValue("economicActivityId", result.data.id, { shouldDirty: true, shouldValidate: true });
                      }
                      Alert.alert("Sucesso", result.message || "Atividade econômica configurada com sucesso");
                    } catch (error: any) {
                      // API client already shows error alert
                    }
                  }}
                  createLabel={(value) => `Criar CNAE "${value}"`}
                  placeholder="Buscar por código ou descrição"
                  searchPlaceholder="Digite o código ou descrição..."
                  emptyText="Nenhuma atividade encontrada"
                  searchable={true}
                  clearable={true}
                  disabled={isSubmitting}
                />
              )}
            />
          </FormFieldGroup>
          </View>
        </Card>

        {/* Address */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconMapPin size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Endereço</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
          <FormFieldGroup label="CEP" error={errors.zipCode?.message}>
            <Controller
              control={control}
              name="zipCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value ? formatCEP(String(value)) : ""}
                  onChangeText={(text) => onChange(cleanCEP(String(text || "")) || "")}
                  onBlur={onBlur}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  maxLength={9}
                  error={!!errors.zipCode}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Tipo de Logradouro" error={errors.logradouro?.message}>
            <Controller
              control={control}
              name="logradouro"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={onChange}
                  options={[...STREET_TYPE_OPTIONS]}
                  placeholder="Selecione o tipo de logradouro"
                  searchPlaceholder="Pesquisar tipo..."
                  emptyText="Nenhum tipo encontrado"
                  searchable={true}
                  clearable={true}
                  disabled={isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Logradouro" error={errors.address?.message}>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Rua, Avenida, etc."
                  maxLength={200}
                  error={!!errors.address}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormRow>
            <FormFieldGroup label="Número" error={errors.addressNumber?.message}>
              <Controller
                control={control}
                name="addressNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="123"
                    maxLength={10}
                    error={!!errors.addressNumber}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Complemento" error={errors.addressComplement?.message}>
              <Controller
                control={control}
                name="addressComplement"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Apto, Sala, etc."
                    maxLength={100}
                    error={!!errors.addressComplement}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          <FormFieldGroup label="Bairro" error={errors.neighborhood?.message}>
            <Controller
              control={control}
              name="neighborhood"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Centro"
                  maxLength={100}
                  error={!!errors.neighborhood}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormRow>
            <FormFieldGroup label="Cidade" error={errors.city?.message}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="São Paulo"
                    maxLength={100}
                    error={!!errors.city}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Estado" error={errors.state?.message}>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    value={value || ""}
                    onValueChange={onChange}
                    options={stateOptions}
                    placeholder="Selecione"
                    searchable={false}
                    clearable={false}
                    disabled={isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
          </View>
        </Card>

        {/* Contact */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPhone size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Contato</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
          <FormFieldGroup label="Site" error={errors.site?.message}>
            <Controller
              control={control}
              name="site"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="https://exemplo.com.br"
                  keyboardType="url"
                  autoCapitalize="none"
                  error={!!errors.site}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Telefones">
            <Controller
              control={control}
              name="phones"
              render={({ field: { onChange, value } }) => (
                <PhoneManager phones={value || []} onChange={onChange} />
              )}
            />
          </FormFieldGroup>
          </View>
        </Card>

        {/* Tags */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconTag size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Tags</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
          <FormFieldGroup label="Tags do Cliente">
            <Controller
              control={control}
              name="tags"
              render={({ field: { onChange, value } }) => (
                <TagManager tags={value || []} onChange={onChange} />
              )}
            />
          </FormFieldGroup>
          </View>
        </Card>
        </KeyboardAwareFormProvider>
        </ScrollView>

        <SimpleFormActionBar
          onCancel={handleCancel}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          canSubmit={isValid}
          submitLabel="Criar"
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
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
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
  documentRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  documentInputField: {
    flex: 1,
  },
  documentTypeContainer: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  documentTypeButton: {
    minWidth: 50,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
