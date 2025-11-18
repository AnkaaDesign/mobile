import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { orderCreateSchema } from '@/schemas';
import type { OrderCreateFormData } from '@/schemas';
import { useOrderMutations, useItems, useFile } from '@/hooks';
import { ORDER_STATUS } from '@/constants';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Combobox } from '@/components/ui/combobox';
import { RadioGroup } from '@/components/ui/radio-group';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { FileUploadField } from '@/components/ui/file-upload-field';
import type { FileWithPreview } from '@/components/ui/file-upload-field';
import { useTheme } from '@/lib/theme';
import { routeToMobilePath } from '@/lib/route-mapper';
import { showToast } from '@/lib/toast';
import { getSuppliers } from '@/api-client';
import type { Supplier } from '@/types';

interface OrderCreateFormProps {
  onSuccess?: () => void;
}

export const OrderCreateForm: React.FC<OrderCreateFormProps> = ({ onSuccess }) => {
  const theme = useTheme();
  const router = useRouter();
  const [orderItemMode, setOrderItemMode] = useState<'inventory' | 'temporary'>('inventory');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [itemIcms, setItemIcms] = useState<Record<string, number>>({});
  const [itemIpi, setItemIpi] = useState<Record<string, number>>({});
  const [temporaryItems, setTemporaryItems] = useState<Array<{
    temporaryItemDescription: string;
    orderedQuantity: number;
    price: number | null;
    icms: number;
    ipi: number;
  }>>([{ temporaryItemDescription: '', orderedQuantity: 1, price: null, icms: 0, ipi: 0 }]);

  // File upload state for all 5 types
  const [budgetFiles, setBudgetFiles] = useState<FileWithPreview[]>([]);
  const [invoiceFiles, setInvoiceFiles] = useState<FileWithPreview[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<FileWithPreview[]>([]);
  const [reimbursementFiles, setReimbursementFiles] = useState<FileWithPreview[]>([]);
  const [reimbursementInvoiceFiles, setReimbursementInvoiceFiles] = useState<FileWithPreview[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const form = useForm<OrderCreateFormData>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      description: '',
      status: ORDER_STATUS.CREATED,
      supplierId: undefined,
      forecast: undefined,
      notes: '',
      items: [],
      temporaryItems: [],
    },
    mode: 'onTouched',
  });

  const { createAsync, isLoading } = useOrderMutations();

  // Setup file upload hooks for each file type
  const budgetUpload = useFile({
    entityType: 'order',
    fileContext: 'budget',
  });

  const invoiceUpload = useFile({
    entityType: 'order',
    fileContext: 'invoice',
  });

  const receiptUpload = useFile({
    entityType: 'order',
    fileContext: 'receipt',
  });

  const reimbursementUpload = useFile({
    entityType: 'order',
    fileContext: 'reimbursement',
  });

  const reimbursementInvoiceUpload = useFile({
    entityType: 'order',
    fileContext: 'reimbursementInvoice',
  });

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
      console.error('[OrderCreateForm] Error fetching suppliers:', error);
      return { data: [], hasMore: false };
    }
  }, []);

  // Fetch all items for selection (simplified - should use paginated selector)
  const { data: itemsResponse } = useItems({
    orderBy: { name: 'asc' },
    take: 100,
    where: { isActive: true },
    include: { brand: true, category: true },
  });
  const items = itemsResponse?.data || [];

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        label: `${item.name}${item.uniCode ? ` (${item.uniCode})` : ''}`,
        value: item.id,
      })),
    [items]
  );

  const handleAddTemporaryItem = useCallback(() => {
    setTemporaryItems((prev) => [
      ...prev,
      { temporaryItemDescription: '', orderedQuantity: 1, price: null, icms: 0, ipi: 0 },
    ]);
  }, []);

  const handleRemoveTemporaryItem = useCallback((index: number) => {
    setTemporaryItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateTemporaryItem = useCallback(
    (index: number, field: string, value: any) => {
      setTemporaryItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  // File picker handlers
  const handlePickFiles = useCallback(async (
    fileType: 'budget' | 'invoice' | 'receipt' | 'reimbursement' | 'reimbursementInvoice',
    setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const newFiles: FileWithPreview[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Erro', 'Falha ao selecionar arquivos');
    }
  }, []);

  const handleRemoveFile = useCallback((
    index: number,
    setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  ) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (data: OrderCreateFormData) => {
      try {
        let itemsData: any[] = [];

        if (orderItemMode === 'inventory') {
          // Validate selection
          if (selectedItems.size === 0) {
            Alert.alert('Erro', 'Selecione pelo menos um item');
            return;
          }

          // Validate prices
          const itemsWithoutPrice = Array.from(selectedItems).filter(
            (id) => !itemPrices[id] || itemPrices[id] <= 0
          );
          if (itemsWithoutPrice.length > 0) {
            Alert.alert('Erro', 'Todos os itens devem ter preço definido');
            return;
          }

          itemsData = Array.from(selectedItems).map((itemId) => ({
            itemId,
            orderedQuantity: itemQuantities[itemId] || 1,
            price: itemPrices[itemId] || 0,
            icms: itemIcms[itemId] || 0,
            ipi: itemIpi[itemId] || 0,
          }));
        } else {
          // Validate temporary items
          if (temporaryItems.length === 0) {
            Alert.alert('Erro', 'Adicione pelo menos um item temporário');
            return;
          }

          const hasIncomplete = temporaryItems.some(
            (item) =>
              !item.temporaryItemDescription ||
              !item.orderedQuantity ||
              item.orderedQuantity <= 0 ||
              item.price === null ||
              item.price < 0
          );

          if (hasIncomplete) {
            Alert.alert('Erro', 'Todos os itens devem ter descrição, quantidade e preço');
            return;
          }

          itemsData = temporaryItems;
        }

        // Upload files and collect IDs
        setIsUploadingFiles(true);

        try {
          // Upload budget files
          for (const filePreview of budgetFiles) {
            await budgetUpload.addFile({
              uri: filePreview.uri,
              name: filePreview.name,
              type: filePreview.type,
              size: filePreview.size || 0,
            });
          }

          // Upload invoice files
          for (const filePreview of invoiceFiles) {
            await invoiceUpload.addFile({
              uri: filePreview.uri,
              name: filePreview.name,
              type: filePreview.type,
              size: filePreview.size || 0,
            });
          }

          // Upload receipt files
          for (const filePreview of receiptFiles) {
            await receiptUpload.addFile({
              uri: filePreview.uri,
              name: filePreview.name,
              type: filePreview.type,
              size: filePreview.size || 0,
            });
          }

          // Upload reimbursement files
          for (const filePreview of reimbursementFiles) {
            await reimbursementUpload.addFile({
              uri: filePreview.uri,
              name: filePreview.name,
              type: filePreview.type,
              size: filePreview.size || 0,
            });
          }

          // Upload reimbursement invoice files
          for (const filePreview of reimbursementInvoiceFiles) {
            await reimbursementInvoiceUpload.addFile({
              uri: filePreview.uri,
              name: filePreview.name,
              type: filePreview.type,
              size: filePreview.size || 0,
            });
          }

          // Collect uploaded file IDs
          const budgetIds = budgetUpload.uploadedFiles
            .filter((f) => f.status === 'completed' && f.id)
            .map((f) => f.id!);

          const invoiceIds = invoiceUpload.uploadedFiles
            .filter((f) => f.status === 'completed' && f.id)
            .map((f) => f.id!);

          const receiptIds = receiptUpload.uploadedFiles
            .filter((f) => f.status === 'completed' && f.id)
            .map((f) => f.id!);

          const reimbursementIds = reimbursementUpload.uploadedFiles
            .filter((f) => f.status === 'completed' && f.id)
            .map((f) => f.id!);

          const reimbursementInvoiceIds = reimbursementInvoiceUpload.uploadedFiles
            .filter((f) => f.status === 'completed' && f.id)
            .map((f) => f.id!);

          const orderData: OrderCreateFormData = {
            ...data,
            items: orderItemMode === 'inventory' ? itemsData : [],
            temporaryItems: orderItemMode === 'temporary' ? itemsData : [],
            budgetIds: budgetIds.length > 0 ? budgetIds : undefined,
            invoiceIds: invoiceIds.length > 0 ? invoiceIds : undefined,
            receiptIds: receiptIds.length > 0 ? receiptIds : undefined,
            reimbursementIds: reimbursementIds.length > 0 ? reimbursementIds : undefined,
            reimbursementInvoiceIds: reimbursementInvoiceIds.length > 0 ? reimbursementInvoiceIds : undefined,
          };

          const result = await createAsync(orderData);

          if (result.success && result.data) {
            showToast({
              type: 'success',
              message: 'Pedido criado com sucesso!',
            });

            if (onSuccess) {
              onSuccess();
            } else {
              router.push(routeToMobilePath(`/inventory/orders/details/${result.data.id}`));
            }
          }
        } catch (error) {
          console.error('Error uploading files or creating order:', error);
          Alert.alert('Erro', 'Falha ao fazer upload dos arquivos ou criar pedido');
        } finally {
          setIsUploadingFiles(false);
        }
      } catch (error) {
        console.error('Error creating order:', error);
        Alert.alert('Erro', 'Falha ao criar pedido');
      }
    },
    [
      orderItemMode,
      selectedItems,
      itemQuantities,
      itemPrices,
      itemIcms,
      itemIpi,
      temporaryItems,
      budgetFiles,
      invoiceFiles,
      receiptFiles,
      reimbursementFiles,
      reimbursementInvoiceFiles,
      uploadFile,
      createAsync,
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
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold as any,
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
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
    radioGroup: {
      gap: theme.spacing.sm,
    },
    radioOption: {
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    radioOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryForeground + '10',
    },
    itemList: {
      gap: theme.spacing.sm,
    },
    itemCard: {
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    tempItemRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flex: 1,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Basic Information */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>

          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Descrição <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Ex: Pedido de materiais de escritório"
                    error={fieldState.error?.message}
                  />
                </>
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
                  queryKey={["suppliers", "order-create"]}
                  queryFn={searchSuppliers}
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

          <FileUploadField
            files={budgetFiles}
            onRemove={(index) => handleRemoveFile(index, setBudgetFiles)}
            onAdd={() => handlePickFiles('budget', setBudgetFiles)}
            maxFiles={10}
            label="Orçamentos"
          />

          <FileUploadField
            files={invoiceFiles}
            onRemove={(index) => handleRemoveFile(index, setInvoiceFiles)}
            onAdd={() => handlePickFiles('invoice', setInvoiceFiles)}
            maxFiles={10}
            label="Notas Fiscais"
          />

          <FileUploadField
            files={receiptFiles}
            onRemove={(index) => handleRemoveFile(index, setReceiptFiles)}
            onAdd={() => handlePickFiles('receipt', setReceiptFiles)}
            maxFiles={10}
            label="Recibos"
          />

          <FileUploadField
            files={reimbursementFiles}
            onRemove={(index) => handleRemoveFile(index, setReimbursementFiles)}
            onAdd={() => handlePickFiles('reimbursement', setReimbursementFiles)}
            maxFiles={10}
            label="Reembolsos"
          />

          <FileUploadField
            files={reimbursementInvoiceFiles}
            onRemove={(index) => handleRemoveFile(index, setReimbursementInvoiceFiles)}
            onAdd={() => handlePickFiles('reimbursementInvoice', setReimbursementInvoiceFiles)}
            maxFiles={10}
            label="Notas Fiscais de Reembolso"
          />
        </Card>

        {/* Item Mode Selection */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tipo de Itens</ThemedText>

          <View style={styles.radioGroup}>
            <Button
              onPress={() => setOrderItemMode('inventory')}
              variant={orderItemMode === 'inventory' ? 'default' : 'outline'}
              style={styles.radioOption}
            >
              <ThemedText>Itens do Estoque</ThemedText>
            </Button>
            <Button
              onPress={() => setOrderItemMode('temporary')}
              variant={orderItemMode === 'temporary' ? 'default' : 'outline'}
              style={styles.radioOption}
            >
              <ThemedText>Itens Temporários</ThemedText>
            </Button>
          </View>
        </Card>

        {/* Item Selection or Temporary Items */}
        {orderItemMode === 'inventory' ? (
          <Card style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Seleção de Itens</ThemedText>
            <ThemedText style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
              Nota: Interface simplificada. Para seleção avançada, use a versão web.
            </ThemedText>

            <Select
              value=""
              onValueChange={(itemId) => {
                if (itemId && !selectedItems.has(itemId)) {
                  setSelectedItems((prev) => new Set([...prev, itemId]));
                  setItemQuantities((prev) => ({ ...prev, [itemId]: 1 }));
                  setItemPrices((prev) => ({ ...prev, [itemId]: 0 }));
                  setItemIcms((prev) => ({ ...prev, [itemId]: 0 }));
                  setItemIpi((prev) => ({ ...prev, [itemId]: 0 }));
                }
              }}
              options={itemOptions.filter((opt) => !selectedItems.has(opt.value))}
              placeholder="Adicionar item..."
            />

            <Separator style={{ marginVertical: theme.spacing.md }} />

            {Array.from(selectedItems).map((itemId) => {
              const item = items.find((i) => i.id === itemId);
              if (!item) return null;

              return (
                <Card key={itemId} style={styles.itemCard}>
                  <ThemedText style={{ fontWeight: theme.fontWeight.semibold as any, marginBottom: theme.spacing.sm }}>
                    {item.name}
                  </ThemedText>

                  <View style={styles.field}>
                    <ThemedText style={styles.label}>Quantidade</ThemedText>
                    <Input
                      value={String(itemQuantities[itemId] || 1)}
                      onChangeText={(value) =>
                        setItemQuantities((prev) => ({ ...prev, [itemId]: Number(value) || 1 }))
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.field}>
                    <ThemedText style={styles.label}>Preço Unitário</ThemedText>
                    <Input
                      value={String(itemPrices[itemId] || 0)}
                      onChangeText={(value) =>
                        setItemPrices((prev) => ({ ...prev, [itemId]: Number(value) || 0 }))
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.label}>ICMS (%)</ThemedText>
                      <Input
                        value={String(itemIcms[itemId] || 0)}
                        onChangeText={(value) =>
                          setItemIcms((prev) => ({ ...prev, [itemId]: Number(value) || 0 }))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.label}>IPI (%)</ThemedText>
                      <Input
                        value={String(itemIpi[itemId] || 0)}
                        onChangeText={(value) =>
                          setItemIpi((prev) => ({ ...prev, [itemId]: Number(value) || 0 }))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Button
                    variant="destructive"
                    size="sm"
                    onPress={() => {
                      setSelectedItems((prev) => {
                        const next = new Set(prev);
                        next.delete(itemId);
                        return next;
                      });
                    }}
                    style={{ marginTop: theme.spacing.sm }}
                  >
                    <ThemedText>Remover</ThemedText>
                  </Button>
                </Card>
              );
            })}
          </Card>
        ) : (
          <Card style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Itens Temporários</ThemedText>

            {temporaryItems.map((item, index) => (
              <Card key={index} style={styles.itemCard}>
                <View style={styles.field}>
                  <ThemedText style={styles.label}>Descrição</ThemedText>
                  <Input
                    value={item.temporaryItemDescription}
                    onChangeText={(value) =>
                      handleUpdateTemporaryItem(index, 'temporaryItemDescription', value)
                    }
                    placeholder="Descrição do item"
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Quantidade</ThemedText>
                  <Input
                    value={String(item.orderedQuantity)}
                    onChangeText={(value) =>
                      handleUpdateTemporaryItem(index, 'orderedQuantity', Number(value) || 1)
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.label}>Preço Unitário</ThemedText>
                  <Input
                    value={item.price !== null ? String(item.price) : ''}
                    onChangeText={(value) =>
                      handleUpdateTemporaryItem(index, 'price', value ? Number(value) : null)
                    }
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.label}>ICMS (%)</ThemedText>
                    <Input
                      value={String(item.icms)}
                      onChangeText={(value) =>
                        handleUpdateTemporaryItem(index, 'icms', Number(value) || 0)
                      }
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.label}>IPI (%)</ThemedText>
                    <Input
                      value={String(item.ipi)}
                      onChangeText={(value) =>
                        handleUpdateTemporaryItem(index, 'ipi', Number(value) || 0)
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {temporaryItems.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onPress={() => handleRemoveTemporaryItem(index)}
                    style={{ marginTop: theme.spacing.sm }}
                  >
                    <ThemedText>Remover</ThemedText>
                  </Button>
                )}
              </Card>
            ))}

            <Button variant="outline" onPress={handleAddTemporaryItem}>
              <ThemedText>Adicionar Item</ThemedText>
            </Button>
          </Card>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => router.back()}
          style={styles.actionButton}
          disabled={isLoading || isUploadingFiles}
        >
          <ThemedText>Cancelar</ThemedText>
        </Button>
        <Button
          onPress={form.handleSubmit(handleSubmit)}
          style={styles.actionButton}
          disabled={isLoading || isUploadingFiles}
          loading={isLoading || isUploadingFiles}
        >
          <ThemedText>
            {isUploadingFiles ? 'Enviando arquivos...' : 'Criar Pedido'}
          </ThemedText>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};
