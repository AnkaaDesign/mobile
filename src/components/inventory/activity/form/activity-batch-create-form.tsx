import { useCallback, useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { FormCard } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { useUsers, useOrders, useOrderItems, useItems, useMultiStepForm, useKeyboardAwareScroll, useBatchResultDialog } from "@/hooks";
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from "@/constants";
import { ACTIVITY_REASON_LABELS } from "@/constants/enum-labels";
import { FormSteps, FormStep } from "@/components/ui/form-steps";
import { ItemSelectorTable } from "@/components/forms";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { ActivityBatchResultModal, ActivityBatchResult } from "./activity-batch-result-modal";
import type { BatchOperationResult } from "@/types/common";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconX,
} from "@tabler/icons-react-native";

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

interface ActivityBatchCreateFormProps {
  onSubmit: (data: {
    operation: typeof ACTIVITY_OPERATION.INBOUND | typeof ACTIVITY_OPERATION.OUTBOUND;
    userId?: string | null;
    reason?: string | null;
    orderId?: string | null;
    orderItemId?: string | null;
    items: Array<{ itemId: string; quantity: number }>;
  }) => Promise<BatchOperationResult<ActivityBatchResult, ActivityBatchResult> | void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// 2 Steps: Select Items -> Configure + Review
const STEPS: FormStep[] = [
  { id: 1, name: "Selecionar", description: "Escolha os itens" },
  { id: 2, name: "Confirmar", description: "Configure e revise" },
];

const OPERATION_OPTIONS = [
  { value: ACTIVITY_OPERATION.INBOUND, label: "Entrada" },
  { value: ACTIVITY_OPERATION.OUTBOUND, label: "Saída" },
];

// Map all 14 ACTIVITY_REASON options
const REASON_OPTIONS = [
  { value: ACTIVITY_REASON.ORDER_RECEIVED, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.ORDER_RECEIVED] },
  { value: ACTIVITY_REASON.PRODUCTION_USAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PRODUCTION_USAGE] },
  { value: ACTIVITY_REASON.PPE_DELIVERY, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PPE_DELIVERY] },
  { value: ACTIVITY_REASON.BORROW, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.BORROW] },
  { value: ACTIVITY_REASON.RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.RETURN] },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL] },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN] },
  { value: ACTIVITY_REASON.INVENTORY_COUNT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.INVENTORY_COUNT] },
  { value: ACTIVITY_REASON.MANUAL_ADJUSTMENT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MANUAL_ADJUSTMENT] },
  { value: ACTIVITY_REASON.MAINTENANCE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MAINTENANCE] },
  { value: ACTIVITY_REASON.DAMAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.DAMAGE] },
  { value: ACTIVITY_REASON.LOSS, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.LOSS] },
  { value: ACTIVITY_REASON.PAINT_PRODUCTION, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PAINT_PRODUCTION] },
  { value: ACTIVITY_REASON.OTHER, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.OTHER] },
];


