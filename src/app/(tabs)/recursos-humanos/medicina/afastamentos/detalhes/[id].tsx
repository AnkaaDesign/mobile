import { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconCalendarOff } from "@tabler/icons-react-native";

import { useLeave, useLeaveMutations } from "@/hooks/useLeave";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, LEAVE_STATUS, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import type { PageAction } from "@/components/ui/page-header";
import type { Leave } from "@/types";
import {
  LeaveInfoCard,
  CollaboratorCard,
  LeavePayrollSplitCard,
} from "@/components/human-resources/leave/detail";
import { FinishLeaveDialog } from "@/components/human-resources/leave/finish-leave-dialog";

const ROOT = mobileRoute(routes.humanResources.occupationalHealth.leaves.root);

export default function LeaveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leaveId = id || "";
  const { deleteMutation } = useLeaveMutations();
  const [finishOpen, setFinishOpen] = useState(false);

  // Finishing a leave (registering the actual return) is an edit-level action.
  const { allowed: canEdit } = usePrivilegeGate({
    any: [
      SECTOR_PRIVILEGES.ACCOUNTING,
      SECTOR_PRIVILEGES.HUMAN_RESOURCES,
      SECTOR_PRIVILEGES.ADMIN,
    ],
  });

  const query = useLeave(leaveId, {
    include: {
      user: { include: { position: true, sector: true } },
      files: true,
      changelogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    enabled: !!leaveId,
  });

  const leave = (query.data as any)?.data as Leave | undefined;

  // "Finalizar Afastamento" is offered while the leave is still open
  // (SCHEDULED or ACTIVE) and the user has edit privilege.
  const canFinish =
    canEdit &&
    !!leave &&
    (leave.status === LEAVE_STATUS.ACTIVE || leave.status === LEAVE_STATUS.SCHEDULED);

  const overflowActions = useMemo<PageAction[]>(() => {
    if (!canFinish) return [];
    return [
      {
        key: "finish",
        label: "Finalizar Afastamento",
        icon: "calendar-check",
        onPress: () => setFinishOpen(true),
      },
    ];
  }, [canFinish]);

  return (
    <>
      <DetailScreen<Leave>
        query={query as any}
        icon={IconCalendarOff}
        title={(l) => l.user?.name ?? "Afastamento"}
        privilege={{
          any: [
            SECTOR_PRIVILEGES.ACCOUNTING,
            SECTOR_PRIVILEGES.HUMAN_RESOURCES,
            SECTOR_PRIVILEGES.ADMIN,
          ],
        }}
        deletePrivilege={{
          any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
        }}
        actions={overflowActions}
        editRoute={(l) => mobileRoute(routes.humanResources.occupationalHealth.leaves.edit(l.id))}
        deleteAction={{
          mutation: deleteMutation,
          confirmText:
            "Tem certeza que deseja excluir este afastamento? Esta ação não pode ser desfeita.",
          successRoute: ROOT,
        }}
        notFoundFallback={ROOT}
      >
        {(l) => (
          <View style={styles.body}>
            <LeaveInfoCard leave={l} />
            <CollaboratorCard leave={l} />
            <LeavePayrollSplitCard leave={l} />
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.LEAVE}
              entityId={l.id}
              entityName={`Afastamento - ${l.user?.name || "Sem nome"}`}
              entityCreatedAt={l.createdAt}
              maxHeight={400}
            />
          </View>
        )}
      </DetailScreen>

      <FinishLeaveDialog
        leave={leave ?? null}
        open={finishOpen}
        onOpenChange={setFinishOpen}
        onFinished={() => query.refetch()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
});
