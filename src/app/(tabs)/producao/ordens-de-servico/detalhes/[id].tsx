import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useServiceOrderDetail } from "@/hooks";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { EDITABLE_SERVICE_ORDER_STATUSES } from "@/constants/editable-statuses";
import { spacing, fontSize } from "@/constants/design-system";
import {
  IconClipboardList,
  IconHistory,
} from "@tabler/icons-react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useTheme } from "@/lib/theme";
import { DetailScreen } from "@/components/screens/detail-screen";

import {
  ServiceOrderInfoCard,
  TaskInfoCard,
} from "@/components/production/service-order/detail";

export default function ServiceOrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const id = params?.id || "";

  const query = useServiceOrderDetail(id, {
    include: {
      task: {
        select: {
          id: true,
          name: true,
          details: true,
          term: true,
          customer: { select: { id: true, fantasyName: true } },
        },
      },
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconClipboardList}
      title={(so) =>
        so.description || `Ordem #${String(so.id ?? "").slice(-8).toUpperCase()}`
      }
      // Mirrors API PUT /service-orders/:id roles (service-order.controller.ts);
      // same list as canEditServiceOrders in entity-permissions.
      privilege={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.PRODUCTION,
          SECTOR_PRIVILEGES.DESIGNER,
          SECTOR_PRIVILEGES.LOGISTIC,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      editGuard={{ editable: EDITABLE_SERVICE_ORDER_STATUSES }}
      editRoute={(so) =>
        mobileRoute(routes.production.serviceOrders.edit(so.id))
      }
      notFoundFallback={mobileRoute(routes.production.serviceOrders.root)}
    >
      {(serviceOrder) => {
        const orderDescription =
          serviceOrder.description ||
          `Ordem #${String(serviceOrder.id ?? "").slice(-8).toUpperCase()}`;

        return (
          <View style={styles.body}>
            <ServiceOrderInfoCard serviceOrder={serviceOrder} />
            <TaskInfoCard serviceOrder={serviceOrder} />

            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconHistory size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>
                    Histórico de Alterações
                  </ThemedText>
                </View>
              </View>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.SERVICE_ORDER}
                entityId={serviceOrder.id}
                entityName={orderDescription}
                entityCreatedAt={serviceOrder.createdAt}
                maxHeight={400}
              />
            </Card>
          </View>
        );
      }}
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
    justifyContent: "space-between",
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
    fontWeight: "500",
  },
});
