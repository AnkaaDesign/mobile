import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, Alert, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  IconEdit,
  IconTrash,
  IconHistory,
  IconPackage,
} from "@tabler/icons-react-native";
import { useOrder, useOrderMutations } from "@/hooks";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { OrderInfoCard } from "@/components/inventory/order/detail/order-info-card";
import { OrderItemsTable } from "@/components/inventory/order/detail/order-items-table";
import { OrderDocumentsCard } from "@/components/inventory/order/detail/order-documents-card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useTheme } from "@/lib/theme";
import { routes, ORDER_STATUS, SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege, formatCurrency } from "@/utils";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
// import { showToast } from "@/components/ui/toast";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canManageWarehouse = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);

  // Fetch order data with all necessary includes (matching web version)
  const { data: response, isLoading, error, refetch } = useOrder(id!, {
    include: {
      items: {
        include: {
          item: {
            include: {
              brand: true,
              measures: true,
            },
          },
        },
      },
      supplier: {
        include: {
          logo: true,
        },
      },
      budgets: true,
      invoices: true,
      receipts: true,
      reimbursements: true,
      invoiceReimbursements: true,
    },
    enabled: !!id && id !== "",
  });

  const { delete: deleteOrder } = useOrderMutations();

  const order = response?.data;

  // Calculate order total with taxes
  const orderTotal = useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce((total, item) => {
      const subtotal = item.orderedQuantity * item.price;
      const icmsAmount = subtotal * (item.icms / 100);
      const ipiAmount = subtotal * (item.ipi / 100);
      return total + subtotal + icmsAmount + ipiAmount;
    }, 0);
  }, [order?.items]);

  // Check if order can be edited
  const canEdit = useMemo(() => {
    return (
      canManageWarehouse &&
      order &&
      ![ORDER_STATUS.RECEIVED, ORDER_STATUS.CANCELLED].includes(order.status)
    );
  }, [canManageWarehouse, order]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      Alert.alert("Sucesso", "Pedido atualizado");
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleEdit = useCallback(() => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar pedidos");
      return;
    }
    router.push(routeToMobilePath(routes.inventory.orders.edit(id!)) as any);
  }, [canEdit, id]);

  const handleDelete = useCallback(() => {
    if (!canDelete) {
      Alert.alert("Sem permissão", "Você não tem permissão para excluir pedidos");
      return;
    }

    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir este pedido?\n\nFornecedor: ${order?.supplier?.fantasyName || "Não especificado"}\nValor Total: ${formatCurrency(orderTotal)}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOrder(id!);
              router.replace(routeToMobilePath(routes.inventory.orders.list) as any);
              Alert.alert("Sucesso", "Pedido excluído com sucesso");
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  }, [canDelete, order, orderTotal, deleteOrder, id]);

  if (isLoading) {
    return <LoadingScreen message="Carregando pedido..." />;
  }

  if (error || !order || !id || id === "") {
    return (
      <View style={[styles.scrollView, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
                <IconPackage size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                Pedido não encontrado
              </ThemedText>
              <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
                O pedido solicitado não foi encontrado ou pode ter sido removido.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header Card with Order Title and Actions */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconPackage size={24} color={colors.primary} />
              <View style={styles.headerTitleContainer}>
                <ThemedText style={[styles.orderTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {order.description || `Pedido #${order.id.slice(-8).toUpperCase()}`}
                </ThemedText>
                {order.supplier && (
                  <ThemedText style={[styles.supplierName, { color: colors.mutedForeground }]}>
                    {order.supplier.fantasyName}
                  </ThemedText>
                )}
              </View>
            </View>
            <View style={styles.headerActions}>
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        {/* Order Info Card */}
        <OrderInfoCard order={order} />

        {/* Order Items Table */}
        <OrderItemsTable order={order} />

        {/* Documents */}
        <OrderDocumentsCard order={order} />

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconHistory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.ORDER}
              entityId={order.id}
              entityName={order.description}
              entityCreatedAt={order.createdAt}
              maxHeight={400}
            />
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  orderTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  supplierName: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  changelogContent: {
    marginTop: spacing.sm,
  },
  errorContent: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
