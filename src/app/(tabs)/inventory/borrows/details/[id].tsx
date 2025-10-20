import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Alert, RefreshControl , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBorrow, useBorrowMutations } from '../../../../../hooks';
import { hasPrivilege, formatDate, formatDateTime } from '../../../../../utils';
import { SECTOR_PRIVILEGES, BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../../../constants';
import { IconPackage, IconUser, IconCalendar, IconX, IconCheck, IconRefresh } from "@tabler/icons-react-native";
import { BorrowDetailSkeleton } from "@/components/inventory/borrow/skeleton/borrow-detail-skeleton";

export default function EstoqueEmprestimosDetalhesScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const { deleteAsync, update } = useBorrowMutations();

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
  } = useBorrow(params.id!, {
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
    enabled: !!params.id && canManageWarehouse,
  });

  const borrow = response?.data;

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle return
  const handleReturn = useCallback(async () => {
    Alert.alert(
      "Devolver Item",
      "Confirma a devolução deste item?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "default",
          onPress: async () => {
            try {
              await update({
                id: params.id!,
                data: {
                  status: BORROW_STATUS.RETURNED,
                  returnedAt: new Date(),
                },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível devolver o item");
            }
          },
        },
      ]
    );
  }, [update, params.id, refetch]);

  // Handle mark as lost
  const handleMarkAsLost = useCallback(async () => {
    Alert.alert(
      "Marcar como Perdido",
      "Tem certeza que deseja marcar este item como perdido? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Perdido",
          style: "destructive",
          onPress: async () => {
            try {
              await update({
                id: params.id!,
                data: { status: BORROW_STATUS.LOST },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível marcar o item como perdido");
            }
          },
        },
      ]
    );
  }, [update, params.id, refetch]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    Alert.alert(
      "Excluir Empréstimo",
      "Tem certeza que deseja excluir este empréstimo? Esta ação é irreversível.",
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
              Alert.alert("Erro", "Não foi possível excluir o empréstimo");
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
            title: "Detalhes do Empréstimo",
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
            title: "Detalhes do Empréstimo",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <ErrorScreen
          message="Erro ao carregar empréstimo"
          detail={error.message}
        />
      </>
    );
  }

  if (isLoading || !borrow) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Detalhes do Empréstimo",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
          }}
        />
        <BorrowDetailSkeleton />
      </>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case BORROW_STATUS.ACTIVE:
        return "#3b82f6";
      case BORROW_STATUS.RETURNED:
        return "#10b981";
      case BORROW_STATUS.LOST:
        return "#ef4444";
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case BORROW_STATUS.ACTIVE:
        return <IconX size={14} color="white" />;
      case BORROW_STATUS.RETURNED:
        return <IconCheck size={14} color="white" />;
      case BORROW_STATUS.LOST:
        return <IconX size={14} color="white" />;
      default:
        return null;
    }
  };

  const daysBorrowed = Math.floor((new Date().getTime() - new Date(borrow.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <Stack.Screen
        options={{
          title: `Empréstimo #${borrow.id.slice(0, 8)}`,
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
          {/* Borrow Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Empréstimo</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <Badge
                  variant="default"
                  style={{ backgroundColor: getStatusColor(borrow.status) }}
                >
                  <View style={styles.badgeContent}>
                    {getStatusIcon(borrow.status)}
                    <ThemedText style={styles.statusText}>
                      {BORROW_STATUS_LABELS[borrow.status]}
                    </ThemedText>
                  </View>
                </Badge>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Quantidade</ThemedText>
                <ThemedText style={styles.value}>
                  {borrow.quantity} un
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Data do Empréstimo</ThemedText>
                <ThemedText style={styles.value}>
                  {formatDateTime(borrow.createdAt)}
                </ThemedText>
              </View>

              {borrow.returnedAt && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Data de Devolução</ThemedText>
                  <ThemedText style={styles.value}>
                    {formatDateTime(borrow.returnedAt)}
                  </ThemedText>
                </View>
              )}

              {borrow.status === BORROW_STATUS.ACTIVE && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Tempo Emprestado</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.value, daysBorrowed > 30 && { color: "#f59e0b" }])}>
                    {daysBorrowed} {daysBorrowed === 1 ? "dia" : "dias"}
                  </ThemedText>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Item Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Item</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Nome</ThemedText>
                <ThemedText style={styles.value}>
                  {borrow.item?.name || "-"}
                </ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Código</ThemedText>
                <ThemedText style={styles.value}>
                  {borrow.item?.uniCode || "-"}
                </ThemedText>
              </View>

              {borrow.item?.brand && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Marca</ThemedText>
                  <ThemedText style={styles.value}>
                    {borrow.item.brand.name}
                  </ThemedText>
                </View>
              )}

              {borrow.item?.category && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Categoria</ThemedText>
                  <ThemedText style={styles.value}>
                    {borrow.item.category.name}
                  </ThemedText>
                </View>
              )}

              {borrow.item?.supplier && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Fornecedor</ThemedText>
                  <ThemedText style={styles.value}>
                    {borrow.item.supplier.fantasyName || borrow.item.supplier.corporateName}
                  </ThemedText>
                </View>
              )}
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Usuário</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Nome</ThemedText>
                <ThemedText style={styles.value}>
                  {borrow.user?.name || "-"}
                </ThemedText>
              </View>

              {borrow.user?.position && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Cargo</ThemedText>
                  <ThemedText style={styles.value}>
                    {borrow.user.position.name}
                  </ThemedText>
                </View>
              )}

              {borrow.user?.sector && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Setor</ThemedText>
                  <ThemedText style={styles.value}>
                    {borrow.user.sector.name}
                  </ThemedText>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            {borrow.status === BORROW_STATUS.ACTIVE && (
              <>
                <Button
                  onPress={handleReturn}
                  style={styles.actionButton}
                >
                  <IconCheck size={18} color={colors.primaryForeground} />
                  <ThemedText style={{ color: colors.primaryForeground }}>
                    Devolver Item
                  </ThemedText>
                </Button>

                <Button
                  variant="outline"
                  onPress={handleMarkAsLost}
                  style={styles.actionButton}
                >
                  <IconX size={18} color={colors.foreground} />
                  <ThemedText>Marcar como Perdido</ThemedText>
                </Button>
              </>
            )}

            {isAdmin && (
              <Button
                variant="destructive"
                onPress={handleDelete}
                style={styles.actionButton}
              >
                <ThemedText style={{ color: colors.destructiveForeground }}>
                  Excluir Empréstimo
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
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
});