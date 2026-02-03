import { useState, useEffect } from "react";
import { View, ScrollView, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconReceipt2, IconDeviceFloppy, IconX, IconSearch, IconBuilding, IconFileText, IconMapPin, IconPhone, IconTag } from "@tabler/icons-react-native";
import { spacing, fontSize } from "@/constants/design-system";
import { useCustomer, useCustomerMutations, useCnpjLookup, useCepLookup } from "@/hooks";
import { customerUpdateSchema, type CustomerUpdateFormData } from "@/schemas";
import {
  ThemedView,
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  ErrorScreen,
  Skeleton,
  SimpleFormField,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes, BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { formatCPF, formatCNPJ, cleanCPF, cleanCNPJ, formatCEP, cleanCEP } from "@/utils";
import { TagManager } from "@/components/administration/customer/form/tag-manager";
import { PhoneArrayInput } from "@/components/ui";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";

/**
 * Financial Customer Edit Screen
 *
 * Allows editing customer information from the financial module context.
 * Uses the same form components as administration but navigates back to
 * financial routes.
 */
export default function FinancialCustomerEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cnpj");
  const [logoFiles, setLogoFiles] = useState<FilePickerItem[]>([]);

  // CNPJ Lookup Hook
  const { lookupCnpj, isLoading: isLoadingCnpj } = useCnpjLookup({
    onSuccess: (data: any /* TODO: Add proper type */) => {
      setValue("fantasyName", data.fantasyName);
      setValue("corporateName", data.corporateName);
      setValue("email", data.email);
      setValue("address", data.address);
      setValue("addressNumber", data.addressNumber);
      setValue("addressComplement", data.addressComplement);
      setValue("neighborhood", data.neighborhood);
      setValue("city", data.city);
      setValue("state", data.state);
      setValue("zipCode", data.zipCode);
      setValue("phones", data.phones);

      Alert.alert(
        "CNPJ Encontrado",
        `Dados de ${data.fantasyName} foram carregados automaticamente.`,
        [{ text: "OK" }]
      );
    },
    onError: () => {
      Alert.alert(
        "CNPJ não encontrado",
        "Não foi possível encontrar os dados deste CNPJ. Verifique se o número está correto ou preencha manualmente.",
        [{ text: "OK" }]
      );
    },
  });

  // CEP Lookup Hook
  const { lookupCep, isLoading: isLoadingCep } = useCepLookup({
    onSuccess: (data) => {
      if (data.logradouro) {
        setValue("address", data.logradouro);
      }
      if (data.bairro) {
        setValue("neighborhood", data.bairro);
      }
      if (data.localidade) {
        setValue("city", data.localidade);
      }
      if (data.uf) {
        setValue("state", data.uf);
      }
    },
    onError: (error) => {
      console.error('CEP lookup error:', error);
    },
  });

  const { data: customer, isLoading, error, refetch } = useCustomer(id!, {
    // Use select for optimized data fetching - only fetch fields needed for the form
    select: {
      // All editable fields
      id: true,
      fantasyName: true,
      cnpj: true,
      cpf: true,
      corporateName: true,
      email: true,
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      site: true,
      phones: true,
      tags: true,
      logoId: true,
      situacaoCadastral: true,
      inscricaoEstadual: true,
      economicActivityId: true,
      logradouro: true,
      // Logo relation for display
      logo: {
        select: {
          id: true,
          url: true,
          name: true,
          mimeType: true,
        },
      },
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    reset,
    watch,
  } = useForm<CustomerUpdateFormData>({
    resolver: zodResolver(customerUpdateSchema),
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
    },
  });

  const { updateAsync } = useCustomerMutations();

  // Watch for changes to determine document type
  const cpfValue = watch("cpf");
  const cnpjValue = watch("cnpj");

  useEffect(() => {
    if (cpfValue && !cnpjValue) {
      setDocumentType("cpf");
    } else if (cnpjValue) {
      setDocumentType("cnpj");
    }
  }, [cpfValue, cnpjValue]);

  // Watch CEP field and trigger lookup
  const cepValue = watch("zipCode");
  useEffect(() => {
    const cleanCep = cepValue?.replace(/\D/g, '');
    if (cleanCep && cleanCep.length === 8) {
      lookupCep(cleanCep);
    }
  }, [cepValue, lookupCep]);

  // Populate form when customer data is loaded
  useEffect(() => {
    if (customer?.data && !isLoading) {
      const customerData = customer.data;
      reset({
        fantasyName: customerData.fantasyName,
        cnpj: customerData.cnpj,
        cpf: customerData.cpf,
        corporateName: customerData.corporateName,
        email: customerData.email,
        address: customerData.address,
        addressNumber: customerData.addressNumber,
        addressComplement: customerData.addressComplement,
        neighborhood: customerData.neighborhood,
        city: customerData.city,
        state: customerData.state,
        zipCode: customerData.zipCode,
        site: customerData.site,
        phones: customerData.phones,
        tags: customerData.tags,
        logoId: customerData.logoId,
      });

      // Set document type based on existing data
      if (customerData.cpf && !customerData.cnpj) {
        setDocumentType("cpf");
      } else {
        setDocumentType("cnpj");
      }
    }
  }, [customer, isLoading, reset]);

  const onSubmit = async (data: CustomerUpdateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let submitData: CustomerUpdateFormData | any = data;

      // If we have a new logo file, create FormData
      if (logoFiles.length > 0) {
        const formData = new FormData();

        // Add all form fields
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Handle arrays (phones, tags)
              value.forEach((item, index) => {
                formData.append(`${key}[${index}]`, item);
              });
            } else {
              formData.append(key, String(value));
            }
          }
        });

        // Add the logo file
        const logoFile = logoFiles[0];
        formData.append("logo", {
          uri: logoFile.uri,
          name: logoFile.name,
          type: logoFile.type,
        } as any);

        submitData = formData;
      }

      const result = await updateAsync({ id: id!, data: submitData as CustomerUpdateFormData });

      if (result?.data) {
        // API client already shows success alert
        // Navigate back to financial customer details, not administration
        router.replace(routeToMobilePath(routes.financial.customers.details(id!)) as any);
      } else {
        Alert.alert("Erro", "Erro ao atualizar cliente");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar cliente. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty || logoFiles.length > 0) {
      Alert.alert("Descartar Alterações", "Você tem alterações não salvas. Deseja descartá-las?", [
        { text: "Continuar Editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handleDocumentTypeChange = (type: "cpf" | "cnpj") => {
    setDocumentType(type);
    if (type === "cpf") {
      setValue("cnpj", null);
    } else {
      setValue("cpf", null);
    }
  };

  const handleCnpjBlur = async (cnpj: string | null | undefined) => {
    if (!cnpj || cnpj.length !== 14) return;
    await lookupCnpj(cnpj);
  };

  const stateOptions = BRAZILIAN_STATES.map((state) => ({
    label: BRAZILIAN_STATE_NAMES[state],
    value: state,
  }));

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Skeleton height={24} width="60%" />
            <View style={styles.skeletonRows}>
              <Skeleton height={48} width="100%" />
              <Skeleton height={48} width="100%" />
              <Skeleton height={48} width="100%" />
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error || !customer?.data) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar cliente" detail={error?.message || "Cliente não encontrado"} onRetry={refetch} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <IconReceipt2 size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Editar Cliente (Financeiro)</ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.subtitle, { color: colors.mutedForeground }])}>{customer.data.fantasyName}</ThemedText>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Basic Information */}
        <Card style={styles.section}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBuilding size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>
            </View>
          </View>
          <View style={styles.sectionContentWrapper}>
            <SimpleFormField label="Nome Fantasia" required error={errors.fantasyName}>
              <Controller
                control={control}
                name="fantasyName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Ex: Empresa LTDA" maxLength={200} error={!!errors.fantasyName} />
                )}
              />
            </SimpleFormField>

            <SimpleFormField label="Razão Social" error={errors.corporateName}>
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
                  />
                )}
              />
            </SimpleFormField>

            <SimpleFormField label="Email" error={errors.email}>
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
                  />
                )}
              />
            </SimpleFormField>

            <SimpleFormField label="Site" error={errors.site}>
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
                  />
                )}
              />
            </SimpleFormField>
          </View>
        </Card>

        {/* Document */}
        <Card style={styles.section}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconFileText size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Documento</ThemedText>
            </View>
          </View>
          <View style={styles.sectionContentWrapper}>
            <View style={styles.documentTypeContainer}>
            <Button
              variant={documentType === "cnpj" ? "default" : "outline"}
              onPress={() => handleDocumentTypeChange("cnpj")}
              style={styles.documentTypeButton}
            >
              <ThemedText style={{ color: documentType === "cnpj" ? "white" : colors.foreground }}>CNPJ</ThemedText>
            </Button>
            <Button variant={documentType === "cpf" ? "default" : "outline"} onPress={() => handleDocumentTypeChange("cpf")} style={styles.documentTypeButton}>
              <ThemedText style={{ color: documentType === "cpf" ? "white" : colors.foreground }}>CPF</ThemedText>
            </Button>
          </View>

          {documentType === "cnpj" ? (
            <SimpleFormField label="CNPJ" required error={errors.cnpj}>
              <Controller
                control={control}
                name="cnpj"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View style={styles.inputWithIcon}>
                      <Input
                        value={value ? formatCNPJ(String(value || '')) : ""}
                        onChangeText={(text) => onChange(cleanCNPJ(String(text || "")) || "")}
                        onBlur={() => {
                          onBlur();
                          handleCnpjBlur(value);
                        }}
                        placeholder="00.000.000/0000-00"
                        keyboardType="numeric"
                        maxLength={18}
                        error={!!errors.cnpj}
                        editable={!isLoadingCnpj}
                        style={{ flex: 1 }}
                      />
                      {isLoadingCnpj && (
                        <View style={styles.iconContainer}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                      )}
                      {!isLoadingCnpj && value && value.length === 14 && (
                        <View style={styles.iconContainer}>
                          <IconSearch size={20} color={colors.mutedForeground} />
                        </View>
                      )}
                    </View>
                    {isLoadingCnpj && (
                      <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                        Buscando dados do CNPJ...
                      </ThemedText>
                    )}
                  </>
                )}
              />
            </SimpleFormField>
          ) : (
            <SimpleFormField label="CPF" required error={errors.cpf}>
              <Controller
                control={control}
                name="cpf"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value ? formatCPF(String(value || '')) : ""}
                    onChangeText={(text) => onChange(cleanCPF(String(text || "")) || "")}
                    onBlur={onBlur}
                    placeholder="000.000.000-00"
                    keyboardType="numeric"
                    maxLength={14}
                    error={!!errors.cpf}
                  />
                )}
              />
            </SimpleFormField>
          )}
          </View>
        </Card>

        {/* Logo */}
        <Card style={styles.section}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconFileText size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Logo</ThemedText>
            </View>
          </View>
          <View style={styles.sectionContentWrapper}>
            <FilePicker
              value={logoFiles}
              onChange={setLogoFiles}
              maxFiles={1}
              label="Logo do Cliente"
              placeholder="Adicionar logo"
              helperText="Selecione uma imagem para o logo do cliente"
              disabled={isSubmitting}
              showCamera={true}
              showGallery={true}
              showFilePicker={true}
            />
            {customer.data.logo?.url && logoFiles.length === 0 && (
              <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                Logo atual: {customer.data.logo.filename || 'logo.jpg'}
              </ThemedText>
            )}
          </View>
        </Card>

        {/* Address */}
        <Card style={styles.section}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconMapPin size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Endereço</ThemedText>
            </View>
          </View>
          <View style={styles.sectionContentWrapper}>
            <SimpleFormField label="CEP" error={errors.zipCode}>
            <Controller
              control={control}
              name="zipCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <View style={styles.inputWithIcon}>
                    <Input
                      value={value ? formatCEP(String(value || '')) : ""}
                      onChangeText={(text) => onChange(cleanCEP(String(text || "")) || "")}
                      onBlur={onBlur}
                      placeholder="00000-000"
                      keyboardType="numeric"
                      maxLength={9}
                      error={!!errors.zipCode}
                      editable={!isSubmitting && !isLoadingCep}
                      style={{ flex: 1 }}
                    />
                    {isLoadingCep && (
                      <View style={styles.iconContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    )}
                    {!isLoadingCep && value && value.length === 8 && (
                      <View style={styles.iconContainer}>
                        <IconSearch size={20} color={colors.mutedForeground} />
                      </View>
                    )}
                  </View>
                  {isLoadingCep && (
                    <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
                      Buscando endereço do CEP...
                    </ThemedText>
                  )}
                </>
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Logradouro" error={errors.address}>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Rua, Avenida, etc." maxLength={200} error={!!errors.address} />
              )}
            />
          </SimpleFormField>

          <View style={styles.row}>
            <SimpleFormField label="Número" error={errors.addressNumber} style={styles.smallField}>
              <Controller
                control={control}
                name="addressNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="123" maxLength={10} error={!!errors.addressNumber} />
                )}
              />
            </SimpleFormField>

            <SimpleFormField label="Complemento" error={errors.addressComplement} style={styles.largeField}>
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
                  />
                )}
              />
            </SimpleFormField>
          </View>

          <SimpleFormField label="Bairro" error={errors.neighborhood}>
            <Controller
              control={control}
              name="neighborhood"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Centro" maxLength={100} error={!!errors.neighborhood} />
              )}
            />
          </SimpleFormField>

          <View style={styles.row}>
            <SimpleFormField label="Cidade" error={errors.city} style={styles.largeField}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="São Paulo" maxLength={100} error={!!errors.city} />
                )}
              />
            </SimpleFormField>

            <SimpleFormField label="Estado" error={errors.state} style={styles.smallField}>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, value } }) => (
                  <Select value={value || ""} onValueChange={onChange}>
                    <SelectItem label="Selecione" value="" />
                    {stateOptions.map((option) => (
                      <SelectItem key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Select>
                )}
              />
            </SimpleFormField>
          </View>
          </View>
        </Card>

        {/* Contact */}
        <Card style={styles.section}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPhone size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Contato</ThemedText>
            </View>
          </View>
          <View style={styles.sectionContentWrapper}>
            <SimpleFormField label="Telefones">
              <Controller
                control={control}
                name="phones"
                render={({ field: { onChange, value } }) => (
                  <PhoneArrayInput
                    phones={value || []}
                    onChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </SimpleFormField>
          </View>
        </Card>

        {/* Tags */}
        <Card style={styles.section}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconTag size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
            </View>
          </View>
          <View style={styles.sectionContentWrapper}>
            <SimpleFormField label="Tags do Cliente">
              <Controller control={control} name="tags" render={({ field: { onChange, value } }) => <TagManager tags={value || []} onChange={onChange} />} />
            </SimpleFormField>
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
        <Button variant="outline" onPress={handleCancel} disabled={isSubmitting} style={styles.actionButton}>
          <IconX size={20} />
          <ThemedText>Cancelar</ThemedText>
        </Button>

        <Button variant="default" onPress={handleSubmit(onSubmit)} disabled={!isValid || isSubmitting || (!isDirty && logoFiles.length === 0)} style={styles.actionButton}>
          <IconDeviceFloppy size={20} />
          <ThemedText style={{ color: "white" }}>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    gap: 4,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginLeft: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  sectionContentWrapper: {
    marginTop: spacing.md,
  },
  documentTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  documentTypeButton: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  smallField: {
    flex: 1,
  },
  largeField: {
    flex: 2,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  skeletonRows: {
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
