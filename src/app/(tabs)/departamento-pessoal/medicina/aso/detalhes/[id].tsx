import { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconClipboardCheck } from "@tabler/icons-react-native";

import { useMedicalExam, useMedicalExamMutations } from "@/hooks/useMedicalExam";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, MEDICAL_EXAM_STATUS, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import type { PageAction } from "@/components/ui/page-header";
import type { MedicalExam } from "@/types";
import {
  ExamInfoCard,
  CollaboratorCard,
  DocumentCard,
} from "@/components/personnel-department/medical-exam/detail";
import { MedicalExamCompleteDialog } from "@/components/personnel-department/medical-exam/complete";

const ROOT = mobileRoute(routes.personnelDepartment.occupationalHealth.medicalExams.root);

export default function MedicalExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const examId = id || "";
  const { deleteMutation } = useMedicalExamMutations();
  const [completeOpen, setCompleteOpen] = useState(false);

  // Concluir um exame (registrar o resultado do ASO) é uma ação de edição.
  const { allowed: canEdit } = usePrivilegeGate({
    any: [
      SECTOR_PRIVILEGES.ACCOUNTING,
      SECTOR_PRIVILEGES.HUMAN_RESOURCES,
      SECTOR_PRIVILEGES.ADMIN,
    ],
  });

  const query = useMedicalExam(examId, {
    include: {
      user: { include: { position: true, sector: true } },
      file: true,
      changelogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    enabled: !!examId,
  });

  const exam = (query.data as any)?.data as MedicalExam | undefined;

  // "Concluir Exame" só é oferecido enquanto o exame está agendado (SCHEDULED)
  // e o usuário tem privilégio de edição.
  const canComplete = canEdit && !!exam && exam.status === MEDICAL_EXAM_STATUS.SCHEDULED;

  const overflowActions = useMemo<PageAction[]>(() => {
    if (!canComplete) return [];
    return [
      {
        key: "complete",
        label: "Concluir Exame",
        icon: "clipboard-check",
        onPress: () => setCompleteOpen(true),
      },
    ];
  }, [canComplete]);

  return (
    <>
      <DetailScreen<MedicalExam>
        query={query as any}
        icon={IconClipboardCheck}
        title={(e) => e.user?.name ?? "Exame Ocupacional"}
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
        editRoute={(e) => mobileRoute(routes.personnelDepartment.occupationalHealth.medicalExams.edit(e.id))}
        deleteAction={{
          mutation: deleteMutation,
          confirmText:
            "Tem certeza que deseja excluir este exame ocupacional? Esta ação não pode ser desfeita.",
          successRoute: ROOT,
        }}
        notFoundFallback={ROOT}
      >
        {(e) => (
          <View style={styles.body}>
            <ExamInfoCard exam={e} />
            <CollaboratorCard exam={e} />
            <DocumentCard exam={e} />
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.MEDICAL_EXAM}
              entityId={e.id}
              entityName={`Exame Ocupacional - ${e.user?.name || "Sem nome"}`}
              entityCreatedAt={e.createdAt}
              maxHeight={400}
            />
          </View>
        )}
      </DetailScreen>

      <MedicalExamCompleteDialog
        exam={exam ?? null}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onCompleted={() => query.refetch()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
});
