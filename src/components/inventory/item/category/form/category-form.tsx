
import { View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconLoader } from "@tabler/icons-react-native";
import { itemCategoryCreateSchema, itemCategoryUpdateSchema, type ItemCategoryCreateFormData, type ItemCategoryUpdateFormData } from '../../../../../schemas';
import { ITEM_CATEGORY_TYPE } from '../../../../../constants';
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useItems } from '../../../../../hooks';
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { Label } from "@/components/ui/label";

// Import form components
import { NameInput } from "./name-input";
import { TypeSelector } from "./type-selector";

interface ItemCategoryFormProps<TMode extends "create" | "update"> {
  onSubmit: (data: TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<TMode extends "create" ? ItemCategoryCreateFormData : ItemCategoryUpdateFormData>;
  mode: TMode;
}

export function ItemCategoryForm<TMode extends "create" | "update">({ onSubmit, onCancel, isSubmitting, defaultValues, mode }: ItemCategoryFormProps<TMode>) {
  const { colors } = useTheme();

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

  return (
    <FormProvider {...form}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ThemedScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            {/* Basic Information */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Informações da Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.fieldGroup}>
                  <NameInput disabled={isSubmitting} required={isRequired} />
                  <TypeSelector disabled={isSubmitting} />

                  <View>
                    <Label style={styles.label}>Produtos Associados</Label>
                    <Controller
                      control={form.control}
                      name={"itemIds" as any}
                      render={({ field }) => (
                        <MultiSelectCombobox
                          options={itemOptions}
                          selectedValues={Array.isArray(field.value) ? field.value : []}
                          onValueChange={field.onChange}
                          onCreate={() => {}}
                          onSearchChange={() => {}}
                          onEndReached={() => {}}
                          placeholder="Selecione produtos para associar"
                          selectedText="produtos selecionados"
                          searchPlaceholder="Pesquisar produtos..."
                          disabled={isSubmitting || isLoadingItems}
                        />
                      )}
                    />
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <View style={styles.actions}>
                <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.cancelButton}>
                  Cancelar
                </Button>
                <Button onPress={form.handleSubmit(handleSubmit as any)} disabled={isSubmitting} style={styles.submitButton}>
                  {isSubmitting ? (
                    <>
                      <IconLoader size={20} color={colors.primaryForeground} />
                      <ThemedText style={{ color: colors.primaryForeground }}>Salvando...</ThemedText>
                    </>
                  ) : (
                    <ThemedText style={{ color: colors.primaryForeground }}>{mode === "create" ? "Criar Categoria" : "Atualizar Categoria"}</ThemedText>
                  )}
                </Button>
              </View>
            </View>
          </View>
        </ThemedScrollView>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  actionsContainer: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    minWidth: 100,
  },
  submitButton: {
    minWidth: 120,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
});
