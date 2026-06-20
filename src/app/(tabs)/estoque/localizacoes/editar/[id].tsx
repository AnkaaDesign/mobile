import { useState, useEffect, useMemo, useRef } from "react";
import { ScrollView, Alert, StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWarehouseLocationDetail, useUpdateWarehouseLocation, useKeyboardAwareScroll, useScreenReady } from "@/hooks";
import { warehouseLocationUpdateSchema, type WarehouseLocationUpdateFormData } from "@/schemas";
import { Input, Switch } from "@/components/ui";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function WarehouseLocationEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}>
      <WarehouseLocationEditScreenInner key={id} />
    </PrivilegeGate>
  );
}

function WarehouseLocationEditScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNav();
  const goBack = () => nav.goBack({ fallback: mobileRoute(routes.inventory.warehouseLocations.root) });
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handlers, refs } = useKeyboardAwareScroll();

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const { data: location, isLoading, error } = useWarehouseLocationDetail(id!, {
    enabled: !!id,
  });

  useScreenReady(!isLoading);

  const form = useForm<WarehouseLocationUpdateFormData>({
    resolver: zodResolver(warehouseLocationUpdateSchema),
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

  // Track original values for change detection
  const originalValuesRef = useRef<WarehouseLocationUpdateFormData | null>(null);

  // Populate form when data is loaded
  useEffect(() => {
    if (location?.data && !isLoading) {
      const data = location.data;
      const formValues: WarehouseLocationUpdateFormData = {
        name: data.name,
        type: data.type,
        section: data.section,
        code: data.code,
        description: data.description,
        isActive: data.isActive,
        levels: data.levels,
        columns: data.columns,
        columnsPerLevel: data.columnsPerLevel && data.columnsPerLevel.length > 0 ? data.columnsPerLevel : undefined,
      };
      form.reset(formValues);
      if (!originalValuesRef.current) {
        originalValuesRef.current = formValues;
      }
    }
  }, [location, isLoading]);

  const { mutateAsync: updateAsync } = useUpdateWarehouseLocation(id!);

  const onSubmit = async (data: WarehouseLocationUpdateFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const original = originalValuesRef.current;

      const changedFields: Partial<WarehouseLocationUpdateFormData> = {};

      if (original) {
        (Object.keys(data) as (keyof WarehouseLocationUpdateFormData)[]).forEach((key) => {
          if (data[key] !== original[key]) {
            (changedFields as any)[key] = data[key];
          }
        });
      } else {
        Object.assign(changedFields, data);
      }

      if (Object.keys(changedFields).length === 0) {
        Alert.alert("Aviso", "Nenhuma alteração detectada.");
        setIsSubmitting(false);
        return;
      }

      const result = await updateAsync(changedFields);

      if (result?.data) {
        nav.replace(mobileRoute(routes.inventory.warehouseLocations.details(id!)));
      } else {
        Alert.alert("Erro", "Erro ao atualizar localização");
      }
    } catch (error: any) {
      // Error toast is shown automatically by the API client interceptor
      console.error("Error updating warehouse location:", error);
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
          <Skeleton style={{ height: 24, width: "40%", borderRadius: 4 }} />
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
            <Skeleton style={{ height: 16, width: "70%", borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: "50%", borderRadius: 4 }} />
            <Skeleton style={{ height: 16, width: "60%", borderRadius: 4 }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !location?.data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Localização não encontrada</ThemedText>
          <ThemedText style={styles.errorMessage}>A localização que você está procurando não existe ou foi removida.</ThemedText>
          <Button onPress={handleCancel}>
            <ThemedText style={styles.buttonText}>Voltar para lista</ThemedText>
          </Button>
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
            <FormCard title="Informações Básicas" icon="IconMapPin">
              <FormFieldGroup label="Nome" required error={form.formState.errors.name?.message}>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
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
    paddingBottom: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  errorMessage: {
    textAlign: "center",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
  },
});
