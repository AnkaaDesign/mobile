import { useState } from "react";
import { View, ScrollView, Alert, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconEdit, IconTrash, IconCheck, IconX, IconHistory } from "@tabler/icons-react-native";
import { useExternalWithdrawal, useExternalWithdrawalMutations } from "@/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ExternalWithdrawalInfoCard } from "@/components/inventory/external-withdrawal/detail/external-withdrawal-info-card";
import { ExternalWithdrawalItemsCard } from "@/components/inventory/external-withdrawal/detail/external-withdrawal-items-card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { EXTERNAL_WITHDRAWAL_STATUS, SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from "@/utils";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

export default function ExternalWithdrawalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);
  const canManage = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch withdrawal data
  const { data: response, isLoading, error, refetch } = useExternalWithdrawal(id!, {
    include: {
      receipts: true,
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
            } catch (_error) {
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
            } catch (_error) {
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
            } catch (_error) {
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
            } catch (_error) {
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

  // Generate page title
  const pageTitle = `Retirada #${withdrawal?.id?.slice(-8).toUpperCase()}`;

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Page Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText
                style={[styles.pageTitle, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {pageTitle}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color={colors.destructiveForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        <View style={styles.cardsContainer}>
          {/* Withdrawal Info */}
          <ExternalWithdrawalInfoCard withdrawal={withdrawal} />

          {/* Withdrawal Items */}
          <ExternalWithdrawalItemsCard items={withdrawal?.items || []} />

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
                entityType={CHANGE_LOG_ENTITY_TYPE.EXTERNAL_WITHDRAWAL}
                entityId={withdrawal.id}
                entityName={withdrawal.withdrawerName}
                entityCreatedAt={withdrawal.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>

          {/* Action Buttons */}
          {(showMarkAsFullyReturned || showMarkAsCharged || showCancel) && (
            <View style={styles.actionsCard}>
              {showMarkAsFullyReturned && (
                <Button
                  onPress={handleMarkAsFullyReturned}
                  style={styles.actionButtonLarge}
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
                  style={styles.actionButtonLarge}
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
                  style={styles.actionButtonLarge}
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
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  pageTitle: {
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
  cardsContainer: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  actionsCard: {
    gap: spacing.sm,
  },
  actionButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
