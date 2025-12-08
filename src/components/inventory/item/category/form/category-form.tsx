import { useMemo } from "react";
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { itemCategoryCreateSchema, itemCategoryUpdateSchema, type ItemCategoryCreateFormData, type ItemCategoryUpdateFormData } from '../../../../../schemas';
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from "@/constants";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useItems, useKeyboardAwareScroll } from "@/hooks";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

interface ItemCategoryFormProps<TMode extends "create" | "update"> {
  onSubmit: (data: TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData>;
  mode: TMode;
}

export function ItemCategoryForm<TMode extends "create" | "update">({ onSubmit, onCancel, isSubmitting, defaultValues, mode }: ItemCategoryFormProps<TMode>) {
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();

  type FormData = TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData;

  const form = useForm<FormData>({
    resolver: zodResolver(mode === "create" ? itemCategoryCreateSchema : itemCategoryUpdateSchema),
    defaultValues: {
      name: "",
      type: ITEM_CATEGORY_TYPE.REGULAR,
      itemIds: [],
      ...defaultValues,
    } as any,
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data as any);
    } catch (error) {
      // Error handling done by parent component
    }
  };

  const isRequired = mode === "create";

  // Fetch items for multi-selector
  const { data: items, isLoading: isLoadingItems } = useItems({
    orderBy: { name: "asc" },
    include: {
      category: true,
    },
  });

  const itemOptions =
    items?.data?.map((item) => ({
      value: item.id,
      label: `${item.name}${item.category ? ` (${item.category.name})` : ""}`,
    })) || [];

  const typeOptions = Object.values(ITEM_CATEGORY_TYPE).map((type) => ({
    label: ITEM_CATEGORY_TYPE_LABELS[type],
    value: type,
  }));

  const watchedType = form.watch("type");

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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            <FormCard title="Informações da Categoria" icon="IconFolder">
          <FormFieldGroup
            label="Nome da Categoria"
            required={isRequired}
            error={form.formState.errors.name?.message}
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ex: Ferramentas, EPIs, etc."
                  editable={!isSubmitting}
                  autoCapitalize="words"
                  error={!!error}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Tipo da Categoria"
            helper={
              watchedType === ITEM_CATEGORY_TYPE.PPE
                ? "Categoria para Equipamentos de Proteção Individual"
                : watchedType === ITEM_CATEGORY_TYPE.TOOL
                  ? "Categoria para ferramentas e equipamentos"
                  : "Categoria para produtos gerais"
            }
            error={form.formState.errors.type?.message}
          >
            <Controller
              control={form.control}
              name="type"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  placeholder="Selecione o tipo da categoria"
                  options={typeOptions}
                  value={value}
                  onValueChange={onChange}
                  disabled={isSubmitting}
                  searchable={false}
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Produtos Associados">
            <Controller
              control={form.control}
              name={"itemIds" as any}
              render={({ field }) => (
                <Combobox
                  mode="multiple"
                  options={itemOptions}
                  value={Array.isArray(field.value) ? field.value : []}
                  onValueChange={field.onChange}
                  placeholder="Selecione produtos para associar"
                  searchPlaceholder="Pesquisar produtos..."
                  emptyText="Nenhum produto encontrado"
                  disabled={isSubmitting || isLoadingItems}
                />
              )}
            />
          </FormFieldGroup>
            </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
        onCancel={onCancel}
        onSubmit={form.handleSubmit(handleSubmit as any)}
        isSubmitting={isSubmitting}
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
});
