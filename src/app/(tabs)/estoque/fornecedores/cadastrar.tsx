import { useState } from "react";
import { View, ScrollView, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconTruck, IconDeviceFloppy, IconX } from "@tabler/icons-react-native";
import { useCreateSupplier } from "@/hooks";
import { supplierCreateSchema, type SupplierCreateFormData } from "@/schemas";
import { ThemedView, ThemedText, Card, Input, Combobox, Button, SimpleFormField } from "@/components/ui";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useTheme } from "@/lib/theme";
import { routes, BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { formatCNPJ, cleanCNPJ, formatZipCode, cleanZipCode } from "@/utils";
import { PhoneManager, TagManager, FileUploadManager } from "@/components/inventory/supplier/form";

interface FileUpload {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function SupplierCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFiles, setLogoFiles] = useState<FileUpload[]>([]);
  const [documentFiles, setDocumentFiles] = useState<FileUpload[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<SupplierCreateFormData>({
    resolver: zodResolver(supplierCreateSchema),
    mode: "onChange",
    defaultValues: {
      fantasyName: "",
      cnpj: null,
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

  const { mutateAsync: createAsync } = useCreateSupplier();

  const onSubmit = async (data: SupplierCreateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Create FormData if we have files
      if (logoFiles.length > 0 || documentFiles.length > 0) {
        const formData = new FormData();

        // Add all form fields
        formData.append("fantasyName", data.fantasyName);
        if (data.cnpj) formData.append("cnpj", data.cnpj);
        if (data.corporateName) formData.append("corporateName", data.corporateName);
        if (data.email) formData.append("email", data.email);
        if (data.address) formData.append("address", data.address);
        if (data.addressNumber) formData.append("addressNumber", data.addressNumber);
        if (data.addressComplement) formData.append("addressComplement", data.addressComplement);
        if (data.neighborhood) formData.append("neighborhood", data.neighborhood);
        if (data.city) formData.append("city", data.city);
        if (data.state) formData.append("state", data.state);
        if (data.zipCode) formData.append("zipCode", data.zipCode);
        if (data.site) formData.append("site", data.site);

        // Add phones as array
        data.phones?.forEach((phone, index) => {
          formData.append(`phones[${index}]`, phone);
        });

        // Add tags as array
        data.tags?.forEach((tag, index) => {
          formData.append(`tags[${index}]`, tag);
        });

        // Add logo file
        if (logoFiles.length > 0) {
          const logoFile = logoFiles[0];
          formData.append("logo", {
            uri: logoFile.uri,
            name: logoFile.name,
            type: logoFile.type,
          } as any);
        }

        // Add document files
        documentFiles.forEach((file) => {
          formData.append("documents", {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as any);
        });

        const result = await createAsync(formData as any);

        if (result?.data) {
          Alert.alert("Sucesso", "Fornecedor criado com sucesso!", [
            {
              text: "OK",
              onPress: () => {
                router.replace(routeToMobilePath(routes.inventory.suppliers.root) as any);
              },
            },
          ]);
        } else {
          Alert.alert("Erro", "Erro ao criar fornecedor");
        }
      } else {
        // No files, send regular JSON data
        const result = await createAsync(data);

        if (result?.data) {
          Alert.alert("Sucesso", "Fornecedor criado com sucesso!", [
            {
              text: "OK",
              onPress: () => {
                router.replace(routeToMobilePath(routes.inventory.suppliers.root) as any);
              },
            },
          ]);
        } else {
          Alert.alert("Erro", "Erro ao criar fornecedor");
        }
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar fornecedor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty || logoFiles.length > 0 || documentFiles.length > 0) {
      Alert.alert("Descartar Alterações", "Você tem alterações não salvas. Deseja descartá-las?", [
        { text: "Continuar Editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
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
            <IconTruck size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Criar Fornecedor</ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.subtitle, { color: colors.mutedForeground }])}>Preencha os dados do novo fornecedor</ThemedText>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <Accordion type="multiple" collapsible defaultValue={["basic", "address"]}>
          {/* Basic Information */}
          <AccordionItem value="basic">
            <Card style={styles.section}>
              <AccordionTrigger>
                <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>
              </AccordionTrigger>
              <AccordionContent>
                <View style={styles.sectionContent}>
                  <SimpleFormField label="Nome Fantasia" required error={errors.fantasyName}>
                    <Controller
                      control={control}
                      name="fantasyName"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Ex: Fornecedor ABC" maxLength={200} error={!!errors.fantasyName} />
                      )}
                    />
                  </SimpleFormField>

                  <SimpleFormField label="CNPJ" error={errors.cnpj}>
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

                  <SimpleFormField label="Razão Social" error={errors.corporateName}>
                    <Controller
                      control={control}
                      name="corporateName"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          value={value || ""}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Ex: Fornecedor ABC LTDA"
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
                          placeholder="email@fornecedor.com"
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
                          placeholder="https://fornecedor.com.br"
                          keyboardType="url"
                          autoCapitalize="none"
                          error={!!errors.site}
                        />
                      )}
                    />
                  </SimpleFormField>
                </View>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Address */}
          <AccordionItem value="address">
            <Card style={styles.section}>
              <AccordionTrigger>
                <ThemedText style={styles.sectionTitle}>Endereço</ThemedText>
              </AccordionTrigger>
              <AccordionContent>
                <View style={styles.sectionContent}>
                  <SimpleFormField label="CEP" error={errors.zipCode}>
                    <Controller
                      control={control}
                      name="zipCode"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          value={value ? formatZipCode(value) : ""}
                          onChangeText={(text) => onChange(cleanZipCode(text))}
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
                          <Combobox
                            value={value || ""}
                            onValueChange={onChange}
                            options={stateOptions}
                            placeholder="Selecione"
                            searchable={false}
                          />
                        )}
                      />
                    </SimpleFormField>
                  </View>
                </View>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Contact */}
          <AccordionItem value="contact">
            <Card style={styles.section}>
              <AccordionTrigger>
                <ThemedText style={styles.sectionTitle}>Contato</ThemedText>
              </AccordionTrigger>
              <AccordionContent>
                <View style={styles.sectionContent}>
                  <SimpleFormField label="Telefones">
                    <Controller control={control} name="phones" render={({ field: { onChange, value } }) => <PhoneManager phones={value || []} onChange={onChange} />} />
                  </SimpleFormField>
                </View>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Files */}
          <AccordionItem value="files">
            <Card style={styles.section}>
              <AccordionTrigger>
                <ThemedText style={styles.sectionTitle}>Arquivos</ThemedText>
              </AccordionTrigger>
              <AccordionContent>
                <View style={styles.sectionContent}>
                  <SimpleFormField label="Logo do Fornecedor">
                    <FileUploadManager files={logoFiles} onChange={setLogoFiles} maxFiles={1} allowImages={true} />
                  </SimpleFormField>

                  <SimpleFormField label="Documentos">
                    <FileUploadManager files={documentFiles} onChange={setDocumentFiles} maxFiles={5} allowImages={true} />
                  </SimpleFormField>
                </View>
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* Tags */}
          <AccordionItem value="tags">
            <Card style={styles.section}>
              <AccordionTrigger>
                <ThemedText style={styles.sectionTitle}>Tags</ThemedText>
              </AccordionTrigger>
              <AccordionContent>
                <View style={styles.sectionContent}>
                  <SimpleFormField label="Tags do Fornecedor">
                    <Controller control={control} name="tags" render={({ field: { onChange, value } }) => <TagManager tags={value || []} onChange={onChange} />} />
                  </SimpleFormField>
                </View>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom }]}>
        <Button variant="outline" onPress={handleCancel} disabled={isSubmitting} style={styles.actionButton}>
          <IconX size={20} />
          <ThemedText>Cancelar</ThemedText>
        </Button>

        <Button variant="default" onPress={handleSubmit(onSubmit)} disabled={!isValid || isSubmitting} style={styles.actionButton}>
          <IconDeviceFloppy size={20} />
          <ThemedText style={{ color: "white" }}>{isSubmitting ? "Salvando..." : "Criar Fornecedor"}</ThemedText>
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
  },
  sectionContent: {
    gap: 16,
    paddingTop: 8,
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
