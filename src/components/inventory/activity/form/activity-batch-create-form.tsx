import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useItems, useUsers, useOrders, useOrderItems } from '../../../../hooks';
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from '../../../../constants';
import { ACTIVITY_REASON_LABELS } from '../../../../constants/enum-labels';
import { IconLoader, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react-native";

// Form schema for batch activity creation with conditional validation
const activityBatchFormSchema = z.object({
  operation: z.enum([ACTIVITY_OPERATION.INBOUND, ACTIVITY_OPERATION.OUTBOUND], {
    errorMap: () => ({ message: "Selecione uma operação válida" }),
  }),
  userId: z.string().uuid("Selecione um usuário válido").nullable().optional(),
  reason: z.enum([
    ACTIVITY_REASON.ORDER_RECEIVED,
    ACTIVITY_REASON.PRODUCTION_USAGE,
    ACTIVITY_REASON.PPE_DELIVERY,
    ACTIVITY_REASON.BORROW,
    ACTIVITY_REASON.RETURN,
    ACTIVITY_REASON.EXTERNAL_WITHDRAWAL,
    ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN,
    ACTIVITY_REASON.INVENTORY_COUNT,
    ACTIVITY_REASON.MANUAL_ADJUSTMENT,
    ACTIVITY_REASON.MAINTENANCE,
    ACTIVITY_REASON.DAMAGE,
    ACTIVITY_REASON.LOSS,
    ACTIVITY_REASON.PAINT_PRODUCTION,
    ACTIVITY_REASON.OTHER,
  ] as const, {
    errorMap: () => ({ message: "Selecione um motivo válido" }),
  }).nullable().optional(),
  orderId: z.string().uuid("Selecione um pedido válido").nullable().optional(),
  orderItemId: z.string().uuid("Selecione um item do pedido válido").nullable().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().positive("Quantidade deve ser positiva"),
    currentStock: z.number().optional(),
  })).min(1, "Selecione pelo menos um item"),
}).superRefine((data, ctx) => {
  // Validate ORDER_RECEIVED reason requires orderId
  if (data.reason === ACTIVITY_REASON.ORDER_RECEIVED && !data.orderId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pedido é obrigatório quando o motivo é 'Pedido Recebido'",
      path: ["orderId"],
    });
  }

  // Validate OUTBOUND operations don't cause negative stock
  if (data.operation === ACTIVITY_OPERATION.OUTBOUND) {
    data.items.forEach((item, index) => {
      if (item.currentStock !== undefined && item.currentStock < item.quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Estoque insuficiente. Disponível: ${item.currentStock}, Solicitado: ${item.quantity}`,
          path: ["items", index, "quantity"],
        });
      }
    });
  }
});

type ActivityBatchFormData = z.infer<typeof activityBatchFormSchema>;

interface ActivityBatchCreateFormProps {
  onSubmit: (data: ActivityBatchFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OPERATION_OPTIONS = [
  { value: ACTIVITY_OPERATION.INBOUND, label: "Entrada", description: "Adicionar itens ao estoque" },
  { value: ACTIVITY_OPERATION.OUTBOUND, label: "Saída", description: "Remover itens do estoque" },
];

// Map all 14 ACTIVITY_REASON options with descriptions
const REASON_OPTIONS = [
  { value: ACTIVITY_REASON.ORDER_RECEIVED, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.ORDER_RECEIVED], description: "Recebimento de pedido de compra" },
  { value: ACTIVITY_REASON.PRODUCTION_USAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PRODUCTION_USAGE], description: "Consumo para produção" },
  { value: ACTIVITY_REASON.PPE_DELIVERY, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PPE_DELIVERY], description: "Entrega de equipamento de proteção" },
  { value: ACTIVITY_REASON.BORROW, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.BORROW], description: "Empréstimo de item" },
  { value: ACTIVITY_REASON.RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.RETURN], description: "Devolução de item emprestado" },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL], description: "Retirada para uso externo" },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN], description: "Retorno de retirada externa" },
  { value: ACTIVITY_REASON.INVENTORY_COUNT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.INVENTORY_COUNT], description: "Ajuste por contagem física" },
  { value: ACTIVITY_REASON.MANUAL_ADJUSTMENT, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MANUAL_ADJUSTMENT], description: "Ajuste manual de estoque" },
  { value: ACTIVITY_REASON.MAINTENANCE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.MAINTENANCE], description: "Uso em manutenção" },
  { value: ACTIVITY_REASON.DAMAGE, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.DAMAGE], description: "Item danificado" },
  { value: ACTIVITY_REASON.LOSS, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.LOSS], description: "Item perdido" },
  { value: ACTIVITY_REASON.PAINT_PRODUCTION, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.PAINT_PRODUCTION], description: "Produção de tinta" },
  { value: ACTIVITY_REASON.OTHER, label: ACTIVITY_REASON_LABELS[ACTIVITY_REASON.OTHER], description: "Outro motivo" },
];

export function ActivityBatchCreateForm({ onSubmit, onCancel, isSubmitting }: ActivityBatchCreateFormProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{
    itemId: string;
    name: string;
    quantity: number;
    currentStock: number;
  }>>([]);

  const form = useForm<ActivityBatchFormData>({
    resolver: zodResolver(activityBatchFormSchema),
    defaultValues: {
      operation: ACTIVITY_OPERATION.INBOUND,
      userId: null,
      reason: null,
      orderId: null,
      orderItemId: null,
      items: [],
    },
  });

  // Watch form values for conditional rendering
  const operation = useWatch({ control: form.control, name: "operation" });
  const reason = useWatch({ control: form.control, name: "reason" });
  const orderId = useWatch({ control: form.control, name: "orderId" });

  // Fetch items for selection
  const { data: items, isLoading: isLoadingItems } = useItems({
    searchingFor: searchQuery,
    orderBy: { name: "asc" },
    include: {
      brand: true,
      category: true,
    },
  });

  // Fetch users for selection
  const { data: users, isLoading: isLoadingUsers } = useUsers({
    searchingFor: userSearchQuery,
    orderBy: { name: "asc" },
  });

  // Fetch orders for selection (when reason is ORDER_RECEIVED)
  const { data: orders, isLoading: isLoadingOrders } = useOrders({
    searchingFor: orderSearchQuery,
    orderBy: { createdAt: "desc" },
    include: {
      supplier: true,
    },
  }, {
    enabled: reason === ACTIVITY_REASON.ORDER_RECEIVED,
  });

  // Fetch order items when an order is selected
  const { data: orderItems, isLoading: isLoadingOrderItems } = useOrderItems({
    where: { orderId: orderId || undefined },
    include: {
      item: true,
    },
  }, {
    enabled: !!orderId && reason === ACTIVITY_REASON.ORDER_RECEIVED,
  });

  const itemOptions = items?.data?.map((item) => ({
    value: item.id,
    label: `${item.name}${item.brand ? ` - ${item.brand.name}` : ""}`,
    stock: item.quantity,
  })) || [];

  const userOptions = users?.data?.map((user) => ({
    value: user.id,
    label: user.name,
  })) || [];

  const orderOptions = orders?.data?.map((order) => ({
    value: order.id,
    label: `Pedido #${order.id.slice(0, 8)} - ${order.supplier?.fantasyName || "Sem fornecedor"}`,
  })) || [];

  const orderItemOptions = orderItems?.data?.map((orderItem) => ({
    value: orderItem.id,
    label: `${orderItem.item?.name || "Item"} - Qtd: ${orderItem.orderedQuantity}`,
  })) || [];

  // Determine if user field should be shown (for certain reasons)
  const shouldShowUserField = useMemo(() => {
    return [
      ACTIVITY_REASON.PRODUCTION_USAGE,
      ACTIVITY_REASON.PPE_DELIVERY,
      ACTIVITY_REASON.BORROW,
      ACTIVITY_REASON.RETURN,
      ACTIVITY_REASON.EXTERNAL_WITHDRAWAL,
      ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN,
      ACTIVITY_REASON.MAINTENANCE,
    ].includes(reason as ACTIVITY_REASON);
  }, [reason]);

  // Determine if order field should be shown
  const shouldShowOrderField = reason === ACTIVITY_REASON.ORDER_RECEIVED;

  // Handle adding an item to the batch
  const handleAddItem = useCallback((itemId: string) => {
    const item = items?.data?.find((i) => i.id === itemId);
    if (!item) return;

    // Check if item already exists
    if (selectedItems.some((i) => i.itemId === itemId)) {
      Alert.alert("Atenção", "Este item já foi adicionado à lista");
      return;
    }

    // Check stock for OUTBOUND operations
    if (operation === ACTIVITY_OPERATION.OUTBOUND && item.quantity <= 0) {
      Alert.alert("Estoque Insuficiente", `O item "${item.name}" está com estoque zero ou negativo.`);
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        quantity: 1,
        currentStock: item.quantity,
      },
    ]);
  }, [items?.data, selectedItems, operation]);

  // Handle removing an item from the batch
  const handleRemoveItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  }, []);

  // Handle quantity change for an item
  const handleQuantityChange = useCallback((itemId: string, quantity: string) => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) return;

    setSelectedItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, quantity: numQuantity } : i))
    );
  }, []);

  // Handle form submission
  const handleFormSubmit = async (data: ActivityBatchFormData) => {
    try {
      // Map selected items to form data
      const formData = {
        ...data,
        items: selectedItems.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          currentStock: item.currentStock,
        })),
      };

      await onSubmit(formData);
    } catch (error) {
      // Error handled by parent component
    }
  };

  // Get stock level color for visual feedback
  const getStockLevelColor = useCallback((currentStock: number, requestedQty: number, operation: ACTIVITY_OPERATION) => {
    if (operation === ACTIVITY_OPERATION.INBOUND) return colors.muted;

    if (currentStock === 0) return colors.destructive;
    if (currentStock < requestedQty) return colors.destructive;
    if (currentStock < requestedQty * 2) return "#f59e0b"; // warning orange
    return colors.success;
  }, [colors, operation]);

  return (
    <FormProvider {...form}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Global Configuration */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Configuração Global</CardTitle>
              <CardDescription>
                Configure os detalhes da movimentação de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View style={styles.fieldGroup}>
                {/* Operation Selector with Visual Indicator */}
                <Controller
                  control={form.control}
                  name="operation"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <View style={styles.labelRow}>
                        <Label>Operação *</Label>
                        <Badge
                          variant={value === ACTIVITY_OPERATION.INBOUND ? "success" : "destructive"}
                          style={styles.operationBadge}
                        >
                          {value === ACTIVITY_OPERATION.INBOUND ? "ENTRADA" : "SAÍDA"}
                        </Badge>
                      </View>
                      <Combobox
                        value={value}
                        onValueChange={onChange}
                        options={OPERATION_OPTIONS}
                        placeholder="Selecione a operação"
                        searchable={false}
                        clearable={false}
                        disabled={isSubmitting}
                      />
                      <View style={styles.helpText}>
                        <Icon name="info-circle" size={14} color={colors.mutedForeground} />
                        <ThemedText style={styles.helpTextContent}>
                          {value === ACTIVITY_OPERATION.INBOUND
                            ? "Entrada adiciona itens ao estoque"
                            : "Saída remove itens do estoque"}
                        </ThemedText>
                      </View>
                      {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    </View>
                  )}
                />

                {/* Reason Selector */}
                <Controller
                  control={form.control}
                  name="reason"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Label>Motivo (Opcional)</Label>
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => onChange(val || null)}
                        options={REASON_OPTIONS}
                        placeholder="Selecione um motivo"
                        searchPlaceholder="Buscar motivo..."
                        emptyText="Nenhum motivo encontrado"
                        disabled={isSubmitting}
                      />
                      {value && REASON_OPTIONS.find((r) => r.value === value)?.description && (
                        <View style={styles.helpText}>
                          <Icon name="info-circle" size={14} color={colors.mutedForeground} />
                          <ThemedText style={styles.helpTextContent}>
                            {REASON_OPTIONS.find((r) => r.value === value)?.description}
                          </ThemedText>
                        </View>
                      )}
                      {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    </View>
                  )}
                />

                {/* Conditional Order Selector (for ORDER_RECEIVED reason) */}
                {shouldShowOrderField && (
                  <Controller
                    control={form.control}
                    name="orderId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
                        <View style={styles.labelRow}>
                          <Label>Pedido *</Label>
                          <Badge variant="default">Obrigatório</Badge>
                        </View>
                        <Combobox
                          value={value || ""}
                          onValueChange={(val) => onChange(val || null)}
                          options={orderOptions}
                          placeholder="Selecione um pedido"
                          searchPlaceholder="Buscar pedido..."
                          emptyText="Nenhum pedido encontrado"
                          onSearchChange={setOrderSearchQuery}
                          disabled={isSubmitting || isLoadingOrders}
                          loading={isLoadingOrders}
                        />
                        {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                      </View>
                    )}
                  />
                )}

                {/* Conditional OrderItem Selector (when order is selected) */}
                {shouldShowOrderField && orderId && (
                  <Controller
                    control={form.control}
                    name="orderItemId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
                        <Label>Item do Pedido (Opcional)</Label>
                        <Combobox
                          value={value || ""}
                          onValueChange={(val) => onChange(val || null)}
                          options={orderItemOptions}
                          placeholder="Selecione um item do pedido"
                          emptyText="Nenhum item encontrado no pedido"
                          disabled={isSubmitting || isLoadingOrderItems}
                          loading={isLoadingOrderItems}
                        />
                        {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                      </View>
                    )}
                  />
                )}

                {/* Conditional User Selector (for specific reasons) */}
                {shouldShowUserField && (
                  <Controller
                    control={form.control}
                    name="userId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
                        <Label>Usuário{[ACTIVITY_REASON.PPE_DELIVERY, ACTIVITY_REASON.BORROW].includes(reason as ACTIVITY_REASON) ? " *" : " (Opcional)"}</Label>
                        <Combobox
                          value={value || ""}
                          onValueChange={(val) => onChange(val || null)}
                          options={userOptions}
                          placeholder="Selecione um usuário"
                          searchPlaceholder="Buscar usuário..."
                          emptyText="Nenhum usuário encontrado"
                          onSearchChange={setUserSearchQuery}
                          disabled={isSubmitting || isLoadingUsers}
                          loading={isLoadingUsers}
                        />
                        {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                      </View>
                    )}
                  />
                )}
              </View>
            </CardContent>
          </Card>

          {/* Item Selection */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Selecionar Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.fieldGroup}>
                <Label>Adicionar Item</Label>
                <Combobox
                  value=""
                  onValueChange={handleAddItem}
                  options={itemOptions}
                  placeholder="Buscar e adicionar item..."
                  searchPlaceholder="Digite para buscar..."
                  emptyText="Nenhum item encontrado"
                  onSearchChange={setSearchQuery}
                  disabled={isSubmitting || isLoadingItems}
                  loading={isLoadingItems}
                />
              </View>
            </CardContent>
          </Card>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Itens Selecionados ({selectedItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.itemsList}>
                  {selectedItems.map((item, index) => {
                    const stockColor = getStockLevelColor(item.currentStock, item.quantity, operation);
                    const hasStockWarning = operation === ACTIVITY_OPERATION.OUTBOUND && item.currentStock < item.quantity;
                    const hasLowStock = operation === ACTIVITY_OPERATION.OUTBOUND && item.currentStock > 0 && item.currentStock < item.quantity * 2;

                    return (
                      <View key={item.itemId} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.itemInfo}>
                          <View style={styles.itemHeader}>
                            <ThemedText style={styles.itemName} numberOfLines={1}>
                              {item.name}
                            </ThemedText>
                            {/* Stock Badge */}
                            <Badge
                              variant={hasStockWarning ? "destructive" : hasLowStock ? "warning" : "outline"}
                              style={styles.stockBadge}
                            >
                              <ThemedText style={[styles.stockBadgeText, { color: stockColor }]}>
                                Estoque: {item.currentStock}
                              </ThemedText>
                            </Badge>
                          </View>

                          {/* Stock Warning */}
                          {hasStockWarning && (
                            <View style={styles.warningRow}>
                              <IconAlertCircle size={16} color={colors.destructive} />
                              <ThemedText style={[styles.warningText, { color: colors.destructive }]}>
                                Estoque insuficiente! Disponível: {item.currentStock}
                              </ThemedText>
                            </View>
                          )}

                          {/* Low Stock Warning */}
                          {hasLowStock && !hasStockWarning && (
                            <View style={styles.warningRow}>
                              <IconInfoCircle size={16} color="#f59e0b" />
                              <ThemedText style={[styles.warningText, { color: "#f59e0b" }]}>
                                Estoque baixo
                              </ThemedText>
                            </View>
                          )}

                          <View style={styles.quantityRow}>
                            <Label style={styles.quantityLabel}>Quantidade:</Label>
                            <Input
                              value={item.quantity.toString()}
                              onChangeText={(value) => handleQuantityChange(item.itemId, value)}
                              keyboardType="numeric"
                              editable={!isSubmitting}
                              containerStyle={styles.quantityInput}
                              error={hasStockWarning}
                            />
                          </View>
                        </View>
                        <Button
                          variant="ghost"
                          onPress={() => handleRemoveItem(item.itemId)}
                          disabled={isSubmitting}
                          style={styles.removeButton}
                        >
                          <Icon name="trash" size={20} color={colors.destructive} />
                        </Button>
                      </View>
                    );
                  })}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.actions}>
              <Button variant="outline" onPress={onCancel} disabled={isSubmitting} style={styles.cancelButton}>
                Cancelar
              </Button>
              <Button
                onPress={form.handleSubmit(handleFormSubmit)}
                disabled={isSubmitting || selectedItems.length === 0}
                style={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <IconLoader size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>Salvando...</ThemedText>
                  </>
                ) : (
                  <ThemedText style={{ color: colors.primaryForeground }}>Criar Movimentações</ThemedText>
                )}
              </Button>
            </View>
          </View>
        </View>
      </ThemedScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  operationBadge: {
    marginLeft: spacing.sm,
  },
  helpText: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  helpTextContent: {
    fontSize: fontSize.xs,
    color: "#6b7280",
    flex: 1,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: "500",
    flex: 1,
    marginRight: spacing.sm,
  },
  stockBadge: {
    marginLeft: spacing.sm,
  },
  stockBadgeText: {
    fontSize: fontSize.xs,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    minWidth: 85,
  },
  quantityInput: {
    width: 80,
    height: 36,
  },
  removeButton: {
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsContainer: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    minWidth: 100,
  },
  submitButton: {
    minWidth: 120,
  },
});
