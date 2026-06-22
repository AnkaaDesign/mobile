import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useActivity } from "@/hooks";
import {
  ACTIVITY_OPERATION,
  ACTIVITY_OPERATION_LABELS,
  ACTIVITY_REASON_LABELS,
  routes,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils";
import { IconArrowsExchange, IconExternalLink } from "@tabler/icons-react-native";
import type { Activity } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";

const formatSignedQuantity = (quantity: number, operation: string) => {
  const sign = operation === ACTIVITY_OPERATION.INBOUND ? "+" : "-";
  const absValue = Math.abs(quantity ?? 0);
  return `${sign}${absValue % 1 === 0 ? absValue : absValue.toFixed(2)}`;
};

export default function MovementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();

  const query = useActivity(id || "", {
    include: {
      item: { select: { id: true, name: true } },
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<Activity>
      query={query as any}
      icon={IconArrowsExchange}
      title={(activity) => activity.item?.name || "Movimentação"}
      subtitle={(activity) =>
        activity.reason ? ACTIVITY_REASON_LABELS[activity.reason] : undefined
      }
      // User-scoped read-only mirror — the user views their own stock movements
      // and can't edit anything, so hide the refresh button (pull-to-refresh
      // covers it) and the terminal-state banner.
      editGuard={{ editable: [] }}
      hideRefresh
      hideTerminalBanner
      notFoundFallback={mobileRoute(routes.personal.myMovements.root)}
    >
      {(activity) => {
        const isInbound = activity.operation === ACTIVITY_OPERATION.INBOUND;
        return (
          <View style={styles.body}>
            {/* Movement Info */}
            <DetailCard title="Informações da Movimentação" icon="arrows-exchange">
              <View style={styles.content}>
                <DetailField
                  label="Operação"
                  value={
                    <Badge
                      variant={isInbound ? "success" : "destructive"}
                      textStyle={styles.badgeText}
                    >
                      {`${isInbound ? "↑ " : "↓ "}${
                        ACTIVITY_OPERATION_LABELS[activity.operation] || "-"
                      }`}
                    </Badge>
                  }
                />

                <DetailField
                  label="Quantidade"
                  value={formatSignedQuantity(activity.quantity, activity.operation)}
                />

                {activity.reason && (
                  <DetailField
                    label="Motivo"
                    value={ACTIVITY_REASON_LABELS[activity.reason] || "-"}
                  />
                )}
              </View>
            </DetailCard>

            {/* Item */}
            <DetailCard title="Item" icon="box">
              {activity.item ? (
                <TouchableOpacity
                  onPress={() =>
                    activity.item?.id &&
                    nav.push(
                      mobileRoute(routes.inventory.products.details(activity.item.id)),
                    )
                  }
                  activeOpacity={0.7}
                >
                  <DetailField
                    label="Nome do Item"
                    icon="package"
                    value={
                      <View style={styles.nameRow}>
                        <ThemedText style={[styles.nameText, { color: colors.foreground }]}>
                          {activity.item.name}
                        </ThemedText>
                        <IconExternalLink size={14} color={colors.primary} />
                      </View>
                    }
                  />
                </TouchableOpacity>
              ) : (
                <DetailField label="Nome do Item" icon="package" value="-" />
              )}
            </DetailCard>

            {/* Dates */}
            <DetailCard title="Datas" icon="calendar">
              <View style={styles.content}>
                {activity.createdAt && (
                  <DetailField
                    label="Data da Movimentação"
                    icon="calendar"
                    value={formatDate(activity.createdAt)}
                  />
                )}
              </View>
            </DetailCard>
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
  content: {
    gap: spacing.lg,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
});
