import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Alert, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

import { ThemedText } from "@/components/ui/themed-text";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/ui/detail-page-layout";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useActivity, useActivityMutations, useScreenReady } from "@/hooks";
import { hasPrivilege, formatDateTime, formatCurrency, formatQuantity } from "@/utils";
import { SECTOR_PRIVILEGES, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS, ACTIVITY_OPERATION, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { IconArrowUp, IconArrowDown, IconBox, IconUser, IconClipboardList, IconHistory, IconTrash } from "@tabler/icons-react-native";
import { ActivityDetailSkeleton } from "@/components/inventory/activity/skeleton/activity-detail-skeleton";

export default function ActivityDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const { deleteAsync } = useActivityMutations();

  // Permission check
  const canManageWarehouse = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useActivity(params.id!, {
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
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          supplier: {
            select: {
              id: true,
              fantasyName: true,
              corporateName: true,
            },
          },
          prices: {
            select: {
              id: true,
              value: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          position: {
            select: {
              id: true,
              name: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          supplier: {
            select: {
              id: true,
              fantasyName: true,
              corporateName: true,
            },
          },
        },
      },
      orderItem: {
        select: {
          id: true,
          orderedQuantity: true,
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    enabled: !!params.id && canManageWarehouse,
  });

  useScreenReady(!isLoading);

  const activity = response?.data;

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    Alert.alert(
      "Excluir Movimentação",
      "Tem certeza que deseja excluir esta movimentação? Esta ação é irreversível e afetará o estoque.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(params.id!);
              router.back();
            } catch (_error) {
              Alert.alert("Erro", "Não foi possível excluir a movimentação");
            }
          },
        },
      ]
    );
  }, [deleteAsync, params.id]);

  // Permission gate
  if (!canManageWarehouse) {
    return (
      <ErrorScreen
        message="Acesso negado"
        detail="Você não tem permissão para acessar esta funcionalidade."
      />
    );
  }

  if (isLoading || !activity) {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <ActivityDetailSkeleton />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        message="Erro ao carregar movimentação"
        detail={error.message}
      />
    );
  }

  const currentPrice = activity.item?.prices?.[0]?.value || 0;
  const totalValue = currentPrice * activity.quantity;
  const isInbound = activity.operation === ACTIVITY_OPERATION.INBOUND;

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header Card with Title and Actions */}
        <Card>
          <CardContent style={styles.headerCardContent}>
            <View style={styles.headerCardLeft}>
              <ThemedText style={StyleSheet.flatten([styles.headerCardTitle, { color: colors.foreground }])} numberOfLines={2}>
                Movimentação #{activity.id.slice(0, 8)}
              </ThemedText>
            </View>
            <View style={styles.headerCardActions}>
              {isAdmin && (
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

        {/* Activity Info Card */}
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
                  <View style={StyleSheet.flatten([styles.operationIcon, { backgroundColor: isInbound ? "#10b981" : "#ef4444" }])}>
                    {isInbound ? (
                      <IconArrowDown size={14} color="white" />
                    ) : (
                      <IconArrowUp size={14} color="white" />
                    )}
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.foreground }])}>
                    {ACTIVITY_OPERATION_LABELS[activity.operation]}
                  </ThemedText>
                </View>
              }
            />

            <DetailField
              label="Quantidade"
              icon="hash"
              value={
                <ThemedText style={StyleSheet.flatten([styles.valueText, { color: isInbound ? "#10b981" : "#ef4444" }])}>
                  {isInbound ? "+" : "-"}{formatQuantity(activity.quantity)} un
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

        {/* Item Info Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBox size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações do Item</ThemedText>
            </View>
          </View>
          <View style={styles.cardBody}>
            <DetailField
              label="Nome"
              icon="package"
              value={activity.item?.name || "-"}
            />

            <DetailField
              label="Código"
              icon="hash"
              value={activity.item?.uniCode || "-"}
            />

            {activity.item?.brand && (
              <DetailField
                label="Marca"
                icon="tag"
                value={activity.item.brand.name}
              />
            )}

            {activity.item?.category && (
              <DetailField
                label="Categoria"
                icon="category"
                value={activity.item.category.name}
              />
            )}

            {activity.item?.supplier && (
              <DetailField
                label="Fornecedor"
                icon="building"
                value={activity.item.supplier.fantasyName || activity.item.supplier.corporateName}
              />
            )}

            {currentPrice > 0 && (
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
                    <ThemedText style={StyleSheet.flatten([styles.valueText, styles.valueBold, { color: colors.foreground }])}>
                      {formatCurrency(totalValue)}
                    </ThemedText>
                  }
                />
              </>
            )}
          </View>
        </Card>

        {/* User Info Card */}
        {activity.user && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconUser size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Informações do Usuário</ThemedText>
              </View>
            </View>
            <View style={styles.cardBody}>
              <DetailField
                label="Nome"
                icon="user"
                value={activity.user.name}
              />

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

        {/* Order Info Card */}
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
                  value={activity.order.supplier.fantasyName || activity.order.supplier.corporateName}
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

        {/* Changelog */}
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
              entityName={`Movimentação - ${activity.item?.name || 'Item'}`}
              entityCreatedAt={activity.createdAt}
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
    padding: spacing.md,
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
  headerCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerCardLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerCardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerCardActions: {
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
});
