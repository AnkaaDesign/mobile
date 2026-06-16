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
import { ExternalOperationInfoCard } from "@/components/inventory/external-operation/detail/external-operation-info-card";
import { ExternalOperationItemsCard } from "@/components/inventory/external-operation/detail/external-operation-items-card";
import { ExternalOperationServicesCard } from "@/components/inventory/external-operation/detail/external-operation-services-card";
import { ExternalOperationBillingCard } from "@/components/inventory/external-operation/detail/external-operation-billing-card";
import { useTheme } from "@/lib/theme";
import {
  useExternalOperation,
  useExternalOperationMutations,
  useGenerateExternalOperationBilling,
} from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import {
  EXTERNAL_OPERATION_STATUS,
  EXTERNAL_OPERATION_TYPE,
  SECTOR_PRIVILEGES,
  CHANGE_LOG_ENTITY_TYPE,
  routes,
} from "@/constants";
import { EDITABLE_EXTERNAL_OPERATION_STATUSES } from "@/constants/editable-statuses";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { ExternalOperation } from "@/types";

export default function ExternalOperationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const { deleteMutation, updateAsync } = useExternalOperationMutations();
  const generateBillingMutation = useGenerateExternalOperationBilling();

  const query = useExternalOperation(id as string, {
    include: {
      receipts: true,
      items: {
        include: {
          item: { include: { brands: true, category: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      customer: true,
      services: { orderBy: { position: "asc" } },
      billingInvoice: {
        include: {
          installments: { include: { bankSlip: true }, orderBy: { number: "asc" } },
          nfseDocuments: true,
        },
      },
    },
    enabled: !!id,
  });

  const promptGenerateBilling = (docsLabel: string) => {
    Alert.alert(
      "Gerar Faturamento",
      `Deseja gerar o faturamento desta operação? ${docsLabel} para o cliente. Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            if (!id) return;
            try {
              await nav.withLoading(async () =>
                generateBillingMutation.mutateAsync({ id }),
              );
              await query.refetch();
            } catch {
              // API client surfaces error.
            }
          },
        },
      ],
    );
  };

  const promptUpdateStatus = (status: EXTERNAL_OPERATION_STATUS, title: string, message: string) => {
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
    <DetailScreen<ExternalOperation>
      query={query as any}
      icon={IconPackage}
      title={(w) => `Operação #${String(w.id).slice(-8).toUpperCase()}`}
      privilege={{ any: [SECTOR_PRIVILEGES.ADMIN] }}
      editGuard={{ editable: EDITABLE_EXTERNAL_OPERATION_STATUSES }}
      editRoute={(w) => mobileRoute(routes.inventory.externalOperations.edit(w.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta operação externa? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.inventory.externalOperations.root),
      }}
      notFoundFallback={mobileRoute(routes.inventory.externalOperations.root)}
    >
      {(withdrawal, ctx) => {
        const showMarkAsFullyReturned =
          withdrawal.type === EXTERNAL_OPERATION_TYPE.RETURNABLE &&
          (withdrawal.status === EXTERNAL_OPERATION_STATUS.PENDING ||
            withdrawal.status === EXTERNAL_OPERATION_STATUS.PARTIALLY_RETURNED) &&
          ctx.isEditable;
        const showMarkAsCharged =
          withdrawal.type === EXTERNAL_OPERATION_TYPE.CHARGEABLE &&
          withdrawal.status === EXTERNAL_OPERATION_STATUS.PENDING &&
          ctx.isEditable;
        const showMarkAsDelivered =
          withdrawal.type === EXTERNAL_OPERATION_TYPE.COMPLIMENTARY &&
          withdrawal.status === EXTERNAL_OPERATION_STATUS.PENDING &&
          ctx.isEditable;
        const finalStatuses: EXTERNAL_OPERATION_STATUS[] = [
          EXTERNAL_OPERATION_STATUS.FULLY_RETURNED,
          EXTERNAL_OPERATION_STATUS.CHARGED,
          EXTERNAL_OPERATION_STATUS.LIQUIDATED,
          EXTERNAL_OPERATION_STATUS.DELIVERED,
          EXTERNAL_OPERATION_STATUS.CANCELLED,
        ];
        const showCancel =
          !!withdrawal.status && !finalStatuses.includes(withdrawal.status) && ctx.isEditable;

        // Billing configuration (CHARGEABLE only): customer + at least one
        // document kind (NFS-e and/or boleto) selected for emission.
        const billingConfigured =
          withdrawal.type === EXTERNAL_OPERATION_TYPE.CHARGEABLE &&
          !!withdrawal.customerId &&
          (!!withdrawal.generateInvoice || !!withdrawal.generateBankSlip);
        const billingDocsLabel = [
          withdrawal.generateInvoice ? "NFS-e" : null,
          withdrawal.generateBankSlip ? "boletos" : null,
        ]
          .filter(Boolean)
          .join(" e ");
        // M1 — billing-aware charge confirmation (mirrors web)
        const chargeConfirmMessage = billingConfigured
          ? `Deseja marcar esta operação como cobrada? ${billingDocsLabel} ${
              withdrawal.generateBankSlip ? "serão emitidos" : "será emitida"
            } automaticamente para o cliente.`
          : "Deseja marcar esta operação como cobrada? Atenção: nenhum faturamento (NFS-e/boleto) será gerado — não há cliente ou emissão de documentos configurada.";
        // H4 — billing recovery: CHARGED with billing configured but no invoice
        const showGenerateBilling =
          billingConfigured &&
          withdrawal.status === EXTERNAL_OPERATION_STATUS.CHARGED &&
          !withdrawal.billingInvoice;

        return (
          <View style={styles.body}>
            <ExternalOperationInfoCard withdrawal={withdrawal} />
            <ExternalOperationItemsCard
              items={withdrawal.items || []}
              withdrawalType={withdrawal.type}
              withdrawalStatus={withdrawal.status}
            />
            {(withdrawal.services?.length ?? 0) > 0 && (
              <ExternalOperationServicesCard services={withdrawal.services!} />
            )}
            {withdrawal.type === EXTERNAL_OPERATION_TYPE.CHARGEABLE &&
              withdrawal.billingInvoice && (
                <ExternalOperationBillingCard invoice={withdrawal.billingInvoice} />
              )}
            {/* H4 — billing recovery: CHARGED + billing configured but no invoice */}
            {showGenerateBilling && (
              <Card style={styles.card}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <View style={styles.headerLeft}>
                    <IconCurrencyReal size={20} color={colors.mutedForeground} />
                    <ThemedText style={styles.title}>Faturamento</ThemedText>
                  </View>
                </View>
                <View style={styles.changelogContent}>
                  <ThemedText style={{ color: colors.mutedForeground }}>
                    Esta operação foi cobrada, mas o faturamento ainda não foi
                    gerado.
                  </ThemedText>
                  <Button
                    onPress={() => promptGenerateBilling(`${billingDocsLabel} ${withdrawal.generateBankSlip ? "serão emitidos" : "será emitida"}`)}
                    disabled={generateBillingMutation.isPending}
                    loading={generateBillingMutation.isPending}
                    style={styles.actionButtonLarge}
                  >
                    <IconCurrencyReal size={20} color={colors.primaryForeground} />
                    <ThemedText style={{ color: colors.primaryForeground }}>
                      Gerar Faturamento
                    </ThemedText>
                  </Button>
                </View>
              </Card>
            )}

            <Card style={styles.card}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconHistory size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
                </View>
              </View>
              <View style={styles.changelogContent}>
                <ChangelogTimeline
                  entityType={CHANGE_LOG_ENTITY_TYPE.EXTERNAL_OPERATION}
                  entityId={withdrawal.id}
                  entityName={withdrawal.withdrawerName ?? undefined}
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
                        EXTERNAL_OPERATION_STATUS.FULLY_RETURNED,
                        "Confirmar Devolução Completa",
                        "Deseja marcar esta operação como totalmente devolvida?",
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
                        EXTERNAL_OPERATION_STATUS.CHARGED,
                        "Confirmar Cobrança",
                        chargeConfirmMessage,
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
                        EXTERNAL_OPERATION_STATUS.DELIVERED,
                        "Confirmar Entrega",
                        "Deseja marcar esta operação como entregue?",
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
                        EXTERNAL_OPERATION_STATUS.CANCELLED,
                        "Confirmar Cancelamento",
                        "Tem certeza que deseja cancelar esta operação externa?",
                      )
                    }
                    style={styles.actionButtonLarge}
                    variant="destructive"
                  >
                    <IconX size={20} color={colors.destructiveForeground} />
                    <ThemedText style={{ color: colors.destructiveForeground }}>
                      Cancelar Operação
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
