import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePpeDelivery, usePpeDeliveryMutations, useMarkPpeDeliveryAsDelivered } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  PPE_DELIVERY_STATUS,
  PPE_DELIVERY_STATUS_LABELS,
  SECTOR_PRIVILEGES,
  MEASURE_UNIT_LABELS,
  PPE_TYPE_LABELS,
  SCHEDULE_FREQUENCY_LABELS,
  ASSIGNMENT_TYPE_LABELS,
  CHANGE_LOG_ENTITY_TYPE
} from "@/constants";
import { hasPrivilege, formatDate, formatDateTime, formatRelativeTime, formatCurrency } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { TouchableOpacity } from "react-native";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import {
  IconRefresh,
  IconEdit,
  IconTrash,
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
  IconClock,
  IconHistory,
  IconUsers,
  IconCalendarCheck
} from "@tabler/icons-react-native";

export default function PPEDeliveryDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const { update, delete: deleteAsync } = usePpeDeliveryMutations();
  const markAsDelivered = useMarkPpeDeliveryAsDelivered();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canManageWarehouse = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const isAdmin = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch delivery details
  const { data: response, isLoading, error, refetch } = usePpeDelivery(id as string, {
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          prices: {
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      reviewedByUser: true,
      ppeSchedule: {
        include: {
          ppeItems: true,
        },
      },
    },
  });

  const delivery = response?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Detalhes atualizados", type: "success" });
  };

  // Handle edit
  const handleEdit = () => {
    if (!canManageWarehouse || !delivery || delivery.status !== PPE_DELIVERY_STATUS.PENDING) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/estoque/epi/entregas/editar/${id}`);
  };

  // Handle mark as delivered
  const handleMarkDelivered = () => {
    if (!canManageWarehouse || !delivery || delivery.status !== PPE_DELIVERY_STATUS.PENDING) {
      showToast({ message: "Ação não permitida", type: "error" });
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
              await markAsDelivered.mutateAsync({
                id: delivery.id,
                deliveryDate: new Date(),
              });
              showToast({ message: "Entrega marcada como realizada", type: "success" });
              refetch();
            } catch (error) {
              showToast({ message: "Erro ao marcar entrega", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Handle cancel
  const handleCancel = () => {
    if (!canManageWarehouse || !delivery || delivery.status !== PPE_DELIVERY_STATUS.PENDING) {
      showToast({ message: "Ação não permitida", type: "error" });
      return;
    }

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
              await update({
                id: delivery.id,
                data: {
                  status: PPE_DELIVERY_STATUS.CANCELLED,
                },
              });
              showToast({ message: "Entrega cancelada com sucesso", type: "success" });
              refetch();
            } catch (error) {
              showToast({ message: "Erro ao cancelar entrega", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Handle delete
  const handleDelete = () => {
    if (!isAdmin || !delivery || delivery.status !== PPE_DELIVERY_STATUS.PENDING) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Entrega",
      `Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.\n\nItem: ${delivery.item?.name || "-"}\nFuncionário: ${delivery.user?.name || "-"}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(delivery.id);
              showToast({ message: "Entrega excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir entrega", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Get status icon
  const getStatusIcon = (status: PPE_DELIVERY_STATUS) => {
    switch (status) {
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
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da entrega..." />;
  }

  if (error || !delivery) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes da entrega"
        onRetry={refetch}
      />
    );
  }

  // Check if can perform actions
  const canEdit = canManageWarehouse && delivery.status === PPE_DELIVERY_STATUS.PENDING;
  const canDelete = isAdmin && delivery.status === PPE_DELIVERY_STATUS.PENDING;
  const canMarkAsDelivered = canManageWarehouse && delivery.status === PPE_DELIVERY_STATUS.PENDING;
  const canCancelDelivery = canManageWarehouse && delivery.status === PPE_DELIVERY_STATUS.PENDING;

  // Get current price
  const currentPrice = delivery.item?.prices && delivery.item.prices.length > 0 ? delivery.item.prices[0].value : null;

  const StatusIcon = getStatusIcon(delivery.status);

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.headerTitle, { color: colors.foreground }])} numberOfLines={2}>
                Entrega EPI #{delivery.id.slice(-8)}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.muted }])}
                activeOpacity={0.7}
                disabled={refreshing}
              >
                <IconRefresh size={18} color={colors.foreground} />
              </TouchableOpacity>
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canMarkAsDelivered && (
                <TouchableOpacity
                  onPress={handleMarkDelivered}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.success }])}
                  activeOpacity={0.7}
                >
                  <IconTruck size={18} color="#fff" />
                </TouchableOpacity>
              )}
              {canCancelDelivery && (
                <TouchableOpacity
                  onPress={handleCancel}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.warning }])}
                  activeOpacity={0.7}
                >
                  <IconCircleX size={18} color="#fff" />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color={colors.destructiveForeground} />
                </TouchableOpacity>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Status Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconShield size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Status da Entrega</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Status</ThemedText>
              <Badge
                variant={getBadgeVariantFromStatus("PPE_DELIVERY", delivery.status)}
                style={styles.badge}
              >
                <StatusIcon size={14} color={colors.primaryForeground} style={{ marginRight: 4 }} />
                {PPE_DELIVERY_STATUS_LABELS[delivery.status]}
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

        {/* Employee Information */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconUser size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Funcionário</ThemedText>
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

        {/* PPE Item Information */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconPackage size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Item EPI</ThemedText>
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
                    <Badge variant="secondary">{PPE_TYPE_LABELS[delivery.item.ppeType]}</Badge>
                  </View>
                )}

                {delivery.item.ppeSize && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Tamanho</ThemedText>
                    <Badge variant="outline">{delivery.item.ppeSize}</Badge>
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

        {/* Quantity and Dates Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconBoxMultiple size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Quantidade e Datas</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={StyleSheet.flatten([styles.highlightBox, { backgroundColor: colors.primary + "15" }])}>
              <View style={styles.quantityRow}>
                <ThemedText style={styles.detailLabel}>Quantidade Entregue</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.primary }])}>
                  {delivery.quantity}
                </ThemedText>
              </View>
              {delivery.item?.measureUnit && (
                <ThemedText style={styles.measureUnit}>
                  {MEASURE_UNIT_LABELS[delivery.item.measureUnit]}
                </ThemedText>
              )}
            </View>

            {currentPrice !== null && currentPrice !== undefined && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabelRow}>
                  <IconCurrencyDollar size={16} color={colors.mutedForeground} />
                  <ThemedText style={styles.detailLabel}>Preço Unitário</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { fontWeight: fontWeight.semibold }])}>
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
                <ThemedText style={styles.relativeTime}>{formatRelativeTime(delivery.createdAt)}</ThemedText>
              </View>
            </View>

            {delivery.actualDeliveryDate && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabelRow}>
                  <IconTruck size={16} color={colors.mutedForeground} />
                  <ThemedText style={styles.detailLabel}>Data de Entrega</ThemedText>
                </View>
                <View style={styles.dateColumn}>
                  <ThemedText style={styles.detailValue}>{formatDateTime(delivery.actualDeliveryDate)}</ThemedText>
                  <ThemedText style={styles.relativeTime}>{formatRelativeTime(delivery.actualDeliveryDate)}</ThemedText>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Stock Information */}
        {delivery.item?.quantity !== undefined && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconBoxMultiple size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Estoque</ThemedText>
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Estoque Atual do Item</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { fontWeight: fontWeight.bold }])}>
                  {delivery.item.quantity % 1 === 0
                    ? delivery.item.quantity.toLocaleString("pt-BR")
                    : delivery.item.quantity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {delivery.item.measureUnit && (
                    <ThemedText style={styles.measureUnitSmall}> {MEASURE_UNIT_LABELS[delivery.item.measureUnit]}</ThemedText>
                  )}
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Review Information */}
        {delivery.reviewedByUser && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconCircleCheck size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Revisão</ThemedText>
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Revisado por</ThemedText>
                <ThemedText style={styles.detailValue}>{delivery.reviewedByUser.name}</ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Schedule Information */}
        {delivery.ppeSchedule && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconCalendarCheck size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Agendamento</ThemedText>
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Status</ThemedText>
                <Badge variant={delivery.ppeSchedule.isActive ? "success" : "secondary"}>
                  {delivery.ppeSchedule.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelRow}>
                  <IconClock size={16} color={colors.mutedForeground} />
                  <ThemedText style={styles.detailLabel}>Frequência</ThemedText>
                </View>
                <View style={styles.dateColumn}>
                  <ThemedText style={styles.detailValue}>
                    {SCHEDULE_FREQUENCY_LABELS[delivery.ppeSchedule.frequency]}
                  </ThemedText>
                  {delivery.ppeSchedule.frequencyCount > 1 && (
                    <ThemedText style={styles.relativeTime}>
                      A cada {delivery.ppeSchedule.frequencyCount}{" "}
                      {delivery.ppeSchedule.frequency === "DAILY" ? "dias" :
                       delivery.ppeSchedule.frequency === "WEEKLY" ? "semanas" :
                       delivery.ppeSchedule.frequency === "MONTHLY" ? "meses" : "anos"}
                    </ThemedText>
                  )}
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabelRow}>
                  <IconUsers size={16} color={colors.mutedForeground} />
                  <ThemedText style={styles.detailLabel}>Atribuição</ThemedText>
                </View>
                <Badge variant="outline">{ASSIGNMENT_TYPE_LABELS[delivery.ppeSchedule.assignmentType]}</Badge>
              </View>

              {delivery.ppeSchedule.ppeItems && delivery.ppeSchedule.ppeItems.length > 0 && (
                <View style={styles.ppeItemsSection}>
                  <ThemedText style={styles.detailLabel}>Tipos de EPI</ThemedText>
                  <View style={styles.badgeContainer}>
                    {delivery.ppeSchedule.ppeItems.map((ppeItem: any, index: number) => (
                      <Badge key={index} variant="secondary" textStyle={styles.ppeBadgeText}>
                        {PPE_TYPE_LABELS[ppeItem.ppeType as keyof typeof PPE_TYPE_LABELS] || ppeItem.ppeType} ({ppeItem.quantity}x)
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {delivery.ppeSchedule.lastRun && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconClock size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.detailLabel}>Última Execução</ThemedText>
                  </View>
                  <View style={styles.dateColumn}>
                    <ThemedText style={styles.detailValue}>{formatDate(delivery.ppeSchedule.lastRun)}</ThemedText>
                    <ThemedText style={styles.relativeTime}>{formatDateTime(delivery.ppeSchedule.lastRun)}</ThemedText>
                  </View>
                </View>
              )}

              {delivery.ppeSchedule.nextRun && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelRow}>
                    <IconCalendarCheck size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.detailLabel}>Próxima Execução</ThemedText>
                  </View>
                  <View style={styles.dateColumn}>
                    <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.primary, fontWeight: fontWeight.semibold }])}>
                      {formatDate(delivery.ppeSchedule.nextRun)}
                    </ThemedText>
                    <ThemedText style={styles.relativeTime}>{formatDateTime(delivery.ppeSchedule.nextRun)}</ThemedText>
                  </View>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Changelog History */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconHistory size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
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

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  itemDetails: {
    gap: spacing.sm,
  },
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
  dateColumn: {
    alignItems: "flex-end",
  },
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
  measureUnitSmall: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    fontWeight: fontWeight.normal,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
  },
  ppeItemsSection: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  ppeBadgeText: {
    fontSize: fontSize.xs,
  },
});
