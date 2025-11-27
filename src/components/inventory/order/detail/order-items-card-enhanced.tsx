import React, { useState, useCallback, useMemo } from "react";
import { View, TextInput, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils";
import { formatCurrencyPrecise } from "@/utils/format-standard";
import type { OrderItem } from '../../../../types';
import { IconCheck, IconX, IconClock, IconDeviceFloppy, IconReload, IconShoppingCart, IconTruck, IconAlertCircle } from "@tabler/icons-react-native";
import { ORDER_STATUS } from "@/constants";
import { useOrderItemBatchMutations, useOrderItemSpecializedBatchMutations } from "@/hooks";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface OrderItemsCardEnhancedProps {
  items: OrderItem[];
  orderStatus: string;
  orderDescription?: string;
  orderCreatedAt?: string;
  onOrderUpdate?: () => void;
}

interface ItemChanges {
  [itemId: string]: {
    receivedQuantity: number;
    isComplete: boolean;
  };
}

interface SelectedItems {
  [itemId: string]: boolean;
}

export const OrderItemsCardEnhanced: React.FC<OrderItemsCardEnhancedProps> = ({
  items,
  orderStatus,
  orderDescription,
  orderCreatedAt,
  onOrderUpdate
}) => {
  const { colors } = useTheme();
  const [itemChanges, setItemChanges] = useState<ItemChanges>({});
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [isSaving, setIsSaving] = useState(false);

  // Batch mutations
  const { batchUpdate } = useOrderItemBatchMutations({
    onBatchUpdateSuccess: () => {
      Alert.alert("Sucesso", "Quantidades recebidas atualizadas com sucesso!");
      onOrderUpdate?.();
      setItemChanges({});
    },
  });

  const { markFulfilled, markReceived } = useOrderItemSpecializedBatchMutations({
    onMarkFulfilledSuccess: () => {
      Alert.alert("Sucesso", "Itens marcados como feito com sucesso");
      onOrderUpdate?.();
      setSelectedItems({});
    },
    onMarkReceivedSuccess: () => {
      Alert.alert("Sucesso", "Itens marcados como recebidos com sucesso");
      onOrderUpdate?.();
      setSelectedItems({});
    },
  });

  // Check if order allows inline editing
  const canEditItems = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.PARTIALLY_FULFILLED,
    ORDER_STATUS.FULFILLED,
    ORDER_STATUS.PARTIALLY_RECEIVED
  ].includes(orderStatus);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return Object.keys(itemChanges).length > 0;
  }, [itemChanges]);

  // Get the current value for an item (either changed or original)
  const getItemValue = useCallback(
    (item: OrderItem) => {
      if (itemChanges[item.id]) {
        return itemChanges[item.id];
      }
      return {
        receivedQuantity: item.receivedQuantity || 0,
        isComplete: item.receivedQuantity === item.orderedQuantity,
      };
    },
    [itemChanges],
  );

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allSelected: SelectedItems = {};
      items.forEach((item) => {
        allSelected[item.id] = true;
      });
      setSelectedItems(allSelected);
    } else {
      setSelectedItems({});
    }
  }, [items]);

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
  }, []);

  const selectedCount = useMemo(() => {
    return Object.values(selectedItems).filter(Boolean).length;
  }, [selectedItems]);

  const allSelected = useMemo(() => {
    return items.length > 0 && selectedCount === items.length;
  }, [selectedCount, items.length]);

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (itemId: string, value: string) => {
      // Handle both comma and dot as decimal separator
      const normalizedValue = value.replace(',', '.');
      const numValue = parseFloat(normalizedValue) || 0;
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newQuantity = Math.max(0, Math.min(numValue, item.orderedQuantity));
      const isComplete = newQuantity === item.orderedQuantity;

      setItemChanges((prev) => ({
        ...prev,
        [itemId]: {
          receivedQuantity: newQuantity,
          isComplete,
        },
      }));
    },
    [items],
  );

  // Batch operations
  const handleBatchMarkFulfilled = useCallback(() => {
    const ids = Object.keys(selectedItems).filter((id) => selectedItems[id]);
    if (ids.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos um item");
      return;
    }

    Alert.alert(
      "Confirmar",
      `Marcar ${ids.length} ${ids.length === 1 ? 'item' : 'itens'} como feito?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => markFulfilled(ids)
        }
      ]
    );
  }, [selectedItems, markFulfilled]);

  const handleBatchMarkReceived = useCallback(() => {
    const itemsToMark = Object.keys(selectedItems)
      .filter((id) => selectedItems[id])
      .map((id) => {
        const item = items.find((i) => i.id === id);
        return {
          id,
          receivedQuantity: item?.orderedQuantity || 0,
        };
      });

    if (itemsToMark.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos um item");
      return;
    }

    Alert.alert(
      "Confirmar",
      `Marcar ${itemsToMark.length} ${itemsToMark.length === 1 ? 'item' : 'itens'} como recebido?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => markReceived(itemsToMark)
        }
      ]
    );
  }, [selectedItems, items, markReceived]);

  // Reset changes
  const handleReset = useCallback(() => {
    setItemChanges({});
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      // Prepare batch update data
      const orderItems = Object.entries(itemChanges).map(([itemId, changes]) => ({
        id: itemId,
        data: {
          receivedQuantity: changes.receivedQuantity,
        },
      }));

      await batchUpdate({ orderItems });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar as quantidades recebidas");
      console.error("Error updating order items:", error);
    } finally {
      setIsSaving(false);
    }
  }, [itemChanges, hasChanges, batchUpdate]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    let totalOrdered = 0;
    let totalReceived = 0;
    let totalValue = 0;

    items.forEach((item) => {
      const currentValues = getItemValue(item);
      const subtotal = item.orderedQuantity * (item.unitPrice || 0);

      totalOrdered += item.orderedQuantity;
      totalReceived += currentValues.receivedQuantity;
      totalValue += subtotal;
    });

    return {
      itemCount: items.length,
      totalOrdered,
      totalReceived,
      totalValue,
      percentComplete: totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0,
    };
  }, [items, getItemValue]);

  // PDF Export
  const handleExportPDF = useCallback(async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${orderDescription || 'Pedido de Compra'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              padding: 20px;
            }
            .header {
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 10px;
              color: #1f2937;
            }
            .info {
              color: #6b7280;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px 8px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
              text-transform: uppercase;
              font-size: 12px;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-medium {
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${orderDescription || 'Pedido de Compra'}</h1>
            <div class="info">
              <p>Total de itens: ${items.length}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th class="text-center">Quantidade</th>
                <th class="text-right">Preço Unit.</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item) => `
                <tr>
                  <td>${item.item?.uniCode || '-'}</td>
                  <td class="font-medium">${item.item?.name || 'Item desconhecido'}</td>
                  <td class="text-center">${item.orderedQuantity}</td>
                  <td class="text-right">${formatCurrencyPrecise(item.unitPrice || 0)}</td>
                  <td class="text-right">${formatCurrencyPrecise((item.unitPrice || 0) * item.orderedQuantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Sucesso", "PDF gerado com sucesso");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF");
      console.error("Error generating PDF:", error);
    }
  }, [items, orderDescription]);

  const getItemStatus = (item: OrderItem) => {
    const currentValues = getItemValue(item);

    if (itemChanges[item.id]) {
      return { icon: IconClock, color: colors.warning, label: "Alterado" };
    }
    if (currentValues.isComplete) {
      return { icon: IconCheck, color: colors.primary, label: "Recebido" };
    }
    if (currentValues.receivedQuantity > 0) {
      return { icon: IconClock, color: colors.warning, label: "Parcial" };
    }
    if (item.fulfilledAt) {
      return { icon: IconShoppingCart, color: colors.secondary, label: "Feito" };
    }
    return { icon: IconX, color: colors.destructive, label: "Pendente" };
  };

  if (items.length === 0) {
    return (
      <Card style={styles.card}>
        <ThemedText style={styles.title}>Itens do Pedido</ThemedText>
        <ThemedText style={styles.emptyText}>Nenhum item no pedido</ThemedText>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Header with item count */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Itens do Pedido</ThemedText>
        <Badge size="sm">
          <ThemedText style={styles.countText}>{items.length} itens</ThemedText>
        </Badge>
      </View>

      {/* Summary Statistics */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.summaryLabel}>Pedida</ThemedText>
          <ThemedText style={styles.summaryValue}>{summary.totalOrdered.toLocaleString('pt-BR')}</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.summaryLabel}>Recebida</ThemedText>
          <ThemedText style={styles.summaryValue}>{summary.totalReceived.toLocaleString('pt-BR')}</ThemedText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.summaryLabel}>Progresso</ThemedText>
          <ThemedText style={styles.summaryValue}>{summary.percentComplete.toFixed(0)}%</ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          variant="outline"
          size="sm"
          onPress={handleExportPDF}
          style={styles.actionButton}
        >
          <ThemedText style={styles.actionButtonText}>Exportar PDF</ThemedText>
        </Button>

        {canEditItems && selectedCount > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onPress={handleBatchMarkFulfilled}
              disabled={isSaving}
              style={styles.actionButton}
            >
              <IconShoppingCart size={16} color={colors.foreground} />
              <ThemedText style={styles.actionButtonText}>Feito ({selectedCount})</ThemedText>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={handleBatchMarkReceived}
              disabled={isSaving}
              style={styles.actionButton}
            >
              <IconTruck size={16} color={colors.foreground} />
              <ThemedText style={styles.actionButtonText}>Recebido ({selectedCount})</ThemedText>
            </Button>
          </>
        )}

        {hasChanges && (
          <>
            <Button
              variant="default"
              size="sm"
              onPress={handleSave}
              disabled={isSaving}
              style={styles.actionButton}
            >
              <IconDeviceFloppy size={16} color="#fff" />
              <ThemedText style={styles.actionButtonTextPrimary}>
                Salvar ({Object.keys(itemChanges).length})
              </ThemedText>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={handleReset}
              disabled={isSaving}
              style={styles.actionButton}
            >
              <IconReload size={16} color={colors.foreground} />
              <ThemedText style={styles.actionButtonText}>Desfazer</ThemedText>
            </Button>
          </>
        )}
      </View>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <IconAlertCircle size={20} color={colors.warning} />
          <View style={styles.warningContent}>
            <ThemedText style={[styles.warningTitle, { color: colors.warning }]}>
              Alterações não salvas
            </ThemedText>
            <ThemedText style={[styles.warningText, { color: colors.warning }]}>
              Você tem {Object.keys(itemChanges).length} {Object.keys(itemChanges).length === 1 ? 'item alterado' : 'itens alterados'}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Select All */}
      {canEditItems && (
        <View style={styles.selectAllContainer}>
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            disabled={items.length === 0}
          />
          <ThemedText style={styles.selectAllText}>
            Selecionar todos ({selectedCount}/{items.length})
          </ThemedText>
        </View>
      )}

      {/* Items List */}
      <View style={styles.itemsList}>
        {items.map((orderItem, index) => {
          const status = getItemStatus(orderItem);
          const StatusIcon = status.icon;
          const item = orderItem.item;
          const currentValues = getItemValue(orderItem);
          const isSelected = selectedItems[orderItem.id] || false;
          const hasItemChanges = Boolean(itemChanges[orderItem.id]);

          return (
            <View
              key={orderItem.id}
              style={StyleSheet.flatten([
                styles.item,
                { borderBottomColor: colors.border },
                index < items.length - 1 && styles.itemBorder,
                hasItemChanges && { backgroundColor: colors.warning + '10' },
                isSelected && { backgroundColor: colors.accent },
              ])}
            >
              {/* Item Header */}
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  {canEditItems && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectItem(orderItem.id, checked)}
                    />
                  )}
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName} numberOfLines={2}>
                      {item?.name || "Item desconhecido"}
                    </ThemedText>
                    {item?.uniCode && (
                      <ThemedText style={styles.itemCode}>
                        Código: {item.uniCode}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: status.color + "20" }])}>
                  <StatusIcon size={14} color={status.color} />
                  <ThemedText style={StyleSheet.flatten([styles.statusText, { color: status.color }])}>
                    {status.label}
                  </ThemedText>
                </View>
              </View>

              {/* Item Details */}
              <View style={styles.itemDetails}>
                <View style={styles.quantityInfo}>
                  <View style={styles.quantityRow}>
                    <ThemedText style={styles.quantityLabel}>Pedido:</ThemedText>
                    <ThemedText style={styles.quantityValue}>
                      {orderItem.orderedQuantity}
                    </ThemedText>
                  </View>

                  <View style={styles.quantityRow}>
                    <ThemedText style={styles.quantityLabel}>Recebido:</ThemedText>
                    {canEditItems ? (
                      <TextInput
                        style={StyleSheet.flatten([
                          styles.quantityInput,
                          {
                            color: colors.foreground,
                            borderColor: colors.border,
                            backgroundColor: colors.input,
                          },
                          currentValues.receivedQuantity === orderItem.orderedQuantity && {
                            color: colors.primary,
                            borderColor: colors.primary,
                          },
                          currentValues.receivedQuantity > 0 && currentValues.receivedQuantity < orderItem.orderedQuantity && {
                            color: colors.warning,
                            borderColor: colors.warning,
                          },
                        ])}
                        value={currentValues.receivedQuantity > 0 ? String(currentValues.receivedQuantity) : ""}
                        onChangeText={(value) => handleQuantityChange(orderItem.id, value)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.mutedForeground}
                        editable={!isSaving}
                      />
                    ) : (
                      <ThemedText style={StyleSheet.flatten([
                        styles.quantityValue,
                        { color: orderItem.receivedQuantity === orderItem.orderedQuantity ? colors.primary : colors.foreground }
                      ])}>
                        {orderItem.receivedQuantity || 0}
                      </ThemedText>
                    )}
                  </View>
                </View>

                <View style={styles.priceInfo}>
                  <ThemedText style={styles.priceLabel}>Preço Unit:</ThemedText>
                  <ThemedText style={styles.priceValue}>
                    {formatCurrency(orderItem.unitPrice || 0)}
                  </ThemedText>
                  <ThemedText style={styles.priceLabel}>Total:</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.priceValue, styles.totalPrice])}>
                    {formatCurrency((orderItem.unitPrice || 0) * orderItem.orderedQuantity)}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  countText: {
    fontSize: fontSize.xs,
    color: "#fff",
  },
  emptyText: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
  },
  actionButtonTextPrimary: {
    fontSize: fontSize.sm,
    color: "#fff",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: 2,
  },
  warningText: {
    fontSize: fontSize.xs,
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectAllText: {
    fontSize: fontSize.sm,
  },
  itemsList: {
    gap: spacing.md,
  },
  item: {
    paddingBottom: spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  itemHeader: {
    marginBottom: spacing.sm,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemCode: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  quantityInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    width: 70,
  },
  quantityValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  quantityInput: {
    width: 60,
    height: 32,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  priceLabel: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  priceValue: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
