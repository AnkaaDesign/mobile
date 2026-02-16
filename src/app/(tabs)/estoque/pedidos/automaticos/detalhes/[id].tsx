import { useState, useCallback } from "react";
import { View, ScrollView, Alert, Pressable , StyleSheet} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  IconEdit,
  
  IconPlayerPlay,
  IconPlayerPause,
  IconCalendar,
  IconClock,
  IconPackage,
  IconHistory,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderSchedule, useOrderScheduleMutations, useOrders } from "@/hooks";
import type { OrderScheduleInclude } from '../../../../../../schemas';
import {
  ThemedView,
  ThemedText,
  Card,
  Badge,
  Button,
  ErrorScreen,
  LoadingScreen,
} from "@/components/ui";

import { ActionSheet, type ActionSheetItem } from "@/components/ui/action-sheet";
import { Header } from "@/components/ui/header";
import { InfoRow } from "@/components/ui/info-row";
import { FrequencyBadge } from "@/components/inventory/order/schedule/frequency-badge";
import { ScheduleInfoCard } from "@/components/inventory/order/schedule/schedule-info-card";

import { ScheduleHistory } from "@/components/inventory/order/schedule/schedule-history";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege, formatDateTime, formatDate } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function AutomaticOrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);

  const scheduleId = params.id!;

  const include: OrderScheduleInclude = {
    weeklyConfig: { include: { daysOfWeek: true } },
    monthlyConfig: { include: { occurrences: true } },
    yearlyConfig: { include: { monthlyConfigs: true } },
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

  const schedule = response?.data;

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

  const { update: updateSchedule, delete: deleteSchedule } = useOrderScheduleMutations({
    onUpdateSuccess: () => {
      Alert.alert("Sucesso", "Agendamento atualizado com sucesso");
    },
    onDeleteSuccess: () => {
      Alert.alert("Sucesso", "Agendamento excluído com sucesso");
      router.back();
    },
  });

  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar agendamentos automáticos");
      return;
    }
    router.push(routeToMobilePath(routes.inventory.orders.automatic.root + `/edit/${scheduleId}`) as any);
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
              Alert.alert("Erro", "Não foi possível excluir o agendamento. Tente novamente.");
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
              Alert.alert("Erro", `Não foi possível ${action} o agendamento. Tente novamente.`);
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
            router.push({
              pathname: routeToMobilePath(routes.inventory.orders.create) as any,
              params: { fromSchedule: scheduleId },
            });
          },
        },
      ],
    );
  }, [canEdit, scheduleId, router]);

  if (isLoading) {
    return <LoadingScreen message="Carregando agendamento automático..." />;
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
          onRetry={() => router.back()}
        />
      </ThemedView>
    );
  }

  const actionSheetItems: ActionSheetItem[] = [
    {
      id: "edit",
      label: "Editar",
      icon: "edit",
      onPress: handleEdit,
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

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
      <Header
        title="Agendamento Automático"
        showBackButton={true}
        onBackPress={() => router.back()}
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

        {/* Items */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Itens ({schedule?.items?.length || 0})</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            {/* Note: OrderSchedule.items is string[] but ItemsList expects OrderItem[]. Need to fetch actual items or modify component */}
            <ThemedText style={{ color: colors.mutedForeground, fontStyle: 'italic' }}>
              {schedule?.items?.length || 0} itens configurados
            </ThemedText>
            {schedule?.items && schedule.items.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {schedule.items.map((itemId) => (
                  <ThemedText key={itemId} style={{ color: colors.foreground, marginVertical: 2 }}>
                    • Item ID: {itemId}
                  </ThemedText>
                ))}
              </View>
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
});