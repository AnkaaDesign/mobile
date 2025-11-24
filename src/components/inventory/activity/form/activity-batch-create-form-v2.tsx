import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useUsers, useOrders, useOrderItems, useItems } from "@/hooks";
import { useMultiStepForm, FormStep } from "@/hooks";
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from "@/constants";
import { ACTIVITY_REASON_LABELS } from "@/constants/enum-labels";
import {
  MultiStepFormContainer,
  ItemSelectorTableV2,
} from "@/components/forms";

// Form schema for batch activity creation
const activityBatchFormSchema = z.object({
  operation: z.enum([ACTIVITY_OPERATION.INBOUND, ACTIVITY_OPERATION.OUTBOUND], {
    errorMap: () => ({ message: "Selecione uma operação válida" }),
  }),
  userId: z.string().uuid("Selecione um usuário válido").nullable().optional(),
  reason: z.enum([
    ACTIVITY_REASON.ORDER_RECEIVED,
    ACTIVITY_REASON.PRODUCTION_USAGE,
    ACTIVITY_REASON.PPE_DELIVERY,
    ACTIVITY_REASON.BORROW,
    ACTIVITY_REASON.RETURN,
    ACTIVITY_REASON.EXTERNAL_WITHDRAWAL,
    ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN,
    ACTIVITY_REASON.INVENTORY_COUNT,
    ACTIVITY_REASON.MANUAL_ADJUSTMENT,
    ACTIVITY_REASON.MAINTENANCE,
    ACTIVITY_REASON.DAMAGE,
    ACTIVITY_REASON.LOSS,
    ACTIVITY_REASON.PAINT_PRODUCTION,
    ACTIVITY_REASON.OTHER,
  ] as const, {
    errorMap: () => ({ message: "Selecione um motivo válido" }),
  }).nullable().optional(),
  orderId: z.string().uuid("Selecione um pedido válido").nullable().optional(),
  orderItemId: z.string().uuid("Selecione um item do pedido válido").nullable().optional(),
});

type ActivityBatchFormData = z.infer<typeof activityBatchFormSchema>;

interface ActivityBatchCreateFormV2Props {
  onSubmit: (data: {
    operation: typeof ACTIVITY_OPERATION.INBOUND | typeof ACTIVITY_OPERATION.OUTBOUND;
    userId?: string | null;
    reason?: string | null;
    orderId?: string | null;
    orderItemId?: string | null;
    items: Array<{ itemId: string; quantity: number }>;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Steps configuration
const STEPS: FormStep[] = [
  { id: 1, name: "Operação", description: "Tipo e motivo" },
  { id: 2, name: "Itens", description: "Selecione os itens" },
  { id: 3, name: "Revisão", description: "Confirme os dados" },
];

const OPERATION_OPTIONS = [
  { value: ACTIVITY_OPERATION.INBOUND, label: "Entrada", description: "Adicionar itens ao estoque" },
  { value: ACTIVITY_OPERATION.OUTBOUND, label: "Saída", description: "Remover itens do estoque" },
];

// Map all 14 ACTIVITY_REASON options with descriptions
const REASON_OPTIONS = [
  { value: ACTIVITY_REASON.ORDER_RECEIVED, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.ORDER_RECEIVED], description: "Recebimento de pedido de compra" },
  { value: ACTIVITY_REASON.PRODUCTION_USAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PRODUCTION_USAGE], description: "Consumo para produção" },
  { value: ACTIVITY_REASON.PPE_DELIVERY, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PPE_DELIVERY], description: "Entrega de equipamento de proteção" },
  { value: ACTIVITY_REASON.BORROW, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.BORROW], description: "Empréstimo de item" },
  { value: ACTIVITY_REASON.RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.RETURN], description: "Devolução de item emprestado" },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL], description: "Retirada para uso externo" },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN], description: "Retorno de retirada externa" },
  { value: ACTIVITY_REASON.INVENTORY_COUNT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.INVENTORY_COUNT], description: "Ajuste por contagem física" },
  { value: ACTIVITY_REASON.MANUAL_ADJUSTMENT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MANUAL_ADJUSTMENT], description: "Ajuste manual de estoque" },
  { value: ACTIVITY_REASON.MAINTENANCE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MAINTENANCE], description: "Uso em manutenção" },
  { value: ACTIVITY_REASON.DAMAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.DAMAGE], description: "Item danificado" },
  { value: ACTIVITY_REASON.LOSS, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.LOSS], description: "Item perdido" },
  { value: ACTIVITY_REASON.PAINT_PRODUCTION, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PAINT_PRODUCTION], description: "Produção de tinta" },
  { value: ACTIVITY_REASON.OTHER, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.OTHER], description: "Outro motivo" },
];


