import { useState, useEffect, useMemo } from "react";
import { ScrollView, Alert, StyleSheet, View, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupplierDetail, useUpdateSupplier, useKeyboardAwareScroll } from "@/hooks";
import { supplierUpdateSchema, type SupplierUpdateFormData } from "@/schemas";
import { Input, Combobox } from "@/components/ui";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useTheme } from "@/lib/theme";
import { BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from "@/constants";
import { formatCNPJ, cleanCNPJ, formatZipCode, cleanZipCode } from "@/utils";
import { PhoneManager, TagManager } from "@/components/inventory/supplier/form";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { formSpacing } from "@/constants/form-styles";

export default function SupplierEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFiles, setLogoFiles] = useState<FilePickerItem[]>([]);
  const [documentFiles, setDocumentFiles] = useState<FilePickerItem[]>([]);

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const { data: supplier, isLoading, error } = useSupplierDetail(id!, {
    enabled: !!id,
  });

  const form = useForm<SupplierUpdateFormData>({
    resolver: zodResolver(supplierUpdateSchema),
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

  // Populate form when supplier data is loaded
  useEffect(() => {
    if (supplier?.data && !isLoading) {
      const supplierData = supplier.data;
      form.reset({
        fantasyName: supplierData.fantasyName,
        cnpj: supplierData.cnpj,
        corporateName: supplierData.corporateName,
        email: supplierData.email,
        address: supplierData.address,
        addressNumber: supplierData.addressNumber,
        addressComplement: supplierData.addressComplement,
        neighborhood: supplierData.neighborhood,
        city: supplierData.city,
        state: supplierData.state,
        zipCode: supplierData.zipCode,
        site: supplierData.site,
        phones: supplierData.phones || [],
        tags: supplierData.tags || [],
      });
    }
  }, [supplier, isLoading]);

  const { mutateAsync: updateAsync } = useUpdateSupplier(id!);

  const onSubmit = async (data: SupplierUpdateFormData) => {
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

        const result = await updateAsync(formData as any);

        if (result?.data) {
          Alert.alert("Sucesso", "Fornecedor atualizado com sucesso!", [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]);
        } else {
          Alert.alert("Erro", "Erro ao atualizar fornecedor");
        }
      } else {
        // No files, send regular JSON data
        const result = await updateAsync(data);

        if (result?.data) {
          Alert.alert("Sucesso", "Fornecedor atualizado com sucesso!", [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]);
        } else {
          Alert.alert("Erro", "Erro ao atualizar fornecedor");
        }
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar fornecedor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty || logoFiles.length > 0 || documentFiles.length > 0) {
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !supplier?.data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        <FormCard title="Informações Básicas" icon="IconBuildingStore">
          <FormFieldGroup
            label="Nome Fantasia"
            required
            error={form.formState.errors.fantasyName?.message}
          >
            <Controller
              control={form.control}
              name="fantasyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: Fornecedor ABC"
                  maxLength={200}
                  error={!!form.formState.errors.fantasyName}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="CNPJ" error={form.formState.errors.cnpj?.message}>
            <Controller
              control={form.control}
              name="cnpj"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value ? formatCNPJ(String(value || "")) : ""}
                  onChangeText={(text) => onChange(text ? cleanCNPJ(String(text)) ?? "" : "")}
                  onBlur={onBlur}
                  placeholder="00.000.000/0000-00"
                  keyboardType="numeric"
                  maxLength={18}
                  error={!!form.formState.errors.cnpj}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Razão Social" error={form.formState.errors.corporateName?.message}>
            <Controller
              control={form.control}
              name="corporateName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: Fornecedor ABC LTDA"
                  maxLength={200}
                  error={!!form.formState.errors.corporateName}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Email" error={form.formState.errors.email?.message}>
            <Controller
              control={form.control}
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
                  error={!!form.formState.errors.email}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Site" error={form.formState.errors.site?.message}>
            <Controller
              control={form.control}
              name="site"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="https://fornecedor.com.br"
                  keyboardType="url"
                  autoCapitalize="none"
                  error={!!form.formState.errors.site}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>
        </FormCard>

        {/* Address */}
        <FormCard title="Endereço" icon="IconMapPin">
          <FormFieldGroup label="CEP" error={form.formState.errors.zipCode?.message}>
            <Controller
              control={form.control}
              name="zipCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value ? formatZipCode(String(value || "")) : ""}
                  onChangeText={(text) => onChange(text ? cleanZipCode(String(text)) ?? "" : "")}
                  onBlur={onBlur}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  maxLength={9}
                  error={!!form.formState.errors.zipCode}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Logradouro" error={form.formState.errors.address?.message}>
            <Controller
              control={form.control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Rua, Avenida, etc."
                  maxLength={200}
                  error={!!form.formState.errors.address}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

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
                    placeholder="123"
                    maxLength={10}
                    error={!!form.formState.errors.addressNumber}
                    editable={!isSubmitting}
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
                    placeholder="Apto, Sala, etc."
                    maxLength={100}
                    error={!!form.formState.errors.addressComplement}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          <FormFieldGroup label="Bairro" error={form.formState.errors.neighborhood?.message}>
            <Controller
              control={form.control}
              name="neighborhood"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Centro"
                  maxLength={100}
                  error={!!form.formState.errors.neighborhood}
                  editable={!isSubmitting}
                />
              )}
            />
          </FormFieldGroup>

          <FormRow>
            <FormFieldGroup label="Cidade" error={form.formState.errors.city?.message}>
              <Controller
                control={form.control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="São Paulo"
                    maxLength={100}
                    error={!!form.formState.errors.city}
                    editable={!isSubmitting}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Estado" error={form.formState.errors.state?.message}>
              <Controller
                control={form.control}
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
        </FormCard>

        {/* Contact */}
        <FormCard title="Contato" icon="IconPhone">
          <FormFieldGroup label="Telefones">
            <Controller
              control={form.control}
              name="phones"
              render={({ field: { onChange, value } }) => (
                <PhoneManager phones={value || []} onChange={onChange} />
              )}
            />
          </FormFieldGroup>
        </FormCard>

        {/* Files */}
        <FormCard title="Arquivos" icon="IconFileText">
          <FormFieldGroup label="Logo do Fornecedor">
            <FilePicker
              value={logoFiles}
              onChange={setLogoFiles}
              maxFiles={1}
              placeholder="Adicionar logo"
              helperText="Selecione uma imagem para o logo do fornecedor"
              disabled={isSubmitting}
              showCamera={true}
              showGallery={true}
              showFilePicker={true}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Documentos">
            <FilePicker
              value={documentFiles}
              onChange={setDocumentFiles}
              maxFiles={5}
              placeholder="Adicionar documentos"
              helperText="Selecione até 5 documentos do fornecedor"
              disabled={isSubmitting}
              showCamera={true}
              showGallery={true}
              showFilePicker={true}
            />
          </FormFieldGroup>
        </FormCard>

        {/* Tags */}
        <FormCard title="Tags" icon="IconTag">
          <FormFieldGroup label="Tags do Fornecedor">
            <Controller
              control={form.control}
              name="tags"
              render={({ field: { onChange, value } }) => (
                <TagManager tags={value || []} onChange={onChange} />
              )}
            />
          </FormFieldGroup>
        </FormCard>
        </KeyboardAwareFormProvider>
        </ScrollView>

        <SimpleFormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          canSubmit={form.formState.isValid}
          submitLabel="Salvar"
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
