import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { routes } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useSuppliers, useItems, useOrderMutations, useCanViewPrices } from "@/hooks";
import { getUsers } from "@/api-client";
import { useMultiStepForm } from "@/hooks";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_METHOD_LABELS, SECTOR_PRIVILEGES, CONTRACT_STATUS } from "@/constants";
import { BoletoPaymentFields } from "./boleto-payment-fields";
import { formatCurrency, formatQuantity, formatPixKey } from "@/utils";
import { createOrderFormData } from "@/utils/order-form-utils";
import type { FormStep } from "@/components/ui/form-steps";
import type { OrderCreateFormData as OrderCreateFormDataSchema } from "@/schemas";
import {
  MultiStepFormContainer,
  ItemSelectorTable,
} from "@/components/forms";
import {
  ReanimatedSwipeableRow,
  type SwipeAction,
} from "@/components/ui/reanimated-swipeable-row";
import {
  IconBox,
  IconCalendar,
  IconPackage,
  IconPlus,
  IconTrash,
  IconTruck,
} from "@tabler/icons-react-native";

// Form schema for order creation
const orderCreateFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  supplierId: z.string().uuid("Selecione um fornecedor válido").optional().nullable(),
  forecast: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  freight: z.number().min(0, "Frete deve ser maior ou igual a 0").optional().nullable(),
  discount: z.number().min(0).max(100).optional().nullable(),
  totalOverride: z.number().min(0, "Valor total deve ser maior ou igual a 0").optional().nullable(),
  paymentMethod: z.enum([PAYMENT_METHOD.PIX, PAYMENT_METHOD.BANK_SLIP, PAYMENT_METHOD.CREDIT_CARD]).optional().nullable(),
  paymentPix: z.string().max(500, "Chave Pix deve ter no máximo 500 caracteres").optional().nullable(),
  paymentDueDays: z.number().int().positive().optional().nullable(),
  paymentFirstDueDate: z.date().optional().nullable(),
  installmentCount: z.number().int().min(1).max(48).optional().nullable(),
  paymentResponsibleId: z.string().uuid("Selecione um responsável válido").optional().nullable(),
});

type OrderCreateFormData = z.infer<typeof orderCreateFormSchema>;

interface OrderCreateFormProps {
  onSuccess?: () => void;
}

// Temporary item interface
interface TemporaryItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  icms: number;
  ipi: number;
}

// Steps configuration
const STEPS: FormStep[] = [
  { id: 1, name: "Informações", description: "Dados do pedido" },
  { id: 2, name: "Itens", description: "Selecione os itens" },
  { id: 3, name: "Revisão", description: "Confirme os dados" },
];

