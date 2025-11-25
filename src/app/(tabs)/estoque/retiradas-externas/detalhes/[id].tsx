import { useState } from "react";
import { View, ScrollView, Alert, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconArrowLeft, IconEdit, IconTrash, IconRefresh, IconCheck, IconX } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExternalWithdrawal, useExternalWithdrawalMutations } from "@/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ExternalWithdrawalInfoCard } from "@/components/inventory/external-withdrawal/detail/external-withdrawal-info-card";
import { ExternalWithdrawalItemsCard } from "@/components/inventory/external-withdrawal/detail/external-withdrawal-items-card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { EXTERNAL_WITHDRAWAL_STATUS, SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { spacing } from "@/constants/design-system";

export default function ExternalWithdrawalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);
  const canManage = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch withdrawal data
  const { data: response, isLoading, error, refetch } = useExternalWithdrawal(id!, {
    include: {
      nfe: true,
      receipt: true,
      items: {
        include: {
          item: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const { delete: deleteWithdrawal, update: updateWithdrawal } = useExternalWithdrawalMutations();

  const withdrawal = response?.data;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar retiradas externas");
      return;
    }
    router.push(routeToMobilePath(`/inventory/external-withdrawals/edit/${id}`) as any);
  };

  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert("Sem permissão", "Você não tem permissão para excluir retiradas externas");
      return;
    }

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta retirada externa? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWithdrawal(id!);
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a retirada externa");
            }
          },
        },
      ],
    );
  };

  const handleMarkAsFullyReturned = async () => {
    if (!canManage) {
      Alert.alert("Sem permissão", "Você não tem permissão para alterar retiradas externas");
      return;
    }

    Alert.alert(
      "Confirmar Devolução Completa",
      "Deseja marcar esta retirada como totalmente devolvida?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await updateWithdrawal({
                id: id!,
                data: { status: EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível atualizar o status");
            }
          },
        },
      ],
    );
  };

  const handleMarkAsCharged = async () => {
    if (!canManage) {
      Alert.alert("Sem permissão", "Você não tem permissão para alterar retiradas externas");
      return;
    }

    Alert.alert(
      "Confirmar Cobrança",
      "Deseja marcar esta retirada como cobrada?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await updateWithdrawal({
                id: id!,
                data: { status: EXTERNAL_WITHDRAWAL_STATUS.CHARGED },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível atualizar o status");
            }
          },
        },
      ],
    );
  };

  const handleCancel = async () => {
    if (!canManage) {
      Alert.alert("Sem permissão", "Você não tem permissão para cancelar retiradas externas");
      return;
    }

    Alert.alert(
      "Confirmar Cancelamento",
      "Tem certeza que deseja cancelar esta retirada externa?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await updateWithdrawal({
                id: id!,
                data: { status: EXTERNAL_WITHDRAWAL_STATUS.CANCELLED },
              });
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível cancelar a retirada");
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !withdrawal) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar retirada externa"
          detail={error?.message || "Retirada externa não encontrada"}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  // Determine available actions based on status
  const showMarkAsFullyReturned =
    withdrawal?.status === EXTERNAL_WITHDRAWAL_STATUS.PENDING && canManage;
  const showMarkAsCharged =
    withdrawal?.willReturn === false &&
    withdrawal?.status === EXTERNAL_WITHDRAWAL_STATUS.PENDING &&
    canManage;
  const showCancel =
    withdrawal?.status !== EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED &&
    withdrawal?.status !== EXTERNAL_WITHDRAWAL_STATUS.CHARGED &&
    withdrawal?.status !== EXTERNAL_WITHDRAWAL_STATUS.CANCELLED &&
    canManage;

  return (
    <ThemedView style={StyleSheet.flatten([styles.container, { paddingTop: insets.top }])}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Button
            variant="default"
            size="icon"
            onPress={handleGoBack}
          >
            <IconArrowLeft size={24} color={colors.foreground} />
          </Button>
          <ThemedText style={styles.headerTitle}>Retirada #{withdrawal?.id?.slice(-8).toUpperCase()}</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <Button
            variant="default"
            size="icon"
            onPress={handleRefresh}
          >
            <IconRefresh size={24} color={colors.foreground} />
          </Button>
          {canEdit && (
            <Button
              variant="default"
              size="icon"
              onPress={handleEdit}
            >
              <IconEdit size={24} color={colors.foreground} />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="default"
              size="icon"
              onPress={handleDelete}
            >
              <IconTrash size={24} color={colors.destructive} />
            </Button>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.cardsContainer}>
          {/* Withdrawal Info */}
          <ExternalWithdrawalInfoCard withdrawal={withdrawal} />

          {/* Withdrawal Items */}
          <ExternalWithdrawalItemsCard items={withdrawal?.items || []} />

          {/* Changelog */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.EXTERNAL_WITHDRAWAL}
                entityId={withdrawal.id}
                entityName={withdrawal.withdrawerName}
                entityCreatedAt={withdrawal.createdAt}
                maxHeight={400}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {(showMarkAsFullyReturned || showMarkAsCharged || showCancel) && (
            <View style={styles.actionsCard}>
              {showMarkAsFullyReturned && (
                <Button
                  onPress={handleMarkAsFullyReturned}
                  style={styles.actionButton}
                >
                  <IconCheck size={20} color={colors.primaryForeground} />
                  <ThemedText style={{ color: colors.primaryForeground }}>
                    Marcar como Devolvido
                  </ThemedText>
                </Button>
              )}
              {showMarkAsCharged && (
                <Button
                  onPress={handleMarkAsCharged}
                  style={styles.actionButton}
                  variant="default"
                >
                  <IconCheck size={20} color={colors.primaryForeground} />
                  <ThemedText style={{ color: colors.primaryForeground }}>
                    Marcar como Cobrado
                  </ThemedText>
                </Button>
              )}
              {showCancel && (
                <Button
                  onPress={handleCancel}
                  style={styles.actionButton}
                  variant="destructive"
                >
                  <IconX size={20} color={colors.destructiveForeground} />
                  <ThemedText style={{ color: colors.destructiveForeground }}>
                    Cancelar Retirada
                  </ThemedText>
                </Button>
              )}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ paddingBottom: insets.bottom + spacing.lg }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  actionsCard: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
