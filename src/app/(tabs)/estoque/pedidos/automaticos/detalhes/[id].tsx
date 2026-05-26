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
import { formatDateTime, formatDate } from "@/utils";
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

  // Open the cascade-mode chooser for a real "Disparar agora" trigger.
  const handleOpenTrigger = useCallback(() => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para disparar agendamentos automáticos");
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

        {/* Projection Summary */}
        {projectionMeta && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconCalendar size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Previsão do Disparo Automático</ThemedText>
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
              <View style={styles.content}>
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
        {canEdit && (
          <Button
            variant="default"
            style={[styles.actionButton, { marginBottom: 16 }]}
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
        title="Disparar agora"
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
  summaryTotals: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  summaryTotalBlock: {
    flex: 1,
  },
  summaryTotalLabel: {
    fontSize: 11,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
});