export function OrderCreateForm({ onSuccess }: OrderCreateFormProps) {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();
  const nav = useNav();
  const goBack = () =>
    nav.goBack({ fallback: mobileRoute(routes.inventory.orders.root) });

  // Local state for date (since it's a Date object)
  const [forecastDate, setForecastDate] = useState<Date | undefined>(undefined);

  // Temporary items state (coexist with inventory items, like web)
  const [temporaryItems, setTemporaryItems] = useState<TemporaryItem[]>([]);

  // Per-inventory-item ICMS/IPI maps (mobile multi-step hook doesn't carry these;
  // kept in local state keyed by itemId to mirror web's icmses/ipis maps).
  const [itemIcms, setItemIcms] = useState<Record<string, number>>({});
  const [itemIpi, setItemIpi] = useState<Record<string, number>>({});

  // File upload states
  const [receiptFiles, setReceiptFiles] = useState<FilePickerItem[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Mutations
  const { createAsync, isLoading: isMutating } = useOrderMutations();

  // Multi-step form state management
  const multiStepForm = useMultiStepForm<OrderCreateFormData>({
    storageKey: "@order_create_form",
    totalSteps: 3,
    defaultFormData: {
      description: "",
      supplierId: null,
      forecast: null,
      notes: "",
      freight: null,
      discount: null,
      totalOverride: null,
      paymentMethod: null,
      paymentPix: null,
      paymentDueDays: null,
      paymentFirstDueDate: null,
      installmentCount: 1,
      paymentResponsibleId: null,
    },
    defaultQuantity: 1,
    defaultPrice: 0,
    validateOnStepChange: true,
    validateStep: (step, state) => {
      if (step === 1) {
        // Description is required
        return !!state.formData.description?.trim();
      }
      if (step === 2) {
        // Unified list: at least one inventory item OR a valid temporary item
        const hasInventory = state.selectedItems.length > 0;
        const hasValidTemp =
          temporaryItems.length > 0 &&
          temporaryItems.every(
            (item) => item.description.trim() && item.quantity > 0 && item.price >= 0,
          );
        return hasInventory || hasValidTemp;
      }
      return true;
    },
    getStepErrors: (step, state) => {
      const errors: Record<string, string> = {};
      if (step === 1) {
        if (!state.formData.description?.trim()) {
          errors.description = "Descrição é obrigatória";
        }
      }
      if (step === 2) {
        const hasInventory = state.selectedItems.length > 0;
        const hasTemp = temporaryItems.length > 0;
        if (!hasInventory && !hasTemp) {
          errors.items = "Adicione pelo menos um item (estoque ou temporário)";
        }
      }
      return errors;
    },
  });

  // React Hook Form for form fields
  const form = useForm<OrderCreateFormData>({
    resolver: zodResolver(orderCreateFormSchema),
    defaultValues: multiStepForm.formData,
    mode: "onChange",
  });

  // Sync form data to multi-step state
  const handleFormChange = useCallback(
    <K extends keyof OrderCreateFormData>(field: K, value: OrderCreateFormData[K]) => {
      form.setValue(field, value as any);
      multiStepForm.updateFormData({ [field]: value } as Partial<OrderCreateFormData>);
    },
    [form, multiStepForm],
  );

  // Fetch suppliers for selection
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers({
    where: { isActive: true },
    orderBy: { fantasyName: "asc" },
    take: 100,
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

  // Fetch selected items for review step (only when on step 3)
  const selectedItemIds = useMemo(
    () => Array.from(multiStepForm.selectedItems),
    [multiStepForm.selectedItems],
  );

  const { data: selectedItemsData } = useItems(
    {
      where: { id: { in: selectedItemIds } },
      include: { brands: true, category: true },
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
      brand: itemsMap.get(item.id)?.brands?.map((b) => b.name).join(", "),
      uniCode: itemsMap.get(item.id)?.uniCode,
    }));
  }, [selectedItemsData, multiStepForm]);

  // Freight value (carried in form data)
  const freightValue = (multiStepForm.formData.freight as number | null | undefined) || 0;

  // Discount value (percentage, carried in form data)
  const discountValue = (multiStepForm.formData.discount as number | null | undefined) || 0;

  // Calculate totals for review (unified: inventory + temporary, with taxes - discount + freight)
  const totals = useMemo(() => {
    const invItems = multiStepForm.getSelectedItemsWithData();

    let subtotal = 0;
    let goodsSubtotal = 0;
    let totalQuantity = 0;

    invItems.forEach((item) => {
      const lineSubtotal = (item.price || 0) * item.quantity;
      const icms = itemIcms[item.id] || 0;
      const ipi = itemIpi[item.id] || 0;
      subtotal += lineSubtotal + lineSubtotal * (icms / 100) + lineSubtotal * (ipi / 100);
      goodsSubtotal += lineSubtotal;
      totalQuantity += item.quantity;
    });

    temporaryItems.forEach((item) => {
      const lineSubtotal = item.price * item.quantity;
      subtotal += lineSubtotal + lineSubtotal * ((item.icms || 0) / 100) + lineSubtotal * ((item.ipi || 0) / 100);
      goodsSubtotal += lineSubtotal;
      totalQuantity += item.quantity;
    });

    const discountAmount = goodsSubtotal * (discountValue / 100);
    const total = subtotal - discountAmount + freightValue;

    return {
      itemCount: invItems.length + temporaryItems.length,
      totalQuantity,
      subtotal,
      goodsSubtotal,
      discountAmount,
      total,
    };
  }, [multiStepForm, temporaryItems, itemIcms, itemIpi, freightValue, discountValue]);

  // Temporary item handlers
  const handleAddTemporaryItem = useCallback(() => {
    setTemporaryItems((prev) => [
      {
        id: `temp-${Date.now()}`,
        description: "",
        quantity: 1,
        price: 0,
        icms: 0,
        ipi: 0,
      },
      ...prev,
    ]);
  }, []);

  const handleRemoveTemporaryItem = useCallback((id: string) => {
    setTemporaryItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleUpdateTemporaryItem = useCallback(
    (id: string, field: keyof TemporaryItem, value: string | number) => {
      setTemporaryItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      );
    },
    [],
  );


  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    try {
      // Unified item list (inventory + temporary coexist, mirroring web)
      const itemsData: NonNullable<OrderCreateFormDataSchema["items"]> = [];

      // Inventory items
      const invItems = multiStepForm.getSelectedItemsWithData();
      const invalidInvItems = invItems.filter((item) => item.quantity <= 0 || (item.price || 0) < 0);
      if (invalidInvItems.length > 0) {
        Alert.alert("Erro", "Todos os itens de estoque devem ter quantidade maior que zero");
        return;
      }
      invItems.forEach((item) => {
        itemsData.push({
          itemId: item.id,
          orderedQuantity: item.quantity,
          price: item.price || 0,
          icms: itemIcms[item.id] || 0,
          ipi: itemIpi[item.id] || 0,
        });
      });

      // Temporary items
      const invalidTempItems = temporaryItems.filter(
        (item) => !item.description.trim() || item.quantity <= 0 || item.price < 0
      );
      if (invalidTempItems.length > 0) {
        Alert.alert("Erro", "Todos os itens temporários devem ter descrição, quantidade e preço válidos");
        return;
      }
      temporaryItems.forEach((item) => {
        itemsData.push({
          temporaryItemDescription: item.description,
          orderedQuantity: item.quantity,
          price: item.price,
          icms: item.icms,
          ipi: item.ipi,
        });
      });

      if (itemsData.length === 0) {
        Alert.alert("Erro", "Adicione pelo menos um item ao pedido");
        return;
      }

      // Prepare order data
      const orderData: OrderCreateFormDataSchema = {
        description: multiStepForm.formData.description,
        status: ORDER_STATUS.CREATED,
        supplierId: multiStepForm.formData.supplierId || undefined,
        forecast: forecastDate ?? null,
        notes: multiStepForm.formData.notes || undefined,
        freight: freightValue,
        discount: discountValue,
        // Manual grand-total override (Valor Total). null = use the automatic computed total.
        totalOverride:
          multiStepForm.formData.totalOverride != null &&
          Number.isFinite(Number(multiStepForm.formData.totalOverride)) &&
          Number(multiStepForm.formData.totalOverride) >= 0
            ? Number(multiStepForm.formData.totalOverride)
            : null,
        items: itemsData,
        paymentMethod: multiStepForm.formData.paymentMethod || undefined,
        paymentPix: multiStepForm.formData.paymentMethod === PAYMENT_METHOD.PIX ? multiStepForm.formData.paymentPix || undefined : undefined,
        // Persist the default interval (30 days) shown for 2x+ boletos when none was explicitly chosen.
        paymentDueDays:
          multiStepForm.formData.paymentMethod === PAYMENT_METHOD.BANK_SLIP
            ? (multiStepForm.formData.installmentCount || 1) > 1
              ? multiStepForm.formData.paymentDueDays || 30
              : multiStepForm.formData.paymentDueDays || undefined
            : undefined,
        paymentFirstDueDate: multiStepForm.formData.paymentMethod === PAYMENT_METHOD.BANK_SLIP ? multiStepForm.formData.paymentFirstDueDate || undefined : undefined,
        installmentCount: multiStepForm.formData.paymentMethod === PAYMENT_METHOD.BANK_SLIP ? multiStepForm.formData.installmentCount || 1 : 1,
        paymentResponsibleId: multiStepForm.formData.paymentResponsibleId || undefined,
      };

      // Check if there are files to upload
      const hasFiles = receiptFiles.length > 0;

      let result;
      setIsUploadingFiles(hasFiles);

      try {
        if (hasFiles) {
          // ATOMIC SUBMISSION: Use FormData when there are files
          // This prevents race conditions by submitting files + data in single request
          const supplier = multiStepForm.formData.supplierId
            ? suppliers?.data?.find((s) => s.id === multiStepForm.formData.supplierId)
            : undefined;

          const formDataWithFiles = createOrderFormData(
            orderData,
            {
              receipts: receiptFiles.length > 0 ? receiptFiles : undefined,
            },
            supplier
              ? {
                  id: supplier.id,
                  fantasyName: supplier.fantasyName ?? undefined,
                }
              : undefined
          );

          // FormData is accepted by the API client for multipart form submission
          result = await createAsync(formDataWithFiles as unknown as OrderCreateFormDataSchema);
        } else {
          // Use regular JSON payload when no files
          result = await createAsync(orderData);
        }

        if (result.success && result.data) {
          // API client already shows success alert

          // Clear form state
          await multiStepForm.resetForm();
          setForecastDate(undefined);
          setTemporaryItems([]);
          setItemIcms({});
          setItemIpi({});
          setReceiptFiles([]);

          if (onSuccess) {
            onSuccess();
          } else {
            nav.replace(mobileRoute(routes.inventory.orders.details(result.data.id)));
          }
        }
      } catch (error) {
        console.error("Error uploading files or creating order:", error);
      } finally {
        setIsUploadingFiles(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  }, [
    multiStepForm,
    temporaryItems,
    itemIcms,
    itemIpi,
    freightValue,
    discountValue,
    forecastDate,
    receiptFiles,
    suppliers,
    createAsync,
    onSuccess,
    nav,
  ]);

  // Handle cancel with confirmation if form has data
  const handleCancel = useCallback(() => {
    const hasData = multiStepForm.selectionCount > 0 ||
      multiStepForm.formData.description?.trim() ||
      temporaryItems.length > 0;

    if (hasData) {
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
              setTemporaryItems([]);
              setItemIcms({});
              setItemIpi({});
              setReceiptFiles([]);
              goBack();
            },
          },
        ],
      );
    } else {
      goBack();
    }
  }, [multiStepForm, temporaryItems, goBack]);

  // Loading state
  if (multiStepForm.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ThemedText>Carregando...</ThemedText>
      </View>
    );
  }

  const isSubmitting = isMutating || isUploadingFiles;

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
        submitLabel={isUploadingFiles ? "Enviando arquivos..." : "Cadastrar"}
        cancelLabel="Cancelar"
        scrollable={multiStepForm.currentStep !== 2}
      >
        {/* Step 1: Order Information */}
        {multiStepForm.currentStep === 1 && (
          <View style={styles.step1Container}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Description */}
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field: { value }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <View style={styles.labelRow}>
                        <Label style={{ marginBottom: 0 }}>Descrição</Label>
                        <Text style={styles.requiredAsterisk}> *</Text>
                      </View>
                      <Input
                        value={value || ""}
                        onChangeText={(val) => handleFormChange("description", val)}
                        placeholder="Ex: Pedido de materiais de escritório"
                        editable={!isSubmitting}
                      />
                      {error && (
                        <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                      )}
                      {multiStepForm.formTouched && multiStepForm.validation.errors.description && (
                        <ThemedText style={styles.errorText}>
                          {multiStepForm.validation.errors.description}
                        </ThemedText>
                      )}
                    </View>
                  )}
                />

                {/* Supplier Selection */}
                <Controller
                  control={form.control}
                  name="supplierId"
                  render={({ field: { value }, fieldState: { error } }) => (
                    <View style={styles.fieldGroup}>
                      <Label>Fornecedor</Label>
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => handleFormChange("supplierId", (val || null) as string | null)}
                        options={supplierOptions}
                        placeholder="Selecione o fornecedor (opcional)"
                        searchPlaceholder="Buscar fornecedor..."
                        emptyText="Nenhum fornecedor encontrado"
                        disabled={isSubmitting || isLoadingSuppliers}
                        loading={isLoadingSuppliers}
                        clearable
                        searchable
                      />
                      {error && (
                        <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                      )}
                    </View>
                  )}
                />

                {/* Delivery Date */}
                <View style={styles.fieldGroup}>
                  <Label>Previsão de Entrega</Label>
                  <DateTimePicker
                    value={forecastDate}
                    onChange={setForecastDate}
                    mode="date"
                    placeholder="Selecione a data"
                    minimumDate={new Date()}
                    disabled={isSubmitting}
                  />
                  <ThemedText style={styles.helpText}>
                    Data prevista para entrega do pedido
                  </ThemedText>
                </View>

                {/* Notes */}
                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field: { value }, fieldState: { error } }) => (
                    <View style={styles.lastFieldGroup}>
                      <Label>Observações</Label>
                      <Input
                        value={value || ""}
                        onChangeText={(val) => handleFormChange("notes", val)}
                        placeholder="Observações sobre o pedido (opcional)"
                        editable={!isSubmitting}
                        multiline
                        numberOfLines={3}
                        style={{ height: 80 }}
                      />
                      {error && (
                        <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                      )}
                    </View>
                  )}
                />
              </CardContent>
            </Card>

            {/* Comprovantes Section */}
            <Card style={styles.lastCard}>
              <CardHeader>
                <CardTitle>Comprovantes (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <FilePicker
                  value={receiptFiles}
                  onChange={setReceiptFiles}
                  maxFiles={10}
                  label="Comprovantes"
                  placeholder="Adicionar comprovantes"
                  helperText="Selecione até 10 comprovantes"
                  disabled={isSubmitting}
                  showCamera={true}
                  showGallery={true}
                  showFilePicker={true}
                />
              </CardContent>
            </Card>
          </View>
        )}

        {/* Step 2: Inventory Item Selection (temporary items managed in review) */}
        {multiStepForm.currentStep === 2 && (
          <View style={styles.itemSelectorContainer}>
            <ItemSelectorTable
              selectedItems={multiStepForm.selectedItems}
              quantities={multiStepForm.quantities}
              prices={multiStepForm.prices}
              onSelectItem={(itemId, item) => {
                // Get the item's default price
                let defaultPrice = 0;
                if (item?.prices?.length > 0) {
                  const sortedPrices = [...item.prices].sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  );
                  defaultPrice = sortedPrices[0].value || 0;
                } else if (item?.price != null) {
                  defaultPrice = item.price;
                }
                multiStepForm.toggleItemSelection(itemId, undefined, defaultPrice);
              }}
              onQuantityChange={multiStepForm.setItemQuantity}
              onPriceChange={multiStepForm.setItemPrice}
              showQuantityInput
              showPriceInput={canViewPrices}
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
          </View>
        )}

        {/* Step 3: Review */}
        {multiStepForm.currentStep === 3 && (
          <View style={styles.reviewContainer}>
            {/* Summary Metrics */}
            <Card style={styles.card}>
              <CardContent style={styles.metricsContent}>
                <View style={styles.metricsRow}>
                  {/* Supplier */}
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <IconTruck size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                        FORNECEDOR
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                      {multiStepForm.formData.supplierId ? selectedSupplierName : "Não definido"}
                    </ThemedText>
                  </View>

                  {/* Items Count */}
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <IconPackage size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                        ITENS
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValueLarge, { color: colors.foreground }]}>
                      {totals.itemCount}
                    </ThemedText>
                  </View>

                  {/* Delivery Date */}
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <IconCalendar size={16} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                        ENTREGA
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
                      {forecastDate ? forecastDate.toLocaleDateString("pt-BR") : "Não definida"}
                    </ThemedText>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Detalhes do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Descrição</ThemedText>
                  <ThemedText style={styles.detailValue}>{multiStepForm.formData.description}</ThemedText>
                </View>
                {multiStepForm.formData.notes && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Observações</ThemedText>
                    <ThemedText style={styles.detailValue}>{multiStepForm.formData.notes}</ThemedText>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Temporary Items (coexist with inventory items) */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Itens Temporários</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onPress={handleAddTemporaryItem}
                  disabled={isSubmitting}
                  style={styles.addItemButton}
                >
                  <IconPlus size={16} color={colors.foreground} />
                  <ThemedText style={styles.addButtonText}>Adicionar Item Temporário</ThemedText>
                </Button>

                {temporaryItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <IconBox size={40} color={colors.mutedForeground} />
                    <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      Nenhum item temporário
                    </ThemedText>
                  </View>
                ) : (
                  temporaryItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && (
                        <View style={[styles.itemSeparator, { backgroundColor: colors.border }]} />
                      )}
                      <ReanimatedSwipeableRow
                        rightActions={[
                          {
                            key: "delete",
                            label: "Excluir",
                            icon: <IconTrash size={18} color="white" />,
                            backgroundColor: "#9b2c2c",
                            onPress: () => handleRemoveTemporaryItem(item.id),
                            closeOnPress: true,
                          },
                        ]}
                        enabled={!isSubmitting}
                      >
                        <View style={styles.temporaryItemRow}>
                          <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                              <Label style={{ marginBottom: 0 }}>Descrição</Label>
                              <Text style={styles.requiredAsterisk}> *</Text>
                            </View>
                            <Input
                              value={item.description}
                              onChangeText={(val) => handleUpdateTemporaryItem(item.id, "description", val)}
                              placeholder="Descrição do item"
                              editable={!isSubmitting}
                            />
                          </View>

                          <View style={styles.rowFields}>
                            <View style={styles.smallField}>
                              <View style={styles.labelRow}>
                                <Label style={{ marginBottom: 0 }}>Qtd</Label>
                                <Text style={styles.requiredAsterisk}> *</Text>
                              </View>
                              <Input
                                value={String(item.quantity)}
                                onChangeText={(val) => handleUpdateTemporaryItem(item.id, "quantity", Number(val) || 0)}
                                keyboardType="numeric"
                                editable={!isSubmitting}
                              />
                            </View>
                            {canViewPrices && (
                              <>
                                <View style={styles.priceField}>
                                  <View style={styles.labelRow}>
                                    <Label style={{ marginBottom: 0 }}>Preço</Label>
                                    <Text style={styles.requiredAsterisk}> *</Text>
                                  </View>
                                  <Input
                                    type="currency"
                                    value={item.price}
                                    onChange={(val) => handleUpdateTemporaryItem(item.id, "price", typeof val === "number" ? val : 0)}
                                    editable={!isSubmitting}
                                  />
                                </View>
                                <View style={styles.smallField}>
                                  <Label>ICMS %</Label>
                                  <Input
                                    value={String(item.icms)}
                                    onChangeText={(val) => handleUpdateTemporaryItem(item.id, "icms", Number(val) || 0)}
                                    keyboardType="numeric"
                                    editable={!isSubmitting}
                                  />
                                </View>
                                <View style={styles.smallField}>
                                  <Label>IPI %</Label>
                                  <Input
                                    value={String(item.ipi)}
                                    onChangeText={(val) => handleUpdateTemporaryItem(item.id, "ipi", Number(val) || 0)}
                                    keyboardType="numeric"
                                    editable={!isSubmitting}
                                  />
                                </View>
                              </>
                            )}
                          </View>
                        </View>
                      </ReanimatedSwipeableRow>
                    </React.Fragment>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Payment Section — hidden entirely from roles that can't view prices
                (e.g. WAREHOUSE), matching web. */}
            {canViewPrices && (
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Pagamento (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Payment Responsible */}
                <Controller
                  control={form.control}
                  name="paymentResponsibleId"
                  render={({ field }) => (
                    <View style={styles.fieldGroup}>
                      <Label>Responsável pelo Pagamento</Label>
                      <Combobox
                        async
                        queryKey={["users", "payment-responsible-selector"]}
                        queryFn={async (searchTerm: string, page: number = 1) => {
                          const pageSize = 20;
                          const response = await getUsers({
                            take: pageSize,
                            skip: (page - 1) * pageSize,
                            includeSectorPrivileges: [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.ACCOUNTING],
                            where: {
                              currentContractStatus: CONTRACT_STATUS.ACTIVE,
                              ...(searchTerm ? {
                                OR: [
                                  { name: { contains: searchTerm, mode: "insensitive" } },
                                  { email: { contains: searchTerm, mode: "insensitive" } },
                                ],
                              } : {}),
                            },
                            orderBy: { name: "asc" },
                            select: {
                              id: true,
                              name: true,
                              email: true,
                            },
                          });
                          const users = response.data || [];
                          return {
                            data: users.map((user) => ({
                              value: user.id,
                              label: user.name,
                              description: user.email || undefined,
                            })),
                            hasMore: response.meta?.hasNextPage || false,
                          };
                        }}
                        minSearchLength={0}
                        pageSize={20}
                        debounceMs={500}
                        loadOnMount={false}
                        value={field.value || ""}
                        onValueChange={(val) => {
                          const value = Array.isArray(val) ? val[0] : val;
                          field.onChange(value ?? null);
                          handleFormChange("paymentResponsibleId", value ?? null);
                        }}
                        placeholder="Selecione o responsável"
                        emptyText="Nenhum usuário encontrado"
                        searchPlaceholder="Buscar por nome ou e-mail..."
                        disabled={isSubmitting}
                        searchable
                        clearable
                      />
                    </View>
                  )}
                />

                {/* Payment Method */}
                <Controller
                  control={form.control}
                  name="paymentMethod"
                  render={({ field: { value } }) => (
                    <View style={styles.fieldGroup}>
                      <Label>Método de Pagamento</Label>
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => {
                          const paymentMethodValue = val ? (val as PAYMENT_METHOD) : null;
                          handleFormChange("paymentMethod", paymentMethodValue);
                          // Auto-fill PIX from supplier when selecting PIX
                          if (val === PAYMENT_METHOD.PIX && multiStepForm.formData.supplierId) {
                            const selectedSupplier = suppliers?.data?.find(
                              (s) => s.id === multiStepForm.formData.supplierId
                            );
                            if (selectedSupplier?.pix) {
                              handleFormChange("paymentPix", selectedSupplier.pix);
                            }
                          }
                          // Clear conditional fields when changing method
                          if (val !== PAYMENT_METHOD.PIX) {
                            handleFormChange("paymentPix", null);
                          }
                          if (val !== PAYMENT_METHOD.BANK_SLIP) {
                            handleFormChange("paymentDueDays", null);
                            handleFormChange("paymentFirstDueDate", null);
                            handleFormChange("installmentCount", 1);
                          }
                        }}
                        options={[
                          { label: PAYMENT_METHOD_LABELS[PAYMENT_METHOD.PIX], value: PAYMENT_METHOD.PIX },
                          { label: PAYMENT_METHOD_LABELS[PAYMENT_METHOD.BANK_SLIP], value: PAYMENT_METHOD.BANK_SLIP },
                          { label: PAYMENT_METHOD_LABELS[PAYMENT_METHOD.CREDIT_CARD], value: PAYMENT_METHOD.CREDIT_CARD },
                        ]}
                        placeholder="Selecione o método de pagamento"
                        disabled={isSubmitting}
                        clearable
                      />
                    </View>
                  )}
                />

                {/* PIX Key (shown when PIX is selected) */}
                {multiStepForm.formData.paymentMethod === PAYMENT_METHOD.PIX && (
                  <Controller
                    control={form.control}
                    name="paymentPix"
                    render={({ field: { value }, fieldState: { error } }) => (
                      <View style={styles.fieldGroup}>
                        <Label>Chave Pix</Label>
                        <Input
                          value={value || ""}
                          onChangeText={(val) => handleFormChange("paymentPix", val)}
                          onBlur={() => {
                            const currentValue = form.getValues("paymentPix");
                            if (currentValue) {
                              const formatted = formatPixKey(currentValue);
                              form.setValue("paymentPix", formatted);
                              handleFormChange("paymentPix", formatted);
                            }
                          }}
                          placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
                          editable={!isSubmitting}
                          autoCapitalize="none"
                        />
                        {error && (
                          <ThemedText style={styles.errorText}>{error.message}</ThemedText>
                        )}
                        <ThemedText style={styles.helpText}>
                          Chave Pix para pagamento do pedido
                        </ThemedText>
                      </View>
                    )}
                  />
                )}

                {/* Boleto scheduling — parcelas, primeiro vencimento (presets ou data),
                    and the interval between parcelas. */}
                {multiStepForm.formData.paymentMethod === PAYMENT_METHOD.BANK_SLIP && (
                  <BoletoPaymentFields
                    installmentCount={multiStepForm.formData.installmentCount}
                    paymentFirstDueDate={multiStepForm.formData.paymentFirstDueDate}
                    paymentDueDays={multiStepForm.formData.paymentDueDays}
                    onChange={handleFormChange}
                    disabled={isSubmitting}
                  />
                )}

                {/* Freight */}
                {canViewPrices && (
                  <Controller
                    control={form.control}
                    name="freight"
                    render={({ field: { value } }) => (
                      <View style={styles.fieldGroup}>
                        <Label>Frete</Label>
                        <Input
                          type="currency"
                          value={(value as number | null | undefined) ?? 0}
                          onChange={(val) => handleFormChange("freight", typeof val === "number" ? val : 0)}
                          editable={!isSubmitting}
                        />
                        <ThemedText style={styles.helpText}>
                          Valor do frete somado ao total do pedido
                        </ThemedText>
                      </View>
                    )}
                  />
                )}

                {/* Discount */}
                {canViewPrices && (
                  <Controller
                    control={form.control}
                    name="discount"
                    render={({ field: { value } }) => (
                      <View style={styles.fieldGroup}>
                        <Label>Desconto (%)</Label>
                        <Input
                          type="percentage"
                          min={0}
                          max={100}
                          value={(value as number | null | undefined) ?? 0}
                          onChange={(val) => {
                            const num = typeof val === "number" ? val : 0;
                            const clamped = Math.min(100, Math.max(0, num));
                            handleFormChange("discount", clamped);
                          }}
                          editable={!isSubmitting}
                        />
                        <ThemedText style={styles.helpText}>
                          Percentual de desconto aplicado sobre o subtotal
                        </ThemedText>
                      </View>
                    )}
                  />
                )}

                {/* Manual total override — leave blank to use the automatic total computed from items. */}
                {canViewPrices && (
                  <Controller
                    control={form.control}
                    name="totalOverride"
                    render={({ field: { value } }) => (
                      <View style={styles.lastFieldGroup}>
                        <Label>Valor Total (manual)</Label>
                        <Input
                          type="currency"
                          value={(value as number | null | undefined) ?? null}
                          onChange={(val) => {
                            const num = typeof val === "number" ? val : null;
                            handleFormChange(
                              "totalOverride",
                              num != null && Number.isFinite(num) && num >= 0 ? num : null,
                            );
                          }}
                          placeholder="Total automático"
                          editable={!isSubmitting}
                        />
                        <ThemedText style={styles.helpText}>
                          Substitui o total calculado. Deixe em branco para usar o total automático.
                        </ThemedText>
                      </View>
                    )}
                  />
                )}
              </CardContent>
            </Card>
            )}

            {/* Items Table */}
            <Card style={[styles.card, styles.itemsCard]}>
              <CardHeader style={styles.itemsHeader}>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent style={styles.itemsContent}>
                {/* Table Header */}
                <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
                  <ThemedText style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 3 }]}>
                    ITEM
                  </ThemedText>
                  <ThemedText style={[styles.tableHeaderText, { color: colors.mutedForeground, width: 50, textAlign: "center" }]}>
                    QTD
                  </ThemedText>
                  {canViewPrices && (
                    <ThemedText style={[styles.tableHeaderText, { color: colors.mutedForeground, width: 80, textAlign: "right" }]}>
                      PREÇO
                    </ThemedText>
                  )}
                </View>

                {/* Table Body - unified list (inventory + temporary) */}
                {selectedItemsWithNames.length === 0 && temporaryItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <IconBox size={40} color={colors.mutedForeground} />
                    <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      Nenhum item no pedido
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    {selectedItemsWithNames.map((item, index) => (
                      <View
                        key={`inv-${item.id}`}
                        style={[
                          styles.tableRow,
                          { backgroundColor: index % 2 === 0 ? colors.background : colors.card, flexWrap: "wrap" },
                        ]}
                      >
                        <View style={styles.itemInfo}>
                          <ThemedText style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                            {item.uniCode ? `${item.name} - ${item.uniCode}` : item.name}
                          </ThemedText>
                          {item.brand && (
                            <ThemedText style={[styles.itemBrand, { color: colors.mutedForeground }]}>
                              {item.brand}
                            </ThemedText>
                          )}
                        </View>
                        <View style={styles.itemQuantity}>
                          <ThemedText style={[styles.quantityText, { color: colors.foreground }]}>
                            {formatQuantity(item.quantity)}
                          </ThemedText>
                        </View>
                        {canViewPrices && (
                          <View style={styles.itemPrice}>
                            <ThemedText style={[styles.priceText, { color: colors.foreground }]}>
                              {formatCurrency(item.price || 0)}
                            </ThemedText>
                          </View>
                        )}
                        {/* Per-item ICMS / IPI editing */}
                        {canViewPrices && (
                          <View style={styles.taxEditRow}>
                            <View style={styles.smallField}>
                              <Label>ICMS %</Label>
                              <Input
                                value={String(itemIcms[item.id] ?? 0)}
                                onChangeText={(val) =>
                                  setItemIcms((prev) => ({ ...prev, [item.id]: Number(val) || 0 }))
                                }
                                keyboardType="numeric"
                                editable={!isSubmitting}
                              />
                            </View>
                            <View style={styles.smallField}>
                              <Label>IPI %</Label>
                              <Input
                                value={String(itemIpi[item.id] ?? 0)}
                                onChangeText={(val) =>
                                  setItemIpi((prev) => ({ ...prev, [item.id]: Number(val) || 0 }))
                                }
                                keyboardType="numeric"
                                editable={!isSubmitting}
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                    {temporaryItems.map((item, index) => (
                      <View
                        key={`tmp-${item.id}`}
                        style={[
                          styles.tableRow,
                          {
                            backgroundColor:
                              (selectedItemsWithNames.length + index) % 2 === 0 ? colors.background : colors.card,
                          },
                        ]}
                      >
                        <View style={styles.itemInfo}>
                          <ThemedText style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                            {item.description || "Item temporário"}
                          </ThemedText>
                          <Badge variant="outline" size="sm">
                            <ThemedText style={{ fontSize: fontSize.xs }}>Temporário</ThemedText>
                          </Badge>
                        </View>
                        <View style={styles.itemQuantity}>
                          <ThemedText style={[styles.quantityText, { color: colors.foreground }]}>
                            {formatQuantity(item.quantity)}
                          </ThemedText>
                        </View>
                        {canViewPrices && (
                          <View style={styles.itemPrice}>
                            <ThemedText style={[styles.priceText, { color: colors.foreground }]}>
                              {formatCurrency(item.price)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {/* Table Footer */}
                {canViewPrices && (
                  <>
                    <View style={[styles.tableFooterRow, { borderTopColor: colors.border, backgroundColor: colors.muted }]}>
                      <ThemedText style={[styles.tableFooterText, { color: colors.foreground }]}>
                        Subtotal ({totals.totalQuantity} unidades)
                      </ThemedText>
                      <ThemedText style={[styles.tableFooterValue, { color: colors.foreground }]}>
                        {formatCurrency(totals.subtotal)}
                      </ThemedText>
                    </View>
                    {totals.discountAmount > 0 && (
                      <View style={[styles.tableFooterRow, { borderTopWidth: 0, marginTop: 0 }]}>
                        <ThemedText style={[styles.tableFooterText, { color: colors.foreground }]}>
                          Desconto ({discountValue}%)
                        </ThemedText>
                        <ThemedText style={[styles.tableFooterValue, { color: colors.foreground }]}>
                          - {formatCurrency(totals.discountAmount)}
                        </ThemedText>
                      </View>
                    )}
                    {freightValue > 0 && (
                      <View style={[styles.tableFooterRow, { borderTopWidth: 0, marginTop: 0 }]}>
                        <ThemedText style={[styles.tableFooterText, { color: colors.foreground }]}>
                          Frete
                        </ThemedText>
                        <ThemedText style={[styles.tableFooterValue, { color: colors.foreground }]}>
                          {formatCurrency(freightValue)}
                        </ThemedText>
                      </View>
                    )}
                    <View style={[styles.tableFooterRow, { borderTopColor: colors.border, marginTop: 0 }]}>
                      <ThemedText style={[styles.tableFooterText, { color: colors.foreground }]}>
                        Total
                      </ThemedText>
                      <ThemedText style={[styles.tableFooterValue, { color: colors.primary }]}>
                        {formatCurrency(totals.total)}
                      </ThemedText>
                    </View>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Comprovantes Summary */}
            {receiptFiles.length > 0 && (
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Comprovantes Anexados</CardTitle>
                </CardHeader>
                <CardContent>
                  {receiptFiles.length > 0 && (
                    <View style={styles.docSummaryRow}>
                      <ThemedText style={styles.docLabel}>Comprovantes</ThemedText>
                      <Badge variant="secondary">
                        <ThemedText>{receiptFiles.length} arquivo(s)</ThemedText>
                      </Badge>
                    </View>
                  )}
                </CardContent>
              </Card>
            )}
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
  step1Container: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  lastCard: {
    marginBottom: 0,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  lastFieldGroup: {
    marginBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  requiredAsterisk: {
    color: "#ef4444",
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  fieldSpacer: {
    height: spacing.md,
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
  temporaryItemsContainer: {
    flex: 1,
  },
  addItemButton: {
    marginBottom: spacing.md,
  },
  addButtonText: {
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    textAlign: "center",
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  temporaryItemRow: {
    paddingVertical: spacing.sm,
  },
  rowFields: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
    marginBottom: spacing.md,
  },
  smallField: {
    flex: 1,
  },
  priceField: {
    flex: 1.5,
  },
  taxEditRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    marginTop: spacing.xs,
  },
  errorContainer: {
    padding: spacing.md,
  },
  reviewContainer: {
    flex: 1,
  },
  metricsContent: {
    paddingVertical: spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  metricValueLarge: {
    fontSize: 20,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    marginLeft: spacing.md,
  },
  itemsCard: {
    flex: 1,
  },
  itemsHeader: {
    paddingBottom: spacing.xs,
  },
  itemsContent: {
    flex: 1,
    paddingTop: 0,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 44,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  itemInfo: {
    flex: 3,
  },
  itemCode: {
    fontSize: 10,
    fontWeight: "600",
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginTop: 1,
  },
  itemBrand: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  itemQuantity: {
    width: 50,
    alignItems: "center",
  },
  quantityText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  itemPrice: {
    width: 80,
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  tableFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1,
    marginTop: spacing.xs,
  },
  tableFooterText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  tableFooterValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  docSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  docLabel: {
    fontSize: fontSize.sm,
  },
});

export default OrderCreateForm;
