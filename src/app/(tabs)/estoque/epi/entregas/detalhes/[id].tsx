import { useEffect, useMemo, useRef, useCallback } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import {
  usePpeDelivery,
  usePpeDeliveryMutations,
  useMarkPpeDeliveryAsDelivered,
} from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  PPE_DELIVERY_STATUS,
  PPE_DELIVERY_STATUS_LABELS,
  SECTOR_PRIVILEGES,
  MEASURE_UNIT_LABELS,
  PPE_TYPE_LABELS,
  CHANGE_LOG_ENTITY_TYPE,
  routes,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { EDITABLE_PPE_DELIVERY_STATUSES } from "@/constants/editable-statuses";
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
  formatQuantity,
} from "@/utils";
import {
  IconShield,
  IconUser,
  IconPackage,
  IconCalendar,
  IconTruck,
  IconCircleCheck,
  IconCircleX,
  IconAlertCircle,
  IconHash,
  IconTag,
  IconCategory,
  IconBoxMultiple,
  IconCurrencyDollar,
  IconHistory,
} from "@tabler/icons-react-native";
import { DetailScreen } from "@/components/screens/detail-screen";
import { trackPpeDeliveryEvent } from "@/services/ppe-signing";

export default function PPEDeliveryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewTrackedRef = useRef<string | null>(null);
  const { deleteMutation } = usePpeDeliveryMutations();

  // Best-effort: log DOCUMENT_VIEWED once per (delivery × screen mount).
  useEffect(() => {
    if (!id || viewTrackedRef.current === id) return;
    viewTrackedRef.current = id;
    void trackPpeDeliveryEvent(id, "DOCUMENT_VIEWED");
  }, [id]);

  const query = usePpeDelivery(id as string, {
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          prices: { orderBy: { updatedAt: "desc" }, take: 1 },
        },
      },
      user: { include: { position: true, sector: true } },
      reviewedByUser: true,
      ppeSchedule: { include: { ppeItems: true } },
    },
  });

  const adaptedQuery = useMemo(() => {
    const data = (query as any).data;
    if (!data) return query;
    const inner = data.data ?? data;
    if (!inner?.id) return query;
    const named = {
      ...inner,
      name: inner.item?.name ?? `Entrega EPI #${String(inner.id).slice(-8)}`,
    };
    return { ...query, data: { ...data, data: named } } as typeof query;
  }, [query]);

  return (
    <DetailScreen
      query={adaptedQuery as any}
      icon={IconShield}
      privilege={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      editGuard={{ editable: EDITABLE_PPE_DELIVERY_STATUSES }}
      editRoute={(d: any) => mobileRoute(routes.inventory.ppe.deliveries.edit(d.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.inventory.ppe.deliveries.root),
      }}
      notFoundFallback={mobileRoute(routes.inventory.ppe.deliveries.root)}
      status={(d: any) => ({
        label: PPE_DELIVERY_STATUS_LABELS[d.status as PPE_DELIVERY_STATUS] ?? d.status,
        variant: getBadgeVariantFromStatus("PPE_DELIVERY", d.status) as any,
      })}
    >
      {(delivery: any) => <DeliveryDetailBody delivery={delivery} refetch={query.refetch} />}
    </DetailScreen>
  );
}

