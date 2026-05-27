import { useState, useCallback } from "react";
import { View, ScrollView, Alert, Pressable , StyleSheet, ActivityIndicator} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  IconEdit,

  IconPlayerPlay,
  IconPlayerPause,
  IconCalendar,
  IconClock,
  IconPackage,
  IconHistory,
  IconBolt,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useOrderSchedule,
  useOrderScheduleMutations,
  useOrderScheduleProjection,
  useTriggerOrderSchedule,
  useOrders,
  useItems,
  useScreenReady,
} from '@/hooks';
import type { OrderScheduleInclude } from '../../../../../../schemas';
import type { OrderScheduleCascadeMode } from "@/types";
import {
  ThemedView,
  ThemedText,
  Card,
  Badge,
  Button,
  ErrorScreen,
} from "@/components/ui";

import { ActionSheet, type ActionSheetItem } from "@/components/ui/action-sheet";
import { Header } from "@/components/ui/header";
import { InfoRow } from "@/components/ui/info-row";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { FrequencyBadge } from "@/components/inventory/order/schedule/frequency-badge";
import { ScheduleInfoCard } from "@/components/inventory/order/schedule/schedule-info-card";

import { ScheduleHistory } from "@/components/inventory/order/schedule/schedule-history";
import { useTheme } from "@/lib/theme";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { useNav } from "@/contexts/nav";
import { formatDateTime, formatDate, formatQuantity } from "@/utils";
import { formatCurrency } from "@/utils/number";


import { Skeleton } from "@/components/ui/skeleton";

export default function AutomaticOrderDetailScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <AutomaticOrderDetailScreenInner />
    </PrivilegeGate>
  );
}

