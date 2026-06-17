import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconHistory, IconPackage } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { DetailScreen } from "@/components/screens/detail-screen";
import type { PageAction } from "@/components/ui/page-header";
import { useTheme } from "@/lib/theme";
import { useOrder, useOrderMutations } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { mobileRoute } from "@/constants/routes.types";
import {
  routes,
  SECTOR_PRIVILEGES,
  CHANGE_LOG_ENTITY_TYPE,
  ORDER_PAYMENT_STATUS,
} from "@/constants";
import { EDITABLE_ORDER_STATUSES } from "@/constants/editable-statuses";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { OrderInfoCard } from "@/components/inventory/order/detail/order-info-card";
import { OrderItemsTable } from "@/components/inventory/order/detail/order-items-table";
import { OrderDocumentsCard } from "@/components/inventory/order/detail/order-documents-card";
import { OrderPdfExportCard } from "@/components/inventory/order/detail/order-pdf-export-card";
import type { Order } from "@/types";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const { deleteMutation, markPaidMutation, markAwaitingPaymentMutation } = useOrderMutations();
  // Payment actions are restricted to finance/admin (mirrors web).
  const { allowed: canManagePayment } = usePrivilegeGate({
    any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL],
  });

  const query = useOrder(id as string, {
    include: {
      items: {
        include: {
          item: {
            include: {
              brands: true,
              category: true,
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
      orderSchedule: true,
      budgets: true,
      invoices: true,
      receipts: true,
      reimbursements: true,
      invoiceReimbursements: true,
      paymentResponsible: true,
      paymentAssignedBy: true,
    },
    enabled: !!id && id !== "",
  });

  const order = (query.data as any)?.data ?? (query.data as any);

  const handleMarkPaid = () => {
    if (!order?.id) return;
    Alert.alert(
      "Marcar como Pago",
      "Confirmar que este pedido foi pago?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Pago",
          onPress: async () => {
            try {
              await nav.withLoading(async () => markPaidMutation.mutateAsync(order.id));
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  const handleMarkAwaitingPayment = () => {
    if (!order?.id) return;
    Alert.alert(
      "Desfazer pagamento",
      "Reverter este pedido para Aguardando Pagamento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desfazer",
          style: "destructive",
          onPress: async () => {
            try {
              await nav.withLoading(async () => markAwaitingPaymentMutation.mutateAsync(order.id));
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  // Payment actions are restricted to ADMIN/FINANCIAL. An order is payable
  // (show "Marcar como Pago") while paymentStatus !== PAID; once PAID, offer
  // "Desfazer pagamento" to revert to awaiting payment.
  const isPaid = order?.paymentStatus === ORDER_PAYMENT_STATUS.PAID;
  const actions: PageAction[] = !canManagePayment
    ? []
    : isPaid
      ? [
          {
            key: "mark-awaiting-payment",
            label: "Desfazer pagamento",
            icon: "receipt",
            loading: markAwaitingPaymentMutation.isPending,
            onPress: handleMarkAwaitingPayment,
          },
        ]
      : [
          {
            key: "mark-paid",
            label: "Marcar como Pago",
            icon: "receipt",
            loading: markPaidMutation.isPending,
            onPress: handleMarkPaid,
          },
        ];

  return (
    <DetailScreen<Order>
      query={query as any}
      icon={IconPackage}
      actions={actions}
      title={(o) =>
        o.description || `Pedido #${o.id.slice(-8).toUpperCase()}`
      }
      subtitle={(o) => o.supplier?.fantasyName ?? null}
      privilege={{
        any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(o) => mobileRoute(routes.inventory.orders.edit(o.id))}
      editGuard={{
        field: "status",
        editable: EDITABLE_ORDER_STATUSES as unknown as string[],
      }}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.inventory.orders.list),
      }}
      // WAREHOUSE manages orders but must never delete them — ADMIN only.
      deletePrivilege={{ any: [SECTOR_PRIVILEGES.ADMIN] }}
      notFoundFallback={mobileRoute(routes.inventory.orders.root)}
    >
      {(order) => (
        <View style={styles.body}>
          <OrderInfoCard order={order} />
          <OrderItemsTable order={order} />
          <OrderPdfExportCard order={order} />
          <OrderDocumentsCard order={order} />

          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.ORDER}
                entityId={order.id}
                entityName={order.description ?? ""}
                entityCreatedAt={order.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  content: {
    gap: spacing.sm,
  },
});
