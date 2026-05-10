import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconHistory, IconPackage } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { DetailScreen } from "@/components/screens/detail-screen";
import { useTheme } from "@/lib/theme";
import { useOrder, useOrderMutations } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import {
  routes,
  SECTOR_PRIVILEGES,
  CHANGE_LOG_ENTITY_TYPE,
} from "@/constants";
import { EDITABLE_ORDER_STATUSES } from "@/constants/editable-statuses";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { OrderInfoCard } from "@/components/inventory/order/detail/order-info-card";
import { OrderItemsTable } from "@/components/inventory/order/detail/order-items-table";
import { OrderDocumentsCard } from "@/components/inventory/order/detail/order-documents-card";
import type { Order } from "@/types";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { deleteMutation } = useOrderMutations();

  const query = useOrder(id as string, {
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
      paymentResponsible: true,
      paymentAssignedBy: true,
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<Order>
      query={query as any}
      icon={IconPackage}
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
      notFoundFallback={mobileRoute(routes.inventory.orders.root)}
    >
      {(order) => (
        <View style={styles.body}>
          <OrderInfoCard order={order} />
          <OrderItemsTable order={order} />
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