function AutomaticOrderDetailScreenInner() {
  const nav = useNav();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCascadeSheet, setShowCascadeSheet] = useState(false);

  const scheduleId = params.id!;
  const goBack = () =>
    nav.goBack({ fallback: mobileRoute(routes.inventory.orders.automatic.root) });

  const editPriv = usePrivilegeGate({
    any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
  });
  const deletePriv = usePrivilegeGate(SECTOR_PRIVILEGES.ADMIN);
  const canEdit = editPriv.allowed;
  const canDelete = deletePriv.allowed;

  const include: OrderScheduleInclude = {
    weeklyConfig: true,
    monthlyConfig: true,
    yearlyConfig: true,
    order: true,
  };

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useOrderSchedule(scheduleId, {
    include,
  });

  useScreenReady(!isLoading);

  const schedule = response?.data;

  // Fetch the auto-creation projection (per-item quantities/totals for today vs scheduled date)
  const {
    data: projectionResponse,
    isLoading: isProjectionLoading,
  } = useOrderScheduleProjection(scheduleId);

  const projection = projectionResponse?.data;
  const projectionItems = projection?.items ?? [];
  const projectionMeta = projection?.meta;

  // Fetch the underlying items (stock + measures) for the projection rows. The
  // projection only carries itemId/itemName, so we load each item's current
  // quantity (Estoque) and measures (Medidas) and key them by id.
  const projectionItemIds = projectionItems.map((item) => item.itemId);
  const scheduleItemIds = schedule?.items ?? [];
  const itemIds = projectionItemIds.length > 0 ? projectionItemIds : scheduleItemIds;
  const { data: itemsResponse } = useItems(
    {
      where: { id: { in: itemIds } },
      include: { measures: true },
      take: itemIds.length || 1,
    },
    { enabled: itemIds.length > 0 },
  );
  const itemsById = new Map((itemsResponse?.data ?? []).map((item) => [item.id, item]));

  // Fetch orders created from this schedule
  const {
    data: ordersResponse,
  } = useOrders({
    where: {
      orderScheduleId: scheduleId,
    },
    orderBy: { createdAt: "desc" },
    take: 10, // Show last 10 orders
  });

  const { mutate: triggerSchedule, isPending: isTriggering } = useTriggerOrderSchedule({
    onSuccess: (data) => {
      // Success toast is shown automatically by the API client interceptor.
      // The trigger envelope carries an `order` that is null when nothing needed
      // ordering, so gate the "Nada a pedir" message on the order id (matching web).
      if (!data?.data?.order?.id) {
        Alert.alert("Nada a pedir", "Nenhum item precisa ser pedido neste momento.");
      }
      refetch();
    },
  });

  const { update: updateSchedule, delete: deleteSchedule } = useOrderScheduleMutations({
    onDeleteSuccess: () => {
      // Success toast is shown automatically by the API client interceptor
      goBack();
    },
  });

  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar agendamentos automáticos");
      return;
    }
    nav.push(mobileRoute(routes.inventory.orders.automatic.edit(scheduleId)));
  };

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
      Alert.alert("Sem permissão", "Você não tem permissão para excluir agendamentos automáticos");
      return;
    }

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este agendamento automático? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSchedule(scheduleId);
            } catch (_error) {
              // Error toast is shown automatically by the API client interceptor
            }
          },
        },
      ],
    );
  }, [deleteSchedule, scheduleId, canDelete]);

  const handleToggleActive = useCallback(async () => {
    if (!canEdit || !schedule) {
      Alert.alert("Sem permissão", "Você não tem permissão para alterar agendamentos automáticos");
      return;
    }

    const newStatus = !schedule.isActive;
    const action = newStatus ? "ativar" : "pausar";

    Alert.alert(
      `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Tem certeza que deseja ${action} este agendamento automático?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              await updateSchedule({ id: scheduleId, data: { isActive: newStatus } });
            } catch (_error) {
              // Error toast is shown automatically by the API client interceptor
            }
          },
        },
      ],
    );
  }, [updateSchedule, scheduleId, schedule, canEdit]);

  const handleCreateOrder = useCallback(async () => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para criar pedidos");
      return;
    }

    Alert.alert(
      "Criar Pedido Agora",
      "Deseja criar um pedido baseado neste agendamento automático?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Criar",
          onPress: () => {
            // Navigate to create order with pre-filled data from schedule
            nav.push({
              pathname: mobileRoute(routes.inventory.orders.create),
              params: { fromSchedule: scheduleId },
            } as any);
          },
        },
      ],
    );
  }, [canEdit, scheduleId, nav]);

  // Whether the schedule can be executed right now (active, not finished, not already firing).
  const canTrigger = canEdit && !!schedule?.isActive && !schedule?.finishedAt && !isTriggering;

  // Open the cascade-mode chooser for a real "Executar agora" trigger.
  const handleOpenTrigger = useCallback(() => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para executar agendamentos automáticos");
      return;
    }
    if (isTriggering) return;
    setShowCascadeSheet(true);
  }, [canEdit, isTriggering]);

  const handleTrigger = useCallback(
    (cascadeMode: OrderScheduleCascadeMode) => {
      if (isTriggering) return;
      // Close + lock the sheet on first selection so a double-tap can't fire two POSTs.
      setShowCascadeSheet(false);
      triggerSchedule({ id: scheduleId, cascadeMode });
    },
    [triggerSchedule, scheduleId, isTriggering],
  );

  if (isLoading) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { gap: 16 }]} showsVerticalScrollIndicator={false}>
          {/* Frequency config card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Skeleton width="55%" height={18} borderRadius={4} />
              <Skeleton width={60} height={22} borderRadius={11} />
            </View>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Skeleton width="35%" height={14} borderRadius={4} />
                <Skeleton width="45%" height={14} borderRadius={4} />
              </View>
            ))}
          </View>
          {/* Items card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="30%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={60} borderRadius={8} />
          </View>
          {/* Execution info card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="55%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
            {[1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Skeleton width="40%" height={14} borderRadius={4} />
                <Skeleton width="40%" height={14} borderRadius={4} />
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar agendamento automático"
          detail={error.message}
          onRetry={() => refetch()}
        />
      </ThemedView>
    );
  }

  if (!schedule) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Agendamento não encontrado"
          detail="O agendamento automático solicitado não foi encontrado"
          onRetry={() => goBack()}
        />
      </ThemedView>
    );
  }

  const gapDays = projectionMeta?.gapDays ?? 0;
  const intervalDays = projectionMeta?.intervalDays ?? null;
  // When due now / overdue there is no gap-only option (it would fall back to a
  // full cycle), so the gap-only column + trigger option are hidden.
  const hasGap = projectionMeta?.hasGap ?? gapDays > 0;

  const actionSheetItems: ActionSheetItem[] = [
    {
      id: "edit",
      label: "Editar",
      icon: "edit",
      onPress: handleEdit,
      disabled: !canEdit,
    },
    {
      id: "trigger",
      label: "Executar agora",
      icon: "bolt",
      onPress: handleOpenTrigger,
      disabled: !canTrigger,
    },
    {
      id: "toggle",
      label: schedule.isActive ? "Pausar" : "Ativar",
      icon: schedule.isActive ? "player-pause" : "player-play",
      onPress: handleToggleActive,
      disabled: !canEdit,
    },
    {
      id: "create-order",
      label: "Criar Pedido Agora",
      icon: "package",
      onPress: handleCreateOrder,
      disabled: !canEdit,
    },
    {
      id: "delete",
      label: "Excluir",
      icon: "trash",
      onPress: handleDelete,
      disabled: !canDelete,
      destructive: true,
    },
  ];

  // Cascade-mode chooser options derived from projection meta. Each option shows
  // its OWN actual total (gapOnlyTotal / gapPlusCycleTotal) — these equal the
  // per-item column totals shown in the items list and the order that gets created.
  const gapOnlyTotal = projectionMeta?.gapOnlyTotal ?? 0;
  const gapPlusCycleTotal = projectionMeta?.gapPlusCycleTotal ?? 0;
  const scheduledTotal = projectionMeta?.scheduledTotal ?? 0;
  const cascadeSheetItems: ActionSheetItem[] = [];
  if (hasGap) {
    cascadeSheetItems.push({
      id: "gap-only",
      label: `Cobrir até a próxima execução (${gapDays} dias) · ${formatCurrency(gapOnlyTotal)}`,
      icon: "calendar",
      onPress: () => handleTrigger("GAP_ONLY"),
      disabled: isTriggering,
    });
  }
  cascadeSheetItems.push({
    id: "gap-plus-cycle",
    label:
      intervalDays != null
        ? `Cobrir execução + ciclo (${gapDays}+${intervalDays} dias) · ${formatCurrency(gapPlusCycleTotal)}`
        : `Cobrir execução + ciclo completo · ${formatCurrency(gapPlusCycleTotal)}`,
    icon: "refresh",
    onPress: () => handleTrigger("GAP_PLUS_CYCLE"),
    disabled: isTriggering,
  });

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      <Header
        title="Agendamento Automático"
        showBackButton={true}
        onBackPress={() => goBack()}
        rightAction={
          (canEdit || canDelete) ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowActionSheet(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: colors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconEdit size={18} color={colors.foreground} />
              </Pressable>
            </View>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status and Frequency */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCalendar size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Configuração da Frequência</ThemedText>
            </View>
            <View>
              <Badge variant={schedule.isActive ? "success" : "secondary"} size="sm">
                <ThemedText style={styles.statusText}>
                  {schedule.isActive ? "Ativo" : "Pausado"}
                </ThemedText>
              </Badge>
            </View>
          </View>
          <View style={styles.content}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <FrequencyBadge frequency={schedule.frequency} />
            </View>
            <ScheduleInfoCard schedule={schedule} />
          </View>
        </Card>

        {/* Items Projection */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>
                Itens ({projectionItems.length || schedule?.items?.length || 0})
              </ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            {isProjectionLoading ? (
              <View style={styles.projectionLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <ThemedText style={{ color: colors.mutedForeground }}>
                  Calculando previsões...
                </ThemedText>
              </View>
            ) : projectionItems.length > 0 ? (
              <View style={styles.content}>
                {scheduledTotal > 0 && (
                  <ThemedText
                    style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 8 }}
                    numberOfLines={2}
                  >
                    Próximo pedido automático (estimativa): {formatCurrency(scheduledTotal)}
                  </ThemedText>
                )}
                {projectionItems.map((item, index) => {
                  const isLast = index === projectionItems.length - 1;
                  const goOrder = item.quantityGapOnly > 0;
                  const gpcOrder = item.quantityGapPlusCycle > 0;
                  // Nothing to order in either trigger mode → single dash row.
                  const muted = !goOrder && !gpcOrder;
                  const sourceItem = itemsById.get(item.itemId);
                  const measuresText =
                    sourceItem?.measures && sourceItem.measures.length > 0
                      ? sourceItem.measures
                          .map((m) => `${m.value ?? "-"}${m.unit ?? ""}`)
                          .join(" × ")
                      : null;
                  return (
                    <View
                      key={item.itemId}
                      style={[
                        styles.projectionRow,
                        !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                      ]}
                    >
                      <ThemedText
                        style={[styles.projectionItemName, { color: muted ? colors.mutedForeground : colors.foreground }]}
                        numberOfLines={2}
                      >
                        {item.itemName}
                      </ThemedText>
                      {sourceItem && (
                        <View style={styles.projectionMetaRow}>
                          <ThemedText style={[styles.projectionMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                            Estoque: {formatQuantity(sourceItem.quantity ?? 0)}
                          </ThemedText>
                          <ThemedText style={[styles.projectionMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                            Medidas: {measuresText ?? "-"}
                          </ThemedText>
                        </View>
                      )}
                      {muted ? (
                        <View>
                          <ThemedText style={[styles.projectionMutedValue, { color: colors.mutedForeground }]}>
                            —
                          </ThemedText>
                          {(item.reasonGapPlusCycle || item.reasonGapOnly) && (
                            <ThemedText
                              style={[styles.projectionReason, { color: colors.mutedForeground }]}
                              numberOfLines={2}
                            >
                              {item.reasonGapPlusCycle || item.reasonGapOnly}
                            </ThemedText>
                          )}
                        </View>
                      ) : (
                        <View style={styles.projectionGrid}>
                          {hasGap && (
                            <View style={styles.projectionCell}>
                              <ThemedText style={[styles.projectionCellLabel, { color: colors.mutedForeground }]}>
                                Até a próxima
                              </ThemedText>
                              <ThemedText style={[styles.projectionCellValue, { color: colors.foreground }]}>
                                {goOrder ? `${item.quantityGapOnly} un · ${formatCurrency(item.totalGapOnly)}` : "—"}
                              </ThemedText>
                            </View>
                          )}
                          <View style={styles.projectionCell}>
                            <ThemedText style={[styles.projectionCellLabel, { color: colors.mutedForeground }]}>
                              + Ciclo completo
                            </ThemedText>
                            <ThemedText style={[styles.projectionCellValue, { color: colors.primary }]}>
                              {gpcOrder ? `${item.quantityGapPlusCycle} un · ${formatCurrency(item.totalGapPlusCycle)}` : "—"}
                            </ThemedText>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <ThemedText style={{ color: colors.mutedForeground, fontStyle: 'italic' }}>
                Nenhum item configurado
              </ThemedText>
            )}
          </View>
        </Card>

        {/* Next Run and Timing Information */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClock size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações de Execução</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            {schedule.nextRun && (
              <InfoRow label="Próxima Execução" value={formatDateTime(schedule.nextRun)} />
            )}

            {schedule.lastRun && (
              <InfoRow label="Última Execução" value={formatDateTime(schedule.lastRun)} />
            )}

            <InfoRow label="Contagem de Frequência" value={schedule.frequencyCount.toString()} />

            {schedule.finishedAt && (
              <InfoRow label="Finalizado em" value={formatDateTime(schedule.finishedAt)} />
            )}
          </View>
        </Card>

        {/* Specific Date Information (if applicable) */}
        {(schedule.specificDate || schedule.dayOfMonth || schedule.dayOfWeek || schedule.month) && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Detalhes do Agendamento</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              {schedule.specificDate && (
                <InfoRow label="Data Específica" value={formatDate(schedule.specificDate)} />
              )}

              {schedule.dayOfMonth && (
                <InfoRow label="Dia do Mês" value={schedule.dayOfMonth.toString()} />
              )}

              {schedule.dayOfWeek && (
                <InfoRow label="Dia da Semana" value={schedule.dayOfWeek} />
              )}

              {schedule.month && (
                <InfoRow label="Mês" value={schedule.month} />
              )}

              {schedule.customMonths && schedule.customMonths.length > 0 && (
                <InfoRow label="Meses Personalizados" value={schedule.customMonths.join(", ")} />
              )}
            </View>
          </Card>
        )}

        {/* Recent Order History */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconHistory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Histórico de Execuções</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ScheduleHistory orders={ordersResponse?.data || []} />
          </View>
        </Card>

        {/* Actions */}
        {canEdit && schedule.isActive && !schedule.finishedAt && (
          <Button
            variant="default"
            style={StyleSheet.flatten([styles.actionButton, { marginBottom: 16 }])}
            onPress={handleOpenTrigger}
            disabled={!canTrigger}
          >
            {isTriggering ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <IconBolt size={16} color={colors.primaryForeground} />
            )}
            <ThemedText style={{ color: colors.primaryForeground }}>
              {isTriggering ? "Executando..." : "Executar agora"}
            </ThemedText>
          </Button>
        )}

        <View style={styles.actionsContainer}>
          {canEdit && (
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={handleCreateOrder}
            >
              <IconPackage size={16} color={colors.foreground} />
              <ThemedText>Criar Pedido Agora</ThemedText>
            </Button>
          )}

          {canEdit && (
            <Button
              variant={schedule.isActive ? "outline" : "default"}
              style={styles.actionButton}
              onPress={handleToggleActive}
            >
              {schedule.isActive ? (
                <IconPlayerPause size={16} color={colors.foreground} />
              ) : (
                <IconPlayerPlay size={16} color={colors.foreground} />
              )}
              <ThemedText>{schedule.isActive ? "Pausar" : "Ativar"}</ThemedText>
            </Button>
          )}
        </View>
      </ScrollView>

      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        items={actionSheetItems}
        title="Ações do Agendamento"
      />

      <ActionSheet
        visible={showCascadeSheet}
        onClose={() => setShowCascadeSheet(false)}
        items={cascadeSheetItems}
        title="Executar agora"
        message="Escolha a estratégia de cobertura para este pedido automático."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusInfo: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  projectionLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  projectionRow: {
    paddingVertical: 8,
    gap: 4,
  },
  projectionItemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  projectionGrid: {
    flexDirection: "row",
    gap: 16,
  },
  projectionCell: {
    flex: 1,
  },
  projectionCellLabel: {
    fontSize: 11,
  },
  projectionCellValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  projectionMutedValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  projectionReason: {
    fontSize: 11,
    marginTop: 2,
  },
  projectionMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  projectionMetaText: {
    fontSize: 11,
  },
});