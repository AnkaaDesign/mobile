import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { useUsers, useItems, useMultiStepForm, useKeyboardAwareScroll, useBatchResultDialog } from "@/hooks";
import { ITEM_CATEGORY_TYPE } from "@/constants";
import { FormSteps, FormStep } from "@/components/ui/form-steps";
import { ItemSelectorTable } from "@/components/forms";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { BorrowBatchResultModal, BorrowBatchResult } from "./borrow-batch-result-modal";
import type { BatchOperationResult } from "@/types/common";
import {
  IconPackage,
  IconBox,
  IconUser,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconX,
} from "@tabler/icons-react-native";

// Form schema for batch borrow creation
const borrowBatchFormSchema = z.object({
  userId: z.string().uuid("Usuário é obrigatório"),
});

type BorrowBatchFormData = z.infer<typeof borrowBatchFormSchema>;

interface BorrowBatchCreateFormProps {
  onSubmit: (data: {
    userId: string;
    items: Array<{ itemId: string; quantity: number }>;
  }) => Promise<BatchOperationResult<any, any> | void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// 2 Steps: Select Items (with user) -> Review
const STEPS: FormStep[] = [
  { id: 1, name: "Selecionar", description: "Usuário e ferramentas" },
  { id: 2, name: "Confirmar", description: "Revise e confirme" },
];

export function BorrowBatchCreateForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BorrowBatchCreateFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Batch result dialog state
  const { isOpen: isResultModalOpen, result: batchResult, openDialog: openResultModal, closeDialog: closeResultModal } = useBatchResultDialog<BorrowBatchResult, BorrowBatchResult>();

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

  // Multi-step form state management
  const multiStepForm = useMultiStepForm<BorrowBatchFormData>({
    storageKey: "@borrow_batch_form",
    totalSteps: 2,
    // Expire after 1 hour to prevent stale data
    expireAfterMs: 60 * 60 * 1000,
    defaultFormData: { userId: "" },
    defaultQuantity: 1,
    validateOnStepChange: true,
    validateStep: (step, state) => {
      if (step === 1) {
        return !!state.formData.userId && state.selectedItems.length > 0;
      }
      return true;
    },
    getStepErrors: (step, state) => {
      const errors: Record<string, string> = {};
      if (step === 1) {
        if (!state.formData.userId) errors.userId = "Selecione um usuário";
        if (state.selectedItems.length === 0) errors.items = "Selecione pelo menos uma ferramenta";
      }
      return errors;
    },
  });

  const form = useForm<BorrowBatchFormData>({
    resolver: zodResolver(borrowBatchFormSchema),
    defaultValues: multiStepForm.formData,
    mode: "onChange",
  });

