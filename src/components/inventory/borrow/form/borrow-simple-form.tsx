import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useItems, useUsers, useItem } from "@/hooks";
import { Text } from "@/components/ui/text";

// Simple Borrow Form Schema
const borrowSimpleSchema = z.object({
  userId: z.string().uuid("Colaborador é obrigatório").min(1, "Colaborador é obrigatório"),
  itemId: z.string().uuid("Item é obrigatório").min(1, "Item é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva").int("Quantidade deve ser um número inteiro"),
  returnedAt: z.date().nullable().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  conditionNotes: z.string().optional(),
});

type BorrowSimpleFormData = z.infer<typeof borrowSimpleSchema>;

interface BorrowSimpleFormProps {
  onSubmit: (data: BorrowSimpleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BorrowSimpleForm({ onSubmit, onCancel, isSubmitting }: BorrowSimpleFormProps) {
  const { colors } = useTheme();
  const [itemSearch] = useState("");
  const [userSearch] = useState("");

  const form = useForm<BorrowSimpleFormData>({
    resolver: zodResolver(borrowSimpleSchema),
    defaultValues: {
      userId: "",
      itemId: "",
      quantity: 1,
      returnedAt: null,
      reason: "",
      notes: "",
      conditionNotes: "",
    },
    mode: "onChange",
  });

  // Fetch items
  const { data: items } = useItems({
    searchingFor: itemSearch,
    orderBy: { name: "asc" },
  });

  // Fetch users (employees)
  const { data: users } = useUsers({
    searchingFor: userSearch,
    orderBy: { username: "asc" },
  });

  const itemOptions = items?.data?.map((item) => ({
    value: item.id,
    label: item.name,
  })) || [];

  const userOptions = users?.data?.map((user) => ({
    value: user.id,
    label: user.name,
  })) || [];

  // Watch selected item and quantity for stock validation
  const selectedItemId = useWatch({
    control: form.control,
    name: "itemId",
  });

  const selectedQuantity = useWatch({
    control: form.control,
    name: "quantity",
  });

  // Fetch selected item details for validation
  const { data: selectedItem, isLoading: isLoadingItem } = useItem(selectedItemId, {
    enabled: !!selectedItemId,
  });

  // Stock validation logic
  const stockValidation = useMemo(() => {
    if (!selectedItem || !selectedQuantity) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Calculate available stock (accounting for active borrows)
    const activeBorrowsQuantity = selectedItem.activeBorrowsQuantity || 0;
    const availableStock = selectedItem.quantity - activeBorrowsQuantity;

    // Validation 1: Check stock availability
    if (selectedQuantity > availableStock) {
      errors.push(`Estoque insuficiente. Disponível: ${availableStock}`);
    }

    // Validation 2: Check if item category is TOOL
    if (selectedItem.itemCategory?.type !== "TOOL") {
      errors.push("Apenas ferramentas podem ser emprestadas");
    }

    // Validation 3: Check if item is active
    if (!selectedItem.active) {
      errors.push("Item inativo não pode ser emprestado");
    }

    return {
      isValid: errors.length === 0,
      errors,
      availableStock,
      itemName: selectedItem.name,
      categoryType: selectedItem.itemCategory?.type,
      isActive: selectedItem.active,
    };
  }, [selectedItem, selectedQuantity]);

  const handleSubmit = async (data: BorrowSimpleFormData) => {
    // Validate stock before submission
    if (!stockValidation.isValid) {
      Alert.alert(
        "Validação falhou",
        stockValidation.errors.join("\n"),
        [{ text: "OK" }]
      );
      return;
    }

    await onSubmit(data);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Form */}
        <FormCard title="Novo Empréstimo">
          {/* Collaborator */}
          <FormFieldGroup
            label="Colaborador"
            required
            error={form.formState.errors.userId?.message}
          >
            <Controller
              control={form.control}
              name="userId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  value={value}
                  onValueChange={onChange}
                  options={userOptions}
                  placeholder="Selecione um colaborador"
                  searchPlaceholder="Buscar colaborador..."
                  disabled={isSubmitting}
                  searchable
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          {/* Item */}
          <FormFieldGroup
            label="Item"
            required
            error={form.formState.errors.itemId?.message}
          >
            <Controller
              control={form.control}
              name="itemId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  value={value}
                  onValueChange={onChange}
                  options={itemOptions}
                  placeholder="Selecione um item"
                  searchPlaceholder="Buscar item..."
                  disabled={isSubmitting}
                  searchable
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          {/* Quantity */}
          <FormFieldGroup
            label="Quantidade"
            required
            error={form.formState.errors.quantity?.message}
          >
            <Controller
              control={form.control}
              name="quantity"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value?.toString() || ""}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                    onChange(isNaN(num) ? 1 : num);
                  }}
                  placeholder="1"
                  keyboardType="numeric"
                  editable={!isSubmitting}
                  error={!!form.formState.errors.quantity}
                />
              )}
            />
          </FormFieldGroup>

          {/* Stock Validation Summary */}
          {selectedItemId && selectedItem && (
            <View
              style={[
                styles.validationCard,
                {
                  backgroundColor: stockValidation.isValid
                    ? colors.success + "10"
                    : colors.destructive + "10",
                  borderColor: stockValidation.isValid
                    ? colors.success
                    : colors.destructive,
                }
              ]}
            >
              <View style={styles.validationContent}>
                {isLoadingItem ? (
                  <Text style={[styles.validationText, { color: colors.mutedForeground }]}>
                    Carregando informações do item...
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.validationText,
                        {
                          color: stockValidation.isValid
                            ? colors.success
                            : colors.destructive,
                          fontWeight: "600"
                        }
                      ]}
                    >
                      {stockValidation.itemName}
                    </Text>

                    <View style={styles.validationDetails}>
                      <Text style={[styles.validationDetailText, { color: colors.foreground }]}>
                        Disponível: {stockValidation.availableStock || 0}
                      </Text>
                      <Text style={[styles.validationDetailText, { color: colors.foreground }]}>
                        Categoria: {stockValidation.categoryType || "N/A"}
                      </Text>
                      <Text style={[styles.validationDetailText, { color: colors.foreground }]}>
                        Status: {stockValidation.isActive ? "Ativo" : "Inativo"}
                      </Text>
                    </View>

                    {!stockValidation.isValid && stockValidation.errors.length > 0 && (
                      <View style={styles.validationErrors}>
                        {stockValidation.errors.map((error, index) => (
                          <Text
                            key={index}
                            style={[styles.validationErrorText, { color: colors.destructive }]}
                          >
                            • {error}
                          </Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          {/* Reason */}
          <FormFieldGroup
            label="Motivo"
            error={form.formState.errors.reason?.message}
          >
            <Controller
              control={form.control}
              name="reason"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  placeholder="Motivo do empréstimo (opcional)"
                  editable={!isSubmitting}
                  error={!!form.formState.errors.reason}
                />
              )}
            />
          </FormFieldGroup>

          {/* Notes */}
          <FormFieldGroup
            label="Observações"
            error={form.formState.errors.notes?.message}
          >
            <Controller
              control={form.control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  placeholder="Observações gerais (opcional)"
                  multiline
                  numberOfLines={3}
                  editable={!isSubmitting}
                  error={!!form.formState.errors.notes}
                />
              )}
            />
          </FormFieldGroup>

          {/* Condition Notes */}
          <FormFieldGroup
            label="Condição do Item"
            error={form.formState.errors.conditionNotes?.message}
          >
            <Controller
              control={form.control}
              name="conditionNotes"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  placeholder="Estado do item (opcional)"
                  multiline
                  numberOfLines={2}
                  editable={!isSubmitting}
                  error={!!form.formState.errors.conditionNotes}
                />
              )}
            />
          </FormFieldGroup>
        </FormCard>
      </ScrollView>

      {/* Action Bar */}
      <SimpleFormActionBar
        onCancel={onCancel}
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isSubmitting}
        canSubmit={form.formState.isValid && stockValidation.isValid}
        submitLabel="Registrar"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  validationCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  validationContent: {
    gap: spacing.sm,
  },
  validationText: {
    fontSize: 14,
  },
  validationDetails: {
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  validationDetailText: {
    fontSize: 12,
  },
  validationErrors: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
  },
  validationErrorText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
