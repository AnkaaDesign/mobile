import { useState, useMemo } from "react";
import { ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useCreateWarehouseLocation, useKeyboardAwareScroll, useScreenReady } from "@/hooks";
import { warehouseLocationCreateSchema, type WarehouseLocationCreateFormData } from "@/schemas";
import { Input, Switch } from "@/components/ui";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useTheme } from "@/lib/theme";
import { routes, SECTOR_PRIVILEGES, WAREHOUSE_LOCATION_TYPE } from "@/constants";
import { WAREHOUSE_LOCATION_TYPE_LABELS } from "@/constants/enum-labels";
import { ColumnsPerLevelEditor } from "@/components/inventory/warehouse-location/form/columns-per-level-editor";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { mobileRoute } from "@/constants/routes.types";
import { useNav } from "@/contexts/nav";
import { formSpacing } from "@/constants/form-styles";

export default function WarehouseLocationCreateScreen() {
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}>
      <WarehouseLocationCreateScreenInner key={formKey} />
    </PrivilegeGate>
  );
}

function WarehouseLocationCreateScreenInner() {
  const nav = useNav();
  const goBack = () => nav.goBack({ fallback: mobileRoute(routes.inventory.warehouseLocations.root) });
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const form = useForm<WarehouseLocationCreateFormData>({
    resolver: zodResolver(warehouseLocationCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      type: WAREHOUSE_LOCATION_TYPE.ESTANTE,
      section: null,
      code: null,
      description: null,
      isActive: true,
      levels: 1,
      columns: 1,
      columnsPerLevel: undefined,
    },
  });

  const typeOptions: ComboboxOption[] = Object.values(WAREHOUSE_LOCATION_TYPE).map((t) => ({
    value: t,
    label: WAREHOUSE_LOCATION_TYPE_LABELS[t],
  }));

  useScreenReady();

  const { mutateAsync: createAsync } = useCreateWarehouseLocation();

  const onSubmit = async (data: WarehouseLocationCreateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createAsync(data);

      if (result?.data) {
        nav.replace(mobileRoute(routes.inventory.warehouseLocations.details(result.data.id)));
      } else {
        Alert.alert("Erro", "Erro ao criar localização");
      }
    } catch (error: any) {
      // Error toast is shown automatically by the API client interceptor
      console.error("Error creating warehouse location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      Alert.alert("Descartar Alterações", "Você tem alterações não salvas. Deseja descartá-las?", [
        { text: "Continuar Editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: () => goBack() },
      ]);
    } else {
      goBack();
    }
  };

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
            <FormCard title="Informações Básicas" icon="IconMapPin">
              <FormFieldGroup label="Nome" required error={form.formState.errors.name?.message}>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: Prateleira A1"
                      maxLength={200}
                      error={!!form.formState.errors.name}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup label="Tipo" error={form.formState.errors.type?.message}>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      options={typeOptions}
                      value={value ?? WAREHOUSE_LOCATION_TYPE.ESTANTE}
                      onValueChange={onChange}
                      placeholder="Selecione o tipo"
                      disabled={isSubmitting}
                      searchable={false}
                      clearable={false}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup label="Setor" error={form.formState.errors.section?.message}>
                <Controller
                  control={form.control}
                  name="section"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: Setor 1"
                      maxLength={200}
                      error={!!form.formState.errors.section}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup label="Código" error={form.formState.errors.code?.message}>
                <Controller
                  control={form.control}
                  name="code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Ex: A1-01"
                      maxLength={50}
                      autoCapitalize="characters"
                      error={!!form.formState.errors.code}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup label="Níveis" error={form.formState.errors.levels?.message}>
                <Controller
                  control={form.control}
                  name="levels"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value != null ? String(value) : ""}
                      onChangeText={(text) => onChange(text === "" ? undefined : Number(text.replace(/[^0-9]/g, "")))}
                      onBlur={onBlur}
                      placeholder="1"
                      keyboardType="number-pad"
                      error={!!form.formState.errors.levels}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup label="Colunas" error={form.formState.errors.columns?.message}>
                <Controller
                  control={form.control}
                  name="columns"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value != null ? String(value) : ""}
                      onChangeText={(text) => onChange(text === "" ? undefined : Number(text.replace(/[^0-9]/g, "")))}
                      onBlur={onBlur}
                      placeholder="1"
                      keyboardType="number-pad"
                      error={!!form.formState.errors.columns}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>

              <Controller
                control={form.control}
                name="columnsPerLevel"
                render={({ field: { onChange, value } }) => (
                  <ColumnsPerLevelEditor
                    levels={form.watch("levels") ?? 1}
                    defaultColumns={form.watch("columns") ?? 1}
                    value={value}
                    onChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />

              <FormFieldGroup label="Descrição" error={form.formState.errors.description?.message}>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Detalhes da localização"
                      maxLength={500}
                      multiline
                      error={!!form.formState.errors.description}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup label="Ativo" error={form.formState.errors.isActive?.message}>
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field: { onChange, value } }) => (
                    <Switch value={!!value} onValueChange={onChange} disabled={isSubmitting} />
                  )}
                />
              </FormFieldGroup>
            </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          canSubmit={form.formState.isValid}
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
});
