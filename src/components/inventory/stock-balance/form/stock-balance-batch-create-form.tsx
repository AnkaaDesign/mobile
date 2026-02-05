import { useCallback, useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import { useItems, useMultiStepForm, useBatchResultDialog, useActivityBatchMutations } from "@/hooks";
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from "@/constants";
import { FormSteps, FormStep } from "@/components/ui/form-steps";
import { ItemSelectorTable } from "@/components/forms";
import { TABLET_WIDTH_THRESHOLD } from "@/lib/table-utils";
import { StockBalanceBatchResultModal, StockBalanceBatchResult } from "./stock-balance-batch-result-modal";
import type { BatchOperationResult } from "@/types/common";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
} from "@tabler/icons-react-native";

// Track original quantities separately (current stock at time of selection)
type OriginalQuantitiesMap = Map<string, number>;

interface StockBalanceBatchCreateFormProps {
  onCancel: () => void;
}

// 2 Steps: Select Items -> Review + Confirm
const STEPS: FormStep[] = [
  { id: 1, name: "Selecionar", description: "Escolha os itens" },
  { id: 2, name: "Conferir", description: "Revise as quantidades" },
];

interface StockBalanceFormData {
  // No additional form data needed - quantities are tracked separately
}

interface ItemWithDifference {
  id: string;
  name: string;
  brand?: string;
  uniCode?: string;
  currentStock: number;
  countedQuantity: number;
  difference: number;
}

