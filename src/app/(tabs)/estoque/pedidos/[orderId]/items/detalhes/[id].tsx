import { useState } from "react";
import { View, ScrollView, Alert, Pressable , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconEdit, IconTrash, IconPackage, IconCalendar, IconCurrency } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderItem, useOrderItemMutations, useScreenReady} from '@/hooks';
import { ThemedView, ThemedText, ErrorScreen, FAB } from "@/components/ui";
import { Card } from "@/components/ui/card";

import { useTheme } from "@/lib/theme";
import { formatCurrency, formatDate } from "@/utils";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";


import { Skeleton } from "@/components/ui/skeleton";

export default function OrderItemDetailScreen() {
  const router = useRouter();
  const { orderId, id } = useLocalSearchParams<{ orderId: string; id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [_refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);

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
          measures: true,
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

  useScreenReady(!isLoading);

  const { delete: deleteOrderItem } = useOrderItemMutations();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar itens");
      return;
    }
    router.push(`/estoque/pedidos/${orderId}/items/editar/${id}` as any);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      Alert.alert("Sem permissão", "Você não tem permissão para excluir itens");
      return;
    }

    const itemName = orderItem?.data?.item?.name || "Item";

    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja remover "${itemName}" do pedido?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOrderItem(id!);
              router.back();
            } catch (_error) {
              Alert.alert("Erro", "Não foi possível remover o item. Tente novamente.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
        <Skeleton style={{ height: 24, width: '40%', borderRadius: 4 }} />
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '70%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
        </View>
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '80%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
        </View>
      </View>;
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
    if (orderItem?.data?.receivedQuantity && orderItem.data.receivedQuantity >= (orderItem.data.orderedQuantity || 0)) {
      return { color: colors.primary, label: "Recebido" };
    }
    if (orderItem?.data?.receivedQuantity && orderItem.data.receivedQuantity > 0) {
      return { color: colors.warning, label: "Parcial" };
    }
    return { color: colors.muted, label: "Pendente" };
  };

  const status = getItemStatus();
  const totalPrice = (orderItem?.data?.price || 0) * (orderItem?.data?.orderedQuantity || 0);
  const pendingQuantity = (orderItem?.data?.orderedQuantity || 0) - (orderItem?.data?.receivedQuantity || 0);
  const pendingReceive = Math.max(0, (orderItem?.data?.orderedQuantity || 0) - (orderItem?.data?.receivedQuantity || 0));

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Context */}
        {order && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconPackage size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Pedido</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.orderTitle}>{order?.description || `Pedido #${order?.id}`}</ThemedText>
              <ThemedText style={styles.orderSupplier}>{order?.supplier?.fantasyName}</ThemedText>
            </View>
          </Card>
        )}

        {/* Item Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações do Item</ThemedText>
            </View>
            <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: status.color + "20" }])}>
              <ThemedText style={StyleSheet.flatten([styles.statusText, { color: status.color }])}>
                {status.label}
              </ThemedText>
            </View>
          </View>

          <View style={styles.content}>
            <ThemedText style={styles.itemName}>{item?.name || "Item desconhecido"}</ThemedText>

            {item?.uniCode && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Código:</ThemedText>
                <ThemedText style={styles.detailValue}>{item.uniCode}</ThemedText>
              </View>
            )}

            {item?.brand?.name && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Marca:</ThemedText>
                <ThemedText style={styles.detailValue}>{item.brand.name}</ThemedText>
              </View>
            )}

            {item?.category?.name && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Categoria:</ThemedText>
                <ThemedText style={styles.detailValue}>{item.category.name}</ThemedText>
              </View>
            )}

          </View>
        </Card>

        {/* Quantity Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCurrency size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Quantidades</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.quantityGrid}>
              <View style={styles.quantityCard}>
                <ThemedText style={styles.quantityLabel}>Pedido</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.primary }])}>
                  {orderItem?.data?.orderedQuantity || 0}
                </ThemedText>
              </View>

              <View style={styles.quantityCard}>
                <ThemedText style={styles.quantityLabel}>Atendido</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.warning }])}>
                  {orderItem?.data?.receivedQuantity || 0}
                </ThemedText>
              </View>

              <View style={styles.quantityCard}>
                <ThemedText style={styles.quantityLabel}>Recebido</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.primary }])}>
                  {orderItem?.data?.receivedQuantity || 0}
                </ThemedText>
              </View>

              {pendingQuantity > 0 && (
                <View style={styles.quantityCard}>
                  <ThemedText style={styles.quantityLabel}>Pendente</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.destructive }])}>
                    {pendingQuantity}
                  </ThemedText>
                </View>
              )}

              {pendingReceive > 0 && (
                <View style={styles.quantityCard}>
                  <ThemedText style={styles.quantityLabel}>A Receber</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.warning }])}>
                    {pendingReceive}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Price Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCurrency size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Preços</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <ThemedText style={styles.priceLabel}>Preço Unitário:</ThemedText>
                <ThemedText style={styles.priceValue}>
                  {formatCurrency(orderItem?.data?.price || 0)}
                </ThemedText>
              </View>

              <View style={styles.priceRow}>
                <ThemedText style={styles.priceLabel}>Quantidade:</ThemedText>
                <ThemedText style={styles.priceValue}>{orderItem?.data?.orderedQuantity || 0}</ThemedText>
              </View>

              <View style={StyleSheet.flatten([styles.priceRow, styles.totalRow])}>
                <ThemedText style={StyleSheet.flatten([styles.priceLabel, styles.totalLabel])}>Total:</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.priceValue, styles.totalValue, { color: colors.primary }])}>
                  {formatCurrency(totalPrice)}
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
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Criado em:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(orderItem?.data?.createdAt || new Date())}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Atualizado em:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(orderItem?.data?.updatedAt || new Date())}
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        {/* Action buttons for small screens */}
        {(canEdit || canDelete) && (
          <Card style={styles.card}>
            <View style={styles.actionButtons}>
              {canEdit && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleEdit}
                >
                  <IconEdit size={20} color="#fff" />
                  <ThemedText style={StyleSheet.flatten([styles.actionButtonText, { color: "#fff" }])}>
                    Editar
                  </ThemedText>
                </Pressable>
              )}

              {canDelete && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    { backgroundColor: colors.destructive },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleDelete}
                >
                  <IconTrash size={20} color="#fff" />
                  <ThemedText style={StyleSheet.flatten([styles.actionButtonText, { color: "#fff" }])}>
                    Excluir
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Floating edit button for larger screens */}
      {canEdit && <FAB icon="edit" onPress={handleEdit} />}
    </ThemedView>
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderInfo: {
    gap: 4,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  orderSupplier: {
    fontSize: 14,
    opacity: 0.7,
  },
  itemDetails: {
    gap: 8,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    width: 100,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    gap: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  quantityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quantityCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
  },
  quantityLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    textAlign: "center",
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  priceContainer: {
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    fontStyle: "italic",
  },
  auditInfo: {
    gap: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});