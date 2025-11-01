import React, { useState, useCallback } from "react";
import { View, Alert, Pressable , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderItemsByOrder, useOrderItemMutations, useOrder } from '../../../../../../hooks';

import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { formatCurrency } from '../../../../../../utils';
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../../../constants';

export default function OrderItemsListScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [_refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Check permissions
  const canEdit = !!(user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE));
  const canDelete = !!(user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN));

  // Get order details
  const { data: order, isLoading: orderLoading, error: orderError } = useOrder(orderId!, {
    include: {
      supplier: { select: { id: true, name: true } },
    },
    enabled: !!orderId,
  });

  // Get order items
  const {
    data: orderItemsResponse,
    
    error,
    refetch,
    
  } = useOrderItemsByOrder(
    {
      orderId: orderId!,
      filters: {
        ...(searchText ? { searchingFor: searchText } : {}),
        include: {
          item: {
            select: {
              id: true,
              name: true,
              uniCode: true,
              brand: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    { enabled: !!orderId }
  );

  const orderItems = orderItemsResponse?.data ?? [];

  const { delete: deleteOrderItem } = useOrderItemMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleAddItem = () => {
    router.push(`/estoque/pedidos/${orderId}/items/adicionar` as any);
  };

  const handleItemPress = (itemId: string) => {
    router.push(`/estoque/pedidos/${orderId}/items/detalhes/${itemId}` as any);
  };

  const handleEditItem = (itemId: string) => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar itens");
      return;
    }
    router.push(`/estoque/pedidos/${orderId}/items/editar/${itemId}` as any);
  };

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!canDelete) {
        Alert.alert("Sem permissão", "Você não tem permissão para excluir itens");
        return;
      }

      const orderItem = orderItems.find((item) => item.id === itemId);
      const itemName = orderItem?.item?.name || "Item";

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
                await deleteOrderItem(itemId);
              } catch (error) {
                Alert.alert("Erro", "Não foi possível remover o item. Tente novamente.");
              }
            },
          },
        ]
      );
    },
    [deleteOrderItem, orderItems, canDelete]
  );

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  if (orderLoading && !orderError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Carregando pedido...</ThemedText>
      </ThemedView>
    );
  }

  if (orderError) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar pedido" detail={orderError.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar itens" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasItems = Array.isArray(orderItems) && orderItems.length > 0;
  const totalValue = orderItems.reduce((sum, item) => sum + (item?.price || 0) * (item?.orderedQuantity || 0), 0);

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }])}>
      {/* Order Info Header */}
      {order && (
        <Card style={styles.orderInfoCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <ThemedText style={styles.orderTitle}>{order?.data?.description || `Pedido #${orderId}`}</ThemedText>
              <ThemedText style={styles.orderSupplier}>{order?.data?.supplier?.name}</ThemedText>
            </View>
            <View style={styles.orderStats}>
              <Badge size="sm">
                <ThemedText style={styles.badgeText}>{orderItems.length} itens</ThemedText>
              </Badge>
            </View>
          </View>
          {hasItems && (
            <View style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>Total dos Itens:</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.totalValue, { color: colors.primary }])}>
                {formatCurrency(totalValue)}
              </ThemedText>
            </View>
          )}
        </Card>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          onSearch={handleSearch}
          placeholder="Buscar itens..."
          style={styles.searchBar}
          debounceMs={300}
        />
      </View>

      {hasItems ? (
        <View style={styles.itemsList}>
          {orderItems.map((orderItem) => (
            <OrderItemCard
              key={orderItem.id}
              orderItem={orderItem}
              onPress={() => handleItemPress(orderItem.id)}
              onEdit={() => handleEditItem(orderItem.id)}
              onDelete={() => handleDeleteItem(orderItem.id)}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "package"}
            title={searchText ? "Nenhum item encontrado" : "Nenhum item no pedido"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece adicionando itens ao pedido"}
            actionLabel={searchText || !canEdit ? undefined : "Adicionar Item"}
            onAction={searchText || !canEdit ? undefined : handleAddItem}
          />
        </View>
      )}

      {/* Items count */}
      {hasItems && <ItemsCountDisplay loadedCount={orderItems.length} totalCount={orderItems.length} isLoading={false} />}

      {canEdit && <FAB icon="plus" onPress={handleAddItem} />}
    </ThemedView>
  );
}

interface OrderItemCardProps {
  orderItem: any; // Replace with proper OrderItem type
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({
  orderItem,
  onPress,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const { colors } = useTheme();
  const item = orderItem?.item;

  const getItemStatus = () => {
    if (orderItem?.receivedQuantity && orderItem.receivedQuantity >= orderItem.orderedQuantity) {
      return { color: colors.primary, label: "Recebido" };
    }
    if (orderItem?.receivedQuantity && orderItem.receivedQuantity > 0) {
      return { color: colors.warning, label: "Atendido" };
    }
    return { color: colors.muted, label: "Pendente" };
  };

  const status = getItemStatus();
  const totalPrice = (orderItem?.price || 0) * (orderItem?.orderedQuantity || 0);

  return (
    <Card style={styles.itemCard}>
      <Pressable
        style={({ pressed }) => [
          styles.itemContent,
          pressed && { opacity: 0.8 },
        ]}
        onPress={onPress}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <ThemedText style={styles.itemName} numberOfLines={2}>
              {item?.name || "Item desconhecido"}
            </ThemedText>
            {item?.uniCode && (
              <ThemedText style={styles.itemCode}>Código: {item.uniCode}</ThemedText>
            )}
            {item?.brand?.name && (
              <ThemedText style={styles.itemBrand}>Marca: {item.brand.name}</ThemedText>
            )}
          </View>
          <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: status.color + "20" }])}>
            <ThemedText style={StyleSheet.flatten([styles.statusText, { color: status.color }])}>
              {status.label}
            </ThemedText>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.quantityInfo}>
            <View style={styles.quantityRow}>
              <ThemedText style={styles.quantityLabel}>Pedido:</ThemedText>
              <ThemedText style={styles.quantityValue}>{orderItem?.orderedQuantity}</ThemedText>
            </View>
            {orderItem?.receivedQuantity !== null && (
              <View style={styles.quantityRow}>
                <ThemedText style={styles.quantityLabel}>Atendido:</ThemedText>
                <ThemedText style={styles.quantityValue}>{orderItem?.receivedQuantity}</ThemedText>
              </View>
            )}
            {orderItem?.receivedQuantity !== null && (
              <View style={styles.quantityRow}>
                <ThemedText style={styles.quantityLabel}>Recebido:</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.primary }])}>
                  {orderItem?.receivedQuantity}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.priceInfo}>
            <ThemedText style={styles.priceLabel}>Preço Unit:</ThemedText>
            <ThemedText style={styles.priceValue}>
              {formatCurrency(orderItem?.price || 0)}
            </ThemedText>
            <ThemedText style={styles.priceLabel}>Total:</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.priceValue, styles.totalPrice])}>
              {formatCurrency(totalPrice)}
            </ThemedText>
          </View>
        </View>

      </Pressable>

      {/* Action buttons */}
      {(canEdit || canDelete) && (
        <View style={styles.actionButtons}>
          {canEdit && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.primary + "20" },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onEdit}
            >
              <IconEdit size={18} color={colors.primary} />
            </Pressable>
          )}
          {canDelete && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.destructive + "20" },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onDelete}
            >
              <IconTrash size={18} color={colors.destructive} />
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orderInfoCard: {
    margin: 16,
    padding: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  orderStats: {
    alignItems: "flex-end",
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flex: 1,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 12,
    opacity: 0.6,
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
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  quantityInfo: {
    flex: 1,
    gap: 4,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 14,
    opacity: 0.7,
    width: 80,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  notes: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});