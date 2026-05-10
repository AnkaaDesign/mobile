import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { usePosition, usePositionMutations } from "@/hooks/usePosition";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { spacing } from "@/constants/design-system";
import { IconBriefcase } from "@tabler/icons-react-native";
import {
  SpecificationsCard,
  RemunerationHistoryCard,
  RelatedUsersCard,
} from "@/components/human-resources/position/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function PositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const positionId = id || "";
  const { deleteMutation } = usePositionMutations();

  const query = usePosition(positionId, {
    include: {
      users: { include: { sector: true }, orderBy: { name: "asc" } },
      remunerations: { orderBy: { createdAt: "desc" } },
      changelogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { users: true, remunerations: true } },
    },
    enabled: !!positionId,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconBriefcase}
      title={(p: any) => p.name ?? "Cargo"}
      privilege={{
        any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(p: any) =>
        mobileRoute(routes.humanResources.positions.edit(p.id))
      }
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir este cargo? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.humanResources.positions.root),
      }}
      notFoundFallback={mobileRoute(routes.humanResources.positions.root)}
    >
      {(position: any) => (
        <View style={styles.body}>
          <SpecificationsCard position={position} />
          <RemunerationHistoryCard position={position} />
          <RelatedUsersCard position={position} />
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.POSITION}
            entityId={position.id}
            entityName={position.name}
            entityCreatedAt={position.createdAt}
            maxHeight={500}
          />
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
});
