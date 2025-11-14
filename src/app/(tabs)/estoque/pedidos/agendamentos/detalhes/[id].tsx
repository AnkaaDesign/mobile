import { useState, useCallback } from "react";
import { View, ScrollView, Alert, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconPlayerPause,
  IconCalendar,
  IconClock,
  IconPackage,
  IconTruck,
  IconHistory,
  IconRefresh,
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
import { ActionSheet} from "@/components/ui/action-sheet";

import { InfoRow } from "@/components/ui/info-row";
import { FrequencyBadge } from "@/components/inventory/order/schedule/frequency-badge";
import { ScheduleInfoCard } from "@/components/inventory/order/schedule/schedule-info-card";
import { ScheduleHistory } from "@/components/inventory/order/schedule/schedule-history";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege, formatDateTime, formatDate } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

export default function OrderScheduleDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);

  const scheduleId = params.id!;

  const include: OrderScheduleInclude = {
    supplier: { include: { contact: true } },
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
      refetch();
    },
    onDeleteSuccess: () => {
      Alert.alert("Sucesso", "Agendamento excluído com sucesso");
      router.back();
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
    router.push(routeToMobilePath(routes.inventory.orders.schedules.root + `/edit/${scheduleId}`) as any);
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
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o agendamento. Tente novamente.");
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
            } catch (error) {
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
      "Deseja criar um pedido baseado neste agendamento?",
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
    return <LoadingScreen message="Carregando detalhes do agendamento..." />;
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
          <View style={styles.sectionHeader}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Configuração da Frequência</ThemedText>
          </View>
          <ScheduleInfoCard schedule={schedule} />
        </Card>

        {/* Supplier Information */}
        {schedule?.supplier && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconTruck size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Fornecedor</ThemedText>
            </View>
            <View style={styles.cardContent}>
              <InfoRow label="Nome" value={schedule.supplier.name || schedule.supplier.fantasyName} />
              {schedule.supplier.corporateName && (
                <InfoRow label="Razão Social" value={schedule.supplier.corporateName} />
              )}
              {schedule.supplier.email && (
                <InfoRow label="Email" value={schedule.supplier.email} />
              )}
              {schedule.supplier.phones && schedule.supplier.phones.length > 0 && (
                <InfoRow label="Telefone" value={schedule.supplier.phones[0]} />
              )}
              {schedule.supplier.cnpj && (
                <InfoRow label="CNPJ" value={schedule.supplier.cnpj} />
              )}
            </View>
          </Card>
        )}

        {/* Items Information */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconPackage size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Itens ({schedule?.items?.length || 0})</ThemedText>
          </View>
          <View style={styles.cardContent}>
            {schedule?.items && schedule.items.length > 0 ? (
              <View style={styles.itemsList}>
                {schedule.items.map((itemId, index) => (
                  <View key={itemId} style={StyleSheet.flatten([styles.itemRow, { borderBottomColor: colors.border }])}>
                    <ThemedText style={styles.itemIndex}>{index + 1}.</ThemedText>
                    <ThemedText style={styles.itemId}>{itemId}</ThemedText>
                  </View>
                ))}
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
          <View style={styles.sectionHeader}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Configuração do Agendamento</ThemedText>
          </View>
          <View style={styles.cardContent}>
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
          <View style={styles.sectionHeader}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Informações de Execução</ThemedText>
          </View>
          <View style={styles.cardContent}>
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
            <View style={styles.sectionHeader}>
              <IconPackage size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Último Pedido Criado</ThemedText>
            </View>
            <View style={styles.cardContent}>
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
            <View style={styles.sectionHeader}>
              <IconHistory size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Histórico de Pedidos</ThemedText>
            </View>
            <View style={styles.cardContent}>
              <ScheduleHistory orders={ordersResponse.data} />
            </View>
          </Card>
        )}

        {/* Metadata Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Informações do Sistema</ThemedText>
          </View>
          <View style={styles.cardContent}>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
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
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButtonFull: {
    flex: 1,
  },
});