export function ActivityBatchCreateForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ActivityBatchCreateFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Batch result dialog state
  const { isOpen: isResultModalOpen, result: batchResult, openDialog: openResultModal, closeDialog: closeResultModal } = useBatchResultDialog<ActivityBatchResult, ActivityBatchResult>();

  // Keyboard visibility tracking
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  // Multi-step form state management - 2 steps
  const multiStepForm = useMultiStepForm<ActivityBatchFormData>({
    storageKey: "@activity_batch_form",
    totalSteps: 2,
    // Expire after 1 hour to prevent stale data
    expireAfterMs: 60 * 60 * 1000,
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
        // At least one item selected
        return state.selectedItems.length > 0;
      }
      if (step === 2) {
        // Operation is required (always has a default)
        const hasOperation = !!state.formData.operation;
        // Check if ORDER_RECEIVED reason requires orderId
        if (state.formData.reason === ACTIVITY_REASON.ORDER_RECEIVED) {
          return hasOperation && !!state.formData.orderId;
        }
        return hasOperation;
      }
      return true;
    },
    getStepErrors: (step, state) => {
      const errors: Record<string, string> = {};
      if (step === 1) {
        if (state.selectedItems.length === 0) {
          errors.items = "Selecione pelo menos um item";
        }
      }
      if (step === 2) {
        if (!state.formData.operation) {
          errors.operation = "Selecione uma operação";
        }
        if (state.formData.reason === ACTIVITY_REASON.ORDER_RECEIVED && !state.formData.orderId) {
          errors.orderId = "Selecione um pedido";
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

  // Fetch selected items for review (step 2)
  const selectedItemIds = useMemo(
    () => Array.from(multiStepForm.selectedItems),
    [multiStepForm.selectedItems],
  );

  const { data: selectedItemsData } = useItems(
    {
      where: { id: { in: selectedItemIds } },
      include: { brand: true, category: true },
    },
    { enabled: multiStepForm.currentStep === 2 && selectedItemIds.length > 0 },
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
    return user?.name || "Não selecionado";
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

      const result = await onSubmit(formData);

      // Show result modal if result is returned, reset form after modal is shown
      if (result) {
        await multiStepForm.resetForm();
        openResultModal(result);
      }
    } catch (error) {
      // Error handled by parent component
    }
  }, [multiStepForm, onSubmit, openResultModal]);

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
  const isFirstStep = multiStepForm.currentStep === 1;
  const isLastStep = multiStepForm.currentStep === STEPS.length;

  // Calculate total units for review
  const totalUnits = multiStepForm.getSelectedItemsWithData().reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <FormProvider {...form}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            <FormSteps steps={STEPS} currentStep={multiStepForm.currentStep} />
          </View>

          {/* Step 1: Item Selection */}
          {multiStepForm.currentStep === 1 && (
            <View style={styles.step1Container}>
              <ItemSelectorTable
                style={styles.itemSelector}
                selectedItems={multiStepForm.selectedItems}
                quantities={multiStepForm.quantities}
                onSelectItem={(itemId) => multiStepForm.toggleItemSelection(itemId)}
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
                allowZeroStock={true}
                emptyText="Nenhum item encontrado"
              />
              {/* Validation Errors */}
              {multiStepForm.formTouched && Object.keys(multiStepForm.validation.errors).length > 0 && (
                <View style={styles.validationErrorContainer}>
                  {Object.values(multiStepForm.validation.errors).map((error, index) => (
                    <ThemedText key={index} style={[styles.validationErrorText, { color: colors.destructive }]}>
                      {error}
                    </ThemedText>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Step 2: Configuration + Review */}
          {multiStepForm.currentStep === 2 && (
            <KeyboardAwareFormProvider value={keyboardContextValue}>
              <ScrollView
                ref={refs.scrollViewRef}
                style={styles.reviewScrollView}
                contentContainerStyle={styles.reviewContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onLayout={handlers.handleScrollViewLayout}
                onScroll={handlers.handleScroll}
                scrollEventThrottle={16}
              >
                {/* Configuration Card */}
                <FormCard title="Configuração" icon="IconClipboardList">
                  {/* Operation Selector */}
                  <Controller
                    control={form.control}
                    name="operation"
                    render={({ field: { value }, fieldState: { error } }) => (
                      <View style={styles.fieldGroup}>
                        <Label style={styles.fieldLabel}>
                          Operação <ThemedText variant="destructive">*</ThemedText>
                        </Label>
                        <Combobox
                          value={value}
                          onValueChange={(val) => handleFormChange("operation", val || ACTIVITY_OPERATION.INBOUND)}
                          options={OPERATION_OPTIONS}
                          placeholder="Selecione a operação"
                          searchable={false}
                          clearable={false}
                          disabled={isSubmitting}
                        />
                        {error && (
                          <ThemedText variant="destructive" style={styles.errorText}>{error.message}</ThemedText>
                        )}
                      </View>
                    )}
                  />

                  {/* User Selector */}
                  <Controller
                    control={form.control}
                    name="userId"
                    render={({ field: { value }, fieldState: { error } }) => (
                      <View style={styles.fieldGroup}>
                        <Label style={styles.fieldLabel}>
                          Usuário Responsável <ThemedText style={[styles.optionalLabel, { color: colors.mutedForeground }]}>(opcional)</ThemedText>
                        </Label>
                        <Combobox
                          value={value || ""}
                          onValueChange={(val) => handleFormChange("userId", val || null)}
                          options={userOptions}
                          placeholder="Selecione um usuário (opcional)"
                          searchPlaceholder="Buscar usuário..."
                          emptyText="Nenhum usuário encontrado"
                          disabled={isSubmitting || isLoadingUsers}
                          loading={isLoadingUsers}
                          searchable
                        />
                        {error && (
                          <ThemedText variant="destructive" style={styles.errorText}>{error.message}</ThemedText>
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
                        <Label style={styles.fieldLabel}>
                          Motivo <ThemedText style={[styles.optionalLabel, { color: colors.mutedForeground }]}>(opcional)</ThemedText>
                        </Label>
                        <Combobox
                          value={value || ""}
                          onValueChange={(val) => handleFormChange("reason", val || null)}
                          options={REASON_OPTIONS}
                          placeholder="Selecione um motivo"
                          searchPlaceholder="Buscar motivo..."
                          emptyText="Nenhum motivo encontrado"
                          disabled={isSubmitting}
                          searchable
                        />
                        {error && (
                          <ThemedText variant="destructive" style={styles.errorText}>{error.message}</ThemedText>
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
                          <Label style={styles.fieldLabel}>
                            Pedido <ThemedText variant="destructive">*</ThemedText>
                          </Label>
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
                            <ThemedText variant="destructive" style={styles.errorText}>{error.message}</ThemedText>
                          )}
                          {multiStepForm.formTouched && multiStepForm.validation.errors.orderId && (
                            <ThemedText variant="destructive" style={styles.errorText}>
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
                          <Label style={styles.fieldLabel}>Item do Pedido</Label>
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
                            <ThemedText variant="destructive" style={styles.errorText}>{error.message}</ThemedText>
                          )}
                        </View>
                      )}
                    />
                  )}
                </FormCard>

                {/* Items Table - Matching borrow form styling */}
                <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border, marginTop: spacing.md }]}>
                  {/* Table Header */}
                  <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText style={[styles.tableHeaderText, styles.tableHeaderItemCol]}>ITEM</ThemedText>
                    <ThemedText style={[styles.tableHeaderText, styles.tableHeaderQtyCol]}>QTD</ThemedText>
                  </View>

                  {/* Table Body */}
                  {selectedItemsWithNames.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: index % 2 === 0 ? colors.background : colors.card,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.tableItemCol}>
                        <ThemedText style={[styles.tableItemName, { color: colors.foreground }]} numberOfLines={1}>
                          {item.uniCode ? `${item.name} - ${item.uniCode}` : item.name}
                        </ThemedText>
                        {item.brand && (
                          <ThemedText style={[styles.tableItemBrand, { color: colors.mutedForeground }]}>
                            {item.brand}
                          </ThemedText>
                        )}
                      </View>
                      <View style={styles.tableQtyCol}>
                        <ThemedText style={[styles.tableQtyText, { color: colors.foreground }]}>
                          {item.quantity}
                        </ThemedText>
                      </View>
                    </View>
                  ))}

                  {/* Table Footer */}
                  <View style={[styles.tableFooter, { backgroundColor: colors.muted, borderTopColor: colors.border }]}>
                    <ThemedText style={[styles.tableFooterText, { color: colors.foreground }]}>Total</ThemedText>
                    <ThemedText style={[styles.tableFooterValue, { color: colors.primary }]}>{totalUnits}</ThemedText>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAwareFormProvider>
          )}

          {/* Action Bar - Same pattern as borrow form */}
          {!isKeyboardVisible && (
            <View
              style={[
                styles.actionBar,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  marginBottom: (insets.bottom || 0) + formSpacing.cardMarginBottom,
                },
              ]}
            >
              {/* Left button - Cancel or Previous */}
              <View style={styles.buttonWrapper}>
                {isFirstStep ? (
                  <Button
                    variant="outline"
                    onPress={handleCancel}
                    disabled={isSubmitting}
                  >
                    <IconX size={18} color={colors.mutedForeground} />
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onPress={multiStepForm.goToPrevStep}
                    disabled={isSubmitting}
                  >
                    <IconArrowLeft size={18} color={colors.foreground} />
                    <Text style={styles.buttonText}>Anterior</Text>
                  </Button>
                )}
              </View>

              {/* Right button - Next or Submit */}
              <View style={styles.buttonWrapper}>
                {isLastStep ? (
                  <Button
                    variant="default"
                    onPress={handleFormSubmit}
                    disabled={!multiStepForm.validation.canSubmit || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.primaryForeground} />
                    ) : (
                      <IconCheck size={18} color={colors.primaryForeground} />
                    )}
                    <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                      {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                    </Text>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onPress={multiStepForm.goToNextStep}
                    disabled={!multiStepForm.validation.canProceedToNext || isSubmitting}
                  >
                    <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Próximo</Text>
                    <IconArrowRight size={18} color={colors.primaryForeground} />
                  </Button>
                )}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>

        {/* Batch Result Modal */}
        <ActivityBatchResultModal
          open={isResultModalOpen}
          onOpenChange={(open) => !open && closeResultModal()}
          result={batchResult}
          operationType="create"
          onConfirm={onCancel}
        />
      </SafeAreaView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  // Step 1 - Item Selection
  step1Container: {
    flex: 1,
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
  },
  itemSelector: {
    flex: 1,
  },
  validationErrorContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  validationErrorText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  // Step 2 - Configuration + Review
  reviewScrollView: {
    flex: 1,
  },
  reviewContainer: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  // Field styling - matching item form
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  optionalLabel: {
    fontSize: fontSize.xs,
    fontWeight: "400",
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  // Table - matching borrow form styling exactly
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    borderBottomWidth: 2,
    paddingHorizontal: spacing.sm,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableHeaderItemCol: {
    flex: 1,
  },
  tableHeaderQtyCol: {
    width: 50,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  tableItemCol: {
    flex: 1,
    justifyContent: "center",
  },
  tableItemName: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  tableItemBrand: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  tableQtyCol: {
    width: 50,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  tableQtyText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  tableFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
  },
  tableFooterText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  tableFooterValue: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  // Action bar - matches borrow form exactly
  actionBar: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    marginHorizontal: formSpacing.containerPaddingHorizontal,
    marginTop: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ActivityBatchCreateForm;
