import { View, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  IconCheck,
  IconCurrencyReal,
  IconHistory,
  IconTruckDelivery,
  IconX,
  IconPackage,
} from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ExternalWithdrawalInfoCard } from "@/components/inventory/external-withdrawal/detail/external-withdrawal-info-card";
import { ExternalWithdrawalItemsCard } from "@/components/inventory/external-withdrawal/detail/external-withdrawal-items-card";
import { useTheme } from "@/lib/theme";
import { useExternalWithdrawal, useExternalWithdrawalMutations } from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import {
  EXTERNAL_WITHDRAWAL_STATUS,
  EXTERNAL_WITHDRAWAL_TYPE,
  SECTOR_PRIVILEGES,
  CHANGE_LOG_ENTITY_TYPE,
  routes,
} from "@/constants";
import { EDITABLE_EXTERNAL_WITHDRAWAL_STATUSES } from "@/constants/editable-statuses";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { ExternalWithdrawal } from "@/types";

export default function ExternalWithdrawalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const { deleteMutation, updateAsync } = useExternalWithdrawalMutations();

  const query = useExternalWithdrawal(id as string, {
    include: {
      receipts: true,
      items: {
        include: {
          item: { include: { brand: true, category: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    enabled: !!id,
  });

  const promptUpdateStatus = (status: EXTERNAL_WITHDRAWAL_STATUS, title: string, message: string) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          if (!id) return;
          try {
            await nav.withLoading(async () =>
              updateAsync({ id, data: { status } }),
            );
            await query.refetch();
          } catch {
            // API client surfaces error.
          }
        },
      },
    ]);
  };

  return (
    <DetailScreen<ExternalWithdrawal>
      query={query as any}
      icon={IconPackage}
      title={(w) => `Retirada #${String(w.id).slice(-8).toUpperCase()}`}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      editGuard={{ editable: EDITABLE_EXTERNAL_WITHDRAWAL_STATUSES }}
      editRoute={(w) => mobileRoute(routes.inventory.externalWithdrawals.edit(w.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta retirada externa? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.inventory.externalWithdrawals.root),
      }}
      notFoundFallback={mobileRoute(routes.inventory.externalWithdrawals.root)}
    >
      {(withdrawal, ctx) => {
        const showMarkAsFullyReturned =
          withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE &&
          (withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.PENDING ||
            withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.PARTIALLY_RETURNED) &&
          ctx.isEditable;
        const showMarkAsCharged =
          withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE &&
          withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.PENDING &&
          ctx.isEditable;
        const showMarkAsDelivered =
          withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.COMPLIMENTARY &&
          withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.PENDING &&
          ctx.isEditable;
        const finalStatuses: EXTERNAL_WITHDRAWAL_STATUS[] = [
          EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED,
          EXTERNAL_WITHDRAWAL_STATUS.CHARGED,
          EXTERNAL_WITHDRAWAL_STATUS.LIQUIDATED,
          EXTERNAL_WITHDRAWAL_STATUS.DELIVERED,
          EXTERNAL_WITHDRAWAL_STATUS.CANCELLED,
        ];
        const showCancel =
          !!withdrawal.status && !finalStatuses.includes(withdrawal.status) && ctx.isEditable;

        return (
          <View style={styles.body}>
            <ExternalWithdrawalInfoCard withdrawal={withdrawal} />
            <ExternalWithdrawalItemsCard
              items={withdrawal.items || []}
              withdrawalType={withdrawal.type}
              withdrawalStatus={withdrawal.status}
            />

            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconHistory size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
                </View>
              </View>
              <View style={styles.changelogContent}>
                <ChangelogTimeline
                  entityType={CHANGE_LOG_ENTITY_TYPE.EXTERNAL_WITHDRAWAL}
                  entityId={withdrawal.id}
                  entityName={withdrawal.withdrawerName}
                  entityCreatedAt={withdrawal.createdAt}
                  maxHeight={400}
                />
              </View>
            </Card>

            {(showMarkAsFullyReturned || showMarkAsCharged || showMarkAsDelivered || showCancel) && (
              <View style={styles.actionsCard}>
                {showMarkAsFullyReturned && (
                  <Button
                    onPress={() =>
                      promptUpdateStatus(
                        EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED,
                        "Confirmar Devolução Completa",
                        "Deseja marcar esta retirada como totalmente devolvida?",
                      )
                    }
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
                    onPress={() =>
                      promptUpdateStatus(
                        EXTERNAL_WITHDRAWAL_STATUS.CHARGED,
                        "Confirmar Cobrança",
                        "Deseja marcar esta retirada como cobrada?",
                      )
                    }
                    style={styles.actionButtonLarge}
                  >
                    <IconCurrencyReal size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>
                      Marcar como Cobrado
                    </ThemedText>
                  </Button>
                )}
                {showMarkAsDelivered && (
                  <Button
                    onPress={() =>
                      promptUpdateStatus(
                        EXTERNAL_WITHDRAWAL_STATUS.DELIVERED,
                        "Confirmar Entrega",
                        "Deseja marcar esta retirada como entregue?",
                      )
                    }
                    style={styles.actionButtonLarge}
                  >
                    <IconTruckDelivery size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>
                      Marcar como Entregue
                    </ThemedText>
                  </Button>
                )}
                {showCancel && (
                  <Button
                    onPress={() =>
                      promptUpdateStatus(
                        EXTERNAL_WITHDRAWAL_STATUS.CANCELLED,
                        "Confirmar Cancelamento",
                        "Tem certeza que deseja cancelar esta retirada externa?",
                      )
                    }
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
        );
      }}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: fontWeight.medium,
  },
  changelogContent: {
    gap: spacing.sm,
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
