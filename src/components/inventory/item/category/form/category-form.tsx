import { useEffect, useMemo } from "react";
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import type { DefaultValues, Path, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { itemCategoryCreateSchema, itemCategoryUpdateSchema, type ItemCategoryCreateFormData, type ItemCategoryUpdateFormData } from '../../../../../schemas';
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS, ACCOUNTING_TYPE, ACCOUNTING_TYPE_LABELS } from "@/constants";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useItems, useItemCategories, useKeyboardAwareScroll } from "@/hooks";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

// Base form data type that covers both create and update scenarios
// This helps TypeScript properly infer the Path types for react-hook-form
interface ItemCategoryBaseFormData {
  name: string;
  type: ITEM_CATEGORY_TYPE;
  parentId?: string | null;
  categoryLevel?: number;
  accountingType?: ACCOUNTING_TYPE | null;
  itemIds?: string[];
}

interface ItemCategoryFormProps<TMode extends "create" | "update"> {
  onSubmit: (data: TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData>;
  mode: TMode;
  // In update mode, the category being edited — excluded from the parent picker
  // so a category can't become its own parent.
  categoryId?: string;
}

export function ItemCategoryForm<TMode extends "create" | "update">({ onSubmit, onCancel, isSubmitting, defaultValues, mode, categoryId }: ItemCategoryFormProps<TMode>) {
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();

  // Use base form type for react-hook-form to properly infer Path types
  // The actual submit handler uses the proper TMode-based type
  const form = useForm<ItemCategoryBaseFormData>({
    resolver: zodResolver(mode === "create" ? itemCategoryCreateSchema : itemCategoryUpdateSchema),
    defaultValues: {
      name: "",
      type: ITEM_CATEGORY_TYPE.REGULAR,
      parentId: null,
      categoryLevel: 1,
      accountingType: null,
      itemIds: [],
      ...defaultValues,
    } as DefaultValues<ItemCategoryBaseFormData>,
  });

  // A category with a parent is a Subcategoria (level 2); otherwise a top-level
  // Categoria (level 1). Mirrors web's CategoryForm taxonomy behaviour.
  const watchedParentId = form.watch("parentId");
  const isSubcategory = !!watchedParentId;

  // Keep categoryLevel in sync with the presence of a parent so the API stores
  // the right level.
  useEffect(() => {
    const nextLevel = isSubcategory ? 2 : 1;
    if (form.getValues("categoryLevel") !== nextLevel) {
      form.setValue("categoryLevel", nextLevel, { shouldDirty: true });
    }
  }, [isSubcategory, form]);

  // Existing categories for the parent picker.
  const { data: categories } = useItemCategories({ orderBy: { name: "asc" } });

  const parentOptions = useMemo(
    () =>
      (categories?.data || [])
        // A category can't be its own parent; subcategories (level 2) can't be parents.
        .filter((c) => c.id !== categoryId && (c.categoryLevel ?? 1) === 1)
        .map((c) => ({ value: c.id, label: c.name })),
    [categories, categoryId],
  );

  // When a parent is chosen, roll up its accountingType onto this subcategory
  // (read-only in the UI) so per-item splits land in the correct cost group.
  const handleParentChange = (parentId: string | null) => {
    form.setValue("parentId", parentId, { shouldDirty: true, shouldValidate: true });
    if (parentId) {
      const parent = (categories?.data || []).find((c) => c.id === parentId);
      if (parent?.accountingType) {
        form.setValue("accountingType", parent.accountingType as ACCOUNTING_TYPE, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  };

  // Item categories only ever roll up into these operational accounting groups;
  // the remaining (transaction-only) AccountingType values are intentionally
  // hidden. Mirrors web's AccountingTypeSelector.
  const accountingTypeOptions = [
    ACCOUNTING_TYPE.PRODUTIVO,
    ACCOUNTING_TYPE.MATERIA_PRIMA,
    ACCOUNTING_TYPE.MANUTENCAO,
    ACCOUNTING_TYPE.EPI,
    ACCOUNTING_TYPE.ESCRITORIO,
  ].map((value) => ({
    label: ACCOUNTING_TYPE_LABELS[value],
    value,
  }));

  const handleSubmit = async (data: ItemCategoryBaseFormData) => {
    try {
      // In update mode, never send itemIds. The web edit form (CategoryEditForm)
      // does not submit itemIds; the API treats a provided itemIds array as the
      // full association set, so sending an empty/stale array would disassociate
      // every item from the category. Web parity + safety.
      const payload =
        mode === "update"
          ? (() => {
              const { itemIds: _omitItemIds, ...rest } = data;
              return rest;
            })()
          : data;
      // Cast to the appropriate type based on mode
      await onSubmit(payload as TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData);
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
            error={(form.formState.errors.name as FieldError | undefined)?.message}
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <Input
                  value={typeof value === 'string' ? value : ""}
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
            error={(form.formState.errors.type as FieldError | undefined)?.message}
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

          <FormFieldGroup
            label="Categoria Pai"
            helper={
              isSubcategory
                ? "Nível 2 · Subcategoria — herda o grupo contábil da categoria pai"
                : "Nível 1 · Categoria — deixe vazio para uma categoria de topo"
            }
          >
            <Controller
              control={form.control}
              name="parentId"
              render={({ field: { value }, fieldState: { error } }) => (
                <Combobox
                  placeholder="Nenhuma (categoria de topo)"
                  searchPlaceholder="Pesquisar categorias..."
                  options={parentOptions}
                  value={value ?? undefined}
                  onValueChange={(v) => handleParentChange(v ? (v as string) : null)}
                  disabled={isSubmitting}
                  clearable
                  emptyText="Nenhuma categoria encontrada"
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Grupo Contábil"
            helper={
              isSubcategory
                ? "Herdado da categoria pai"
                : "Classificação contábil (DRE) para rateio de custos"
            }
            error={(form.formState.errors.accountingType as FieldError | undefined)?.message}
          >
            <Controller
              control={form.control}
              name="accountingType"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  placeholder="Selecione o grupo contábil"
                  searchPlaceholder="Pesquisar grupo..."
                  options={accountingTypeOptions}
                  value={value ?? undefined}
                  onValueChange={(v) => onChange(v ? (v as string) : null)}
                  disabled={isSubmitting || isSubcategory}
                  clearable
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
