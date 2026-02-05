import { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";

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
import { useSuppliers, useItems, useOrderMutations } from "@/hooks";
import { useMultiStepForm } from "@/hooks";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_METHOD_LABELS, BANK_SLIP_DUE_DAYS_OPTIONS } from "@/constants";
import { formatCurrency, formatPixKey } from "@/utils";
import { createOrderFormData } from "@/utils/order-form-utils";
import type { FormStep } from "@/components/ui/form-steps";
import type { OrderCreateFormData as OrderCreateFormDataSchema } from "@/schemas";
import {
  MultiStepFormContainer,
  ItemSelectorTable,
} from "@/components/forms";
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
  notes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
  itemMode: z.enum(["inventory", "temporary"]).default("inventory"),
  paymentMethod: z.enum([PAYMENT_METHOD.PIX, PAYMENT_METHOD.BANK_SLIP, PAYMENT_METHOD.CREDIT_CARD]).optional().nullable(),
  paymentPix: z.string().max(100, "Chave Pix deve ter no máximo 100 caracteres").optional().nullable(),
  paymentDueDays: z.number().int().positive().optional().nullable(),
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
  const router = useRouter();

  // Local state for date (since it's a Date object)
  const [forecastDate, setForecastDate] = useState<Date | undefined>(undefined);

  // Temporary items state (for temporary item mode)
  const [temporaryItems, setTemporaryItems] = useState<TemporaryItem[]>([]);

  // File upload states
  const [budgetFiles, setBudgetFiles] = useState<FilePickerItem[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<FilePickerItem[]>([]);
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
      itemMode: "inventory",
      paymentMethod: null,
      paymentPix: null,
      paymentDueDays: null,
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
        // At least one item selected (inventory mode) or temporary items added
        if (state.formData.itemMode === "inventory") {
          return state.selectedItems.length > 0;
        } else {
          return temporaryItems.length > 0 && temporaryItems.every(
            item => item.description.trim() && item.quantity > 0 && item.price >= 0
          );
        }
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
        if (state.formData.itemMode === "inventory" && state.selectedItems.length === 0) {
          errors.items = "Selecione pelo menos um item";
        }
        if (state.formData.itemMode === "temporary" && temporaryItems.length === 0) {
          errors.items = "Adicione pelo menos um item temporário";
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

  // Calculate totals for review
  const totals = useMemo(() => {
    if (multiStepForm.formData.itemMode === "inventory") {
      const items = multiStepForm.getSelectedItemsWithData();
      const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        itemCount: items.length,
        totalQuantity,
        subtotal,
      };
    } else {
      const subtotal = temporaryItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const totalQuantity = temporaryItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        itemCount: temporaryItems.length,
        totalQuantity,
        subtotal,
      };
    }
  }, [multiStepForm, temporaryItems]);

  // Temporary item handlers
  const handleAddTemporaryItem = useCallback(() => {
    setTemporaryItems((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        description: "",
        quantity: 1,
        price: 0,
        icms: 0,
        ipi: 0,
      },
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
      let itemsData: NonNullable<OrderCreateFormDataSchema["items"]> = [];

      if (multiStepForm.formData.itemMode === "inventory") {
        const items = multiStepForm.getSelectedItemsWithData();
        const invalidItems = items.filter((item) => item.quantity <= 0 || (item.price || 0) < 0);

        if (invalidItems.length > 0) {
          Alert.alert("Erro", "Todos os itens devem ter quantidade maior que zero");
          return;
        }

        itemsData = items.map((item) => ({
          itemId: item.id,
          orderedQuantity: item.quantity,
          price: item.price || 0,
          icms: 0,
          ipi: 0,
          isCritical: false,
        }));
      } else {
        // Temporary items validation
        const invalidTempItems = temporaryItems.filter(
          (item) => !item.description.trim() || item.quantity <= 0 || item.price < 0
        );

        if (invalidTempItems.length > 0) {
          Alert.alert("Erro", "Todos os itens temporários devem ter descrição, quantidade e preço válidos");
          return;
        }

        itemsData = temporaryItems.map((item) => ({
          temporaryItemDescription: item.description,
          orderedQuantity: item.quantity,
          price: item.price,
          icms: item.icms,
          ipi: item.ipi,
          isCritical: false,
        }));
      }

      // Prepare order data
      const orderData: OrderCreateFormDataSchema = {
        description: multiStepForm.formData.description,
        status: ORDER_STATUS.CREATED,
        supplierId: multiStepForm.formData.supplierId || undefined,
        forecast: forecastDate ?? null,
        notes: multiStepForm.formData.notes || undefined,
        items: itemsData,
        paymentMethod: multiStepForm.formData.paymentMethod || undefined,
        paymentPix: multiStepForm.formData.paymentMethod === PAYMENT_METHOD.PIX ? multiStepForm.formData.paymentPix || undefined : undefined,
        paymentDueDays: multiStepForm.formData.paymentMethod === PAYMENT_METHOD.BANK_SLIP ? multiStepForm.formData.paymentDueDays || undefined : undefined,
      };

      // Check if there are files to upload
      const hasFiles =
        budgetFiles.length > 0 ||
        invoiceFiles.length > 0 ||
        receiptFiles.length > 0;

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
              budgets: budgetFiles.length > 0 ? budgetFiles : undefined,
              receipts: receiptFiles.length > 0 ? receiptFiles : undefined,
              invoices: invoiceFiles.length > 0 ? invoiceFiles : undefined,
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
          setBudgetFiles([]);
          setInvoiceFiles([]);
          setReceiptFiles([]);

          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/(tabs)/estoque/pedidos/detalhes/${result.data.id}` as never);
          }
        }
      } catch (error) {
        console.error("Error uploading files or creating order:", error);
        Alert.alert("Erro", "Falha ao fazer upload dos arquivos ou criar pedido");
      } finally {
        setIsUploadingFiles(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert("Erro", "Falha ao criar pedido");
    }
  }, [
    multiStepForm,
    temporaryItems,
    forecastDate,
    budgetFiles,
    invoiceFiles,
    receiptFiles,
    suppliers,
    createAsync,
    onSuccess,
    router,
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
              setBudgetFiles([]);
              setInvoiceFiles([]);
              setReceiptFiles([]);
              router.back();
            },
          },
        ],
      );
    } else {
      router.back();
    }
  }, [multiStepForm, temporaryItems, router]);

  // Loading state
  if (multiStepForm.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ThemedText>Carregando...</ThemedText>
      </View>
    );
  }

  const isSubmitting = isMutating || isUploadingFiles;
  const isInventoryMode = multiStepForm.formData.itemMode === "inventory";

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
        scrollable={multiStepForm.currentStep !== 2 || !isInventoryMode}
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
                        <ThemedText style={styles.requiredAsterisk}> *</ThemedText>
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

                {/* Item Mode Selection */}
                <Controller
                  control={form.control}
                  name="itemMode"
                  render={({ field: { value } }) => (
                    <View style={styles.fieldGroup}>
                      <Label>Tipo de Itens</Label>
                      <Combobox
                        value={value || "inventory"}
                        onValueChange={(val) => handleFormChange("itemMode", (val || "inventory") as "inventory" | "temporary")}
                        options={[
                          { label: "Itens do Estoque", value: "inventory" },
                          { label: "Itens Temporários", value: "temporary" },
                        ]}
                        placeholder="Selecione o tipo de itens"
                        disabled={isSubmitting}
                        clearable={false}
                      />
                      <ThemedText style={styles.helpText}>
                        {isInventoryMode
                          ? "Selecione itens cadastrados no estoque"
                          : "Adicione itens avulsos que não estão no estoque"}
                      </ThemedText>
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

            {/* Payment Section */}
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Pagamento (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
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

                {/* Due Days (shown when BANK_SLIP is selected) */}
                {multiStepForm.formData.paymentMethod === PAYMENT_METHOD.BANK_SLIP && (
                  <Controller
                    control={form.control}
                    name="paymentDueDays"
                    render={({ field: { value } }) => (
                      <View style={styles.fieldGroup}>
                        <Label>Prazo de Vencimento</Label>
                        <Combobox
                          value={value?.toString() || ""}
                          onValueChange={(val) => handleFormChange("paymentDueDays", val ? Number(val) : null)}
                          options={BANK_SLIP_DUE_DAYS_OPTIONS.map((days) => ({
                            label: `${days} dias`,
                            value: days.toString(),
                          }))}
                          placeholder="Selecione o prazo"
                          disabled={isSubmitting}
                          clearable
                        />
                        <ThemedText style={styles.helpText}>
                          Prazo para vencimento do boleto
                        </ThemedText>
                      </View>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card style={styles.lastCard}>
              <CardHeader>
                <CardTitle>Documentos (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <FilePicker
                  value={budgetFiles}
                  onChange={setBudgetFiles}
                  maxFiles={10}
                  label="Orçamentos"
                  placeholder="Adicionar orçamentos"
                  helperText="Selecione até 10 arquivos de orçamento"
                  disabled={isSubmitting}
                  showCamera={true}
                  showGallery={true}
                  showFilePicker={true}
                />
                <View style={styles.fieldSpacer} />
                <FilePicker
                  value={invoiceFiles}
                  onChange={setInvoiceFiles}
                  maxFiles={10}
                  label="Notas Fiscais"
                  placeholder="Adicionar notas fiscais"
                  helperText="Selecione até 10 notas fiscais"
                  disabled={isSubmitting}
                  showCamera={true}
                  showGallery={true}
                  showFilePicker={true}
                />
                <View style={styles.fieldSpacer} />
                <FilePicker
                  value={receiptFiles}
                  onChange={setReceiptFiles}
                  maxFiles={10}
                  label="Recibos"
                  placeholder="Adicionar recibos"
                  helperText="Selecione até 10 recibos"
                  disabled={isSubmitting}
                  showCamera={true}
                  showGallery={true}
                  showFilePicker={true}
                />
              </CardContent>
            </Card>
          </View>
        )}

        {/* Step 2: Item Selection */}
        {multiStepForm.currentStep === 2 && (
          <View style={styles.itemSelectorContainer}>
            {isInventoryMode ? (
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
                showPriceInput
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
            ) : (
              <View style={styles.temporaryItemsContainer}>
                <Card style={styles.card}>
                  <CardHeader style={styles.temporaryItemsHeader}>
                    <CardTitle>Itens Temporários</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={handleAddTemporaryItem}
                      disabled={isSubmitting}
                    >
                      <IconPlus size={16} color={colors.foreground} />
                      <ThemedText style={styles.addButtonText}>Adicionar</ThemedText>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {temporaryItems.length === 0 ? (
                      <View style={styles.emptyState}>
                        <IconBox size={48} color={colors.mutedForeground} />
                        <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                          Nenhum item adicionado
                        </ThemedText>
                        <Button
                          variant="default"
                          onPress={handleAddTemporaryItem}
                          disabled={isSubmitting}
                        >
                          <IconPlus size={16} color={colors.primaryForeground} />
                          <ThemedText style={{ color: colors.primaryForeground, marginLeft: spacing.xs }}>
                            Adicionar Item
                          </ThemedText>
                        </Button>
                      </View>
                    ) : (
                      temporaryItems.map((item, index) => (
                        <Card
                          key={item.id}
                          style={[
                            styles.temporaryItemCard,
                            index < temporaryItems.length - 1 && styles.temporaryItemCardSpaced,
                          ]}
                        >
                          <View style={styles.temporaryItemHeader}>
                            <ThemedText style={styles.temporaryItemTitle}>
                              Item #{index + 1}
                            </ThemedText>
                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() => handleRemoveTemporaryItem(item.id)}
                              disabled={isSubmitting}
                            >
                              <IconTrash size={16} color={colors.destructive} />
                            </Button>
                          </View>

                          <View style={styles.fieldGroup}>
                            <Label>Descrição *</Label>
                            <Input
                              value={item.description}
                              onChangeText={(val) => handleUpdateTemporaryItem(item.id, "description", val)}
                              placeholder="Descrição do item"
                              editable={!isSubmitting}
                            />
                          </View>

                          <View style={styles.rowFields}>
                            <View style={styles.halfField}>
                              <Label>Quantidade *</Label>
                              <Input
                                value={String(item.quantity)}
                                onChangeText={(val) => handleUpdateTemporaryItem(item.id, "quantity", Number(val) || 0)}
                                keyboardType="numeric"
                                editable={!isSubmitting}
                              />
                            </View>
                            <View style={styles.halfField}>
                              <Label>Preço Unitário *</Label>
                              <Input
                                value={String(item.price)}
                                onChangeText={(val) => handleUpdateTemporaryItem(item.id, "price", Number(val) || 0)}
                                keyboardType="decimal-pad"
                                editable={!isSubmitting}
                              />
                            </View>
                          </View>

                          <View style={styles.rowFields}>
                            <View style={styles.halfField}>
                              <Label>ICMS (%)</Label>
                              <Input
                                value={String(item.icms)}
                                onChangeText={(val) => handleUpdateTemporaryItem(item.id, "icms", Number(val) || 0)}
                                keyboardType="numeric"
                                editable={!isSubmitting}
                              />
                            </View>
                            <View style={styles.halfField}>
                              <Label>IPI (%)</Label>
                              <Input
                                value={String(item.ipi)}
                                onChangeText={(val) => handleUpdateTemporaryItem(item.id, "ipi", Number(val) || 0)}
                                keyboardType="numeric"
                                editable={!isSubmitting}
                              />
                            </View>
                          </View>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>

                {multiStepForm.formTouched && multiStepForm.validation.errors.items && (
                  <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>
                      {multiStepForm.validation.errors.items}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
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
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Tipo</ThemedText>
                  <Badge variant={isInventoryMode ? "default" : "secondary"}>
                    <ThemedText>{isInventoryMode ? "Estoque" : "Temporário"}</ThemedText>
                  </Badge>
                </View>
              </CardContent>
            </Card>

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
                  <ThemedText style={[styles.tableHeaderText, { color: colors.mutedForeground, width: 80, textAlign: "right" }]}>
                    PREÇO
                  </ThemedText>
                </View>

                {/* Table Body */}
                {isInventoryMode ? (
                  selectedItemsWithNames.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        { backgroundColor: index % 2 === 0 ? colors.background : colors.card },
                        index === selectedItemsWithNames.length - 1 && styles.tableRowLast,
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
                          {item.quantity}
                        </ThemedText>
                      </View>
                      <View style={styles.itemPrice}>
                        <ThemedText style={[styles.priceText, { color: colors.foreground }]}>
                          {formatCurrency(item.price || 0)}
                        </ThemedText>
                      </View>
                    </View>
                  ))
                ) : (
                  temporaryItems.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        { backgroundColor: index % 2 === 0 ? colors.background : colors.card },
                        index === temporaryItems.length - 1 && styles.tableRowLast,
                      ]}
                    >
                      <View style={styles.itemInfo}>
                        <ThemedText style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                          {item.description || "Sem descrição"}
                        </ThemedText>
                      </View>
                      <View style={styles.itemQuantity}>
                        <ThemedText style={[styles.quantityText, { color: colors.foreground }]}>
                          {item.quantity}
                        </ThemedText>
                      </View>
                      <View style={styles.itemPrice}>
                        <ThemedText style={[styles.priceText, { color: colors.foreground }]}>
                          {formatCurrency(item.price)}
                        </ThemedText>
                      </View>
                    </View>
                  ))
                )}

                {/* Table Footer */}
                <View style={[styles.tableFooterRow, { borderTopColor: colors.border, backgroundColor: colors.muted }]}>
                  <ThemedText style={[styles.tableFooterText, { color: colors.foreground }]}>
                    Total ({totals.totalQuantity} unidades)
                  </ThemedText>
                  <ThemedText style={[styles.tableFooterValue, { color: colors.primary }]}>
                    {formatCurrency(totals.subtotal)}
                  </ThemedText>
                </View>
              </CardContent>
            </Card>

            {/* Documents Summary */}
            {(budgetFiles.length > 0 || invoiceFiles.length > 0 || receiptFiles.length > 0) && (
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Documentos Anexados</CardTitle>
                </CardHeader>
                <CardContent>
                  {budgetFiles.length > 0 && (
                    <View style={styles.docSummaryRow}>
                      <ThemedText style={styles.docLabel}>Orçamentos</ThemedText>
                      <Badge variant="secondary">
                        <ThemedText>{budgetFiles.length} arquivo(s)</ThemedText>
                      </Badge>
                    </View>
                  )}
                  {invoiceFiles.length > 0 && (
                    <View style={styles.docSummaryRow}>
                      <ThemedText style={styles.docLabel}>Notas Fiscais</ThemedText>
                      <Badge variant="secondary">
                        <ThemedText>{invoiceFiles.length} arquivo(s)</ThemedText>
                      </Badge>
                    </View>
                  )}
                  {receiptFiles.length > 0 && (
                    <View style={styles.docSummaryRow}>
                      <ThemedText style={styles.docLabel}>Recibos</ThemedText>
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
  temporaryItemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  temporaryItemCard: {
    padding: spacing.md,
  },
  temporaryItemCardSpaced: {
    marginBottom: spacing.md,
  },
  temporaryItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  temporaryItemTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  rowFields: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
    marginBottom: spacing.md,
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
