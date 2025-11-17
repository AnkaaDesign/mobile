import { useState } from "react";
import { View, ScrollView, Alert, RefreshControl , StyleSheet} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconArrowLeft, IconEdit, IconTrash, IconRefresh, IconCheck, IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrder, useOrderMutations } from "@/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { OrderInfoCard } from "@/components/inventory/order/detail/order-info-card";
import { OrderItemsCard } from "@/components/inventory/order/detail/order-items-card";
import { OrderSupplierCard } from "@/components/inventory/order/detail/order-supplier-card";
import { OrderTimelineCard } from "@/components/inventory/order/detail/order-timeline-card";
import { OrderSummaryCard } from "@/components/inventory/order/detail/order-summary-card";
import { OrderDocumentsCard } from "@/components/inventory/order/detail/order-documents-card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { routes, ORDER_STATUS, SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { spacing } from "@/constants/design-system";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);
  const canMarkAsReceived = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canCancel = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch order data with all necessary includes
  const { data: response, isLoading, error, refetch } = useOrder(id!, {
    include: {
      supplier: true,
      items: {
        include: {
          item: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      orderSchedule: true,
      createdBy: { select: { id: true, name: true, email: true } },
      activities: {
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      // File relations for documents
      budgets: true,
      invoices: true,
      receipts: true,
      reimbursements: true,
      invoiceReimbursements: true,
      _count: { select: { items: true } },
    },
  });

  const { update: updateOrder, delete: deleteOrder } = useOrderMutations();

  const order = response?.data;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar pedidos");
      return;
    }
    router.push(routeToMobilePath(routes.inventory.orders.edit(id!)) as any);
  };

  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert("Sem permissão", "Você não tem permissão para excluir pedidos");
      return;
    }

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOrder(id!);
              router.replace(routeToMobilePath(routes.inventory.orders.list) as any);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o pedido");
            }
          },
        },
      ],
    );
  };

  const handleMarkAsReceived = async () => {
    if (!canMarkAsReceived) {
      Alert.alert("Sem permissão", "Você não tem permissão para marcar pedidos como recebidos");
      return;
    }

    Alert.alert(
      "Confirmar Recebimento",
      "Confirma que todos os itens do pedido foram recebidos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await updateOrder({
                id: id!,
                data: { status: ORDER_STATUS.RECEIVED },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível atualizar o status do pedido");
            }
          },
        },
      ],
    );
  };

  const handleCancel = async () => {
    if (!canCancel) {
      Alert.alert("Sem permissão", "Você não tem permissão para cancelar pedidos");
      return;
    }

    Alert.alert(
      "Confirmar Cancelamento",
      "Tem certeza que deseja cancelar este pedido?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await updateOrder({
                id: id!,
                data: { status: ORDER_STATUS.CANCELLED },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível cancelar o pedido");
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !order) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar pedido"
          detail={error?.message || "Pedido não encontrado"}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  // Determine available actions based on status
  const showMarkAsReceived =
    order?.status === ORDER_STATUS.FULFILLED && canMarkAsReceived;
  const showCancel =
    order?.status !== ORDER_STATUS.RECEIVED &&
    order?.status !== ORDER_STATUS.CANCELLED &&
    canCancel;

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { paddingTop: insets.top }])}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Button
            variant="default"
            size="icon"
            onPress={handleGoBack}
          >
            <IconArrowLeft size={24} color={colors.foreground} />
          </Button>
          <ThemedText style={styles.headerTitle}>Pedido #{order?.id?.slice(-8).toUpperCase()}</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <Button
            variant="default"
            size="icon"
            onPress={handleRefresh}><IconRefresh size={24} color={colors.foreground} /></Button>
          {canEdit && (
            <Button
              variant="default"
              size="icon"
              onPress={handleEdit}><IconEdit size={24} color={colors.foreground} /></Button>
          )}
          {canDelete && (
            <Button
              variant="default"
              size="icon"
              onPress={handleDelete}><IconTrash size={24} color={colors.destructive} /></Button>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.cardsContainer}>
          {/* Order Info */}
          <OrderInfoCard order={order} />

          {/* Supplier Info */}
          {order?.supplier && <OrderSupplierCard supplier={order.supplier} />}

          {/* Financial Summary */}
          <OrderSummaryCard order={order} />

          {/* Order Items */}
          <OrderItemsCard items={order?.items || []} />

          {/* Documents */}
          <OrderDocumentsCard order={order} />

          {/* Timeline */}
          <OrderTimelineCard order={order} activities={order?.activities || []} />

          {/* Changelog */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.ORDER}
                entityId={order.id}
                entityName={order.description}
                entityCreatedAt={order.createdAt}
                maxHeight={400}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {(showMarkAsReceived || showCancel) && (
            <View style={styles.actionsCard}>
              {showMarkAsReceived && (
                <Button
                  variant="default"
                  onPress={handleMarkAsReceived}
                  style={styles.actionButton}
                >
                  <IconCheck size={20} color="#fff" />
                  <ThemedText style={{ color: "#fff" }}>Marcar como Recebido</ThemedText>
                </Button>
              )}
              {showCancel && (
                <Button
                  variant="destructive"
                  onPress={handleCancel}
                  style={styles.actionButton}
                >
                  <IconX size={20} color="#fff" />
                  <ThemedText style={{ color: "#fff" }}>Cancelar Pedido</ThemedText>
                </Button>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  actionsCard: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    width: "100%",
  },
});