import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Alert, RefreshControl , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePpeDelivery, usePpeDeliveryMutations } from '../../../../../hooks';
import { hasPrivilege, formatDate, formatDateTime } from '../../../../../utils';
import { SECTOR_PRIVILEGES, PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from '../../../../../constants';
import { IconRefresh, IconAlertTriangle } from "@tabler/icons-react-native";
import { PpeDetailSkeleton } from "@/components/inventory/ppe/skeleton/ppe-detail-skeleton";

export default function PPEDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const { deleteMutation, updateMutation } = usePpeDeliveryMutations();

  // Permission check
  const canManagePpe = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.HUMAN_RESOURCES) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
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
  } = usePpeDelivery(params.id!, {
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
    },
    enabled: !!params.id && canManagePpe,
  });

  const ppeDelivery = response?.data;

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus: PPE_DELIVERY_STATUS) => {
    Alert.alert(
      "Alterar Status",
      `Deseja alterar o status para ${PPE_DELIVERY_STATUS_LABELS[newStatus as keyof typeof PPE_DELIVERY_STATUS_LABELS]}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: async () => {
            try {
              await updateMutation.mutateAsync({
                id: params.id!,
                data: { status: newStatus },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível alterar o status");
            }
          },
        },
      ]
    );
  }, [updateMutation, params.id, refetch]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    Alert.alert(
      "Excluir Entrega de EPI",
      "Tem certeza que deseja excluir esta entrega de EPI? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(params.id!);
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a entrega de EPI");
            }
          },
        },
      ]
    );
  }, [deleteMutation, params.id]);

  // Permission gate
  if (!canManagePpe) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Detalhes da Entrega de EPI",
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
            title: "Detalhes da Entrega de EPI",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Erro ao carregar entrega de EPI"
          detail={error.message}
        />
      </>
    );
  }

  if (isLoading || !ppeDelivery) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Detalhes do EPI",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <PpeDetailSkeleton />
      </>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case PPE_DELIVERY_STATUS.PENDING:
        return "#f59e0b";
      case PPE_DELIVERY_STATUS.APPROVED:
        return "#10b981";
      case PPE_DELIVERY_STATUS.DELIVERED:
        return "#3b82f6";
      case PPE_DELIVERY_STATUS.REPROVED:
        return "#ef4444";
      case PPE_DELIVERY_STATUS.CANCELLED:
        return "#6b7280";
      default:
        return colors.mutedForeground;
    }
  };

  const isOverdue = ppeDelivery.scheduledDate && new Date(ppeDelivery.scheduledDate) < new Date() && ppeDelivery.status === PPE_DELIVERY_STATUS.PENDING;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Entrega #${ppeDelivery.id.slice(0, 8)}`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Button
                variant="ghost"
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
          {/* PPE Delivery Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Entrega de EPI</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <Badge
                  variant="default"
                  style={{ backgroundColor: getStatusColor(ppeDelivery.status) }}
                >
                  <ThemedText style={styles.statusText}>
                    {PPE_DELIVERY_STATUS_LABELS[ppeDelivery.status]}
                  </ThemedText>
                </Badge>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Quantidade</ThemedText>
                <ThemedText style={styles.value}>{ppeDelivery.quantity}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Data de Criação</ThemedText>
                <ThemedText style={styles.value}>
                  {formatDateTime(ppeDelivery.createdAt)}
                </ThemedText>
              </View>

              {ppeDelivery.scheduledDate && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Data Agendada</ThemedText>
                  <View style={styles.valueRow}>
                    <ThemedText style={StyleSheet.flatten([styles.value, isOverdue && { color: "#ef4444" }])}>
                      {formatDate(ppeDelivery.scheduledDate)}
                    </ThemedText>
                    {isOverdue && <IconAlertTriangle size={16} color="#ef4444" />}
                  </View>
                </View>
              )}

              {ppeDelivery.actualDeliveryDate && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Data de Entrega</ThemedText>
                  <ThemedText style={styles.value}>
                    {formatDate(ppeDelivery.actualDeliveryDate)}
                  </ThemedText>
                </View>
              )}

            </CardContent>
          </Card>

          {/* Item Info Card */}
          {ppeDelivery.item && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Item</CardTitle>
              </CardHeader>
              <CardContent style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Nome</ThemedText>
                  <ThemedText style={styles.value}>
                    {ppeDelivery.item.name}
                  </ThemedText>
                </View>

                {ppeDelivery.item.uniCode && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Código</ThemedText>
                    <ThemedText style={styles.value}>
                      {ppeDelivery.item.uniCode}
                    </ThemedText>
                  </View>
                )}

                {ppeDelivery.item.brand && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Marca</ThemedText>
                    <ThemedText style={styles.value}>
                      {ppeDelivery.item.brand.name}
                    </ThemedText>
                  </View>
                )}

                {ppeDelivery.item.category && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Categoria</ThemedText>
                    <ThemedText style={styles.value}>
                      {ppeDelivery.item.category.name}
                    </ThemedText>
                  </View>
                )}

                {ppeDelivery.item.supplier && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Fornecedor</ThemedText>
                    <ThemedText style={styles.value}>
                      {ppeDelivery.item.supplier.fantasyName || ppeDelivery.item.supplier.corporateName}
                    </ThemedText>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* User Info Card */}
          {ppeDelivery.user && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Usuário</CardTitle>
              </CardHeader>
              <CardContent style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Nome</ThemedText>
                  <ThemedText style={styles.value}>
                    {ppeDelivery.user.name}
                  </ThemedText>
                </View>

                {ppeDelivery.user.position && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Cargo</ThemedText>
                    <ThemedText style={styles.value}>
                      {ppeDelivery.user.position.name}
                    </ThemedText>
                  </View>
                )}

                {ppeDelivery.user.sector && (
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Setor</ThemedText>
                    <ThemedText style={styles.value}>
                      {ppeDelivery.user.sector.name}
                    </ThemedText>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {ppeDelivery.status === PPE_DELIVERY_STATUS.PENDING && (
              <>
                <Button
                  variant="outline"
                  onPress={() => handleStatusChange(PPE_DELIVERY_STATUS.APPROVED)}
                  style={styles.actionButton}
                >
                  <ThemedText>Aprovar Entrega</ThemedText>
                </Button>

                <Button
                  variant="outline"
                  onPress={() => handleStatusChange(PPE_DELIVERY_STATUS.REPROVED)}
                  style={styles.actionButton}
                >
                  <ThemedText>Reprovar Entrega</ThemedText>
                </Button>
              </>
            )}

            {ppeDelivery.status === PPE_DELIVERY_STATUS.APPROVED && (
              <Button
                variant="outline"
                onPress={() => handleStatusChange(PPE_DELIVERY_STATUS.DELIVERED)}
                style={styles.actionButton}
              >
                <ThemedText>Marcar como Entregue</ThemedText>
              </Button>
            )}

            {ppeDelivery.status === PPE_DELIVERY_STATUS.REPROVED && (
              <Button
                variant="outline"
                onPress={() => handleStatusChange(PPE_DELIVERY_STATUS.PENDING)}
                style={styles.actionButton}
              >
                <ThemedText>Reativar Entrega</ThemedText>
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="destructive"
                onPress={handleDelete}
                style={styles.actionButton}
              >
                <ThemedText style={{ color: colors.destructiveForeground }}>
                  Excluir Entrega
                </ThemedText>
              </Button>
            )}
          </View>
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
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  deliveryItem: {
    paddingVertical: spacing.xs,
  },
  deliveryItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  deliveryDate: {
    fontSize: 13,
    fontWeight: "500",
  },
  deliveryQuantity: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
});