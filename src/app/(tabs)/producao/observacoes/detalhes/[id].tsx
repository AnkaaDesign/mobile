import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  useObservationDetail,
  useObservationMutations,
} from "@/hooks";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { OBSERVATION_WRITE_PRIVILEGES } from "@/utils/permissions/entity-permissions";
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
      commissions: {
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
      // Viewing is broad (incl. PRODUCTION read-only); editing/deleting are
      // gated separately below so only the write-privileged sectors can act.
      privilege={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.PRODUCTION,
          SECTOR_PRIVILEGES.WAREHOUSE,
          SECTOR_PRIVILEGES.LOGISTIC,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      editPrivilege={{ any: OBSERVATION_WRITE_PRIVILEGES }}
      editRoute={(o) => mobileRoute(routes.production.observations.edit(o.id))}
      deletePrivilege={{ any: [SECTOR_PRIVILEGES.ADMIN] }}
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
