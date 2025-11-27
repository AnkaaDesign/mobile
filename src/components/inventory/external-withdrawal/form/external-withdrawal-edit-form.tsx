import React, { useCallback, useMemo, useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconArrowLeft, IconArrowRight, IconCheck, IconUser, IconPackage, IconFileText, IconReceipt } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { EXTERNAL_WITHDRAWAL_TYPE, EXTERNAL_WITHDRAWAL_TYPE_LABELS } from "@/constants";
import { useExternalWithdrawalFormState } from "@/hooks/use-external-withdrawal-form-state";
import { useExternalWithdrawalMutations } from "@/hooks";

import type { ExternalWithdrawal, ExternalWithdrawalItem } from "@/types";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormLabel } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";

import { ExternalWithdrawalItemSelector } from "./external-withdrawal-item-selector";
import { ExternalWithdrawalSummaryCards } from "./external-withdrawal-summary-cards";

const STAGES = [
  {
    id: 1,
    name: "Informações Básicas",
    description: "Responsável e detalhes da retirada",
    icon: IconUser,
  },
  {
    id: 2,
    name: "Seleção de Itens",
    description: "Escolha os itens e quantidades",
    icon: IconPackage,
  },
  {
    id: 3,
    name: "Revisão",
    description: "Confirme os dados da retirada",
    icon: IconCheck,
  },
] as const;

interface ExternalWithdrawalEditFormProps {
  withdrawal: ExternalWithdrawal & {
    items: ExternalWithdrawalItem[];
  };
}

