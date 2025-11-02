import { useState } from "react";
import { View, ScrollView, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBuilding, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useCustomerMutations } from "@/hooks";
import { customerCreateSchema, type CustomerCreateFormData } from "@/schemas";
import {
  ThemedView,
  ThemedText,
  Card,
  Input,
  Combobox,
  Button,
  SimpleFormField,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes, BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES, REGISTRATION_STATUS_OPTIONS, LOGRADOURO_TYPE_OPTIONS } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { formatCPF, formatCNPJ, cleanCPF, cleanCNPJ, formatCEP, cleanCEP } from "@/utils";
import { PhoneManager } from "@/components/administration/customer/form/phone-manager";
import { TagManager } from "@/components/administration/customer/form/tag-manager";
import { LogoUpload } from "@/components/administration/customer/form/logo-upload";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

export default function CreateCustomerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cnpj");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
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

  const onSubmit = async (data: CustomerCreateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let submitData: CustomerCreateFormData | any = data;

      // If we have a logo file, create FormData
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

        submitData = formData as any;
      }

      const result = await createAsync(submitData as CustomerCreateFormData);

      if (result?.data) {
        Alert.alert("Sucesso", "Cliente criado com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              router.replace(routeToMobilePath(routes.administration.customers.details(result.data?.id || '')) as any);
            },
          },
        ]);
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
      { text: "Descartar", style: "destructive", onPress: () => router.back() },
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
    <ThemedView style={StyleSheet.flatten([styles.wrapper, { backgroundColor: colors.background }])}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Customer Name Header Card */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={[styles.headerLeft, { flex: 1 }]}>
                <IconBuilding size={24} color={colors.primary} />
                <ThemedText style={StyleSheet.flatten([styles.customerName, { color: colors.foreground }])}>
                  Cadastrar Cliente
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
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: Empresa LTDA"
                  maxLength={200}
                  error={!!errors.fantasyName}
                />
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

          <SimpleFormField label="Situação Cadastral" error={errors.situacaoCadastral}>
            <Controller
              control={control}
              name="situacaoCadastral"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={onChange}
                  options={REGISTRATION_STATUS_OPTIONS}
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
                      value={value ? formatCNPJ(value) : ""}
                      onChangeText={(text) => onChange(cleanCNPJ(text))}
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
                      value={value ? formatCPF(value) : ""}
                      onChangeText={(text) => onChange(cleanCPF(text))}
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
          <LogoUpload value={logoFile} onChange={setLogoFile} disabled={isSubmitting} />
        </Card>

        {/* Address */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Endereço</ThemedText>

          <SimpleFormField label="Tipo de Logradouro" error={errors.logradouro}>
            <Controller
              control={control}
              name="logradouro"
              render={({ field: { onChange, value } }) => (
                <Combobox
                  value={value || ""}
                  onValueChange={onChange}
                  options={LOGRADOURO_TYPE_OPTIONS}
                  placeholder="Selecione o tipo de logradouro"
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
                  value={value ? formatCEP(value) : ""}
                  onChangeText={(text) => onChange(cleanCEP(text))}
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
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Rua, Avenida, etc."
                  maxLength={200}
                  error={!!errors.address}
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Número" error={errors.addressNumber}>
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
                />
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
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Centro"
                  maxLength={100}
                  error={!!errors.neighborhood}
                />
              )}
            />
          </SimpleFormField>

          <SimpleFormField label="Cidade" error={errors.city}>
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
                />
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
            <Controller
              control={control}
              name="phones"
              render={({ field: { onChange, value } }) => <PhoneManager phones={value || []} onChange={onChange} />}
            />
          </SimpleFormField>
        </Card>

        {/* Tags */}
        <Card style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Tags</ThemedText>

          <SimpleFormField label="Tags do Cliente">
            <Controller
              control={control}
              name="tags"
              render={({ field: { onChange, value } }) => <TagManager tags={value || []} onChange={onChange} />}
            />
          </SimpleFormField>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.md }} />
        </View>
      </ScrollView>

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
            disabled={!isValid || isSubmitting}
            style={{ flex: 1, minHeight: 40 }}
          >
            <>
              <IconDeviceFloppy size={20} color={colors.primaryForeground} />
              <ThemedText style={{ color: colors.primaryForeground, marginLeft: 8 }}>
                {isSubmitting ? "Salvando..." : "Salvar Cliente"}
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
});
