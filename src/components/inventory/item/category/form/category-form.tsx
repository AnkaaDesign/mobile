import { useMemo, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import type { DefaultValues, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { itemCategoryCreateSchema, itemCategoryUpdateSchema, type ItemCategoryCreateFormData, type ItemCategoryUpdateFormData } from '../../../../../schemas';
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS, ITEM_CATEGORY_LEVEL, ITEM_CATEGORY_LEVEL_LABELS, ACCOUNTING_TYPE, ACCOUNTING_TYPE_LABELS } from "@/constants";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useItems, useKeyboardAwareScroll } from "@/hooks";
import { getItemCategories } from "@/api-client/item-category";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import type { ItemCategory } from "@/types";

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
  /** Pre-fetched parent Categoria so the parent combobox shows its name on edit. */
  initialParent?: ItemCategory;
  mode: TMode;
}

export function ItemCategoryForm<TMode extends "create" | "update">({ onSubmit, onCancel, isSubmitting, defaultValues, initialParent, mode }: ItemCategoryFormProps<TMode>) {
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
      categoryLevel: ITEM_CATEGORY_LEVEL.CATEGORY,
      accountingType: null,
      itemIds: [],
      ...defaultValues,
    } as DefaultValues<ItemCategoryBaseFormData>,
  });

  const handleSubmit = async (data: ItemCategoryBaseFormData) => {
    try {
      // Derive categoryLevel from parentId: a category with a parent is a
      // Subcategoria (level 2), otherwise a top-level Categoria (level 1).
      const categoryLevel = data.parentId ? ITEM_CATEGORY_LEVEL.SUBCATEGORY : ITEM_CATEGORY_LEVEL.CATEGORY;

      // In update mode, never send itemIds. The web edit form (CategoryEditForm)
      // does not submit itemIds; the API treats a provided itemIds array as the
      // full association set, so sending an empty/stale array would disassociate
      // every item from the category. Web parity + safety.
      const payload =
        mode === "update"
          ? (() => {
              const { itemIds: _omitItemIds, ...rest } = data;
              return { ...rest, categoryLevel };
            })()
          : { ...data, categoryLevel };
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

  // Item categories only roll up into these operational accounting groups; the
  // remaining (transaction-only) AccountingType values are intentionally hidden.
  const accountingTypeOptions = [
    ACCOUNTING_TYPE.PRODUTIVO,
    ACCOUNTING_TYPE.MATERIA_PRIMA,
    ACCOUNTING_TYPE.MANUTENCAO,
    ACCOUNTING_TYPE.EPI,
    ACCOUNTING_TYPE.ESCRITORIO,
  ].map((accType) => ({
    label: ACCOUNTING_TYPE_LABELS[accType],
    value: accType,
  }));

  const watchedType = form.watch("type");
  const watchedParentId = form.watch("parentId");
  const derivedLevel = watchedParentId ? ITEM_CATEGORY_LEVEL.SUBCATEGORY : ITEM_CATEGORY_LEVEL.CATEGORY;

  // Cache for parent category lookups
  const parentCacheRef = useRef<Map<string, ItemCategory>>(new Map());
  if (initialParent && !parentCacheRef.current.has(initialParent.id)) {
    parentCacheRef.current.set(initialParent.id, initialParent);
  }
  const initialParentOptions = useMemo<ItemCategory[]>(() => (initialParent ? [initialParent] : []), [initialParent?.id]);

  // Search top-level Categorias for the parent selector (level 1 only)
  const searchParentCategories = useCallback(
    async (search: string, page: number = 1): Promise<{ data: ItemCategory[]; hasMore: boolean }> => {
      const params: any = {
        orderBy: { name: "asc" },
        page,
        take: 50,
        categoryLevel: ITEM_CATEGORY_LEVEL.CATEGORY,
        select: { id: true, name: true, type: true, categoryLevel: true, accountingType: true },
      };
      if (search && search.trim()) params.searchingFor = search.trim();

      try {
        const response = await getItemCategories(params);
        const categories = response.data || [];
        categories.forEach((cat) => parentCacheRef.current.set(cat.id, cat));
        return { data: categories, hasMore: response.meta?.hasNextPage || false };
      } catch (error) {
        console.error("[CategoryForm] Error fetching parent categories:", error);
        return { data: [], hasMore: false };
      }
    },
    [],
  );

  const getParentLabel = useCallback((category: ItemCategory) => category.name, []);
  const getParentValue = useCallback((category: ItemCategory) => category.id, []);

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
            label="Tipo"
            helper="Classificação contábil usada como tipo principal da categoria"
            error={(form.formState.errors.accountingType as FieldError | undefined)?.message}
          >
            <Controller
              control={form.control}
              name="accountingType"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  placeholder="Selecione a classificação contábil"
                  options={accountingTypeOptions}
                  value={typeof value === "string" ? value : ""}
                  onValueChange={(selectedValue) => {
                    const singleValue = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
                    onChange(singleValue === "" ? null : singleValue ?? null);
                  }}
                  disabled={isSubmitting}
                  searchable={true}
                  clearable={true}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup
            label="Tipo físico (interno)"
            helper={
              watchedType === ITEM_CATEGORY_TYPE.PPE
                ? "Sinalizador físico interno: Equipamentos de Proteção Individual"
                : watchedType === ITEM_CATEGORY_TYPE.TOOL
                  ? "Sinalizador físico interno: ferramentas e equipamentos"
                  : "Sinalizador físico interno: produtos gerais"
            }
            error={(form.formState.errors.type as FieldError | undefined)?.message}
          >
            <Controller
              control={form.control}
              name="type"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  placeholder="Selecione o tipo físico"
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
              derivedLevel === ITEM_CATEGORY_LEVEL.SUBCATEGORY
                ? `Esta será uma ${ITEM_CATEGORY_LEVEL_LABELS[ITEM_CATEGORY_LEVEL.SUBCATEGORY]} (nível 2)`
                : `Deixe vazio para criar uma ${ITEM_CATEGORY_LEVEL_LABELS[ITEM_CATEGORY_LEVEL.CATEGORY]} de nível superior (nível 1)`
            }
          >
            <Controller
              control={form.control}
              name="parentId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox<ItemCategory>
                  value={typeof value === "string" ? value : ""}
                  onValueChange={(selectedValue) => {
                    const singleValue = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
                    onChange(singleValue === "" ? null : singleValue ?? null);
                  }}
                  async={true}
                  queryKey={["item-categories", "form-parents"]}
                  queryFn={searchParentCategories}
                  initialOptions={initialParentOptions}
                  getOptionLabel={getParentLabel}
                  getOptionValue={getParentValue}
                  placeholder="Nenhuma (categoria de nível superior)"
                  searchPlaceholder="Buscar categoria pai..."
                  emptyText="Nenhuma categoria encontrada"
                  disabled={isSubmitting}
                  clearable={true}
                  minSearchLength={0}
                  pageSize={50}
                  debounceMs={300}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Nível" helper="Definido automaticamente pela categoria pai">
            <Input value={ITEM_CATEGORY_LEVEL_LABELS[derivedLevel]} editable={false} />
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
