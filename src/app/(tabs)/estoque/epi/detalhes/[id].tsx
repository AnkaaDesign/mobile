import { useCallback } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { spacing, fontSize } from "@/constants/design-system";
import { usePpeDelivery, usePpeDeliveryMutations } from "@/hooks";
import { formatDate, formatDateTime, formatQuantity } from "@/utils";
import {
  SECTOR_PRIVILEGES,
  PPE_DELIVERY_STATUS,
  PPE_DELIVERY_STATUS_LABELS,
  routes,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import {
  IconAlertTriangle,
  IconShield,
  IconUser,
  IconPackage,
} from "@tabler/icons-react-native";
import { DetailScreen } from "@/components/screens/detail-screen";
import { EDITABLE_PPE_DELIVERY_STATUSES } from "@/constants/editable-statuses";

export default function PPEDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteMutation } = usePpeDeliveryMutations();

  const query = usePpeDelivery(id, {
    include: {
      item: { include: { brand: true, category: true, supplier: true } },
      user: { include: { position: true, sector: true } },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconShield}
      title={(d: any) => d.item?.name ?? `Entrega EPI #${String(d.id).slice(0, 8)}`}
      privilege={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
      editGuard={{ editable: EDITABLE_PPE_DELIVERY_STATUSES }}
      editRoute={(d: any) => mobileRoute(routes.inventory.ppe.deliveries.edit(d.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta entrega de EPI? Esta ação é irreversível.",
        successRoute: mobileRoute(routes.inventory.ppe.deliveries.root),
      }}
      notFoundFallback={mobileRoute(routes.inventory.ppe.deliveries.root)}
      status={(d: any) => ({
        label: PPE_DELIVERY_STATUS_LABELS[d.status as PPE_DELIVERY_STATUS] ?? d.status,
        variant:
          d.status === PPE_DELIVERY_STATUS.DELIVERED
            ? "success"
            : d.status === PPE_DELIVERY_STATUS.PENDING
              ? "warning"
              : d.status === PPE_DELIVERY_STATUS.REPROVED ||
                  d.status === PPE_DELIVERY_STATUS.CANCELLED
                ? "destructive"
                : "default",
      })}
    >
      {(ppeDelivery: any, ctx) => (
        <PpeDetailBody
          ppeDelivery={ppeDelivery}
          refetch={query.refetch}
          isEditable={ctx.isEditable}
        />
      )}
    </DetailScreen>
  );
}

function PpeDetailBody({
  ppeDelivery,
  refetch,
  isEditable,
}: {
  ppeDelivery: any;
  refetch: () => Promise<unknown>;
  isEditable: boolean;
}) {
  const { colors } = useTheme();
  const nav = useNav();
  const { updateMutation } = usePpeDeliveryMutations();

  const handleStatusChange = useCallback(
    (newStatus: PPE_DELIVERY_STATUS) => {
      Alert.alert(
        "Alterar Status",
        `Deseja alterar o status para ${PPE_DELIVERY_STATUS_LABELS[newStatus]}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            style: "default",
            onPress: async () => {
              try {
                await nav.withLoading(async () =>
                  updateMutation.mutateAsync({
                    id: ppeDelivery.id,
                    data: { status: newStatus } as any,
                  }),
                );
                await refetch();
              } catch {
                // Error toast is shown automatically by the API client interceptor
              }
            },
          },
        ],
      );
    },
    [nav, refetch, updateMutation, ppeDelivery.id],
  );

  const isOverdue =
    ppeDelivery.scheduledDate &&
    new Date(ppeDelivery.scheduledDate) < new Date() &&
    ppeDelivery.status === PPE_DELIVERY_STATUS.PENDING;

  return (
    <View style={styles.body}>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconShield size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações da Entrega</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Quantidade</ThemedText>
            <ThemedText style={styles.value}>{formatQuantity(ppeDelivery.quantity)}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Data de Criação</ThemedText>
            <ThemedText style={styles.value}>{formatDateTime(ppeDelivery.createdAt)}</ThemedText>
          </View>
          {ppeDelivery.scheduledDate && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Data Agendada</ThemedText>
              <View style={styles.valueRow}>
                <ThemedText style={[styles.value, isOverdue && { color: "#ef4444" }]}>
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
        </View>
      </Card>

      {ppeDelivery.item && (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações do Item</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Nome</ThemedText>
              <ThemedText style={styles.value}>{ppeDelivery.item.name}</ThemedText>
            </View>
            {ppeDelivery.item.uniCode && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Código</ThemedText>
                <ThemedText style={styles.value}>{ppeDelivery.item.uniCode}</ThemedText>
              </View>
            )}
            {ppeDelivery.item.brand && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Marca</ThemedText>
                <ThemedText style={styles.value}>{ppeDelivery.item.brand.name}</ThemedText>
              </View>
            )}
            {ppeDelivery.item.category && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Categoria</ThemedText>
                <ThemedText style={styles.value}>{ppeDelivery.item.category.name}</ThemedText>
              </View>
            )}
          </View>
        </Card>
      )}

      {ppeDelivery.user && (
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
              <ThemedText style={styles.value}>{ppeDelivery.user.name}</ThemedText>
            </View>
            {ppeDelivery.user.position && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Cargo</ThemedText>
                <ThemedText style={styles.value}>{ppeDelivery.user.position.name}</ThemedText>
              </View>
            )}
            {ppeDelivery.user.sector && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Setor</ThemedText>
                <ThemedText style={styles.value}>{ppeDelivery.user.sector.name}</ThemedText>
              </View>
            )}
          </View>
        </Card>
      )}

      {isEditable && (
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
        </View>
      )}
    </View>
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
  content: {
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
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
});
