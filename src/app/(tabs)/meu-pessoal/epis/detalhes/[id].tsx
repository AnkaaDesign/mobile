import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { usePpeDelivery } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants/enums";
import { PPE_DELIVERY_STATUS } from "@/constants";
import { spacing } from "@/constants/design-system";
import { IconShieldCheck } from "@tabler/icons-react-native";
import { isTeamLeader } from "@/utils/user";
import { mobileRoute } from "@/constants/routes.types";
import type { PpeDelivery } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { DetailCard } from "@/components/ui/detail-page-layout";
import {
  TeamPpeDeliveryCard,
  TeamPpeEmployeeCard,
  TeamPpeItemCard,
  TeamPpeStatusCard,
} from "@/components/my-team/ppe-delivery/detail";
import { SignatureEvidenceCard } from "@/components/human-resources/ppe/delivery/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function TeamPpeDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();

  const query = usePpeDelivery(id || "", {
    include: {
      user: { include: { position: true, sector: true } },
      item: { include: { category: true, brands: true } },
      reviewedByUser: true,
      ppeSchedule: true,
      signature: {
        include: { signedByUser: true, signedDocument: true },
      },
    },
    enabled: !!id && id !== "",
  });

  const delivery = query.data?.data;
  const ledSectorId = currentUser?.ledSector?.id;
  const hasAccess =
    currentUser &&
    isTeamLeader(currentUser) &&
    delivery?.user?.sectorId === ledSectorId;

  if (!query.isLoading && delivery && !hasAccess) {
    return (
      <ThemedView style={{ flex: 1, padding: spacing.md }}>
        <Card style={{ padding: spacing.md }}>
          <View style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl }}>
            <IconShieldCheck size={48} color={colors.mutedForeground} />
            <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={{ color: colors.mutedForeground, textAlign: "center" }}>
              Você não tem permissão para visualizar esta entrega.
            </ThemedText>
          </View>
        </Card>
      </ThemedView>
    );
  }

  return (
    <DetailScreen<PpeDelivery>
      query={query as any}
      icon={IconShieldCheck}
      title={(d) => d.item?.name || "Entrega de EPI"}
      subtitle={(d) => d.user?.name || ""}
      // Team leaders can only view, not edit/delete.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute("/meu-pessoal/epis")}
    >
      {(d) => (
        <View style={styles.body}>
          <TeamPpeEmployeeCard delivery={d} />
          <TeamPpeItemCard delivery={d} />
          <TeamPpeDeliveryCard delivery={d} />
          <TeamPpeStatusCard delivery={d} />

          {d.status === PPE_DELIVERY_STATUS.COMPLETED && d.signature && (
            <SignatureEvidenceCard
              deliveryId={d.id}
              signature={d.signature}
            />
          )}

          <DetailCard title="Histórico de Alterações" icon="history">
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.PPE_DELIVERY}
              entityId={d.id}
              entityName={`${d.user?.name} - ${d.item?.name}`}
              entityCreatedAt={d.createdAt}
              maxHeight={400}
            />
          </DetailCard>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
});
