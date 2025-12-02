import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Alert, RefreshControl , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useActivity, useActivityMutations } from "@/hooks";
import { hasPrivilege, formatDateTime, formatCurrency } from "@/utils";
import { SECTOR_PRIVILEGES, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS, ACTIVITY_OPERATION, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { IconArrowUp, IconArrowDown, IconRefresh, IconBox, IconUser, IconClipboardList, IconHistory } from "@tabler/icons-react-native";
import { ActivityDetailSkeleton } from "@/components/inventory/activity/skeleton/activity-detail-skeleton";

export default function ActivityDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
          prices: {
            orderBy: { createdAt: "desc" },
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
      order: {
        include: {
          supplier: true,
        },
      },
      orderItem: {
        include: {
          item: true,
        },
      },
    },
    enabled: !!params.id && canManageWarehouse,
  });

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
            } catch (error) {
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
      <>
        <Stack.Screen
          options={{
            title: "Detalhes da Movimentação",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade."
        />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Detalhes da Movimentação",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Erro ao carregar movimentação"
          detail={error.message}
        />
      </>
    );
  }

  if (isLoading || !activity) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Detalhes da Movimentação",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ActivityDetailSkeleton />
      </>
    );
  }

  const currentPrice = activity.item?.prices?.[0]?.value || 0;
  const totalValue = currentPrice * activity.quantity;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Movimentação #${activity.id.slice(0, 8)}`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Button
                variant="default"
                size="icon"
                onPress={() => refetch()}
              >
                <IconRefresh size={20} color={colors.foreground} />
              </Button>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
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
        <View style={StyleSheet.flatten([styles.content, { paddingBottom: insets.bottom + spacing.lg }])}>
          {/* Activity Info Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconBox size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Informações da Movimentação</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Operação</ThemedText>
                <View style={styles.valueRow}>
                  <View style={StyleSheet.flatten([styles.operationIcon, { backgroundColor: activity.operation === ACTIVITY_OPERATION.INBOUND ? "#10b981" : "#ef4444" }
                  ])}>
                    {activity.operation === ACTIVITY_OPERATION.INBOUND ? (
                      <IconArrowDown size={14} color="white" />
                    ) : (
                      <IconArrowUp size={14} color="white" />
                    )}
                  </View>
                  <ThemedText style={styles.value}>
                    {ACTIVITY_OPERATION_LABELS[activity.operation]}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Quantidade</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.value, { color: activity.operation === ACTIVITY_OPERATION.INBOUND ? "#10b981" : "#ef4444" }
                ])}>
                  {activity.operation === ACTIVITY_OPERATION.INBOUND ? "+" : "-"}{activity.quantity} un
                </ThemedText>
              </View>

              {activity.reason && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Motivo</ThemedText>
                  <Badge variant="outline">
                    <ThemedText style={styles.badgeText}>
                      {ACTIVITY_REASON_LABELS[activity.reason] || activity.reason}
                    </ThemedText>
                  </Badge>
                </View>
              )}

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Data</ThemedText>
                <ThemedText style={styles.value}>
                  {formatDateTime(activity.createdAt)}
                </ThemedText>
              </View>
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
            <View style={styles.content}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Nome</ThemedText>
                <ThemedText style={styles.value}>
                  {activity.item?.name || "-"}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Código</ThemedText>
                <ThemedText style={styles.value}>
                  {activity.item?.uniCode || "-"}
                </ThemedText>
              </View>

              {activity.item?.brand && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Marca</ThemedText>
                  <ThemedText style={styles.value}>
                    {activity.item.brand.name}
                  </ThemedText>
                </View>
              )}

              {activity.item?.category && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Categoria</ThemedText>
                  <ThemedText style={styles.value}>
                    {activity.item.category.name}
                  </ThemedText>
                </View>
              )}

              {activity.item?.supplier && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Fornecedor</ThemedText>
                  <ThemedText style={styles.value}>
                    {activity.item.supplier.fantasyName || activity.item.supplier.corporateName}
                  </ThemedText>
                </View>
              )}

              {currentPrice > 0 && (
                <>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Preço Unitário</ThemedText>
                    <ThemedText style={styles.value}>
                      {formatCurrency(currentPrice)}
                    </ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Valor Total</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.value, { fontWeight: "600" }])}>
                      {formatCurrency(totalValue)}
                    </ThemedText>
                  </View>
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
              <View style={styles.content}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Nome</ThemedText>
                  <ThemedText style={styles.value}>
                    {activity.user.name}
                  </ThemedText>
                </View>

                {activity.user.position && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Cargo</ThemedText>
                    <ThemedText style={styles.value}>
                      {activity.user.position.name}
                    </ThemedText>
                  </View>
                )}

                {activity.user.sector && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Setor</ThemedText>
                    <ThemedText style={styles.value}>
                      {activity.user.sector.name}
                    </ThemedText>
                  </View>
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
              <View style={styles.content}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Pedido</ThemedText>
                  <ThemedText style={styles.value}>
                    #{activity.order.id.slice(0, 8)}
                  </ThemedText>
                </View>

                {activity.order.supplier && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Fornecedor</ThemedText>
                    <ThemedText style={styles.value}>
                      {activity.order.supplier.fantasyName || activity.order.supplier.corporateName}
                    </ThemedText>
                  </View>
                )}

                {activity.orderItem && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Item do Pedido</ThemedText>
                    <ThemedText style={styles.value}>
                      {activity.orderItem.orderedQuantity} un
                    </ThemedText>
                  </View>
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
            <View style={styles.content}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.ACTIVITY}
                entityId={activity.id}
                entityName={`Movimentação - ${activity.item?.name || 'Item'}`}
                entityCreatedAt={activity.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>

          {/* Actions */}
          {isAdmin && (
            <View style={styles.actions}>
              <Button
                variant="destructive"
                onPress={handleDelete}
                style={styles.deleteButton}
              >
                <ThemedText style={{ color: colors.destructiveForeground }}>
                  Excluir Movimentação
                </ThemedText>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
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
  cardContent: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  valueRow: {
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
  badgeText: {
    fontSize: 12,
  },
  actions: {
    marginTop: spacing.lg,
  },
  deleteButton: {
    width: "100%",
  },
});