import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconPackages, IconCheck, IconShoppingCart, IconCalendar } from '@tabler/icons-react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { ItemMultiSelector } from '@/components/inventory/item/item-multi-selector';
import { OrderBatchResultDialog } from './order-batch-result-dialog';
import { useTheme } from '@/lib/theme';
import { useOrderBatchMutations } from '@/hooks';
import { getSuppliers, getItems } from '@/api-client';
import { showToast } from '@/lib/toast';
import { formatCurrency, formatDate } from '@/utils';
import { ORDER_STATUS } from '@/constants';
import type { OrderFormItem } from './order-form-utils-enhanced';
import {
  calculateOrderTotals,
  validateBatchOrderCreation,
  prepareBatchOrderData,
  processBatchResults,
  generateBatchResultMessage,
  getBestItemPrice,
  type BatchOperationResult,
} from './order-form-utils-enhanced';
import type { Supplier } from '@/types';

interface OrderBatchCreateFormProps {
  onSuccess?: () => void;
}

/**
 * Mobile Batch Order Creation Form
 * Allows creating multiple orders at once from selected items
 * Mobile-optimized version of the web batch order form
 */
export const OrderBatchCreateForm: React.FC<OrderBatchCreateFormProps> = ({ onSuccess }) => {
  const theme = useTheme();
  const router = useRouter();

  // Form state
  const [supplierId, setSupplierId] = useState<string>('');
  const [forecast, setForecast] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  // Item selection state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, OrderFormItem>>(new Map());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [icmses, setIcmses] = useState<Record<string, number>>({});
  const [ipis, setIpis] = useState<Record<string, number>>({});

  // Result dialog state
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchOperationResult | null>(null);

  // Mutations
  const { batchCreateAsync, isLoading } = useOrderBatchMutations();

  // Load items when selected IDs change
  React.useEffect(() => {
    if (selectedItemIds.length > 0) {
      getItems({
        where: { id: { in: selectedItemIds } },
        include: {
          brand: true,
          category: true,
          prices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }).then((response) => {
        if (response.data) {
          const itemsMap = new Map<string, OrderFormItem>();
          const newQuantities: Record<string, number> = {};
          const newPrices: Record<string, number> = {};

          response.data.forEach((item) => {
            itemsMap.set(item.id, {
              id: item.id,
              name: item.name,
              uniCode: item.uniCode,
              quantity: 1,
              price: item.prices?.[0]?.value || null,
              category: item.category,
              brand: item.brand,
              supplier: item.supplier,
              prices: item.prices,
            });

            // Initialize with default values if not already set
            if (!quantities[item.id]) {
              newQuantities[item.id] = 1;
            }
            if (!prices[item.id] && item.prices?.[0]?.value) {
              newPrices[item.id] = item.prices[0].value;
            }
          });

          setSelectedItems(itemsMap);
          setQuantities((prev) => ({ ...prev, ...newQuantities }));
          setPrices((prev) => ({ ...prev, ...newPrices }));
        }
      });
    } else {
      setSelectedItems(new Map());
    }
  }, [selectedItemIds]);

  // Calculate totals
  const totals = useMemo(() => {
    return calculateOrderTotals(selectedItems, quantities, prices, icmses, ipis);
  }, [selectedItems, quantities, prices, icmses, ipis]);

  // Async search for suppliers
  const searchSuppliers = useCallback(async (searchTerm: string): Promise<Supplier[]> => {
    try {
      const response = await getSuppliers({
        where: searchTerm
          ? {
              fantasyName: { contains: searchTerm, mode: 'insensitive' },
              isActive: true,
            }
          : { isActive: true },
        orderBy: { fantasyName: 'asc' },
        take: 20,
      });
      return response.data || [];
    } catch (error) {
      console.error('Error searching suppliers:', error);
      return [];
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    try {
      // Validate
      const validation = validateBatchOrderCreation(selectedItems, quantities, prices, icmses, ipis, {
        supplierId,
        forecast,
      });

      if (!validation.isValid) {
        const errorMessage = validation.errors.map((e) => e.message).join('\n');
        Alert.alert('Erro de Validação', errorMessage);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.map((w) => w.message).join('\n');
        Alert.alert('Aviso', warningMessage);
      }

      // Prepare batch data
      const orders = prepareBatchOrderData(selectedItems, quantities, prices, icmses, ipis, {
        supplierId,
        forecast,
        notes: notes || undefined,
      });

      // Create orders
      const response = await batchCreateAsync({
        orders: orders.map((order) => ({
          description: order.description,
          status: ORDER_STATUS.CREATED,
          supplierId: order.supplierId,
          forecast: order.forecast,
          notes: order.notes,
          items: order.items.map((item) => ({
            itemId: item.itemId,
            orderedQuantity: item.orderedQuantity,
            price: item.price,
            icms: item.icms,
            ipi: item.ipi,
          })),
        })),
      });

      // Process results
      const result = processBatchResults(response);
      const message = generateBatchResultMessage(result);

      // Show result dialog
      setBatchResult(result);
      setShowResultDialog(true);

      // Show toast
      if (result.success) {
        showToast({ type: 'success', title: 'Sucesso', message });
      } else if (result.successCount > 0) {
        showToast({ type: 'warning', title: 'Parcialmente Concluído', message });
      } else {
        showToast({ type: 'error', title: 'Erro', message });
      }
    } catch (error) {
      console.error('Batch create error:', error);
      Alert.alert('Erro', 'Falha ao criar pedidos em lote');
    }
  }, [selectedItems, quantities, prices, icmses, ipis, supplierId, forecast, notes, batchCreateAsync]);

  // Handle result dialog confirmation
  const handleResultConfirm = useCallback(() => {
    if (batchResult?.success || (batchResult && batchResult.successCount > 0)) {
      onSuccess?.();
      router.back();
    }
  }, [batchResult, onSuccess, router]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: 100,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    summaryCard: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.xs,
    },
    summaryLabel: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    summaryValue: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium as any,
      color: theme.colors.text,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
    },
    totalValue: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold as any,
      color: theme.colors.primary,
    },
    itemCard: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.sm,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    itemName: {
      flex: 1,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.medium as any,
      color: theme.colors.text,
    },
    itemInputs: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    inputWrapper: {
      flex: 1,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <PageHeader title="Criar Pedidos em Lote" icon={IconPackages} showBackButton />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <IconShoppingCart size={20} color={theme.colors.text} />
            <ThemedText style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold as any }}>
              Informações do Pedido
            </ThemedText>
          </View>

          <FormField label="Fornecedor" required>
            <Combobox
              placeholder="Selecione um fornecedor"
              value={supplierId}
              onValueChange={setSupplierId}
              searchFunction={searchSuppliers}
              displayKey="fantasyName"
              valueKey="id"
            />
          </FormField>

          <FormField label="Data de Entrega" required>
            <DateTimePicker
              value={forecast}
              onChange={setForecast}
              mode="date"
              placeholder="Selecione a data"
              minimumDate={new Date()}
            />
          </FormField>

          <FormField label="Observações">
            <Input placeholder="Observações sobre os pedidos (opcional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
          </FormField>
        </View>

        {/* Item Selection */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <IconPackages size={20} color={theme.colors.text} />
            <ThemedText style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold as any }}>Selecionar Itens</ThemedText>
          </View>

          <ItemMultiSelector value={selectedItemIds} onValueChange={setSelectedItemIds} supplierId={supplierId} />
        </View>

        {/* Selected Items Configuration */}
        {selectedItems.size > 0 && (
          <View style={styles.section}>
            <ThemedText style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold as any, marginBottom: theme.spacing.md }}>
              Configurar Itens Selecionados
            </ThemedText>

            {Array.from(selectedItems.values()).map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                    {item.uniCode && (
                      <ThemedText style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>Código: {item.uniCode}</ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.itemInputs}>
                  <View style={styles.inputWrapper}>
                    <ThemedText style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 4 }}>Quantidade</ThemedText>
                    <Input
                      value={String(quantities[item.id] || 1)}
                      onChangeText={(value) => setQuantities((prev) => ({ ...prev, [item.id]: parseFloat(value) || 1 }))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <ThemedText style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 4 }}>Preço</ThemedText>
                    <Input
                      value={String(prices[item.id] || getBestItemPrice(item, null))}
                      onChangeText={(value) => setPrices((prev) => ({ ...prev, [item.id]: parseFloat(value) || 0 }))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.itemInputs, { marginTop: theme.spacing.sm }]}>
                  <View style={styles.inputWrapper}>
                    <ThemedText style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 4 }}>ICMS (%)</ThemedText>
                    <Input
                      value={String(icmses[item.id] || 0)}
                      onChangeText={(value) => setIcmses((prev) => ({ ...prev, [item.id]: parseFloat(value) || 0 }))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <ThemedText style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 4 }}>IPI (%)</ThemedText>
                    <Input
                      value={String(ipis[item.id] || 0)}
                      onChangeText={(value) => setIpis((prev) => ({ ...prev, [item.id]: parseFloat(value) || 0 }))}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        {selectedItems.size > 0 && (
          <View style={styles.section}>
            <ThemedText style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold as any, marginBottom: theme.spacing.md }}>
              Resumo
            </ThemedText>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Itens selecionados:</ThemedText>
                <ThemedText style={styles.summaryValue}>{selectedItems.size}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Quantidade total:</ThemedText>
                <ThemedText style={styles.summaryValue}>{totals.totalQuantity}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Subtotal:</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatCurrency(totals.subtotal)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Total ICMS:</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatCurrency(totals.totalIcms)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Total IPI:</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatCurrency(totals.totalIpi)}</ThemedText>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <ThemedText style={[styles.summaryLabel, { fontWeight: theme.fontWeight.semibold as any }]}>Total Geral:</ThemedText>
                <ThemedText style={styles.totalValue}>{formatCurrency(totals.grandTotal)}</ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button variant="outline" onPress={() => router.back()} disabled={isLoading} style={{ flex: 1 }}>
          <ThemedText>Cancelar</ThemedText>
        </Button>
        <Button
          variant="default"
          onPress={handleSubmit}
          disabled={isLoading || selectedItems.size === 0 || !supplierId || !forecast}
          loading={isLoading}
          style={{ flex: 2 }}
        >
          <IconCheck size={18} color="#ffffff" />
          <ThemedText style={{ color: '#ffffff', marginLeft: theme.spacing.xs }}>
            Criar {selectedItems.size} {selectedItems.size === 1 ? 'Pedido' : 'Pedidos'}
          </ThemedText>
        </Button>
      </View>

      {/* Result Dialog */}
      <OrderBatchResultDialog open={showResultDialog} onOpenChange={setShowResultDialog} result={batchResult} onConfirm={handleResultConfirm} />
    </KeyboardAvoidingView>
  );
};
