import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useWarning, useWarningMutations } from "@/hooks/useWarning";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { spacing } from "@/constants/design-system";
import { IconHistory } from "@tabler/icons-react-native";
import {
  WarningCard,
  WarningDetailsCard,
  WarningEmployeeCard,
  WarningDescriptionCard,
  WarningAttachmentsCard,
  SignWarningButton,
  ViewWarningDocumentButton,
  WarningSignatureEvidenceCard,
} from "@/components/personal/warning/detail";
import { RefuseSignatureAction } from "@/components/personnel-department/warning/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function WarningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const warningId = id || "";
  const { deleteMutation } = useWarningMutations();

  const query = useWarning(warningId, {
    include: {
      collaborator: { include: { position: true } },
      supervisor: { include: { position: true } },
      witness: true,
      attachments: true,
      signatures: {
        include: { signedByUser: true, registeredBy: true, signedDocument: true },
      },
      changelogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    enabled: !!warningId,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconHistory}
      title={(w: any) => w.collaborator?.name ?? "Advertência"}
      privilege={{
        any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(w: any) =>
        mobileRoute(routes.personnelDepartment.warnings.edit(w.id))
      }
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta advertência? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.personnelDepartment.warnings.root),
      }}
      notFoundFallback={mobileRoute(routes.personnelDepartment.warnings.root)}
    >
      {(warning: any) => (
        <View style={styles.body}>
          <WarningCard warning={warning} />
          <WarningEmployeeCard warning={warning} />
          <WarningDetailsCard warning={warning} />
          <WarningDescriptionCard warning={warning} />
          <WarningAttachmentsCard warning={warning} />

          {/* Server-rendered PDF term (sealed once signed/refused, fresh render
              otherwise) — mirrors the web "Ver Documento / Ver Termo Assinado". */}
          <ViewWarningDocumentButton warning={warning} />

          {/* In-app electronic signature — shows when the HR viewer is also
              the collaborator/witness; refusal action is HR/supervisor-only
              (the screen is already gated to HR/ADMIN). */}
          <SignWarningButton warning={warning} />
          <RefuseSignatureAction warning={warning} />
          <WarningSignatureEvidenceCard warning={warning} />

          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.WARNING}
            entityId={warning.id}
            entityName={`Advertência - ${warning.collaborator?.name || "Sem nome"}`}
            entityCreatedAt={warning.createdAt}
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
