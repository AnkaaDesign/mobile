import { useMemo } from "react";
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import type { DefaultValues, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { itemBrandCreateSchema, itemBrandUpdateSchema, type ItemBrandCreateFormData, type ItemBrandUpdateFormData } from '../../../../../schemas';
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useItems, useKeyboardAwareScroll } from "@/hooks";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

// Base form data type that covers both create and update scenarios
// This helps TypeScript properly infer the Path types for react-hook-form
interface ItemBrandBaseFormData {
  name: string;
  itemIds?: string[];
}

interface ItemBrandFormProps<TMode extends "create" | "update"> {
  onSubmit: (data: (TMode extends "create" ? ItemBrandCreateFormData : ItemBrandUpdateFormData) & { itemIds?: string[] }) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<TMode extends "create" ? ItemBrandCreateFormData : ItemBrandUpdateFormData>;
  mode: TMode;
}

export function ItemBrandForm<TMode extends "create" | "update">({ onSubmit, onCancel, isSubmitting, defaultValues, mode }: ItemBrandFormProps<TMode>) {
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();

  // Use base form type for react-hook-form to properly infer Path types
  // The actual submit handler uses the proper TMode-based type
  const form = useForm<ItemBrandBaseFormData>({
    resolver: zodResolver(mode === "create" ? itemBrandCreateSchema : itemBrandUpdateSchema),
    defaultValues: {
      name: "",
      itemIds: [],
      ...defaultValues,
    } as DefaultValues<ItemBrandBaseFormData>,
  });

  const handleSubmit = async (data: ItemBrandBaseFormData) => {
    try {
      // Cast to the appropriate type based on mode
      await onSubmit(data as TMode extends "create" ? ItemBrandCreateFormData : ItemBrandUpdateFormData);
    } catch (error) {
      // Error handling done by parent component
    }
  };

  const isRequired = mode === "create";

  // Fetch items for multi-selector
  const { data: items, isLoading: isLoadingItems } = useItems({
    orderBy: { name: "asc" },
    include: {
      brand: true,
    },
  });

  const itemOptions =
    items?.data?.map((item) => ({
      value: item.id,
      label: `${item.name}${item.brand ? ` (${item.brand.name})` : ""}`,
    })) || [];

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
            <FormCard title="Informações da Marca" icon="IconTag">
          <FormFieldGroup
            label="Nome da Marca"
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
                  placeholder="Digite o nome da marca"
                  editable={!isSubmitting}
                  maxLength={255}
                  autoCapitalize="words"
                  error={!!error}
                />
              )}
            />
          </FormFieldGroup>

          <FormFieldGroup label="Produtos Associados">
            <Controller
              control={form.control}
              name="itemIds"
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
          onSubmit={form.handleSubmit(handleSubmit)}
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
