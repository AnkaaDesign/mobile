import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconUserMinus } from "@tabler/icons-react-native";

import { useTermination, useTerminationMutations } from "@/hooks/useTermination";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, TERMINATION_STATUS } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import {
  TerminationStatusStepperCard,
  TerminationSummaryCard,
  TerminationVerbasCard,
  TerminationDocumentsCard,
} from "@/components/human-resources/termination/detail";
import type { Termination } from "@/types";

const ROOT = mobileRoute("/recursos-humanos/rescisoes/listar");

// Editable while the process is still open (mirrors the server status machine:
// COMPLETED and CANCELLED are terminal and block every mutation).
const EDITABLE_TERMINATION_STATUSES = [
  TERMINATION_STATUS.INITIATED,
  TERMINATION_STATUS.NOTICE_PERIOD,
  TERMINATION_STATUS.DOCUMENTS,
  TERMINATION_STATUS.MEDICAL_EXAM,
  TERMINATION_STATUS.CALCULATION,
  TERMINATION_STATUS.PAYMENT,
  TERMINATION_STATUS.HOMOLOGATION,
];

export default function TerminationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const terminationId = id || "";
  const { deleteMutation } = useTerminationMutations();

  // Mutating verbas/documents/status is gated on HR/ADMIN (view is broader,
  // but the cards only render management actions when canManage is true).
  const { allowed: canManagePrivilege } = usePrivilegeGate({
    any: [
      SECTOR_PRIVILEGES.ACCOUNTING,
      SECTOR_PRIVILEGES.HUMAN_RESOURCES,
      SECTOR_PRIVILEGES.ADMIN,
      SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    ],
  });

  const query = useTermination(terminationId, {
    include: {
      user: { include: { position: true, sector: true, currentContract: true } },
      initiatedBy: true,
      items: { orderBy: { createdAt: "asc" } },
      documents: { include: { file: true }, orderBy: { type: "asc" } },
    },
    enabled: !!terminationId,
  });

  return (
    <DetailScreen<Termination>
      query={query as any}
      icon={IconUserMinus}
      title={(t) => t.user?.name ?? "Rescisão"}
      privilege={{
        any: [
          SECTOR_PRIVILEGES.ACCOUNTING,
          SECTOR_PRIVILEGES.HUMAN_RESOURCES,
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      deletePrivilege={SECTOR_PRIVILEGES.ADMIN}
      editGuard={{ field: "status", editable: EDITABLE_TERMINATION_STATUSES }}
      editRoute={(t) => mobileRoute(`/recursos-humanos/rescisoes/editar/${t.id}`)}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta rescisão? Esta ação não pode ser desfeita.",
        successRoute: ROOT,
      }}
      notFoundFallback={ROOT}
    >
      {(termination, ctx) => {
        const canManage = canManagePrivilege && !ctx.isTerminal;
        return (
          <View style={styles.body}>
            <TerminationStatusStepperCard termination={termination} canManage={canManage} />
            <TerminationSummaryCard termination={termination} />
            <TerminationVerbasCard termination={termination} canManage={canManage} />
            <TerminationDocumentsCard termination={termination} canManage={canManage} />
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.TERMINATION}
              entityId={termination.id}
              entityName={`Rescisão - ${termination.user?.name || "Sem nome"}`}
              entityCreatedAt={termination.createdAt}
              maxHeight={400}
            />
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
});
