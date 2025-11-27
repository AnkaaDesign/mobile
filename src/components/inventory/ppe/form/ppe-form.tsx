import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { itemCreateSchema, itemUpdateSchema } from "@/schemas/item";
import type { ItemCreateFormData, ItemUpdateFormData } from "@/schemas/item";
import type { Item } from "@/types";
import { useItemMutations, useKeyboardAwareScroll } from "@/hooks/useItem";
import { useItemBrands } from "@/hooks/useItemBrand";
import { useItemCategories } from "@/hooks/useItemCategory";
import { PPE_TYPE, PPE_DELIVERY_MODE, ITEM_CATEGORY_TYPE } from "@/constants";
import { PPE_TYPE_LABELS, PPE_DELIVERY_MODE_LABELS } from "@/constants/enum-labels";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

interface PPEFormProps {
  mode: "create" | "update";
  item?: Item;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PPEForm({ mode, item, onSuccess, onCancel }: PPEFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useItemMutations();

  const { data: brands } = useItemBrands({ orderBy: { name: "asc" } });
  const { data: categories } = useItemCategories({
    where: { type: ITEM_CATEGORY_TYPE.PPE },
    orderBy: { name: "asc" },
  });

  const form = useForm<ItemCreateFormData | ItemUpdateFormData>({
    resolver: zodResolver(mode === "create" ? itemCreateSchema : itemUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            name: "",
            quantity: 0,
            maxQuantity: null,
            reorderPoint: null,
            reorderQuantity: null,
            ppeType: null,
            ppeCA: null,
            ppeDeliveryMode: null,
            ppeStandardQuantity: null,
            brandId: null,
            categoryId: null,
            isActive: true,
            shouldAssignToUser: true,
          }
        : {
            name: item?.name || "",
            quantity: item?.quantity || 0,
            maxQuantity: item?.maxQuantity || null,
            reorderPoint: item?.reorderPoint || null,
            reorderQuantity: item?.reorderQuantity || null,
            ppeType: item?.ppeType || null,
            ppeCA: item?.ppeCA || null,
            ppeDeliveryMode: item?.ppeDeliveryMode || null,
            ppeStandardQuantity: item?.ppeStandardQuantity || null,
            brandId: item?.brandId || null,
            categoryId: item?.categoryId || null,
            isActive: item?.isActive ?? true,
            shouldAssignToUser: item?.shouldAssignToUser ?? true,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: ItemCreateFormData | ItemUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as ItemCreateFormData);
      } else if (item) {
        await updateAsync({
          id: item.id,
          data: data as ItemUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar o EPI");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const brandOptions: ComboboxOption[] =
    brands?.data?.map((brand) => ({
      value: brand.id,
      label: brand.name,
    })) || [];

  const categoryOptions: ComboboxOption[] =
    categories?.data?.map((category) => ({
      value: category.id,
      label: category.name,
    })) || [];

  const ppeTypeOptions: ComboboxOption[] = Object.entries(PPE_TYPE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const ppeDeliveryModeOptions: ComboboxOption[] = Object.entries(PPE_DELIVERY_MODE_LABELS).map(
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
            {/* Basic Information */}
            <FormCard
              title="Informações Básicas"
              subtitle="Dados do equipamento de proteção individual"
            >
          {/* Name */}
          <FormFieldGroup
            label="Nome"
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
                  placeholder="Digite o nome do EPI"
                  editable={!isLoading}
                  error={!!form.formState.errors.name}
                />
              )}
            />
          </FormFieldGroup>

          {/* PPE Type and Brand Row */}
          <FormRow>
            <FormFieldGroup
              label="Tipo de EPI"
              error={form.formState.errors.ppeType?.message}
            >
              <Controller
                control={form.control}
                name="ppeType"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={ppeTypeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione o tipo"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Marca"
              error={form.formState.errors.brandId?.message}
            >
              <Controller
                control={form.control}
                name="brandId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={brandOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione a marca"
                    disabled={isLoading}
                    searchable
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Category and CA Row */}
          <FormRow>
            <FormFieldGroup
              label="Categoria"
              error={form.formState.errors.categoryId?.message}
            >
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={categoryOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione a categoria"
                    disabled={isLoading}
                    searchable
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="CA (Certificado de Aprovação)"
              error={form.formState.errors.ppeCA?.message}
            >
              <Controller
                control={form.control}
                name="ppeCA"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={(val) => onChange(val || null)}
                    onBlur={onBlur}
                    placeholder="Ex: 12345"
                    editable={!isLoading}
                    error={!!form.formState.errors.ppeCA}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
        </FormCard>

        {/* Stock Information */}
        <FormCard
          title="Informações de Estoque"
          subtitle="Quantidades e pontos de reposição"
        >
          {/* Quantity and Max Quantity Row */}
          <FormRow>
            <FormFieldGroup
              label="Quantidade Atual"
              error={form.formState.errors.quantity?.message}
            >
              <Controller
                control={form.control}
                name="quantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || "0"}
                    onChangeText={(val) => onChange(Number(val) || 0)}
                    onBlur={onBlur}
                    placeholder="0"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.quantity}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Quantidade Máxima"
              error={form.formState.errors.maxQuantity?.message}
            >
              <Controller
                control={form.control}
                name="maxQuantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || ""}
                    onChangeText={(val) => onChange(val ? Number(val) : null)}
                    onBlur={onBlur}
                    placeholder="Opcional"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.maxQuantity}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Reorder Point and Quantity Row */}
          <FormRow>
            <FormFieldGroup
              label="Ponto de Reposição"
              helper="Quando alertar para repor"
              error={form.formState.errors.reorderPoint?.message}
            >
              <Controller
                control={form.control}
                name="reorderPoint"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || ""}
                    onChangeText={(val) => onChange(val ? Number(val) : null)}
                    onBlur={onBlur}
                    placeholder="Opcional"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.reorderPoint}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Quantidade de Reposição"
              error={form.formState.errors.reorderQuantity?.message}
            >
              <Controller
                control={form.control}
                name="reorderQuantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || ""}
                    onChangeText={(val) => onChange(val ? Number(val) : null)}
                    onBlur={onBlur}
                    placeholder="Opcional"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.reorderQuantity}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
        </FormCard>