  const handleFormChange = useCallback(
    (field: keyof BorrowBatchFormData, value: string) => {
      form.setValue(field, value);
      multiStepForm.updateFormData({ [field]: value });
    },
    [form, multiStepForm],
  );

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    orderBy: { name: "asc" },
  });

  const userOptions = useMemo(
    () => users?.data?.map((user) => ({ value: user.id, label: user.name })) || [],
    [users],
  );

  // Fetch selected items for review
  const selectedItemIds = useMemo(() => Array.from(multiStepForm.selectedItems), [multiStepForm.selectedItems]);

  const { data: selectedItemsData } = useItems(
    { where: { id: { in: selectedItemIds } }, include: { brand: true, category: true } },
    { enabled: multiStepForm.currentStep === 2 && selectedItemIds.length > 0 },
  );

  const selectedItemsWithNames = useMemo(() => {
    const itemsMap = new Map(selectedItemsData?.data?.map((item) => [item.id, item]) || []);
    return multiStepForm.getSelectedItemsWithData().map((item) => ({
      ...item,
      name: itemsMap.get(item.id)?.name || `Item ${item.id.slice(0, 8)}`,
      brand: itemsMap.get(item.id)?.brand?.name,
      uniCode: itemsMap.get(item.id)?.uniCode,
    }));
  }, [selectedItemsData, multiStepForm]);

  const selectedUserName = useMemo(() => {
    const user = users?.data?.find((u) => u.id === multiStepForm.formData.userId);
    return user?.name || "Não selecionado";
  }, [users, multiStepForm.formData.userId]);

  const totalUnits = useMemo(
    () => multiStepForm.getSelectedItemsWithData().reduce((sum, item) => sum + item.quantity, 0),
    [multiStepForm],
  );

  const handleFormSubmit = useCallback(async () => {
    try {
      const items = multiStepForm.getSelectedItemsWithData();
      const invalidItems = items.filter((item) => item.quantity <= 0);
      if (invalidItems.length > 0) {
        Alert.alert("Erro", "Todos os itens devem ter quantidade maior que zero");
        return;
      }

      const result = await onSubmit({
        userId: multiStepForm.formData.userId,
        items: items.map((item) => ({ itemId: item.id, quantity: item.quantity })),
      });

      // Show result modal if result is returned, reset form after modal is shown
      if (result) {
        await multiStepForm.resetForm();
        openResultModal(result);
      }
    } catch (error) {}
  }, [multiStepForm, onSubmit, openResultModal]);

  const handleCancel = useCallback(() => {
    if (multiStepForm.selectionCount > 0 || multiStepForm.formData.userId) {
      Alert.alert("Descartar alterações?", "Você tem dados não salvos.", [
        { text: "Continuar", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: async () => { await multiStepForm.resetForm(); onCancel(); }},
      ]);
    } else {
      onCancel();
    }
  }, [multiStepForm, onCancel]);

  const isFirstStep = multiStepForm.currentStep === 1;
  const isLastStep = multiStepForm.currentStep === STEPS.length;

  if (multiStepForm.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ThemedText>Carregando...</ThemedText>
      </View>
    );
  }

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

          {/* Step 1: User + Item Selection */}
          {multiStepForm.currentStep === 1 && (
            <View style={styles.step1Container}>
              {/* User Selection */}
              <KeyboardAwareFormProvider value={keyboardContextValue}>
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { value }, fieldState: { error } }) => (
                    <View style={styles.userSelector}>
                      <Combobox
                        value={value}
                        onValueChange={(val) => handleFormChange("userId", typeof val === "string" ? val || "" : "")}
                        options={userOptions}
                        placeholder="Selecione o colaborador"
                        searchPlaceholder="Buscar colaborador..."
                        emptyText="Nenhum colaborador encontrado"
                        disabled={isSubmitting || isLoadingUsers}
                        loading={isLoadingUsers}
                        clearable={false}
                        searchable
                      />
                      {error && (
                        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                          {error.message}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />
              </KeyboardAwareFormProvider>

              {/* Item Selector - Filter only TOOL category */}
              <ItemSelectorTable
                style={styles.itemSelector}
                selectedItems={multiStepForm.selectedItems}
                quantities={multiStepForm.quantities}
                onSelectItem={(itemId) => multiStepForm.toggleItemSelection(itemId)}
                onQuantityChange={multiStepForm.setItemQuantity}
                showQuantityInput
                minQuantity={1}
                categoryType={ITEM_CATEGORY_TYPE.TOOL}
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
                allowZeroStock={false}
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

          {/* Step 2: Review */}
          {multiStepForm.currentStep === 2 && (
            <ScrollView
              ref={refs.scrollViewRef}
              style={styles.reviewScrollView}
              contentContainerStyle={styles.reviewContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Summary Metrics */}
              <Card style={styles.card}>
                <CardContent style={styles.metricsContent}>
                  {/* User */}
                  <View style={styles.metricRow}>
                    <View style={styles.metricHeader}>
                      <IconUser size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>USUÁRIO</ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                      {selectedUserName}
                    </ThemedText>
                  </View>

                  {/* Items */}
                  <View style={styles.metricRow}>
                    <View style={styles.metricHeader}>
                      <IconPackage size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>ITENS</ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: colors.foreground }]}>
                      {multiStepForm.selectionCount}
                    </ThemedText>
                  </View>

                  {/* Units */}
                  <View style={styles.metricRow}>
                    <View style={styles.metricHeader}>
                      <IconBox size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>UNIDADES</ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: colors.primary }]}>
                      {totalUnits}
                    </ThemedText>
                  </View>
                </CardContent>
              </Card>

              {/* Items Table - Matching item-table styling */}
              <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          )}

          {/* Action Bar - Same pattern as FormActionBar */}
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
        <BorrowBatchResultModal
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
  step1Container: {
    flex: 1,
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
  },
  userSelector: {
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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
  reviewScrollView: {
    flex: 1,
  },
  reviewContainer: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  card: {
    marginBottom: spacing.md,
  },
  metricsContent: {
    paddingVertical: spacing.xs,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  // Table - matching item-table styling
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
  // Action bar - matches FormActionBar exactly
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

export default BorrowBatchCreateForm;
