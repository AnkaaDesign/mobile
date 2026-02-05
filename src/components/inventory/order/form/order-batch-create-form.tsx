import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useSuppliers, useMultiStepForm } from "@/hooks";
import type { FormStep } from "@/components/ui/form-steps";
import { formatCurrency } from "@/utils";
import {
  MultiStepFormContainer,
  ItemSelectorTable,
} from "@/components/forms";

// Form schema for batch order creation
const orderBatchFormSchema = z.object({
  supplierId: z.string().uuid("Selecione um fornecedor válido"),
  forecast: z.date({ required_error: "Data de entrega é obrigatória" }),
  notes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
});

type OrderBatchFormData = z.infer<typeof orderBatchFormSchema>;

interface OrderBatchCreateFormProps {
  onSubmit: (data: {
    supplierId: string;
    forecast: Date;
    notes?: string;
    items: Array<{
      itemId: string;
      quantity: number;
      price: number;
    }>;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Steps configuration
const STEPS: FormStep[] = [
  { id: 1, name: "Fornecedor", description: "Informações do pedido" },
  { id: 2, name: "Itens", description: "Selecione os itens" },
  { id: 3, name: "Revisão", description: "Confirme os dados" },
];

export function OrderBatchCreateForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: OrderBatchCreateFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Local state for date (since it's a Date object)
  const [forecastDate, setForecastDate] = useState<Date | undefined>(undefined);

  // Multi-step form state management
  const multiStepForm = useMultiStepForm<OrderBatchFormData>({
    storageKey: "@order_batch_form",
    totalSteps: 3,
    defaultFormData: {
      supplierId: "",
      forecast: undefined as unknown as Date,
      notes: "",
    },
    defaultQuantity: 1,
    defaultPrice: 0,
    validateOnStepChange: true,
    validateStep: (step, state) => {
      if (step === 1) {
        // Supplier and forecast are required
        return !!state.formData.supplierId && !!forecastDate;
      }
      if (step === 2) {
        // At least one item selected with valid price
        return state.selectedItems.length > 0;
      }
      return true;
    },
    getStepErrors: (step, state) => {
      const errors: Record<string, string> = {};
      if (step === 1) {
        if (!state.formData.supplierId) {
          errors.supplierId = "Selecione um fornecedor";
        }
        if (!forecastDate) {
          errors.forecast = "Selecione a data de entrega";
        }
      }
      if (step === 2) {
        if (state.selectedItems.length === 0) {
          errors.items = "Selecione pelo menos um item";
        }
      }
      return errors;
    },
  });

  // React Hook Form for form fields
  const form = useForm<OrderBatchFormData>({
    resolver: zodResolver(orderBatchFormSchema),
    defaultValues: multiStepForm.formData,
    mode: "onChange",
  });

  // Sync form data to multi-step state
  const handleFormChange = useCallback(
    (field: keyof OrderBatchFormData, value: string) => {
      form.setValue(field, value as never);
      multiStepForm.updateFormData({ [field]: value });
    },
    [form, multiStepForm],
  );

  // Fetch suppliers for selection
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers({
    where: { isActive: true },
    orderBy: { fantasyName: "asc" },
    limit: 100,
  });

  const supplierOptions = useMemo(
    () =>
      suppliers?.data?.map((supplier) => ({
        value: supplier.id,
        label: supplier.fantasyName || supplier.corporateName || supplier.id,
      })) || [],
    [suppliers],
  );

  // Get selected supplier name for review
  const selectedSupplierName = useMemo(() => {
    const supplier = suppliers?.data?.find((s) => s.id === multiStepForm.formData.supplierId);
    return supplier?.fantasyName || supplier?.corporateName || "Não selecionado";
  }, [suppliers, multiStepForm.formData.supplierId]);

  // Calculate totals for review
  const totals = useMemo(() => {
    const items = multiStepForm.getSelectedItemsWithData();
    const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      itemCount: items.length,
      totalQuantity,
      subtotal,
    };
  }, [multiStepForm]);

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    try {
      // Validate all items have valid quantities and prices
      const items = multiStepForm.getSelectedItemsWithData();
      const invalidItems = items.filter((item) => item.quantity <= 0 || (item.price || 0) <= 0);

      if (invalidItems.length > 0) {
        Alert.alert(
          "Erro",
          "Todos os itens devem ter quantidade e preço maior que zero"
        );
        return;
      }

      if (!forecastDate) {
        Alert.alert("Erro", "Selecione a data de entrega");
        return;
      }

      const formData = {
        supplierId: multiStepForm.formData.supplierId,
        forecast: forecastDate,
        notes: multiStepForm.formData.notes || undefined,
        items: items.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
          price: item.price || 0,
        })),
      };