export function ActivityBatchCreateFormV2({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ActivityBatchCreateFormV2Props) {
  const { colors } = useTheme();

  // Multi-step form state management
  const multiStepForm = useMultiStepForm<ActivityBatchFormData>({
    storageKey: "@activity_batch_form",
    totalSteps: 3,
    defaultFormData: {
      operation: ACTIVITY_OPERATION.OUTBOUND,
      userId: null,
      reason: ACTIVITY_REASON.OTHER,
      orderId: null,
      orderItemId: null,
    },
    defaultQuantity: 1,
    validateOnStepChange: true,
    validateStep: (step, state) => {
      if (step === 1) {
        // Operation is required (always has a default)
        const hasOperation = !!state.formData.operation;
        // Check if ORDER_RECEIVED reason requires orderId
        if (state.formData.reason === ACTIVITY_REASON.ORDER_RECEIVED) {
          return hasOperation && !!state.formData.orderId;
        }
        return hasOperation;
      }
      if (step === 2) {
        // At least one item selected
        return state.selectedItems.length > 0;
      }
      return true;
    },
    getStepErrors: (step, state) => {
      const errors: Record<string, string> = {};
      if (step === 1) {
        if (!state.formData.operation) {
          errors.operation = "Selecione uma operação";
        }
        if (state.formData.reason === ACTIVITY_REASON.ORDER_RECEIVED && !state.formData.orderId) {
          errors.orderId = "Selecione um pedido";
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
  const form = useForm<ActivityBatchFormData>({
    resolver: zodResolver(activityBatchFormSchema),
    defaultValues: multiStepForm.formData,
    mode: "onChange",
  });

  // Sync form data to multi-step state
  const handleFormChange = useCallback(
    (field: keyof ActivityBatchFormData, value: string | null) => {
      form.setValue(field, value as never);
      multiStepForm.updateFormData({ [field]: value });
    },
    [form, multiStepForm],
  );

  // Fetch users for selection
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    orderBy: { name: "asc" },
    limit: 100,
  });

  // Fetch orders for selection (when reason is ORDER_RECEIVED)
  const { data: orders, isLoading: isLoadingOrders } = useOrders({
    orderBy: { createdAt: "desc" },
    include: { supplier: true },
    limit: 100,
  }, {
    enabled: multiStepForm.formData.reason === ACTIVITY_REASON.ORDER_RECEIVED,
  });

  // Fetch order items when an order is selected
  const { data: orderItems, isLoading: isLoadingOrderItems } = useOrderItems({
    where: { orderId: multiStepForm.formData.orderId || undefined },
    include: { item: true },
  }, {
    enabled: !!multiStepForm.formData.orderId && multiStepForm.formData.reason === ACTIVITY_REASON.ORDER_RECEIVED,
  });

  const userOptions = useMemo(
    () =>
      users?.data?.map((user) => ({
        value: user.id,
        label: user.name,
      })) || [],
    [users],
  );

  const orderOptions = useMemo(
    () =>
      orders?.data?.map((order) => ({
        value: order.id,
        label: `Pedido #${order.id.slice(0, 8)} - ${order.supplier?.fantasyName || "Sem fornecedor"}`,
      })) || [],
    [orders],
  );

  const orderItemOptions = useMemo(
    () =>
      orderItems?.data?.map((orderItem) => ({
        value: orderItem.id,
        label: `${orderItem.item?.name || "Item"} - Qtd: ${orderItem.orderedQuantity}`,
      })) || [],
    [orderItems],
  );

  // Determine if order field should be shown
  const shouldShowOrderField = multiStepForm.formData.reason === ACTIVITY_REASON.ORDER_RECEIVED;

  // Fetch selected items for review step (only when on step 3)
  const selectedItemIds = useMemo(
    () => Array.from(multiStepForm.selectedItems),
    [multiStepForm.selectedItems],
  );

  const { data: selectedItemsData } = useItems(
    {
      where: { id: { in: selectedItemIds } },
      include: { brand: true, category: true },
    },
    { enabled: multiStepForm.currentStep === 3 && selectedItemIds.length > 0 },
  );

  // Map items with their names for review
  const selectedItemsWithNames = useMemo(() => {
    const itemsMap = new Map(
      selectedItemsData?.data?.map((item) => [item.id, item]) || [],
    );
    return multiStepForm.getSelectedItemsWithData().map((item) => ({
      ...item,
      name: itemsMap.get(item.id)?.name || `Item ${item.id.slice(0, 8)}`,
      brand: itemsMap.get(item.id)?.brand?.name,
      uniCode: itemsMap.get(item.id)?.uniCode,
    }));
  }, [selectedItemsData, multiStepForm]);

  // Get selected user name for review
  const selectedUserName = useMemo(() => {
    const user = users?.data?.find((u) => u.id === multiStepForm.formData.userId);
    return user?.name || null;
  }, [users, multiStepForm.formData.userId]);

  // Get selected order info for review
  const selectedOrderInfo = useMemo(() => {
    const order = orders?.data?.find((o) => o.id === multiStepForm.formData.orderId);
    if (!order) return null;
    return `Pedido #${order.id.slice(0, 8)} - ${order.supplier?.fantasyName || "Sem fornecedor"}`;
  }, [orders, multiStepForm.formData.orderId]);

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    try {
      // Validate all items have valid quantities
      const items = multiStepForm.getSelectedItemsWithData();
      const invalidItems = items.filter((item) => item.quantity <= 0);

      if (invalidItems.length > 0) {
        Alert.alert("Erro", "Todos os itens devem ter quantidade maior que zero");
        return;
      }

      const formData = {
        operation: multiStepForm.formData.operation,
        userId: multiStepForm.formData.userId || undefined,
        reason: multiStepForm.formData.reason || undefined,
        orderId: multiStepForm.formData.orderId || undefined,
        orderItemId: multiStepForm.formData.orderItemId || undefined,
        items: items.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
        })),
      };

      await onSubmit(formData);

      // Clear form state on success
      await multiStepForm.resetForm();
    } catch (error) {
      // Error handled by parent component
    }
  }, [multiStepForm, onSubmit]);

  // Handle cancel with confirmation if form has data
  const handleCancel = useCallback(() => {
    if (multiStepForm.selectionCount > 0 || multiStepForm.formData.reason) {
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

  const isInbound = multiStepForm.formData.operation === ACTIVITY_OPERATION.INBOUND;

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
        submitLabel="Criar Movimentações"
        cancelLabel="Cancelar"
        scrollable={multiStepForm.currentStep !== 2}
      >
        {/* Step 1: Operation Configuration */}
        {multiStepForm.currentStep === 1 && (
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Configuração da Movimentação</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Operation Selector */}
              <Controller
                control={form.control}
                name="operation"
                render={({ field: { value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
                    <Label>Operação *</Label>
                    <Combobox
                      value={value}
                      onValueChange={(val) => handleFormChange("operation", val || ACTIVITY_OPERATION.INBOUND)}
                      options={OPERATION_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                      placeholder="Selecione a operação"
                      searchable={false}
                      clearable={false}
                      disabled={isSubmitting}
                    />
                    {error && (
                      <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                    )}
                  </View>
                )}
              />

              {/* Reason Selector */}
              <Controller
                control={form.control}
                name="reason"
                render={({ field: { value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
                    <Label>Motivo (Opcional)</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => handleFormChange("reason", val || null)}
                      options={REASON_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                      placeholder="Selecione um motivo"
                      searchPlaceholder="Buscar motivo..."
                      emptyText="Nenhum motivo encontrado"
                      disabled={isSubmitting}
                      searchable
                    />
                    {error && (
                      <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                    )}
                  </View>
                )}
              />

              {/* Conditional Order Selector */}
              {shouldShowOrderField && (
                <Controller
                  control={form.control}
                  name="orderId"
                  render={({ field: { value }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <View style={styles.labelRow}>
                        <Label>Pedido *</Label>
                        <Badge variant="default">Obrigatório</Badge>
                      </View>
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => handleFormChange("orderId", val || null)}
                        options={orderOptions}
                        placeholder="Selecione um pedido"
                        searchPlaceholder="Buscar pedido..."
                        emptyText="Nenhum pedido encontrado"
                        disabled={isSubmitting || isLoadingOrders}
                        loading={isLoadingOrders}
                        searchable
                      />
                      {error && (
                        <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                      )}
                      {multiStepForm.formTouched && multiStepForm.validation.errors.orderId && (
                        <ThemedText style={styles.errorText}>
                          {multiStepForm.validation.errors.orderId}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              )}

              {/* Conditional OrderItem Selector */}
              {shouldShowOrderField && multiStepForm.formData.orderId && (
                <Controller
                  control={form.control}
                  name="orderItemId"
                  render={({ field: { value }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <Label>Item do Pedido (Opcional)</Label>
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => handleFormChange("orderItemId", val || null)}
                        options={orderItemOptions}
                        placeholder="Selecione um item do pedido"
                        emptyText="Nenhum item encontrado no pedido"
                        disabled={isSubmitting || isLoadingOrderItems}
                        loading={isLoadingOrderItems}
                      />
                      {error && (
                        <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                      )}
                    </View>
                  )}
                />
              )}

              {/* User Selector */}
              <Controller
                control={form.control}
                name="userId"
                render={({ field: { value }, fieldState: { error } }) => (
                  <View style={styles.fieldGroup}>
                    <Label>Usuário (Opcional)</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => handleFormChange("userId", val || null)}
                      options={userOptions}
                      placeholder="Selecione um usuário"
                      searchPlaceholder="Buscar usuário..."
                      emptyText="Nenhum usuário encontrado"
                      disabled={isSubmitting || isLoadingUsers}
                      loading={isLoadingUsers}
                      searchable
                    />
                    {error && (
                      <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                    )}
                  </View>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Item Selection */}
        {multiStepForm.currentStep === 2 && (
          <View style={styles.itemSelectorContainer}>
            <ItemSelectorTableV2
              selectedItems={multiStepForm.selectedItems}
              quantities={multiStepForm.quantities}
              onSelectItem={multiStepForm.toggleItemSelection}
              onQuantityChange={multiStepForm.setItemQuantity}
              showQuantityInput
              minQuantity={1}
              quantityDecimals={0}
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
              allowZeroStock={isInbound}
              emptyMessage="Nenhum item encontrado"
            />
          </View>
        )}

        {/* Step 3: Review */}
        {multiStepForm.currentStep === 3 && (
          <View style={styles.reviewContainer}>
            {/* Summary Card */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Resumo da Movimentação</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Operação</ThemedText>
                    <Badge variant={isInbound ? "success" : "destructive"}>
                      <ThemedText>{isInbound ? "ENTRADA" : "SAÍDA"}</ThemedText>
                    </Badge>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Itens</ThemedText>
                    <Badge variant="secondary">
                      <ThemedText>{multiStepForm.selectionCount} itens</ThemedText>
                    </Badge>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Total Unidades</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {multiStepForm.getSelectedItemsWithData().reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}
                    </ThemedText>
                  </View>
                </View>

                {multiStepForm.formData.reason && (
                  <View style={styles.summarySection}>
                    <ThemedText style={styles.summaryLabel}>Motivo</ThemedText>
                    <ThemedText>
                      {REASON_OPTIONS.find((r) => r.value === multiStepForm.formData.reason)?.label ||
                        multiStepForm.formData.reason}
                    </ThemedText>
                  </View>
                )}

                {selectedUserName && (
                  <View style={styles.summarySection}>
                    <ThemedText style={styles.summaryLabel}>Usuário</ThemedText>
                    <ThemedText>{selectedUserName}</ThemedText>
                  </View>
                )}

                {selectedOrderInfo && (
                  <View style={styles.summarySection}>
                    <ThemedText style={styles.summaryLabel}>Pedido</ThemedText>
                    <ThemedText>{selectedOrderInfo}</ThemedText>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Selected Items */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Itens Selecionados</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.itemsList}>
                  {selectedItemsWithNames.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.reviewItem,
                        { borderBottomColor: colors.border },
                        index === selectedItemsWithNames.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.reviewItemInfo}>
                        <ThemedText style={styles.reviewItemName} numberOfLines={2}>
                          {item.uniCode ? `${item.uniCode} - ` : ""}{item.name}
                        </ThemedText>
                        {item.brand && (
                          <ThemedText style={styles.reviewItemBrand}>{item.brand}</ThemedText>
                        )}
                      </View>
                      <Badge variant="outline">
                        <ThemedText>Qtd: {item.quantity}</ThemedText>
                      </Badge>
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

const styles = StyleSheet.create({
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: "#6b7280",
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
    color: "#6b7280",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  summarySection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
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
  reviewItemBrand: {
    fontSize: fontSize.xs,
    color: "#6b7280",
    marginTop: 2,
  },
});

export default ActivityBatchCreateFormV2;
