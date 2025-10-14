import React, { useState, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useItems, useUsers } from '../../../../hooks';
import { ACTIVITY_OPERATION, ACTIVITY_REASON } from '../../../../constants';
import { IconLoader } from "@tabler/icons-react-native";

// Form schema for batch activity creation
const activityBatchFormSchema = z.object({
  operation: z.enum([ACTIVITY_OPERATION.INBOUND, ACTIVITY_OPERATION.OUTBOUND]),
  userId: z.string().uuid().nullable().optional(),
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
  ] as const).nullable().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().positive("Quantidade deve ser positiva"),
  })).min(1, "Selecione pelo menos um item"),
});

type ActivityBatchFormData = z.infer<typeof activityBatchFormSchema>;

interface ActivityBatchCreateFormProps {
  onSubmit: (data: ActivityBatchFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OPERATION_OPTIONS = [
  { value: ACTIVITY_OPERATION.INBOUND, label: "Entrada" },
  { value: ACTIVITY_OPERATION.OUTBOUND, label: "Saída" },
];

const REASON_OPTIONS = [
  { value: ACTIVITY_REASON.ORDER_RECEIVED, label: "Pedido Recebido" },
  { value: ACTIVITY_REASON.PRODUCTION_USAGE, label: "Uso em Produção" },
  { value: ACTIVITY_REASON.PPE_DELIVERY, label: "Entrega de EPI" },
  { value: ACTIVITY_REASON.BORROW, label: "Empréstimo" },
  { value: ACTIVITY_REASON.RETURN, label: "Devolução" },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL, label: "Retirada Externa" },
  { value: ACTIVITY_REASON.EXTERNAL_WITHDRAWAL_RETURN, label: "Retorno Retirada Externa" },
  { value: ACTIVITY_REASON.INVENTORY_COUNT, label: "Contagem de Estoque" },
  { value: ACTIVITY_REASON.MANUAL_ADJUSTMENT, label: "Ajuste Manual" },
  { value: ACTIVITY_REASON.MAINTENANCE, label: "Manutenção" },
  { value: ACTIVITY_REASON.DAMAGE, label: "Dano" },
  { value: ACTIVITY_REASON.LOSS, label: "Perda" },
  { value: ACTIVITY_REASON.PAINT_PRODUCTION, label: "Produção de Tinta" },
  { value: ACTIVITY_REASON.OTHER, label: "Outro" },
];

export function ActivityBatchCreateForm({ onSubmit, onCancel, isSubmitting }: ActivityBatchCreateFormProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{ itemId: string; name: string; quantity: number }>>([]);

  const form = useForm<ActivityBatchFormData>({
    resolver: zodResolver(activityBatchFormSchema),
    defaultValues: {
      operation: ACTIVITY_OPERATION.INBOUND,
      userId: null,
      reason: null,
      items: [],
    },
  });

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

  const itemOptions = items?.data?.map((item) => ({
    value: item.id,
    label: `${item.name}${item.brand ? ` - ${item.brand.name}` : ""}`,
  })) || [];

  const userOptions = users?.data?.map((user) => ({
    value: user.id,
    label: user.name,
  })) || [];

  // Handle adding an item to the batch
  const handleAddItem = useCallback((itemId: string) => {
    const item = items?.data?.find((i) => i.id === itemId);
    if (!item) return;

    // Check if item already exists
    if (selectedItems.some((i) => i.itemId === itemId)) {
      Alert.alert("Atenção", "Este item já foi adicionado à lista");
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        quantity: 1,
      },
    ]);
  }, [items?.data, selectedItems]);

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
        })),
      };

      await onSubmit(formData);
    } catch (error) {
      // Error handled by parent component
    }
  };

  return (
    <FormProvider {...form}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Global Configuration */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Configuração Global</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.fieldGroup}>
                {/* Operation Selector */}
                <Controller
                  control={form.control}
                  name="operation"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Label>Operação *</Label>
                      <Combobox
                        value={value}
                        onValueChange={onChange}
                        options={OPERATION_OPTIONS}
                        placeholder="Selecione a operação"
                        searchable={false}
                        clearable={false}
                        disabled={isSubmitting}
                      />
                      {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    </View>
                  )}
                />

                {/* User Selector */}
                <Controller
                  control={form.control}
                  name="userId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View>
                      <Label>Usuário (Opcional)</Label>
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
                      {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                    </View>
                  )}
                />
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
                  {selectedItems.map((item) => (
                    <View key={item.itemId} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.itemInfo}>
                        <ThemedText style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <View style={styles.quantityRow}>
                          <Label style={styles.quantityLabel}>Qtd:</Label>
                          <Input
                            value={item.quantity.toString()}
                            onChangeText={(value) => handleQuantityChange(item.itemId, value)}
                            keyboardType="numeric"
                            disabled={isSubmitting}
                            style={styles.quantityInput}
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
                  ))}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    minWidth: 35,
  },
  quantityInput: {
    width: 80,
    height: 36,
  },
  removeButton: {
    padding: spacing.sm,
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