export function ExternalWithdrawalEditForm({ withdrawal }: ExternalWithdrawalEditFormProps) {
  const { colors } = useTheme();
  const router = useRouter();

  // Convert existing withdrawal data to initial state
  const initialSelectedItems = useMemo(
    () => withdrawal.items.map((item) => item.itemId),
    [withdrawal.items]
  );

  const initialQuantities = useMemo(
    () =>
      withdrawal.items.reduce(
        (acc, item) => {
          acc[item.itemId] = item.withdrawedQuantity;
          return acc;
        },
        {} as Record<string, number>
      ),
    [withdrawal.items]
  );

  const initialPrices = useMemo(
    () =>
      withdrawal.items.reduce(
        (acc, item) => {
          if (item.price !== null && item.price !== undefined) {
            acc[item.itemId] = item.price;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
    [withdrawal.items]
  );

  // Form state hook with initial data
  const {
    stage,
    validation,
    formTouched,
    formProgress,
    withdrawerName,
    type,
    notes,
    nfeId,
    receiptId,
    selectedItems,
    quantities,
    prices,
    showSelectedOnly,
    searchTerm,
    showInactive,
    categoryIds,
    brandIds,
    supplierIds,
    page,
    pageSize,
    totalRecords,
    goToNextStage,
    goToPrevStage,
    updateWithdrawerName,
    updateType,
    updateNotes,
    updateNfeId,
    updateReceiptId,
    setShowSelectedOnly,
    setSearchTerm,
    setShowInactive,
    setCategoryIds,
    setBrandIds,
    setSupplierIds,
    setPage,
    setPageSize,
    setTotalRecords,
    toggleItemSelection,
    setItemQuantity,
    setItemPrice,
    getFormData,
    resetForm,
  } = useExternalWithdrawalFormState({
    storageKey: `@external_withdrawal_edit_form_${withdrawal.id}`,
    defaultQuantity: 1,
    defaultPrice: 0,
    preserveQuantitiesOnDeselect: false,
    validateOnStageChange: true,
    autoSave: true,
    initialData: {
      withdrawerName: withdrawal.withdrawerName,
      type: withdrawal.type,
      notes: withdrawal.notes || "",
      selectedItems: initialSelectedItems,
      quantities: initialQuantities,
      prices: initialPrices,
    },
  });

  // File state - initialize with existing files
  const [receiptFiles, setReceiptFiles] = useState<FileItem[]>([]);
  const [nfeFiles, setNfeFiles] = useState<FileItem[]>([]);
  const [hasFileChanges, setHasFileChanges] = useState(false);

  // Mutations
  const { updateAsync, isLoading: isSubmitting } = useExternalWithdrawalMutations();

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (type !== EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE) return 0;

    return Array.from(selectedItems).reduce((total, itemId) => {
      const quantity = Number(quantities[itemId]) || 1;
      const price = Number(prices[itemId]) || 0;
      return total + quantity * price;
    }, 0);
  }, [type, selectedItems, quantities, prices]);

  // Detect if form has changes
  const hasFormChanges = useMemo(() => {
    const withdrawerNameChanged = (withdrawerName?.trim() || "") !== (withdrawal.withdrawerName?.trim() || "");
    const typeChanged = type !== withdrawal.type;
    const notesChanged = (notes?.trim() || "") !== (withdrawal.notes?.trim() || "");

    // Check if selected items have changed
    const originalItemIds = new Set(withdrawal.items.map((item) => item.itemId));
    const itemsChanged =
      selectedItems.size !== originalItemIds.size ||
      Array.from(selectedItems).some((id) => !originalItemIds.has(id));

    // Check if quantities have changed
    const quantitiesChanged = withdrawal.items.some((item) => {
      const currentQty = quantities[item.itemId];
      return currentQty !== undefined && currentQty !== item.withdrawedQuantity;
    });

    // Check if prices have changed
    const pricesChanged = withdrawal.items.some((item) => {
      const currentPrice = prices[item.itemId];
      return currentPrice !== undefined && currentPrice !== item.price;
    });

    return (
      withdrawerNameChanged ||
      typeChanged ||
      notesChanged ||
      itemsChanged ||
      quantitiesChanged ||
      pricesChanged ||
      hasFileChanges
    );
  }, [
    withdrawerName,
    type,
    notes,
    selectedItems,
    quantities,
    prices,
    withdrawal,
    hasFileChanges,
  ]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    const success = goToNextStage();
    if (!success && formTouched) {
      // Show validation errors
      if (stage === 1 && validation.errors.withdrawerName) {
        Alert.alert("Erro", validation.errors.withdrawerName);
      } else if (stage === 2 && validation.errors.selectedItems) {
        Alert.alert("Erro", validation.errors.selectedItems);
      }
    }
  }, [goToNextStage, formTouched, stage, validation]);

  const handlePrev = useCallback(() => {
    goToPrevStage();
  }, [goToPrevStage]);

  const handleCancel = useCallback(async () => {
    await resetForm();
    router.back();
  }, [resetForm, router]);

  // Handle file uploads
  const handleReceiptUpload = useCallback((files: FileItem[]) => {
    setReceiptFiles(files);
    setHasFileChanges(true);
    updateReceiptId(files.length > 0 ? "pending" : null);
  }, [updateReceiptId]);

  const handleNfeUpload = useCallback((files: FileItem[]) => {
    setNfeFiles(files);
    setHasFileChanges(true);
    updateNfeId(files.length > 0 ? "pending" : null);
  }, [updateNfeId]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validation.canSubmit) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!hasFormChanges) {
      Alert.alert("Aviso", "Nenhuma alteração foi feita");
      return;
    }

    try {
      const updateData = {
        withdrawerName: withdrawerName?.trim() || "",
        type,
        notes: notes?.trim() || null,
      };

      // Note: File upload functionality is available in the UI but not yet implemented
      // in the submission logic. Files selected will be displayed but not uploaded.
      // TODO: Implement file upload using useFileUploadManager pattern
      if (receiptFiles.length > 0 || nfeFiles.length > 0) {
        console.warn("File upload not yet implemented. Files will not be uploaded.");
      }

      const result = await updateAsync({
        id: withdrawal.id,
        data: updateData,
      });

      if (result.success) {
        await resetForm();
        router.back();
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  }, [
    validation,
    hasFormChanges,
    withdrawerName,
    type,
    notes,
    receiptFiles,
    nfeFiles,
    updateAsync,
    withdrawal.id,
    resetForm,
    router,
  ]);

  // Render stage content (same as create form)
  const renderStageContent = useCallback(() => {
    switch (stage) {
      case 1:
        return renderStage1();
      case 2:
        return renderStage2();
      case 3:
        return renderStage3();
      default:
        return null;
    }
  }, [stage, withdrawerName, type, notes, receiptFiles, nfeFiles]);

  // Stage 1: Basic Info
  const renderStage1 = () => (
    <ScrollView style={styles.stageContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardHeaderContent}>
            <IconUser size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Informações da Retirada</Text>
          </View>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Withdrawer Name */}
          <View style={styles.formField}>
            <FormLabel required asteriskColor="red">Nome do Retirador</FormLabel>
            <Input
              value={withdrawerName}
              onChangeText={updateWithdrawerName}
              placeholder="Digite o nome da pessoa que está retirando"
              maxLength={200}
              error={formTouched && validation.errors.withdrawerName}
            />
            {formTouched && validation.errors.withdrawerName && (
              <Text style={styles.errorText}>{validation.errors.withdrawerName}</Text>
            )}
          </View>

          {/* Withdrawal Type */}
          <View style={styles.formField}>
            <FormLabel required asteriskColor="red">Tipo de Retirada</FormLabel>
            <Combobox
              value={type}
              onValueChange={(value) => updateType(value as EXTERNAL_WITHDRAWAL_TYPE)}
              options={[
                {
                  value: EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE,
                  label: EXTERNAL_WITHDRAWAL_TYPE_LABELS[EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE],
                },
                {
                  value: EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE,
                  label: EXTERNAL_WITHDRAWAL_TYPE_LABELS[EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE],
                },
                {
                  value: EXTERNAL_WITHDRAWAL_TYPE.COMPLIMENTARY,
                  label: EXTERNAL_WITHDRAWAL_TYPE_LABELS[EXTERNAL_WITHDRAWAL_TYPE.COMPLIMENTARY],
                },
              ]}
              placeholder="Selecione o tipo"
              searchable={false}
              clearable={false}
            />
            <Text style={styles.helperText}>
              {type === EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE && "Itens serão devolvidos (sem cobrança)"}
              {type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && "Itens não serão devolvidos (com cobrança)"}
              {type === EXTERNAL_WITHDRAWAL_TYPE.COMPLIMENTARY && "Itens cortesia (sem devolução e sem cobrança)"}
            </Text>
          </View>

          {/* Notes */}
          <View style={styles.formField}>
            <FormLabel>Observações</FormLabel>
            <Input
              value={notes}
              onChangeText={updateNotes}
              placeholder="Observações sobre a retirada (opcional)"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{ minHeight: 100 }}
            />
            {notes && (
              <Text style={styles.helperText}>{notes.length}/500 caracteres</Text>
            )}
          </View>

          {/* File Uploads */}
          <View style={styles.formField}>
            <FormLabel>Documentos (Opcional)</FormLabel>

            {/* Receipt */}
            <View style={styles.fileUploadContainer}>
              <View style={styles.fileUploadHeader}>
                <IconReceipt size={16} color={colors.mutedForeground} />
                <Text style={styles.fileUploadLabel}>Recibo</Text>
              </View>
              <FileUpload
                value={receiptFiles}
                onChange={handleReceiptUpload}
                maxFiles={1}
                accept="all"
              />
            </View>

            {/* NFE */}
            <View style={styles.fileUploadContainer}>
              <View style={styles.fileUploadHeader}>
                <IconFileText size={16} color={colors.mutedForeground} />
                <Text style={styles.fileUploadLabel}>Nota Fiscal</Text>
              </View>
              <FileUpload
                value={nfeFiles}
                onChange={handleNfeUpload}
                maxFiles={1}
                accept="all"
              />
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );

  // Stage 2: Item Selection
  const renderStage2 = () => (
    <View style={styles.stageContainer}>
      <ExternalWithdrawalItemSelector
        selectedItems={selectedItems}
        quantities={quantities}
        prices={prices}
        type={type}
        showSelectedOnly={showSelectedOnly}
        searchTerm={searchTerm}
        showInactive={showInactive}
        categoryIds={categoryIds}
        brandIds={brandIds}
        supplierIds={supplierIds}
        page={page}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onSelectItem={toggleItemSelection}
        onQuantityChange={setItemQuantity}
        onPriceChange={setItemPrice}
        onShowSelectedOnlyChange={setShowSelectedOnly}
        onSearchTermChange={setSearchTerm}
        onShowInactiveChange={setShowInactive}
        onCategoryIdsChange={setCategoryIds}
        onBrandIdsChange={setBrandIds}
        onSupplierIdsChange={setSupplierIds}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onTotalRecordsChange={setTotalRecords}
      />
    </View>
  );

  // Stage 3: Review
  const renderStage3 = () => (
    <ScrollView style={styles.stageContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ExternalWithdrawalSummaryCards
        withdrawerName={withdrawerName}
        type={type}
        notes={notes}
        selectedItems={selectedItems}
        quantities={quantities}
        prices={prices}
        totalPrice={totalPrice}
      />
    </ScrollView>
  );

  const isFirstStage = stage === 1;
  const isLastStage = stage === 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          value={formProgress.percentage}
          max={100}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          Etapa {stage} de {STAGES.length} - {STAGES[stage - 1].name}
        </Text>
      </View>

      {/* Stage Indicator */}
      <View style={styles.stageIndicator}>
        {STAGES.map((stageInfo, index) => {
          const stageNumber = index + 1;
          const isActive = stageNumber === stage;
          const isCompleted = stageNumber < stage;
          const Icon = stageInfo.icon;

          return (
            <View key={stageInfo.id} style={styles.stageItem}>
              <View
                style={[
                  styles.stageBadge,
                  isActive && { backgroundColor: colors.primary },
                  isCompleted && { backgroundColor: colors.success },
                  !isActive && !isCompleted && { backgroundColor: colors.muted },
                ]}
              >
                <Icon
                  size={16}
                  color={isActive || isCompleted ? colors.primaryForeground : colors.mutedForeground}
                />
              </View>
              <Text
                style={[
                  styles.stageLabel,
                  isActive && { color: colors.primary, fontWeight: "600" },
                  !isActive && { color: colors.mutedForeground },
                ]}
              >
                {stageInfo.name}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Stage Content */}
      <View style={styles.content}>
        {renderStageContent()}
      </View>

      {/* Navigation Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerButtons}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={styles.footerButton}
          >
            Cancelar
          </Button>

          {!isFirstStage && (
            <Button
              variant="outline"
              onPress={handlePrev}
              disabled={isSubmitting}
              icon={<IconArrowLeft size={16} />}
              style={styles.footerButton}
            >
              Anterior
            </Button>
          )}

          {!isLastStage ? (
            <Button
              variant="default"
              onPress={handleNext}
              disabled={isSubmitting}
              icon={<IconArrowRight size={16} />}
              style={styles.footerButton}
            >
              Próximo
            </Button>
          ) : (
            <Button
              variant="default"
              onPress={handleSubmit}
              disabled={isSubmitting || !validation.canSubmit || !hasFormChanges || selectedItems.size === 0}
              loading={isSubmitting}
              icon={<IconCheck size={16} />}
              style={styles.footerButton}
            >
              Atualizar
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressBar: {
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
  stageIndicator: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stageItem: {
    alignItems: "center",
    flex: 1,
  },
  stageBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  stageLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  stageContainer: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardContent: {
    gap: spacing.lg,
  },
  formField: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
  fileUploadContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  fileUploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  fileUploadLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  footerButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