function DeliveryDetailBody({
  delivery,
  refetch,
}: {
  delivery: any;
  refetch: () => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const nav = useNav();
  const markAsDelivered = useMarkPpeDeliveryAsDelivered();
  const { update } = usePpeDeliveryMutations();

  const handleMarkDelivered = useCallback(() => {
    if (delivery.status !== PPE_DELIVERY_STATUS.PENDING) {
      Alert.alert("Erro", "Ação não permitida");
      return;
    }
    Alert.alert(
      "Confirmar Entrega",
      `Tem certeza que deseja marcar esta entrega como realizada?\n\nItem: ${delivery.item?.name || "-"}\nFuncionário: ${delivery.user?.name || "-"}\nQuantidade: ${delivery.quantity}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: async () => {
            try {
              await nav.withLoading(async () =>
                markAsDelivered.mutateAsync({
                  id: delivery.id,
                  deliveryDate: new Date(),
                }),
              );
              await refetch();
            } catch {
              // API client surfaces error.
            }
          },
        },
      ],
    );
  }, [delivery, markAsDelivered, nav, refetch]);

  const handleCancelDelivery = useCallback(() => {
    if (delivery.status !== PPE_DELIVERY_STATUS.PENDING) return;
    Alert.alert(
      "Cancelar Entrega",
      `Tem certeza que deseja cancelar esta entrega?\n\nItem: ${delivery.item?.name || "-"}\nFuncionário: ${delivery.user?.name || "-"}`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar Entrega",
          style: "destructive",
          onPress: async () => {
            try {
              await nav.withLoading(async () =>
                update({
                  id: delivery.id,
                  data: { status: PPE_DELIVERY_STATUS.CANCELLED } as any,
                }),
              );
              await refetch();
            } catch {
              // API client surfaces error.
            }
          },
        },
      ],
    );
  }, [delivery, update, nav, refetch]);

  const StatusIcon = useMemo(() => {
    switch (delivery.status) {
      case PPE_DELIVERY_STATUS.PENDING:
        return IconAlertCircle;
      case PPE_DELIVERY_STATUS.DELIVERED:
        return IconCircleCheck;
      case PPE_DELIVERY_STATUS.CANCELLED:
      case PPE_DELIVERY_STATUS.REPROVED:
        return IconCircleX;
      default:
        return IconAlertCircle;
    }
  }, [delivery.status]);

  const currentPrice =
    delivery.item?.prices && delivery.item.prices.length > 0
      ? delivery.item.prices[0].value
      : null;

  return (
    <View style={styles.body}>
      {/* Action buttons row (only when relevant status) */}
      {delivery.status === PPE_DELIVERY_STATUS.PENDING && (
        <View style={styles.actionRow}>
          <Button variant="default" onPress={handleMarkDelivered} style={{ flex: 1 }}>
            <IconTruck size={18} color={colors.primaryForeground} />
            <ThemedText style={{ color: colors.primaryForeground, marginLeft: 6 }}>
              Marcar Entregue
            </ThemedText>
          </Button>
          <Button variant="outline" onPress={handleCancelDelivery} style={{ flex: 1 }}>
            <IconCircleX size={18} color={colors.destructive} />
            <ThemedText style={{ marginLeft: 6 }}>Cancelar</ThemedText>
          </Button>
        </View>
      )}

      {/* Status + ID Card */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconShield size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Status da Entrega</ThemedText>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Status</ThemedText>
            <Badge
              variant={getBadgeVariantFromStatus("PPE_DELIVERY", delivery.status)}
              style={styles.badge}
            >
              <StatusIcon size={14} color={colors.primaryForeground} style={{ marginRight: 4 }} />
              {PPE_DELIVERY_STATUS_LABELS[delivery.status as PPE_DELIVERY_STATUS]}
            </Badge>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <IconHash size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.detailLabel}>ID</ThemedText>
            </View>
            <ThemedText style={styles.detailValueMono}>#{delivery.id.slice(-8)}</ThemedText>
          </View>
        </View>
      </Card>

      {/* Employee */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconUser size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Funcionário</ThemedText>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Nome</ThemedText>
            <ThemedText style={styles.detailValue}>{delivery.user?.name || "-"}</ThemedText>
          </View>
          {delivery.user?.position && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Cargo</ThemedText>
              <ThemedText style={styles.detailValue}>{delivery.user.position.name}</ThemedText>
            </View>
          )}
          {delivery.user?.sector && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Setor</ThemedText>
              <ThemedText style={styles.detailValue}>{delivery.user.sector.name}</ThemedText>
            </View>
          )}
        </View>
      </Card>

      {/* Item EPI */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Item EPI</ThemedText>
          </View>
        </View>
        <View style={styles.itemDetails}>
          {delivery.item ? (
            <>
              <View style={styles.highlightBox}>
                <ThemedText style={styles.highlightText}>
                  {delivery.item.uniCode && (
                    <>
                      <ThemedText style={styles.uniCode}>{delivery.item.uniCode}</ThemedText>
                      {" - "}
                    </>
                  )}
                  {delivery.item.name}
                </ThemedText>
              </View>

              {delivery.item.ppeType && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconShield size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.detailLabel}>Tipo de EPI</ThemedText>
                  </View>
                  <Badge variant="secondary">
                    {PPE_TYPE_LABELS[delivery.item.ppeType as keyof typeof PPE_TYPE_LABELS]}
                  </Badge>
                </View>
              )}

              {(delivery.item as any)?.ppeSize && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Tamanho</ThemedText>
                  <Badge variant="outline">{(delivery.item as any)?.ppeSize}</Badge>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailLabelRow}>
                  <IconTag size={16} color={colors.mutedForeground} />
                  <ThemedText style={styles.detailLabel}>Marca</ThemedText>
                </View>
                <ThemedText style={styles.detailValue}>
                  {delivery.item.brand?.name || "Não definida"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelRow}>
                  <IconCategory size={16} color={colors.mutedForeground} />
                  <ThemedText style={styles.detailLabel}>Categoria</ThemedText>
                </View>
                <ThemedText style={styles.detailValue}>
                  {delivery.item.category?.name || "Não definida"}
                </ThemedText>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <IconAlertCircle size={24} color={colors.mutedForeground} />
              <ThemedText style={styles.emptyStateText}>Item não encontrado</ThemedText>
            </View>
          )}
        </View>
      </Card>

      {/* Quantity & Dates */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBoxMultiple size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Quantidade e Datas</ThemedText>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={[styles.highlightBox, { backgroundColor: colors.primary + "15" }]}>
            <View style={styles.quantityRow}>
              <ThemedText style={styles.detailLabel}>Quantidade Entregue</ThemedText>
              <ThemedText style={[styles.quantityValue, { color: colors.primary }]}>
                {formatQuantity(delivery.quantity)}
              </ThemedText>
            </View>
            {delivery.item?.measureUnit && (
              <ThemedText style={styles.measureUnit}>
                {MEASURE_UNIT_LABELS[delivery.item.measureUnit as keyof typeof MEASURE_UNIT_LABELS]}
              </ThemedText>
            )}
          </View>

          {currentPrice !== null && currentPrice !== undefined && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <IconCurrencyDollar size={16} color={colors.mutedForeground} />
                <ThemedText style={styles.detailLabel}>Preço Unitário</ThemedText>
              </View>
              <ThemedText
                style={[styles.detailValue, { fontWeight: fontWeight.semibold }]}
              >
                {formatCurrency(currentPrice)}
              </ThemedText>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <IconCalendar size={16} color={colors.mutedForeground} />
              <ThemedText style={styles.detailLabel}>Criado em</ThemedText>
            </View>
            <View style={styles.dateColumn}>
              <ThemedText style={styles.detailValue}>{formatDate(delivery.createdAt)}</ThemedText>
              <ThemedText style={styles.relativeTime}>
                {formatRelativeTime(delivery.createdAt)}
              </ThemedText>
            </View>
          </View>

          {delivery.actualDeliveryDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <IconTruck size={16} color={colors.mutedForeground} />
                <ThemedText style={styles.detailLabel}>Data de Entrega</ThemedText>
              </View>
              <View style={styles.dateColumn}>
                <ThemedText style={styles.detailValue}>
                  {formatDateTime(delivery.actualDeliveryDate)}
                </ThemedText>
                <ThemedText style={styles.relativeTime}>
                  {formatRelativeTime(delivery.actualDeliveryDate)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </Card>

      {/* Changelog */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconHistory size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
          </View>
        </View>
        <View style={{ paddingHorizontal: spacing.md }}>
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.PPE_DELIVERY}
            entityId={delivery.id}
            entityName={`Entrega EPI #${delivery.id.slice(-8)}`}
            entityCreatedAt={delivery.createdAt}
            maxHeight={400}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: { padding: spacing.md },
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
  itemDetails: { gap: spacing.sm },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.sm,
  },
  detailValueMono: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    fontFamily: "monospace",
  },
  dateColumn: { alignItems: "flex-end" },
  relativeTime: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  highlightBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  highlightText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  uniCode: {
    fontFamily: "monospace",
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  measureUnit: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    opacity: 0.6,
  },
  emptyStateText: { fontSize: fontSize.sm },
});
