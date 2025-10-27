import React, { useState } from "react";
import { View, ScrollView, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconUserPlus, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useCustomerMutations } from "@/hooks";
import { customerCreateSchema, type CustomerCreateFormData } from "@/schemas";
import {
  ThemedView,
  ThemedText,
  Card,
  Input,
  Select,
  SelectItem,
  Button,
  SimpleFormField,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes, BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { formatCPF, formatCNPJ, cleanCPF, cleanCNPJ, formatCEP, cleanCEP } from "@/utils";
import { PhoneManager } from "@/components/administration/customer/form/phone-manager";
import { TagManager } from "@/components/administration/customer/form/tag-manager";
import { LogoUpload } from "@/components/administration/customer/form/logo-upload";

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
              router.replace(routeToMobilePath(routes.administration.customers.details(result.data.id)) as any);
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
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <IconUserPlus size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Novo Cliente</ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.subtitle, { color: colors.mutedForeground }])}>
            Cadastro de novo cliente
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Basic Information */}
        <Card style={styles.section}>
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
        </Card>

        {/* Document */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Documento</ThemedText>

          <View style={styles.documentTypeContainer}>
            <Button
              variant={documentType === "cnpj" ? "default" : "outline"}
              onPress={() => handleDocumentTypeChange("cnpj")}
              style={styles.documentTypeButton}
            >
              <ThemedText style={{ color: documentType === "cnpj" ? "white" : colors.foreground }}>
                CNPJ
              </ThemedText>
            </Button>
            <Button
              variant={documentType === "cpf" ? "default" : "outline"}
              onPress={() => handleDocumentTypeChange("cpf")}
              style={styles.documentTypeButton}
            >
              <ThemedText style={{ color: documentType === "cpf" ? "white" : colors.foreground }}>
                CPF
              </ThemedText>
            </Button>
          </View>

          {documentType === "cnpj" ? (
            <SimpleFormField label="CNPJ" required error={errors.cnpj}>
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
            </SimpleFormField>
          ) : (
            <SimpleFormField label="CPF" required error={errors.cpf}>
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
            </SimpleFormField>
          )}
        </Card>

        {/* Logo */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Logo</ThemedText>
          <LogoUpload value={logoFile} onChange={setLogoFile} disabled={isSubmitting} />
        </Card>

        {/* Address */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Endereço</ThemedText>

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

          <View style={styles.row}>
            <SimpleFormField label="Número" error={errors.addressNumber} style={styles.smallField}>
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

          <View style={styles.row}>
            <SimpleFormField label="Cidade" error={errors.city} style={styles.largeField}>
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
        </Card>

        {/* Contact */}
        <Card style={styles.section}>
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
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tags</ThemedText>

          <SimpleFormField label="Tags do Cliente">
            <Controller
              control={control}
              name="tags"
              render={({ field: { onChange, value } }) => <TagManager tags={value || []} onChange={onChange} />}
            />
          </SimpleFormField>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom },
        ]}
      >
        <Button variant="outline" onPress={handleCancel} disabled={isSubmitting} style={styles.actionButton}>
          <IconX size={20} />
          <ThemedText>Cancelar</ThemedText>
        </Button>

        <Button
          variant="default"
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
          style={styles.actionButton}
        >
          <IconDeviceFloppy size={20} />
          <ThemedText style={{ color: "white" }}>{isSubmitting ? "Salvando..." : "Salvar Cliente"}</ThemedText>
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
    fontSize: 24,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
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
});