export function StockBalanceBatchCreateForm({
  onCancel,
}: StockBalanceBatchCreateFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const isTablet = screenWidth >= TABLET_WIDTH_THRESHOLD;

  // Track original quantities separately (current stock at time of selection)
  const [originalQuantities, setOriginalQuantities] = useState<OriginalQuantitiesMap>(new Map());

  // Batch result dialog state
  const { isOpen: isResultModalOpen, result: batchResult, openDialog: openResultModal, closeDialog: closeResultModal } = useBatchResultDialog<StockBalanceBatchResult, StockBalanceBatchResult>();

  // Mutations
  const { batchCreateAsync, isBatchCreating: isSubmitting } = useActivityBatchMutations();

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

  // Multi-step form state management - 2 steps
  // Uses quantities for counted stock and originalQuantities for current stock
  const multiStepForm = useMultiStepForm<StockBalanceFormData>({
    storageKey: "@stock_balance_batch_form",
    totalSteps: 2,
    expireAfterMs: 60 * 60 * 1000, // 1 hour
    defaultFormData: {},
    defaultQuantity: 0, // Will be set to current stock when selecting
    validateOnStepChange: true,
    validateStep: (step, state) => {
      if (step === 1) {
        return state.selectedItems.length > 0;
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
      return errors;
    },
  });

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

  // Calculate items with differences for review
  const itemsWithDifferences = useMemo<ItemWithDifference[]>(() => {
    const itemsMap = new Map(
      selectedItemsData?.data?.map((item) => [item.id, item]) || [],
    );

    return multiStepForm.getSelectedItemsWithData().map((item) => {
      const itemData = itemsMap.get(item.id);
      const currentStock = originalQuantities.get(item.id) ?? itemData?.quantity ?? 0;
      const countedQuantity = item.quantity;

      return {
        id: item.id,
        name: itemData?.name || `Item ${item.id.slice(0, 8)}`,
        brand: itemData?.brand?.name,
        uniCode: itemData?.uniCode ?? undefined,
        currentStock,
        countedQuantity,
        difference: countedQuantity - currentStock,
      };
    });
  }, [selectedItemsData, multiStepForm, originalQuantities]);

  // Count items with actual differences
  const itemsWithChanges = useMemo(() => {
    return itemsWithDifferences.filter((item) => item.difference !== 0);
  }, [itemsWithDifferences]);

  // Store original quantity when item is selected
  const setOriginalQuantity = useCallback(
    (itemId: string, currentStock: number) => {
      setOriginalQuantities((prev) => {
        if (prev.has(itemId)) return prev;
        const next = new Map(prev);
        next.set(itemId, currentStock);
        return next;
      });
    },
    [],
  );

  // Handle item selection - store original quantity when selecting
  const handleSelectItem = useCallback(
    (itemId: string, item?: any) => {
      const isCurrentlySelected = multiStepForm.selectedItems.has(itemId);

      if (!isCurrentlySelected && item) {
        // Selecting - store original quantity
        const currentStock = item.quantity ?? 0;
        setOriginalQuantity(itemId, currentStock);
        // Set counted quantity to current stock as default
        multiStepForm.setItemQuantity(itemId, currentStock);
      }

      multiStepForm.toggleItemSelection(itemId);
    },
    [multiStepForm, setOriginalQuantity],
  );

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    try {
      if (itemsWithChanges.length === 0) {
        Alert.alert("Nenhuma alteracao", "Nenhuma diferenca foi detectada. Ajuste as quantidades contadas.");
        return;
      }

      // Create activities for stock adjustments
      const activities = itemsWithChanges.map((item) => {
        const operation = item.difference > 0 ? ACTIVITY_OPERATION.INBOUND : ACTIVITY_OPERATION.OUTBOUND;
        const quantity = Math.abs(item.difference);

        return {
          itemId: item.id,
          quantity,
          operation,
          reason: ACTIVITY_REASON.INVENTORY_COUNT,
        };
      });

      const result = await batchCreateAsync({ activities });

      if (result.data) {
        await multiStepForm.resetForm();
        setOriginalQuantities(new Map()); // Clear original quantities on success
        openResultModal(result.data);
      }
    } catch (error) {
      // Error handled by mutation hook
    }
  }, [batchCreateAsync, itemsWithChanges, multiStepForm, openResultModal]);

  // Handle cancel with confirmation if form has data
  const handleCancel = useCallback(() => {
    if (multiStepForm.selectionCount > 0) {
      Alert.alert(
        "Descartar alteracoes?",
        "Voce tem dados nao salvos. Deseja descarta-los?",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: async () => {
              await multiStepForm.resetForm();
              setOriginalQuantities(new Map());
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

  const isFirstStep = multiStepForm.currentStep === 1;
  const isLastStep = multiStepForm.currentStep === STEPS.length;

  // Calculate totals for review
  const totalInbound = itemsWithChanges.filter((i) => i.difference > 0).reduce((sum, i) => sum + i.difference, 0);
  const totalOutbound = itemsWithChanges.filter((i) => i.difference < 0).reduce((sum, i) => sum + Math.abs(i.difference), 0);

  return (
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
              onSelectItem={handleSelectItem}
              onQuantityChange={multiStepForm.setItemQuantity}
              showQuantityInput
              minQuantity={0}
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
            style={styles.reviewScrollView}
            contentContainerStyle={styles.reviewContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.summaryTitle, { color: colors.foreground }]}>
                Resumo do Balanco
              </ThemedText>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                    Itens Selecionados
                  </ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                    {multiStepForm.selectionCount}
                  </ThemedText>
                </View>
                <View style={styles.summaryItem}>
                  <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                    Com Diferenca
                  </ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: itemsWithChanges.length > 0 ? colors.primary : colors.foreground }]}>
                    {itemsWithChanges.length}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemWithIcon}>
                    <IconArrowUp size={14} color={colors.success || "#22c55e"} />
                    <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                      Entradas
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.summaryValue, { color: colors.success || "#22c55e" }]}>
                    +{totalInbound}
                  </ThemedText>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryItemWithIcon}>
                    <IconArrowDown size={14} color={colors.destructive} />
                    <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                      Saidas
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.summaryValue, { color: colors.destructive }]}>
                    -{totalOutbound}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Items Table */}
            <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.tableHeaderText, styles.tableHeaderItemCol]}>ITEM</ThemedText>
                {isTablet && (
                  <ThemedText style={[styles.tableHeaderText, styles.tableHeaderStockCol]}>ESTOQUE</ThemedText>
                )}
                <ThemedText style={[styles.tableHeaderText, styles.tableHeaderCountCol]}>CONTAGEM</ThemedText>
                <ThemedText style={[styles.tableHeaderText, styles.tableHeaderDiffCol]}>DIF</ThemedText>
              </View>

              {/* Table Body */}
              {itemsWithDifferences.map((item, index) => (
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
                    {/* Show stock on mobile (non-tablet) below the name */}
                    {!isTablet && (
                      <ThemedText style={[styles.tableItemStock, { color: colors.mutedForeground }]}>
                        Estoque: {item.currentStock}
                      </ThemedText>
                    )}
                  </View>
                  {isTablet && (
                    <View style={styles.tableStockCol}>
                      <ThemedText style={[styles.tableStockText, { color: colors.mutedForeground }]}>
                        {item.currentStock}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.tableCountCol}>
                    <ThemedText style={[styles.tableCountText, { color: colors.foreground }]}>
                      {item.countedQuantity}
                    </ThemedText>
                  </View>
                  <View style={styles.tableDiffCol}>
                    <View style={[
                      styles.diffBadge,
                      {
                        backgroundColor: item.difference > 0
                          ? (colors.success || "#22c55e") + "20"
                          : item.difference < 0
                          ? colors.destructive + "20"
                          : colors.muted,
                      }
                    ]}>
                      {item.difference > 0 && <IconArrowUp size={12} color={colors.success || "#22c55e"} />}
                      {item.difference < 0 && <IconArrowDown size={12} color={colors.destructive} />}
                      {item.difference === 0 && <IconMinus size={12} color={colors.mutedForeground} />}
                      <ThemedText style={[
                        styles.diffText,
                        {
                          color: item.difference > 0
                            ? (colors.success || "#22c55e")
                            : item.difference < 0
                            ? colors.destructive
                            : colors.mutedForeground,
                        }
                      ]}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}

              {/* Empty State */}
              {itemsWithDifferences.length === 0 && (
                <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
                  <ThemedText style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                    Nenhum item selecionado
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Warning if no changes */}
            {itemsWithChanges.length === 0 && itemsWithDifferences.length > 0 && (
              <View style={[styles.warningCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <ThemedText style={[styles.warningText, { color: colors.mutedForeground }]}>
                  Nenhuma diferenca detectada. Ajuste as quantidades contadas no passo anterior.
                </ThemedText>
              </View>
            )}
          </ScrollView>
        )}

        {/* Action Bar */}
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
                  disabled={itemsWithChanges.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <IconCheck size={18} color={colors.primaryForeground} />
                  )}
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                    {isSubmitting ? "Salvando..." : `Confirmar (${itemsWithChanges.length})`}
                  </Text>
                </Button>
              ) : (
                <Button
                  variant="default"
                  onPress={multiStepForm.goToNextStep}
                  disabled={!multiStepForm.validation.canProceedToNext || isSubmitting}
                >
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Proximo</Text>
                  <IconArrowRight size={18} color={colors.primaryForeground} />
                </Button>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Batch Result Modal */}
      <StockBalanceBatchResultModal
        open={isResultModalOpen}
        onOpenChange={(open) => !open && closeResultModal()}
        result={batchResult}
        onConfirm={onCancel}
      />
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
  // Step 2 - Review
  reviewScrollView: {
    flex: 1,
  },
  reviewContainer: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  // Summary Card
  summaryCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  summaryItem: {
    flex: 1,
  },
  summaryItemWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  // Table
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
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
  tableHeaderStockCol: {
    width: 60,
    textAlign: "center",
  },
  tableHeaderCountCol: {
    width: 60,
    textAlign: "center",
  },
  tableHeaderDiffCol: {
    width: 60,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
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
  tableItemStock: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  tableStockCol: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  tableStockText: {
    fontSize: fontSize.xs,
  },
  tableCountCol: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  tableCountText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  tableDiffCol: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: fontSize.sm,
  },
  // Warning Card
  warningCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  warningText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  // Action bar
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

export default StockBalanceBatchCreateForm;
