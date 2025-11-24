import { useCallback, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useUsers, useItems, useMultiStepForm } from "@/hooks";
import { ITEM_CATEGORY_TYPE } from "@/constants";
import type { FormStep } from "@/components/ui/form-steps";
import {
  MultiStepFormContainer,
  ItemSelectorTableV2,
} from "@/components/forms";
import {
  IconPackage,
  IconBox,
  IconUser,
} from "@tabler/icons-react-native";

// Form schema for batch borrow creation
const borrowBatchFormSchema = z.object({
  userId: z.string().uuid("Usuário é obrigatório"),
});

type BorrowBatchFormData = z.infer<typeof borrowBatchFormSchema>;

interface BorrowBatchCreateFormV2Props {
  onSubmit: (data: {
    userId: string;
    items: Array<{ itemId: string; quantity: number }>;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// 2 Steps: Select Items (with user) -> Review
const STEPS: FormStep[] = [
  { id: 1, name: "Selecionar", description: "Usuário e ferramentas" },
  { id: 2, name: "Confirmar", description: "Revise e confirme" },
];

export function BorrowBatchCreateFormV2({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BorrowBatchCreateFormV2Props) {
  const { colors } = useTheme();

  // Multi-step form state management
  const multiStepForm = useMultiStepForm<BorrowBatchFormData>({
    storageKey: "@borrow_batch_form",
    totalSteps: 2,
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

      await onSubmit({
        userId: multiStepForm.formData.userId,
        items: items.map((item) => ({ itemId: item.id, quantity: item.quantity })),
      });
      await multiStepForm.resetForm();
    } catch (error) {}
  }, [multiStepForm, onSubmit]);

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
        submitLabel="Criar Empréstimos"
        cancelLabel="Cancelar"
        scrollable={false}
      >
        {/* Step 1: User + Item Selection */}
        {multiStepForm.currentStep === 1 && (
          <View style={styles.step1Container}>
            {/* User Selection */}
            <Controller
              control={form.control}
              name="userId"
              render={({ field: { value } }) => (
                <Combobox
                  value={value}
                  onValueChange={(val) => handleFormChange("userId", typeof val === "string" ? val || "" : "")}
                  options={userOptions}
                  placeholder="Selecione o usuário"
                  searchPlaceholder="Buscar usuário..."
                  emptyText="Nenhum usuário encontrado"
                  disabled={isSubmitting || isLoadingUsers}
                  loading={isLoadingUsers}
                  clearable={false}
                  searchable
                />
              )}
            />

            {/* Item Selector - Filter only TOOL category */}
            <ItemSelectorTableV2
              style={{ marginTop: -spacing.sm }}
              selectedItems={multiStepForm.selectedItems}
              quantities={multiStepForm.quantities}
              onSelectItem={multiStepForm.toggleItemSelection}
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
              emptyMessage="Nenhuma ferramenta encontrada"
            />
          </View>
        )}

        {/* Step 2: Review */}
        {multiStepForm.currentStep === 2 && (
          <View style={styles.reviewContainer}>
            {/* Summary Metrics */}
            <Card style={styles.card}>
              <CardContent style={styles.metricsContent}>
                <View style={styles.metricsRow}>
                  {/* User */}
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <IconUser size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>USUÁRIO</ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                      {selectedUserName}
                    </ThemedText>
                  </View>

                  {/* Items Count */}
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <IconPackage size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>ITENS</ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValueLarge, { color: colors.foreground }]}>
                      {multiStepForm.selectionCount}
                    </ThemedText>
                  </View>

                  {/* Total Units */}
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <IconBox size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>UNIDADES</ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValueLarge, { color: colors.primary }]}>
                      {totalUnits}
                    </ThemedText>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card style={[styles.card, styles.itemsCard]}>
              <CardHeader style={styles.itemsHeader}>
                <CardTitle>Ferramentas Selecionadas</CardTitle>
              </CardHeader>
              <CardContent style={styles.itemsContent}>
                {/* Table Header */}
                <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
                  <ThemedText style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 3 }]}>ITEM</ThemedText>
                  <ThemedText style={[styles.tableHeaderText, { color: colors.mutedForeground, width: 60, textAlign: "right" }]}>QTD</ThemedText>
                </View>

                {/* Table Body */}
                {selectedItemsWithNames.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.tableRow,
                      { backgroundColor: index % 2 === 0 ? colors.background : colors.card },
                      index === selectedItemsWithNames.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <ThemedText style={[styles.itemCode, { color: colors.mutedForeground }]}>
                        {item.uniCode || "-"}
                      </ThemedText>
                      <ThemedText style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                        {item.name}
                      </ThemedText>
                      {item.brand && (
                        <ThemedText style={[styles.itemBrand, { color: colors.mutedForeground }]}>
                          {item.brand}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.itemQuantity}>
                      <ThemedText style={[styles.quantityText, { color: colors.foreground }]}>
                        {item.quantity}
                      </ThemedText>
                    </View>
                  </View>
                ))}

                {/* Table Footer */}
                <View style={[styles.tableFooterRow, { borderTopColor: colors.border, backgroundColor: colors.muted }]}>
                  <ThemedText style={[styles.tableFooterText, { color: colors.foreground }]}>Total</ThemedText>
                  <ThemedText style={[styles.tableFooterValue, { color: colors.primary }]}>{totalUnits}</ThemedText>
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  step1Container: { flex: 1 },
  card: { marginBottom: spacing.sm },
  reviewContainer: { flex: 1, padding: spacing.sm },
  metricsContent: { paddingVertical: spacing.sm },
  metricsRow: { flexDirection: "row", justifyContent: "space-between" },
  metricItem: { flex: 1, alignItems: "center" },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  metricLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  metricValue: { fontSize: fontSize.sm, fontWeight: "500" },
  metricValueLarge: { fontSize: 20, fontWeight: "700" },
  itemsCard: { flex: 1 },
  itemsHeader: { paddingBottom: spacing.xs },
  itemsContent: { flex: 1, paddingTop: 0 },
  tableHeaderRow: { flexDirection: "row", paddingVertical: spacing.xs, paddingHorizontal: spacing.xs, borderBottomWidth: 1 },
  tableHeaderText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs, paddingHorizontal: spacing.xs, minHeight: 44 },
  tableRowLast: { borderBottomWidth: 0 },
  itemInfo: { flex: 3 },
  itemCode: { fontSize: 10, fontWeight: "600" },
  itemName: { fontSize: fontSize.sm, fontWeight: "500", marginTop: 1 },
  itemBrand: { fontSize: fontSize.xs, marginTop: 1 },
  itemQuantity: { width: 50, alignItems: "flex-end" },
  quantityText: { fontSize: fontSize.md, fontWeight: "600" },
  tableFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs, paddingHorizontal: spacing.xs, borderTopWidth: 1, marginTop: spacing.xs },
  tableFooterText: { fontSize: fontSize.sm, fontWeight: "600" },
  tableFooterValue: { fontSize: fontSize.md, fontWeight: "700" },
});

export default BorrowBatchCreateFormV2;