        {/* Delivery Configuration */}
        <FormCard
          title="Configuração de Entrega"
          subtitle="Como o EPI é entregue aos colaboradores"
        >
          <FormRow>
            <FormFieldGroup
              label="Modo de Entrega"
              error={form.formState.errors.ppeDeliveryMode?.message}
            >
              <Controller
                control={form.control}
                name="ppeDeliveryMode"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={ppeDeliveryModeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione o modo"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Quantidade Padrão"
              helper="Quantidade padrão por entrega"
              error={form.formState.errors.ppeStandardQuantity?.message}
            >
              <Controller
                control={form.control}
                name="ppeStandardQuantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value?.toString() || ""}
                    onChangeText={(val) => onChange(val ? Number(val) : null)}
                    onBlur={onBlur}
                    placeholder="1"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!form.formState.errors.ppeStandardQuantity}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Toggles */}
          <FormRow>
            <FormFieldGroup
              label="Ativo"
              helper="Item disponível para uso"
            >
              <View style={styles.switchRow}>
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field: { onChange, value } }) => (
                    <Switch value={value ?? true} onValueChange={onChange} disabled={isLoading} />
                  )}
                />
              </View>
            </FormFieldGroup>

            <FormFieldGroup
              label="Vincular ao Colaborador"
              helper="Rastrear por colaborador"
            >
              <View style={styles.switchRow}>
                <Controller
                  control={form.control}
                  name="shouldAssignToUser"
                  render={({ field: { onChange, value } }) => (
                    <Switch value={value ?? true} onValueChange={onChange} disabled={isLoading} />
                  )}
                />
              </View>
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
          submitLabel={mode === "create" ? "Cadastrar" : "Atualizar"}
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
