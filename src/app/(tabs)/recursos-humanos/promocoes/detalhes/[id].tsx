import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconUserUp } from "@tabler/icons-react-native";

import { useUserPositionHistory } from "@/hooks/useUserPositionHistory";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES } from "@/constants";
import { POSITION_CHANGE_REASON_LABELS } from "@/constants/enum-labels";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import {
  UserPositionHistoryDetailCard,
  UserPositionHistoryCard,
} from "@/components/human-resources/user-position-history";
import type { UserPositionHistory } from "@/types";

export default function PromotionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const historyId = id || "";

  const query = useUserPositionHistory(historyId, {
    include: {
      user: true,
      position: true,
      previousPosition: true,
      changedBy: true,
    },
    enabled: !!historyId,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconUserUp}
      title={(h: UserPositionHistory) =>
        h.user?.name
          ? `${h.user.name} — ${POSITION_CHANGE_REASON_LABELS[h.reason] || h.reason}`
          : POSITION_CHANGE_REASON_LABELS[h.reason] || "Promoção"
      }
      privilege={{
        any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      notFoundFallback={"/recursos-humanos/promocoes/listar" as any}
    >
      {(history: UserPositionHistory) => (
        <View style={styles.body}>
          <UserPositionHistoryDetailCard history={history} />
          {history.userId ? <UserPositionHistoryCard userId={history.userId} /> : null}
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.USER_POSITION_HISTORY}
            entityId={history.id}
            entityName={`Cargo - ${history.user?.name || "Sem nome"}`}
            entityCreatedAt={history.createdAt}
            maxHeight={400}
          />
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
