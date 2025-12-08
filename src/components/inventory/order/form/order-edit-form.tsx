import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { orderUpdateSchema } from '@/schemas';
import type { OrderUpdateFormData } from '@/schemas';
import { useOrderMutations, useOrder } from '@/hooks';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { FormActionBar } from '@/components/forms';
import { useTheme } from '@/lib/theme';
import { getSuppliers } from '@/api-client';
import type { Supplier } from '@/types';
import { createOrderFormData } from '@/utils/order-form-utils';
import { formSpacing } from '@/constants/form-styles';

interface OrderEditFormProps {
  orderId: string;
  onSuccess?: () => void;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({ orderId, onSuccess }) => {
  const theme = useTheme();
  const router = useRouter();

  const { data: orderResponse, isLoading: isLoadingOrder } = useOrder(orderId, {
    include: {
      supplier: true,
      items: {
        include: { item: { include: { brand: true, category: true } } },
      },
      budgets: true,
      invoices: true,
      receipts: true,
      reimbursements: true,
      invoiceReimbursements: true,
    },
  });
  const order = orderResponse?.data;

  const form = useForm<OrderUpdateFormData>({
    resolver: zodResolver(orderUpdateSchema),
    mode: 'onTouched',
  });

  const { updateAsync, isLoading } = useOrderMutations();


  // File upload state for all 5 types
  const [budgetFiles, setBudgetFiles] = useState<FilePickerItem[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<FilePickerItem[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<FilePickerItem[]>([]);
  const [reimbursementFiles, setReimbursementFiles] = useState<FilePickerItem[]>([]);
  const [reimbursementInvoiceFiles, setReimbursementInvoiceFiles] = useState<FilePickerItem[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Track existing file IDs (already uploaded)
  const [existingBudgetIds, setExistingBudgetIds] = useState<string[]>([]);
  const [existingInvoiceIds, setExistingInvoiceIds] = useState<string[]>([]);
  const [existingReceiptIds, setExistingReceiptIds] = useState<string[]>([]);
  const [existingReimbursementIds, setExistingReimbursementIds] = useState<string[]>([]);
  const [existingReimbursementInvoiceIds, setExistingReimbursementInvoiceIds] = useState<string[]>([]);

  // Memoize initial supplier options for async combobox
  const initialSupplierOptions = useMemo(
    () => order?.supplier ? [order.supplier] : [],
    [order?.supplier?.id]
  );

  // Async search function for suppliers
  const searchSuppliers = useCallback(async (
    search: string,
    page: number = 1
  ): Promise<{
    data: Supplier[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { fantasyName: "asc" },
      page: page,
      take: 50,
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getSuppliers(params);
      return {
        data: response.data || [],
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error('[OrderEditForm] Error fetching suppliers:', error);
      return { data: [], hasMore: false };
    }
  }, []);

  // Load order data into form
  useEffect(() => {
    if (order) {
      form.reset({
        description: order.description,
        supplierId: order.supplierId || undefined,
        forecast: order.forecast ? new Date(order.forecast) : undefined,
        notes: order.notes || '',
      });

      // Load existing file IDs
      if (order.budgets) {
        setExistingBudgetIds(order.budgets.map((f: any) => f.id));
      }
      if (order.invoices) {
        setExistingInvoiceIds(order.invoices.map((f: any) => f.id));
      }
      if (order.receipts) {
        setExistingReceiptIds(order.receipts.map((f: any) => f.id));
      }
      if (order.reimbursements) {
        setExistingReimbursementIds(order.reimbursements.map((f: any) => f.id));
      }
      if (order.invoiceReimbursements) {
        setExistingReimbursementInvoiceIds(order.invoiceReimbursements.map((f: any) => f.id));
      }
    }
  }, [order, form]);


  const handleSubmit = useCallback(
    async (data: OrderUpdateFormData) => {
      try {
        // Only send changed fields
        const changedData: Partial<OrderUpdateFormData> = {};

        if (data.description !== order?.description) {
          changedData.description = data.description;
        }
        if (data.supplierId !== order?.supplierId) {
          changedData.supplierId = data.supplierId;
        }
        if (data.forecast?.getTime() !== order?.forecast?.getTime()) {
          changedData.forecast = data.forecast;
        }
        if (data.notes !== order?.notes) {
          changedData.notes = data.notes;
        }

        // Check if there are new files to upload
        const hasNewFiles =
          budgetFiles.length > 0 ||
          invoiceFiles.length > 0 ||
          receiptFiles.length > 0 ||
          reimbursementFiles.length > 0 ||
          reimbursementInvoiceFiles.length > 0;

        setIsUploadingFiles(hasNewFiles);

        // Include existing file IDs in changedData (will be preserved on backend)
        if (existingBudgetIds.length > 0) {
          changedData.budgetIds = existingBudgetIds;
        }
        if (existingInvoiceIds.length > 0) {
          changedData.invoiceIds = existingInvoiceIds;
        }
        if (existingReceiptIds.length > 0) {
          changedData.receiptIds = existingReceiptIds;
        }
        if (existingReimbursementIds.length > 0) {
          changedData.reimbursementIds = existingReimbursementIds;
        }
        if (existingReimbursementInvoiceIds.length > 0) {
          changedData.reimbursementInvoiceIds = existingReimbursementInvoiceIds;
        }

        if (Object.keys(changedData).length === 0 && !hasNewFiles) {
          Alert.alert('Aviso', 'Nenhuma alteração foi feita');
          return;
        }

        let result;
        try {
          if (hasNewFiles) {
            // ATOMIC SUBMISSION: Use FormData when there are new files
            // This prevents race conditions by submitting files + data in single request
            const supplier = data.supplierId
              ? await getSuppliers({ where: { id: data.supplierId } }).then((res) => res.data?.[0])
              : order?.supplier;

            const formDataWithFiles = createOrderFormData(
              { ...changedData, id: orderId },
              {
                budgets: budgetFiles.length > 0 ? budgetFiles : undefined,
                receipts: receiptFiles.length > 0 ? receiptFiles : undefined,
                invoices: invoiceFiles.length > 0 ? invoiceFiles : undefined,
              },
              supplier
                ? {
                    id: supplier.id,
                    name: supplier.name,
                    fantasyName: supplier.fantasyName,
                  }
                : undefined
            );

            result = await updateAsync({ id: orderId, data: formDataWithFiles as any });
          } else {
            // Use regular JSON payload when no new files
            result = await updateAsync({ id: orderId, data: changedData });
          }
        } finally {
          setIsUploadingFiles(false);
        }

        if (result.success) {
          // API client already shows success alert

          if (onSuccess) {
            onSuccess();
          } else {
            router.back();
          }
        }
      } catch (error) {
        console.error('Error updating order:', error);
        Alert.alert('Erro', 'Falha ao atualizar pedido');
      }
    },
    [
      orderId,
      order,
      budgetFiles,
      invoiceFiles,
      receiptFiles,
      reimbursementFiles,
      reimbursementInvoiceFiles,
      existingBudgetIds,
      existingInvoiceIds,
      existingReceiptIds,
      existingReimbursementIds,
      existingReimbursementInvoiceIds,
      updateAsync,
      onSuccess,
      router,
    ]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: formSpacing.containerPaddingHorizontal,
      paddingTop: formSpacing.containerPaddingVertical,
      paddingBottom: 0,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold as any,
      marginBottom: theme.spacing.md,
      color: theme.colors.foreground,
    },
    field: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium as any,
      marginBottom: theme.spacing.xs,
      color: theme.colors.textSecondary,
    },
    required: {
      color: theme.colors.error,
    },
    itemsNote: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.md,
    },
  });

  if (isLoadingOrder) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Carregando...</ThemedText>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Pedido não encontrado</ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          <Card style={styles.section}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Descrição <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Ex: Pedido de materiais de escritório"
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Fornecedor</ThemedText>
            <Controller
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <Combobox<Supplier>
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  async={true}
                  queryKey={["suppliers", "order-edit"]}
                  queryFn={searchSuppliers}
                  initialOptions={initialSupplierOptions}
                  getOptionLabel={(supplier) => supplier.fantasyName}
                  getOptionValue={(supplier) => supplier.id}
                  placeholder="Selecione um fornecedor (opcional)"
                  searchPlaceholder="Buscar fornecedor..."
                  emptyText="Nenhum fornecedor encontrado"
                  minSearchLength={0}
                  pageSize={50}
                  debounceMs={300}
                  clearable={true}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Previsão de Entrega</ThemedText>
            <Controller
              control={form.control}
              name="forecast"
              render={({ field }) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  mode="date"
                  placeholder="Selecione uma data"
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Observações</ThemedText>
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Input
                  value={field.value || ''}
                  onChangeText={field.onChange}
                  placeholder="Observações sobre o pedido (opcional)"
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>
        </Card>

        {/* Documents Section */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Documentos</ThemedText>
          <ThemedText style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
            {existingBudgetIds.length > 0 && `${existingBudgetIds.length} orçamento(s) existente(s). `}
            {existingInvoiceIds.length > 0 && `${existingInvoiceIds.length} nota(s) fiscal(is) existente(s). `}
            {existingReceiptIds.length > 0 && `${existingReceiptIds.length} recibo(s) existente(s). `}
            {existingReimbursementIds.length > 0 && `${existingReimbursementIds.length} reembolso(s) existente(s). `}
            {existingReimbursementInvoiceIds.length > 0 && `${existingReimbursementInvoiceIds.length} NF(s) de reembolso existente(s). `}
          </ThemedText>

          <FilePicker
            value={budgetFiles}
            onChange={setBudgetFiles}
            maxFiles={10}
            label="Adicionar Orçamentos"
            placeholder="Adicionar orçamentos"
            helperText="Selecione até 10 arquivos de orçamento"
            disabled={isLoading || isUploadingFiles}
            showCamera={true}
            showGallery={true}
            showFilePicker={true}
          />

          <FilePicker
            value={invoiceFiles}
            onChange={setInvoiceFiles}
            maxFiles={10}
            label="Adicionar Notas Fiscais"
            placeholder="Adicionar notas fiscais"
            helperText="Selecione até 10 notas fiscais"
            disabled={isLoading || isUploadingFiles}
            showCamera={true}
            showGallery={true}
            showFilePicker={true}
          />

          <FilePicker
            value={receiptFiles}
            onChange={setReceiptFiles}
            maxFiles={10}
            label="Adicionar Recibos"
            placeholder="Adicionar recibos"
            helperText="Selecione até 10 recibos"
            disabled={isLoading || isUploadingFiles}
            showCamera={true}
            showGallery={true}
            showFilePicker={true}
          />

          <FilePicker
            value={reimbursementFiles}
            onChange={setReimbursementFiles}
            maxFiles={10}
            label="Adicionar Reembolsos"
            placeholder="Adicionar reembolsos"
            helperText="Selecione até 10 arquivos de reembolso"
            disabled={isLoading || isUploadingFiles}
            showCamera={true}
            showGallery={true}
            showFilePicker={true}
          />

          <FilePicker
            value={reimbursementInvoiceFiles}
            onChange={setReimbursementInvoiceFiles}
            maxFiles={10}
            label="Adicionar Notas Fiscais de Reembolso"
            placeholder="Adicionar notas de reembolso"
            helperText="Selecione até 10 notas de reembolso"
            disabled={isLoading || isUploadingFiles}
            showCamera={true}
            showGallery={true}
            showFilePicker={true}
          />
        </Card>

        {/* Items Note */}
        <Card style={styles.section}>
          <View style={styles.itemsNote}>
            <ThemedText style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
              Nota: Para editar itens, quantidades ou preços, acesse a página de detalhes do pedido.
            </ThemedText>
          </View>
        </Card>
      </ScrollView>

      <FormActionBar
        onCancel={() => router.back()}
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isLoading || isUploadingFiles}
        canSubmit={form.formState.isValid}
        submitLabel="Salvar"
        submittingLabel={isUploadingFiles ? 'Enviando arquivos...' : 'Salvando...'}
      />
    </KeyboardAvoidingView>
  );
};
