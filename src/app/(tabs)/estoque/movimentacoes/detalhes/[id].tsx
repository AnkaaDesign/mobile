import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  IconArrowDown,
  IconArrowUp,
  IconBox,
  IconClipboardList,
  IconHistory,
  IconUser,
} from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/ui/detail-page-layout";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { DetailScreen } from "@/components/screens/detail-screen";
import { useTheme } from "@/lib/theme";
import { useActivity, useActivityMutations, useCanViewPrices } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import {
  ACTIVITY_OPERATION,
  ACTIVITY_OPERATION_LABELS,
  ACTIVITY_REASON_LABELS,
  CHANGE_LOG_ENTITY_TYPE,
  SECTOR_PRIVILEGES,
  routes,
} from "@/constants";
import { formatCurrency, formatDateTime, formatQuantity } from "@/utils";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { Activity } from "@/types";

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { deleteMutation } = useActivityMutations();
  // Money is hidden from WAREHOUSE users by app-wide convention.
  const canViewPrices = useCanViewPrices();

  const query = useActivity(id as string, {
    select: {
      id: true,
      operation: true,
      quantity: true,
      reason: true,
      createdAt: true,
      itemId: true,
      userId: true,
      orderId: true,
      orderItemId: true,
      item: {
        select: {
          id: true,
          name: true,
          uniCode: true,
          brands: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          supplier: {
            select: { id: true, fantasyName: true, corporateName: true },
          },
          prices: {
            select: { id: true, value: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          position: { select: { id: true, name: true } },
          sector: { select: { id: true, name: true } },
        },
      },
      order: {
        select: {
          id: true,
          supplier: {
            select: { id: true, fantasyName: true, corporateName: true },
          },
        },
      },
      orderItem: {
        select: {
          id: true,
          orderedQuantity: true,
          item: { select: { id: true, name: true } },
        },
      },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen<Activity>
      query={query as any}
      icon={IconBox}
      title={(a) => `Movimentação #${String(a.id).slice(0, 8)}`}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta movimentação? Esta ação é irreversível e afetará o estoque.",
        successRoute: mobileRoute(routes.inventory.activities.root),
      }}
      notFoundFallback={mobileRoute(routes.inventory.activities.root)}
    >
      {(activity) => {
        const currentPrice = activity.item?.prices?.[0]?.value || 0;
        const totalValue = currentPrice * activity.quantity;
        const isInbound = activity.operation === ACTIVITY_OPERATION.INBOUND;

        return (
          <View style={styles.body}>
            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconBox size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Informações da Movimentação</ThemedText>
                </View>
              </View>
              <View style={styles.cardBody}>
                <DetailField
                  label="Operação"
                  icon="arrows-exchange"
                  value={
                    <View style={styles.operationValueRow}>
                      <View
                        style={[
                          styles.operationIcon,
                          { backgroundColor: isInbound ? "#10b981" : "#ef4444" },
                        ]}
                      >
                        {isInbound ? (
                          <IconArrowDown size={14} color="white" />
                        ) : (
                          <IconArrowUp size={14} color="white" />
                        )}
                      </View>
                      <ThemedText style={[styles.valueText, { color: colors.foreground }]}>
                        {ACTIVITY_OPERATION_LABELS[activity.operation]}
                      </ThemedText>
                    </View>
                  }
                />

                <DetailField
                  label="Quantidade"
                  icon="hash"
                  value={
                    <ThemedText
                      style={[
                        styles.valueText,
                        { color: isInbound ? "#10b981" : "#ef4444" },
                      ]}
                    >
                      {isInbound ? "+" : "-"}
                      {formatQuantity(activity.quantity)} un
                    </ThemedText>
                  }
                />

                {activity.reason && (
                  <DetailField
                    label="Motivo"
                    icon="clipboard-list"
                    value={
                      <Badge variant="outline">
                        <ThemedText style={styles.badgeText}>
                          {ACTIVITY_REASON_LABELS[activity.reason] || activity.reason}
                        </ThemedText>
                      </Badge>
                    }
                  />
                )}

                <DetailField
                  label="Data"
                  icon="calendar"
                  value={formatDateTime(activity.createdAt)}
                />
              </View>
            </Card>

            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconBox size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Informações do Item</ThemedText>
                </View>
              </View>
              <View style={styles.cardBody}>
                <DetailField label="Nome" icon="package" value={activity.item?.name || "-"} />
                <DetailField label="Código" icon="hash" value={activity.item?.uniCode || "-"} />
                {activity.item?.brands && activity.item.brands.length > 0 && (
                  <DetailField label="Marca" icon="tag" value={activity.item.brands.map((b) => b.name).join(", ")} />
                )}
                {activity.item?.category && (
                  <DetailField label="Categoria" icon="category" value={activity.item.category.name} />
                )}
                {activity.item?.supplier && (
                  <DetailField
                    label="Fornecedor"
                    icon="building"
                    value={activity.item.supplier.fantasyName || activity.item.supplier.corporateName}
                  />
                )}
                {canViewPrices && currentPrice > 0 && (
                  <>
                    <DetailField
                      label="Preço Unitário"
                      icon="coin"
                      value={formatCurrency(currentPrice)}
                    />
                    <DetailField
                      label="Valor Total"
                      icon="coin"
                      value={
                        <ThemedText
                          style={[styles.valueText, styles.valueBold, { color: colors.foreground }]}
                        >
                          {formatCurrency(totalValue)}
                        </ThemedText>
                      }
                    />
                  </>
                )}
              </View>
            </Card>

            {activity.user && (
              <Card style={styles.card}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <View style={styles.headerLeft}>
                    <IconUser size={20} color={colors.mutedForeground} />
                    <ThemedText style={styles.title}>Informações do Usuário</ThemedText>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <DetailField label="Nome" icon="user" value={activity.user.name} />
                  {activity.user.position && (
                    <DetailField
                      label="Cargo"
                      icon="briefcase"
                      value={activity.user.position.name}
                    />
                  )}
                  {activity.user.sector && (
                    <DetailField
                      label="Setor"
                      icon="building"
                      value={activity.user.sector.name}
                    />
                  )}
                </View>
              </Card>
            )}

            {activity.order && (
              <Card style={styles.card}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <View style={styles.headerLeft}>
                    <IconClipboardList size={20} color={colors.mutedForeground} />
                    <ThemedText style={styles.title}>Informações do Pedido</ThemedText>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <DetailField
                    label="Pedido"
                    icon="clipboard-list"
                    value={`#${activity.order.id.slice(0, 8)}`}
                  />
                  {activity.order.supplier && (
                    <DetailField
                      label="Fornecedor"
                      icon="building"
                      value={
                        activity.order.supplier.fantasyName ||
                        activity.order.supplier.corporateName
                      }
                    />
                  )}
                  {activity.orderItem && (
                    <DetailField
                      label="Item do Pedido"
                      icon="package"
                      value={`${activity.orderItem.orderedQuantity} un`}
                    />
                  )}
                </View>
              </Card>
            )}

            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconHistory size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
                </View>
              </View>
              <View style={styles.cardBody}>
                <ChangelogTimeline
                  entityType={CHANGE_LOG_ENTITY_TYPE.ACTIVITY}
                  entityId={activity.id}
                  entityName={`Movimentação - ${activity.item?.name || "Item"}`}
                  entityCreatedAt={activity.createdAt}
                  maxHeight={400}
                />
              </View>
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
  cardBody: {
    gap: spacing.md,
  },
  operationValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  operationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "500",
  },
  valueBold: {
    fontWeight: "600",
  },
  badgeText: {
    fontSize: 12,
  },
});
