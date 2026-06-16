import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  useObservationDetail,
  useObservationMutations,
} from "@/hooks";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { spacing } from "@/constants/design-system";
import { IconNote } from "@tabler/icons-react-native";
import { DetailScreen } from "@/components/screens/detail-screen";

import {
  ObservationInfoCard,
  ObservationFilesCard,
} from "@/components/production/observation/detail";

export default function ObservationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteMutation } = useObservationMutations();

  const query = useObservationDetail(id as string, {
    include: {
      task: {
        select: {
          id: true,
          name: true,
          customer: { select: { id: true, fantasyName: true } },
          sector: { select: { id: true, name: true } },
        },
      },
      files: true,
      bonifications: {
        select: {
          id: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconNote}
      title={(o) =>
        o.task?.name ? `Observação - ${o.task.name}` : "Observação"
      }
      privilege={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.PRODUCTION,
          SECTOR_PRIVILEGES.WAREHOUSE,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      editRoute={(o) => mobileRoute(routes.production.observations.edit(o.id))}
      editPrivilege={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.WAREHOUSE,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      deletePrivilege={{
        any: [SECTOR_PRIVILEGES.FINANCIAL, SECTOR_PRIVILEGES.ADMIN],
      }}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta observação? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.production.observations.root),
      }}
      notFoundFallback={mobileRoute(routes.production.observations.root)}
    >
      {(observation) => (
        <View style={styles.body}>
          <ObservationInfoCard observation={observation as any} />
          {observation.files && observation.files.length > 0 && (
            <ObservationFilesCard files={observation.files as any} />
          )}
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
