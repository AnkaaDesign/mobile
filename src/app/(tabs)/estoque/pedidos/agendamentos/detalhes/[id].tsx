import { useState, useCallback } from "react";
import { View, ScrollView, Alert, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconPlayerPause,
  IconCalendar,
  IconClock,
  IconPackage,
  IconHistory,
  IconRefresh,
  IconBolt,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useOrderSchedule,
  useOrderScheduleMutations,
  useOrderScheduleProjection,
  useTriggerOrderSchedule,
  useOrders,
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

import { InfoRow } from "@/components/ui/info-row";
import { FrequencyBadge } from "@/components/inventory/order/schedule/frequency-badge";
import { ScheduleInfoCard } from "@/components/inventory/order/schedule/schedule-info-card";
import { ScheduleHistory } from "@/components/inventory/order/schedule/schedule-history";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { useTheme } from "@/lib/theme";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { useNav } from "@/contexts/nav";
import { formatDateTime, formatDate } from "@/utils";
import { formatCurrency } from "@/utils/number";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";


import { Skeleton } from "@/components/ui/skeleton";

export default function OrderScheduleDetailsScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <OrderScheduleDetailsScreenInner />
    </PrivilegeGate>
  );
}

function OrderScheduleDetailsScreenInner() {
  const nav = useNav();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCascadeSheet, setShowCascadeSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const editPriv = usePrivilegeGate({
    any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
  });
  const deletePriv = usePrivilegeGate(SECTOR_PRIVILEGES.ADMIN);
  const canEdit = editPriv.allowed;
  const canDelete = deletePriv.allowed;

  const scheduleId = params.id!;
  const goBack = () =>
    nav.goBack({ fallback: mobileRoute(routes.inventory.orders.schedules.root) });

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
      // Success toast is shown automatically by the API client interceptor
      if (!data?.data) {
        Alert.alert("Nada a pedir", "Nenhum item precisa ser pedido neste momento.");
      }
      refetch();
    },
  });

  const { update: updateSchedule, delete: deleteSchedule } = useOrderScheduleMutations({
    onUpdateSuccess: () => {
      // Success toast is shown automatically by the API client interceptor
      refetch();
    },
    onDeleteSuccess: () => {
      // Success toast is shown automatically by the API client interceptor
      goBack();
    },
  });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar agendamentos");
      return;
    }
    nav.push(mobileRoute(routes.inventory.orders.schedules.edit(scheduleId)));
  };

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
      Alert.alert("Sem permissão", "Você não tem permissão para excluir agendamentos");
      return;
    }

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.",
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
      Alert.alert("Sem permissão", "Você não tem permissão para alterar agendamentos");
      return;
    }

    const newStatus = !schedule.isActive;
    const action = newStatus ? "ativar" : "pausar";

    Alert.alert(
      `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Tem certeza que deseja ${action} este agendamento?`,
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
      "Deseja criar um pedido baseado neste agendamento?",
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

  // Open the cascade-mode chooser for a real "Disparar agora" trigger.
  const handleOpenTrigger = useCallback(() => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para disparar agendamentos");
      return;
    }
    setShowCascadeSheet(true);
  }, [canEdit]);

  const handleTrigger = useCallback(
    (cascadeMode: OrderScheduleCascadeMode) => {
      triggerSchedule({ id: scheduleId, cascadeMode });
    },
    [triggerSchedule, scheduleId],
  );

  if (isLoading) {
    return (
      <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent]} showsVerticalScrollIndicator={false}>
          {/* Header card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm }}>
            <Skeleton width="55%" height={22} borderRadius={4} />
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Skeleton width={60} height={22} borderRadius={11} />
              <Skeleton width={80} height={22} borderRadius={11} />
            </View>
          </View>
          {/* Frequency config card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="55%" height={18} borderRadius={4} style={{ marginBottom: spacing.md }} />
            {[1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Skeleton width="35%" height={14} borderRadius={4} />
                <Skeleton width="45%" height={14} borderRadius={4} />
              </View>
            ))}
          </View>
          {/* Items card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="30%" height={18} borderRadius={4} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={60} borderRadius={8} />
          </View>
          {/* Execution info card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="55%" height={18} borderRadius={4} style={{ marginBottom: spacing.md }} />
            {[1, 2].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
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
          message="Erro ao carregar agendamento"
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
          detail="O agendamento solicitado não foi encontrado"
          onRetry={() => goBack()}
        />
      </ThemedView>
    );
  }

  const gapDays = projectionMeta?.gapDays ?? 0;
  const intervalDays = projectionMeta?.intervalDays ?? null;

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
      label: "Disparar agora",
      icon: "bolt",
      onPress: handleOpenTrigger,
      disabled: !canEdit,
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

  // Cascade-mode chooser options derived from projection meta.
  const cascadeSheetItems: ActionSheetItem[] = [];
  if (gapDays > 0) {
    cascadeSheetItems.push({
      id: "gap-only",
      label: `Cobrir até o próximo disparo (${gapDays} dias)`,
      icon: "calendar",
      onPress: () => handleTrigger("GAP_ONLY"),
    });
  }
  cascadeSheetItems.push({
    id: "gap-plus-cycle",
    label:
      intervalDays != null
        ? `Cobrir disparo + ciclo (${gapDays}+${intervalDays} dias)`
        : "Cobrir disparo + ciclo completo",
    icon: "refresh",
    onPress: () => handleTrigger("GAP_PLUS_CYCLE"),
  });

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Card with Title and Actions */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.headerTitle, { color: colors.foreground }])}>
                Agendamento de Pedido
              </ThemedText>
              <View style={styles.headerBadges}>
                <Badge variant={schedule.isActive ? "success" : "secondary"} size="sm">
                  <ThemedText style={styles.badgeText}>
                    {schedule.isActive ? "Ativo" : "Inativo"}
                  </ThemedText>
                </Badge>
                <FrequencyBadge frequency={schedule.frequency} />
              </View>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleRefresh}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.muted }])}
                disabled={refreshing}
              >
                <IconRefresh size={18} color={colors.foreground} />
              </Pressable>
              {canEdit && (
                <Pressable
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </Pressable>
              )}
              {canDelete && (
                <Pressable
                  onPress={handleDelete}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                >
                  <IconTrash size={18} color={colors.destructiveForeground} />
                </Pressable>
              )}
            </View>
          </View>
        </Card>

        {/* Basic Information - Frequency Configuration */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCalendar size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Configuração da Frequência</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ScheduleInfoCard schedule={schedule} />
          </View>
        </Card>

        {/* Projection Summary */}
        {projectionMeta && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Previsão do Disparo</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              {projectionMeta.scheduledDate && (
                <InfoRow
                  label="Data prevista do disparo"
                  value={formatDate(projectionMeta.scheduledDate)}
                />
              )}
              <InfoRow label="Intervalo até o disparo" value={`${projectionMeta.gapDays} dias`} />
              {projectionMeta.intervalDays != null && (
                <InfoRow label="Ciclo" value={`${projectionMeta.intervalDays} dias`} />
              )}
              <View style={styles.summaryTotals}>
                <View style={styles.summaryTotalBlock}>
                  <ThemedText style={[styles.summaryTotalLabel, { color: colors.mutedForeground }]}>
                    Total hoje
                  </ThemedText>
                  <ThemedText style={[styles.summaryTotalValue, { color: colors.foreground }]}>
                    {formatCurrency(projectionMeta.totalToday)}
                  </ThemedText>
                </View>
                <View style={styles.summaryTotalBlock}>
                  <ThemedText style={[styles.summaryTotalLabel, { color: colors.mutedForeground }]}>
                    Total na data
                  </ThemedText>
                  <ThemedText style={[styles.summaryTotalValue, { color: colors.primary }]}>
                    {formatCurrency(projectionMeta.totalScheduled)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Card>
        )}

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
              <View style={styles.itemsList}>
                {projectionItems.map((item, index) => {
                  const isLast = index === projectionItems.length - 1;
                  const muted = item.skipped || (item.quantityToday <= 0 && item.quantityScheduled <= 0);
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
                      {muted ? (
                        <View>
                          <ThemedText style={[styles.projectionMutedValue, { color: colors.mutedForeground }]}>
                            —
                          </ThemedText>
                          {(item.reasonScheduled || item.reasonToday) && (
                            <ThemedText
                              style={[styles.projectionReason, { color: colors.mutedForeground }]}
                              numberOfLines={2}
                            >
                              {item.reasonScheduled || item.reasonToday}
                            </ThemedText>
                          )}
                        </View>
                      ) : (
                        <View style={styles.projectionGrid}>
                          <View style={styles.projectionCell}>
                            <ThemedText style={[styles.projectionCellLabel, { color: colors.mutedForeground }]}>
                              Hoje
                            </ThemedText>
                            <ThemedText style={[styles.projectionCellValue, { color: colors.foreground }]}>
                              {item.quantityToday} un · {formatCurrency(item.totalToday)}
                            </ThemedText>
                          </View>
                          <View style={styles.projectionCell}>
                            <ThemedText style={[styles.projectionCellLabel, { color: colors.mutedForeground }]}>
                              Na data
                            </ThemedText>
                            <ThemedText style={[styles.projectionCellValue, { color: colors.primary }]}>
                              {item.quantityScheduled} un · {formatCurrency(item.totalScheduled)}
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

        {/* Schedule Configuration Details */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClock size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Configuração do Agendamento</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <InfoRow label="Contagem de Frequência" value={schedule.frequencyCount.toString()} />

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

        {/* Execution Information */}
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

            {schedule.finishedAt && (
              <InfoRow
                label="Finalizado em"
                value={formatDateTime(schedule.finishedAt)}
              />
            )}
          </View>
        </Card>

        {/* Last Order Information (if exists) */}
        {schedule.order && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconPackage size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Último Pedido Criado</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <InfoRow label="ID do Pedido" value={schedule.order.id} />
              {schedule.order.description && (
                <InfoRow label="Descrição" value={schedule.order.description} />
              )}
              {schedule.order.status && (
                <InfoRow label="Status" value={schedule.order.status} />
              )}
              {schedule.order.forecast && (
                <InfoRow label="Previsão" value={formatDate(schedule.order.forecast)} />
              )}
              {schedule.order.createdAt && (
                <InfoRow label="Criado em" value={formatDateTime(schedule.order.createdAt)} />
              )}
            </View>
          </Card>
        )}

        {/* Recent Order History */}
        {ordersResponse?.data && ordersResponse.data.length > 0 && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Pedidos</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <ScheduleHistory orders={ordersResponse.data} />
            </View>
          </Card>
        )}

        {/* Metadata Section */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClock size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações do Sistema</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <InfoRow label="ID" value={schedule.id} />
            <InfoRow label="Criado em" value={formatDateTime(schedule.createdAt)} />
            <InfoRow label="Atualizado em" value={formatDateTime(schedule.updatedAt)} />
            {schedule.lastRunId && (
              <InfoRow label="ID da Última Execução" value={schedule.lastRunId} />
            )}
            {schedule.originalScheduleId && (
              <InfoRow label="ID do Agendamento Original" value={schedule.originalScheduleId} />
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        {canEdit && (
          <Button
            variant="default"
            style={styles.actionButtonFull}
            onPress={handleOpenTrigger}
            disabled={isTriggering}
          >
            {isTriggering ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <IconBolt size={16} color={colors.primaryForeground} />
            )}
            <ThemedText style={{ color: colors.primaryForeground }}>
              {isTriggering ? "Disparando..." : "Disparar agora"}
            </ThemedText>
          </Button>
        )}

        <View style={styles.actionsContainer}>
          {canEdit && (
            <Button
              variant="outline"
              style={styles.actionButtonFull}
              onPress={handleCreateOrder}
            >
              <IconPackage size={16} color={colors.foreground} />
              <ThemedText>Criar Pedido Agora</ThemedText>
            </Button>
          )}

          {canEdit && (
            <Button
              variant={schedule.isActive ? "outline" : "default"}
              style={styles.actionButtonFull}
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
        title="Disparar agora"
        message="Escolha a estratégia de cobertura para este pedido."
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
    padding: spacing.md,
    gap: spacing.md,
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
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  headerBadges: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    flexWrap: "wrap",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
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
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  cardContent: {
    gap: spacing.xs,
  },
  itemsList: {
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  itemIndex: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    minWidth: 24,
  },
  itemId: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  projectionLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  projectionRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  projectionItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  projectionGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  projectionCell: {
    flex: 1,
  },
  projectionCellLabel: {
    fontSize: fontSize.xs,
  },
  projectionCellValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  projectionMutedValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  projectionReason: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  summaryTotals: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  summaryTotalBlock: {
    flex: 1,
  },
  summaryTotalLabel: {
    fontSize: fontSize.xs,
  },
  summaryTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButtonFull: {
    flex: 1,
  },
});
