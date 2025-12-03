import { useEffect } from "react";
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconPackage, IconCurrency, IconCalendar } from "@tabler/icons-react-native";
import { useOrderItem, useOrderItemMutations } from "@/hooks";
import { orderItemUpdateSchema } from '../../../../../../../schemas';
import type { OrderItemUpdateFormData } from '../../../../../../../schemas';
import { ThemedView, ThemedText, ErrorScreen, LoadingScreen, Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { ThemedTextInput } from "@/components/ui/themed-text-input";

import { useTheme } from "@/lib/theme";
import { formatCurrency, formatDate } from "@/utils";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EditOrderItemScreen() {
  const router = useRouter();
  const { orderId, id } = useLocalSearchParams<{ orderId: string; id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);

  if (!canEdit) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Sem permissão" detail="Você não tem permissão para editar itens" />
      </ThemedView>
    );
  }

  // Get order item details
  const {
    data: orderItem,
    isLoading,
    error,
    refetch,
  } = useOrderItem(id!, {
    include: {
      item: {
        include: {
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      },
      order: {
        select: {
          id: true,
          description: true,
          supplier: { select: { id: true, name: true } },
          status: true,
        },
      },
    },
    enabled: !!id,
  });

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<OrderItemUpdateFormData>({
    resolver: zodResolver(orderItemUpdateSchema),
    mode: "onChange",
  });

  // Watch for quantity and unit price changes to calculate total
  const watchedQuantity = watch("orderedQuantity");
  const watchedUnitPrice = watch("price");
  const watchedFulfilledQuantity = watch("receivedQuantity");
  const watchedReceivedQuantity = watch("receivedQuantity");

  // Initialize form with current data
  useEffect(() => {
    if (orderItem?.data) {
      reset({
        orderedQuantity: orderItem.data.orderedQuantity,
        price: orderItem.data.price || 0,
        receivedQuantity: orderItem.data.receivedQuantity || undefined,
      });
    }
  }, [orderItem, reset]);

  // Mutations
  const { update, isLoading: isUpdating } = useOrderItemMutations({
    onUpdateSuccess: () => {
      router.back();
    },
  });

  const onSubmit = async (data: OrderItemUpdateFormData) => {
    try {
      await update({ id: id!, data });
    } catch (_error) {
      console.error("Error updating order item:", error);
      Alert.alert("Erro", "Não foi possível atualizar o item. Tente novamente.");
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        "Descartar alterações",
        "Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.",
        [
          { text: "Continuar editando", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (_error) {
      Alert.alert("Erro", "Não foi possível recarregar os dados.");
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando item..." />;
  }

  if (error || !orderItem) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar item"
          detail={error?.message || "Item não encontrado"}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const item = orderItem?.data?.item;
  const order = orderItem?.data?.order;

  const getItemStatus = () => {
    const received = watchedReceivedQuantity ?? orderItem?.data?.receivedQuantity ?? 0;
    const fulfilled = watchedFulfilledQuantity ?? orderItem?.data?.receivedQuantity ?? 0;
    const ordered = watchedQuantity ?? orderItem?.data?.orderedQuantity ?? 0;

    if (received >= ordered) {
      return { color: colors.primary, label: "Recebido" };
    }
    if (fulfilled >= ordered) {
      return { color: colors.warning, label: "Atendido" };
    }
    return { color: colors.muted, label: "Pendente" };
  };

  const status = getItemStatus();
  const totalPrice = (watchedQuantity || 0) * (watchedUnitPrice || 0);
  const originalTotalPrice = (orderItem?.data?.orderedQuantity || 0) * (orderItem?.data?.price || 0);

  return (
    <KeyboardAvoidingView
      style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ThemedView style={StyleSheet.flatten([styles.container, { paddingBottom: insets.bottom }])}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Context */}
          {order && (
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconPackage size={20} color={colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.title}>{order?.description || `Pedido #${orderId}`}</ThemedText>
                    <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>{order?.supplier?.name}</ThemedText>
                  </View>
                </View>
                <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: status.color + "20" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.statusText, { color: status.color }])}>
                    {status.label}
                  </ThemedText>
                </View>
              </View>
            </Card>
          )}

          {/* Item Information (Read-only) */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconPackage size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Item</ThemedText>
              </View>
            </View>

            <View style={styles.content}>
              <ThemedText style={styles.itemName}>{item?.name || "Item desconhecido"}</ThemedText>

              <View style={styles.content}>
                {item?.uniCode && (
                  <View style={styles.itemDetailRow}>
                    <ThemedText style={styles.itemDetailLabel}>Código:</ThemedText>
                    <ThemedText style={styles.itemDetailValue}>{item.uniCode}</ThemedText>
                  </View>
                )}

                {item?.brand?.name && (
                  <View style={styles.itemDetailRow}>
                    <ThemedText style={styles.itemDetailLabel}>Marca:</ThemedText>
                    <ThemedText style={styles.itemDetailValue}>{item.brand.name}</ThemedText>
                  </View>
                )}

                {item?.category?.name && (
                  <View style={styles.itemDetailRow}>
                    <ThemedText style={styles.itemDetailLabel}>Categoria:</ThemedText>
                    <ThemedText style={styles.itemDetailValue}>{item.category.name}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Quantity and Price Editing */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCurrency size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Quantidade e Preço</ThemedText>
              </View>
            </View>
            <View style={styles.content}>

            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="orderedQuantity"
                  rules={{
                    required: "Quantidade é obrigatória",
                    min: { value: 1, message: "Quantidade deve ser maior que 0" },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ThemedTextInput
                      label="Quantidade Pedida *"
                      placeholder="1"
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        onChange(num);
                      }}
                      keyboardType="numeric"
                      error={errors.orderedQuantity?.message}
                    />
                  )}
                />
              </View>

              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="price"
                  rules={{
                    required: "Preço unitário é obrigatório",
                    min: { value: 0, message: "Preço deve ser maior ou igual a 0" },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ThemedTextInput
                      label="Preço Unitário *"
                      placeholder="0,00"
                      value={value ? formatCurrency(value).replace("R$ ", "") : ""}
                      onChangeText={(text) => {
                        // Parse currency input
                        const cleanText = text.replace(/[^\d,]/g, "");
                        const numericValue = parseFloat(cleanText.replace(",", ".")) || 0;
                        onChange(numericValue);
                      }}
                      keyboardType="numeric"
                      error={errors.price?.message}
                    />
                  )}
                />
              </View>
            </View>

            {/* Fulfillment and Receiving */}
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="receivedQuantity"
                  rules={{
                    min: { value: 0, message: "Quantidade deve ser maior ou igual a 0" },
                    max: {
                      value: watchedQuantity || orderItem?.data?.orderedQuantity || 0,
                      message: "Não pode ser maior que a quantidade pedida",
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <ThemedTextInput
                      label="Quantidade Atendida"
                      placeholder="0"
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const num = parseInt(text) || undefined;
                        onChange(num);
                      }}
                      keyboardType="numeric"
                      error={errors.receivedQuantity?.message}
                    />
                  )}
                />
              </View>

              <View style={styles.formGroup}>
                {/* Quantity Received - This would need a separate field name if truly different from fulfilled quantity */}
                <ThemedTextInput
                  label="Quantidade Recebida"
                  placeholder="0"
                  value={(watchedReceivedQuantity ?? orderItem?.data?.receivedQuantity ?? 0).toString()}
                  onChangeText={() => {}} // Read-only for now as it's duplicate of receivedQuantity
                  keyboardType="numeric"
                  editable={false}
                />
              </View>
            </View>

            {/* Total Price Display */}
            <View style={styles.totalContainer}>
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total Original:</ThemedText>
                <ThemedText style={styles.originalTotalValue}>
                  {formatCurrency(originalTotalPrice)}
                </ThemedText>
              </View>
              {totalPrice !== originalTotalPrice && (
                <View style={styles.totalRow}>
                  <ThemedText style={styles.totalLabel}>Novo Total:</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.totalValue, { color: colors.primary }])}>
                    {formatCurrency(totalPrice)}
                  </ThemedText>
                </View>
              )}
            </View>
            </View>
          </Card>

          {/* Progress Summary */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconPackage size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Resumo</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.progressContainer}>
                <View style={styles.progressItem}>
                  <ThemedText style={styles.progressLabel}>Pedido</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.primary }])}>
                    {watchedQuantity || orderItem?.data?.orderedQuantity}
                  </ThemedText>
                </View>

                <View style={styles.progressItem}>
                  <ThemedText style={styles.progressLabel}>Atendido</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.warning }])}>
                    {watchedFulfilledQuantity ?? orderItem?.data?.receivedQuantity ?? 0}
                  </ThemedText>
                </View>

                <View style={styles.progressItem}>
                  <ThemedText style={styles.progressLabel}>Recebido</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.primary }])}>
                    {watchedReceivedQuantity ?? orderItem?.data?.receivedQuantity ?? 0}
                  </ThemedText>
                </View>

                <View style={styles.progressItem}>
                  <ThemedText style={styles.progressLabel}>Pendente</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.progressValue, { color: colors.destructive }])}>
                    {(watchedQuantity || orderItem?.data?.orderedQuantity || 0) - (watchedFulfilledQuantity ?? orderItem?.data?.receivedQuantity ?? 0)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Card>

          {/* Audit Information */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Informações de Auditoria</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.auditInfo}>
                <View style={styles.auditRow}>
                  <ThemedText style={styles.auditLabel}>Criado em:</ThemedText>
                  <ThemedText style={styles.auditValue}>
                    {formatDate(orderItem?.data?.createdAt || new Date())}
                  </ThemedText>
                </View>

                <View style={styles.auditRow}>
                  <ThemedText style={styles.auditLabel}>Atualizado em:</ThemedText>
                  <ThemedText style={styles.auditValue}>
                    {formatDate(orderItem?.data?.updatedAt || new Date())}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        <View style={StyleSheet.flatten([styles.actionButtons, { paddingBottom: insets.bottom }])}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            style={styles.saveButton}
            disabled={!isValid || isUpdating || !isDirty}
          >
            {isUpdating ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginVertical: 8,
    padding: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  orderSupplier: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    gap: 8,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  itemDetails: {
    gap: 6,
  },
  itemDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemDetailLabel: {
    fontSize: 14,
    opacity: 0.7,
    width: 80,
    fontWeight: "500",
  },
  itemDetailValue: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  formGroup: {
    flex: 1,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  totalContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  originalTotalValue: {
    fontSize: 16,
    fontWeight: "400",
    opacity: 0.7,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  progressItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    textAlign: "center",
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  auditInfo: {
    gap: 8,
  },
  auditRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  auditLabel: {
    fontSize: 14,
    opacity: 0.7,
    width: 120,
    fontWeight: "500",
  },
  auditValue: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});