      await onSubmit(formData);

      // Clear form state on success
      await multiStepForm.resetForm();
      setForecastDate(undefined);
    } catch (error) {
      // Error handled by parent component
    }
  }, [multiStepForm, forecastDate, onSubmit]);

  // Handle cancel with confirmation if form has data
  const handleCancel = useCallback(() => {
    if (multiStepForm.selectionCount > 0 || multiStepForm.formData.supplierId) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem dados não salvos. Deseja descartá-los?",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: async () => {
              await multiStepForm.resetForm();
              setForecastDate(undefined);
              onCancel();
            },
          },
        ],
      );
    } else {
      onCancel();
    }
  }, [multiStepForm, onCancel]);

  // Loading state
  if (multiStepForm.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ThemedText>Carregando...</ThemedText>
      </View>
    );
  }

  return (
    <FormProvider {...form}>
      <MultiStepFormContainer
        steps={STEPS}
        currentStep={multiStepForm.currentStep}
        onPrevStep={multiStepForm.goToPrevStep}
        onNextStep={multiStepForm.goToNextStep}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        canProceed={multiStepForm.validation.canProceedToNext}
        canSubmit={multiStepForm.validation.canSubmit}
        submitLabel="Cadastrar"
        cancelLabel="Cancelar"
      >
        {/* Step 1: Order Information */}
        {multiStepForm.currentStep === 1 && (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Supplier Selection */}
              <Controller
                control={form.control}
                name="supplierId"
                render={({ field: { value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
                    <Label>Fornecedor *</Label>
                    <Combobox
                      value={value}
                      onValueChange={(val) => handleFormChange("supplierId", (val || "") as string)}
                      options={supplierOptions}
                      placeholder="Selecione o fornecedor"
                      searchPlaceholder="Buscar fornecedor..."
                      emptyText="Nenhum fornecedor encontrado"
                      disabled={isSubmitting || isLoadingSuppliers}
                      loading={isLoadingSuppliers}
                      clearable={false}
                      searchable
                    />
                    {error && (
                      <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                    )}
                    {multiStepForm.formTouched && multiStepForm.validation.errors.supplierId && (
                      <ThemedText style={styles.errorText}>
                        {multiStepForm.validation.errors.supplierId}
                      </ThemedText>
                    )}
                    <ThemedText style={styles.helpText}>
                      Selecione o fornecedor para este pedido
                    </ThemedText>
                  </View>
                )}
              />

              {/* Delivery Date */}
              <View style={styles.fieldGroup}>
                <Label>Data de Entrega *</Label>
                <DateTimePicker
                  value={forecastDate}
                  onChange={setForecastDate}
                  mode="date"
                  placeholder="Selecione a data"
                  minimumDate={new Date()}
                  disabled={isSubmitting}
                />
                {multiStepForm.formTouched && multiStepForm.validation.errors.forecast && (
                  <ThemedText style={styles.errorText}>
                    {multiStepForm.validation.errors.forecast}
                  </ThemedText>
                )}
                <ThemedText style={styles.helpText}>
                  Data prevista para entrega do pedido
                </ThemedText>
              </View>

              {/* Notes */}
              <Controller
                control={form.control}
                name="notes"
                render={({ field: { value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
                    <Label>Observações</Label>
                    <Textarea
                      value={value || ""}
                      onChangeText={(val) => handleFormChange("notes", val)}
                      placeholder="Observações sobre o pedido (opcional)"
                      editable={!isSubmitting}
                      maxLength={500}
                    />
                    {error && (
                      <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                    )}
                    <ThemedText style={styles.helpText}>
                      Informações adicionais sobre o pedido (opcional)
                    </ThemedText>
                  </View>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Item Selection */}
        {multiStepForm.currentStep === 2 && (
          <View style={styles.itemSelectorContainer}>
            <ItemSelectorTable
              selectedItems={multiStepForm.selectedItems}
              quantities={multiStepForm.quantities}
              onSelectItem={(itemId, _item) => multiStepForm.toggleItemSelection(itemId)}
              onQuantityChange={multiStepForm.setItemQuantity}
              showQuantityInput
              minQuantity={1}
              showSelectedOnly={multiStepForm.showSelectedOnly}
              searchTerm={multiStepForm.searchTerm}
              showInactive={multiStepForm.showInactive}
              categoryIds={multiStepForm.categoryIds}
              brandIds={multiStepForm.brandIds}
              supplierIds={multiStepForm.supplierIds}
              onShowSelectedOnlyChange={multiStepForm.setShowSelectedOnly}
              onSearchTermChange={multiStepForm.setSearchTerm}
              onShowInactiveChange={multiStepForm.setShowInactive}
              onCategoryIdsChange={multiStepForm.setCategoryIds}
              onBrandIdsChange={multiStepForm.setBrandIds}
              onSupplierIdsChange={multiStepForm.setSupplierIds}
              allowZeroStock
              emptyMessage="Nenhum item encontrado"
            />
            {multiStepForm.formTouched && multiStepForm.validation.errors.items && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>
                  {multiStepForm.validation.errors.items}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Step 3: Review */}
        {multiStepForm.currentStep === 3 && (
          <View style={styles.reviewContainer}>
            {/* Summary Card */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Fornecedor</ThemedText>
                    <ThemedText style={styles.summaryValue}>{selectedSupplierName}</ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Data Entrega</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {forecastDate
                        ? forecastDate.toLocaleDateString("pt-BR")
                        : "Não definida"}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Itens</ThemedText>
                    <Badge variant="secondary">
                      <ThemedText>{totals.itemCount} itens</ThemedText>
                    </Badge>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Total Unidades</ThemedText>
                    <ThemedText style={styles.summaryValue}>{totals.totalQuantity}</ThemedText>
                  </View>
                </View>

                <View style={styles.totalSection}>
                  <ThemedText style={styles.summaryLabel}>Valor Total</ThemedText>
                  <ThemedText style={styles.totalValue}>
                    {formatCurrency(totals.subtotal)}
                  </ThemedText>
                </View>

                {multiStepForm.formData.notes && (
                  <View style={styles.summarySection}>
                    <ThemedText style={styles.summaryLabel}>Observações</ThemedText>
                    <ThemedText>{multiStepForm.formData.notes}</ThemedText>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Selected Items */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.itemsList}>
                  {multiStepForm.getSelectedItemsWithData().map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.reviewItem,
                        { borderBottomColor: colors.border },
                        index === multiStepForm.selectionCount - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.reviewItemInfo}>
                        <ThemedText style={styles.reviewItemName} numberOfLines={2}>
                          Item #{index + 1}
                        </ThemedText>
                        <ThemedText style={styles.reviewItemDetails}>
                          {item.quantity}x @ {formatCurrency(item.price || 0)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.reviewItemTotal}>
                        {formatCurrency((item.price || 0) * item.quantity)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </MultiStepFormContainer>
    </FormProvider>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.destructive,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  itemSelectorContainer: {
    flex: 1,
  },
  errorContainer: {
    padding: spacing.md,
  },
  reviewContainer: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    minWidth: 100,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  totalSection: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.success,
  },
  summarySection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemsList: {
    gap: spacing.sm,
  },
  reviewItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  reviewItemName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  reviewItemDetails: {
    fontSize: fontSize.xs,
    color: "#6b7280",
    marginTop: 2,
  },
  reviewItemTotal: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});

export default OrderBatchCreateForm;
