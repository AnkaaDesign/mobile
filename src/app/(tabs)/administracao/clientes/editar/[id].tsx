import { useState, useEffect } from "react";
import { View, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBuilding, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useCustomer, useCustomerMutations } from "@/hooks";
import { useCnpjLookup } from "@/hooks/use-cnpj-lookup";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import { customerUpdateSchema} from "@/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getEconomicActivities, createEconomicActivity, getEconomicActivityById } from "@/api-client/economic-activity";
import { showToast } from "@/components/ui/toast";
import {
  ThemedView,
  ThemedText,
  Card,
  Input,
  Combobox,
  Button,
  ErrorScreen,
  Skeleton,
  SimpleFormField,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes, BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES, REGISTRATION_STATUS_OPTIONS, STREET_TYPE_OPTIONS } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { formatCPF, formatCNPJ, cleanCPF, cleanCNPJ, formatCEP, cleanCEP } from "@/utils";
import { PhoneManager } from "@/components/administration/customer/form/phone-manager";
import { TagManager } from "@/components/administration/customer/form/tag-manager";
import { LogoUpload } from "@/components/administration/customer/form/logo-upload";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

export default function CustomerEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cnpj");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [economicActivityInitialOptions, setEconomicActivityInitialOptions] = useState<Array<{ value: string; label: string }>>([]);
  const queryClient = useQueryClient();

  const { data: customer, isLoading, error, refetch } = useCustomer(id!, {
    include: {
      logo: true,
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
      registrationStatus: null,
      inscricaoEstadual: null,
      economicActivityId: null,
      streetType: null,
    },
  });

  const { updateAsync } = useCustomerMutations();

  // CNPJ Lookup Hook
  const { lookupCnpj } = useCnpjLookup({
    onSuccess: async (data) => {
      const currentValues = watch();

      // Autofill fields with data from Brasil API, allowing updates to existing data
      setValue("fantasyName", data.fantasyName, { shouldDirty: true, shouldValidate: true });

      if (data.corporateName) {
        setValue("corporateName", data.corporateName, { shouldDirty: true, shouldValidate: true });
      }
      if (data.email) {
        setValue("email", data.email, { shouldDirty: true, shouldValidate: true });
      }
      if (data.zipCode) {
        setValue("zipCode", data.zipCode, { shouldDirty: true, shouldValidate: true });
      }
      if (data.streetType) {
        setValue("streetType", data.streetType, { shouldDirty: true, shouldValidate: true });
      }
      if (data.address) {
        setValue("address", data.address, { shouldDirty: true, shouldValidate: true });
      }
      if (data.addressNumber) {
        setValue("addressNumber", data.addressNumber, { shouldDirty: true, shouldValidate: true });
      }
      if (data.addressComplement) {
        setValue("addressComplement", data.addressComplement, { shouldDirty: true, shouldValidate: true });
      }
      if (data.neighborhood) {
        setValue("neighborhood", data.neighborhood, { shouldDirty: true, shouldValidate: true });
      }
      if (data.city) {
        setValue("city", data.city, { shouldDirty: true, shouldValidate: true });
      }
      if (data.state) {
        setValue("state", data.state, { shouldDirty: true, shouldValidate: true });
      }
      if (data.phones && data.phones.length > 0) {
        const currentPhones = currentValues.phones || [];
        const newPhones = data.phones.filter(phone => !currentPhones.includes(phone));
        if (newPhones.length > 0) {
          setValue("phones", [...currentPhones, ...newPhones], { shouldDirty: true, shouldValidate: true });
        }
      }
      if (data.registrationStatus) {
        setValue("registrationStatus", data.registrationStatus, { shouldDirty: true, shouldValidate: true });
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
        setValue("streetType", data.streetType, { shouldDirty: true, shouldValidate: true });
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

  // Economic Activity mutation
  const { mutateAsync: createActivityAsync } = useMutation({
    mutationFn: createEconomicActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["economic-activities"] });
    },
  });

  // Watch for changes to determine document type
  const cpfValue = watch("cpf");
  const cnpjValueWatch = watch("cnpj");

  useEffect(() => {
    if (cpfValue && !cnpjValueWatch) {
      setDocumentType("cpf");
    } else if (cnpjValueWatch) {
      setDocumentType("cnpj");
    }
  }, [cpfValue, cnpjValueWatch]);

  // Watch CNPJ field and trigger lookup
  useEffect(() => {
    if (cnpjValueWatch) {
      lookupCnpj(cnpjValueWatch);
    }
  }, [cnpjValueWatch, lookupCnpj]);

  // Watch CEP field and trigger lookup
  const cepValue = watch("zipCode");
  useEffect(() => {
    if (cepValue) {
      lookupCep(cepValue);
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
        registrationStatus: customerData.registrationStatus,
        inscricaoEstadual: customerData.inscricaoEstadual,
        economicActivityId: customerData.economicActivityId,
        streetType: customerData.streetType,
      });

      // Set document type based on existing data
      if (customerData.cpf && !customerData.cnpj) {
        setDocumentType("cpf");
      } else {
        setDocumentType("cnpj");
      }

      // Load economic activity if present
      if (customerData.economicActivityId) {
        getEconomicActivityById(customerData.economicActivityId)
          .then(response => {
            if (response.data) {
              setEconomicActivityInitialOptions([{
                value: response.data.id,
                label: `${response.data.code} - ${response.data.description}`,
              }]);
            }
          })
          .catch(error => {
            console.error("Error loading economic activity:", error);
          });
      }
    }
  }, [customer, isLoading, reset]);

  const onSubmit = async (data: CustomerUpdateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let submitData: CustomerUpdateFormData | any = data;

      // If we have a new logo file, create FormData
      if (logoFile) {
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
        formData.append("logo", logoFile as any);

        submitData = formData;
      }

      const result = await updateAsync({ id: id!, data: submitData as CustomerUpdateFormData });

      if (result?.data) {
        Alert.alert("Sucesso", "Cliente atualizado com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              router.replace(routeToMobilePath(routes.administration.customers.details(id!)) as any);
            },
          },
        ]);
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
    if (isDirty || logoFile) {
      Alert.alert("Descartar Alterações", "Você tem alterações não salvas. Deseja descartá-las?", [
        { text: "Continuar Editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: () => router.push(routeToMobilePath(routes.administration.customers.list) as any) },
      ]);
    } else {
      router.push(routeToMobilePath(routes.administration.customers.list) as any);
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

  const stateOptions = BRAZILIAN_STATES.map((state) => ({
    label: BRAZILIAN_STATE_NAMES[state],
    value: state,
  }));

  if (isLoading) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Card style={styles.card}>
              <Skeleton height={24} width="60%" />
              <View style={styles.skeletonRows}>
                <Skeleton height={48} width="100%" />
                <Skeleton height={48} width="100%" />
                <Skeleton height={48} width="100%" />
              </View>
            </Card>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error || !customer?.data) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
        <ErrorScreen message="Erro ao carregar cliente" detail={error?.message || "Cliente não encontrado"} onRetry={refetch} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
          {/* Customer Name Header Card */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={[styles.headerLeft, { flex: 1 }]}>
                <IconBuilding size={24} color={colors.primary} />
                <ThemedText style={StyleSheet.flatten([styles.customerName, { color: colors.foreground }])}>
                  Editar Cliente
                </ThemedText>
              </View>
              <View style={styles.headerActions}>
                {/* Empty placeholder to match detail page structure */}
              </View>
            </View>
          </Card>
        {/* Basic Information */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>

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

          <SimpleFormField label="Situação Cadastral" error={errors.registrationStatus}>
            <Controller
              control={control}
              name="registrationStatus"
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
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Inscrição Estadual" error={errors.inscricaoEstadual}>
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
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="CNAE (Atividade Econômica)" error={errors.economicActivityId}>
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
                      showToast({
                        message: result.message || "Atividade econômica configurada com sucesso",
                        type: "success",
                      });
                    } catch (error: any) {
                      showToast({
                        message: error.response?.data?.message || "Erro ao criar atividade econômica",
                        type: "error",
                      });
                    }
                  }}
                  createLabel={(value) => `Criar CNAE "${value}"`}
                  placeholder="Buscar por código ou descrição"
                  searchPlaceholder="Digite o código ou descrição..."
                  emptyText="Nenhuma atividade encontrada"
                  searchable={true}
                  clearable={true}
                />
              )}
            />
          </SimpleFormField>
        </Card>

        {/* Document */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Documento</ThemedText>

          <View style={styles.documentRow}>
            <View style={styles.documentTypeContainer}>
              <Button
                variant={documentType === "cnpj" ? "default" : "outline"}
                onPress={() => handleDocumentTypeChange("cnpj")}
                size="sm"
                style={styles.documentTypeButton}
              >
                <ThemedText style={{ color: documentType === "cnpj" ? colors.primaryForeground : colors.foreground }}>
                  CNPJ
                </ThemedText>
              </Button>
              <Button
                variant={documentType === "cpf" ? "default" : "outline"}
                onPress={() => handleDocumentTypeChange("cpf")}
                size="sm"
                style={styles.documentTypeButton}
              >
                <ThemedText style={{ color: documentType === "cpf" ? colors.primaryForeground : colors.foreground }}>
                  CPF
                </ThemedText>
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
                      onChangeText={(text) => onChange(cleanCNPJ(text) || "")}
                      onBlur={onBlur}
                      placeholder="00.000.000/0000-00"
                      keyboardType="numeric"
                      maxLength={18}
                      error={!!errors.cnpj}
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
                      onChangeText={(text) => onChange(cleanCPF(text) || "")}
                      onBlur={onBlur}
                      placeholder="000.000.000-00"
                      keyboardType="numeric"
                      maxLength={14}
                      error={!!errors.cpf}
                    />
                  )}
                />
              )}
            </View>
          </View>
        </Card>

        {/* Logo */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Logo</ThemedText>
          <LogoUpload value={logoFile} onChange={setLogoFile} disabled={isSubmitting} existingLogoUrl={(customer.data.logo?.url as string) || undefined} />
        </Card>

        {/* Address */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Endereço</ThemedText>

          <SimpleFormField label="Tipo de Logradouro" error={errors.streetType}>
            <Controller
              control={control}
              name="streetType"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={onChange}
                  options={[...STREET_TYPE_OPTIONS]}
                  placeholder="Select street type"
                  searchPlaceholder="Pesquisar tipo..."
                  emptyText="Nenhum tipo encontrado"
                  searchable={true}
                  clearable={true}
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="CEP" error={errors.zipCode}>
            <Controller
              control={control}
              name="zipCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value ? formatCEP(String(value)) : ""}
                  onChangeText={(text) => onChange(cleanCEP(text) || "")}
                  onBlur={onBlur}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  maxLength={9}
                  error={!!errors.zipCode}
                />
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

          <SimpleFormField label="Número" error={errors.addressNumber}>
            <Controller
              control={control}
              name="addressNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="123" maxLength={10} error={!!errors.addressNumber} />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Complemento" error={errors.addressComplement}>
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

          <SimpleFormField label="Bairro" error={errors.neighborhood}>
            <Controller
              control={control}
              name="neighborhood"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Centro" maxLength={100} error={!!errors.neighborhood} />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Cidade" error={errors.city}>
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="São Paulo" maxLength={100} error={!!errors.city} />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Estado" error={errors.state}>
            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={onChange}
                  options={stateOptions}
                  placeholder="Selecione um estado"
                  searchPlaceholder="Pesquisar estado..."
                  emptyText="Nenhum estado encontrado"
                  searchable={true}
                  clearable={true}
                />
              )}
            />
          </SimpleFormField>
        </Card>

        {/* Contact */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Contato</ThemedText>

          <SimpleFormField label="Telefones">
            <Controller control={control} name="phones" render={({ field: { onChange, value } }) => <PhoneManager phones={value || []} onChange={onChange} />} />
          </SimpleFormField>
        </Card>

        {/* Tags */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Tags</ThemedText>

          <SimpleFormField label="Tags do Cliente">
            <Controller control={control} name="tags" render={({ field: { onChange, value } }) => <TagManager tags={value || []} onChange={onChange} />} />
          </SimpleFormField>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.md }} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.card }}>
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: spacing.xl,
            },
          ]}
        >
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconX size={20} color={colors.foreground} />
              <ThemedText style={{ color: colors.foreground, marginLeft: 8 }}>Cancelar</ThemedText>
            </>
          </Button>

          <Button
            variant="default"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting || (!isDirty && !logoFile)}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconDeviceFloppy size={20} color={colors.primaryForeground} />
              <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </ThemedText>
            </>
          </Button>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  customerName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 36, // Match detail page button height
  },
  card: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
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
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  smallField: {
    flex: 1,
  },
  largeField: {
    flex: 2,
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  skeletonRows: {
    gap: 8,
  },
});
