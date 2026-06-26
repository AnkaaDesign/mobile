import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useWorkAccidentReport, useWorkAccidentReportMutations } from "@/hooks/useWorkAccident";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { spacing } from "@/constants/design-system";
import { IconClipboardList } from "@tabler/icons-react-native";
import {
  WorkAccidentInfoCard,
  WorkAccidentCollaboratorCard,
  WorkAccidentLinkedLeaveCard,
  WorkAccidentCatDocumentCard,
} from "@/components/personnel-department/work-accident/detail";

export default function WorkAccidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = id || "";
  const { deleteMutation } = useWorkAccidentReportMutations();

  const query = useWorkAccidentReport(reportId, {
    include: {
      user: { include: { position: true, sector: true } },
      leave: true,
      file: true,
    },
    enabled: !!reportId,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconClipboardList}
      title={(r: any) => r.user?.name ?? "CAT"}
      privilege={{
        any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(r: any) =>
        mobileRoute(routes.personnelDepartment.occupationalHealth.workAccidents.edit(r.id))
      }
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta CAT? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.personnelDepartment.occupationalHealth.workAccidents.root),
      }}
      notFoundFallback={mobileRoute(routes.personnelDepartment.occupationalHealth.workAccidents.root)}
    >
      {(report: any) => (
        <View style={styles.body}>
          <WorkAccidentInfoCard report={report} />
          <WorkAccidentCollaboratorCard report={report} />
          <WorkAccidentLinkedLeaveCard report={report} />
          <WorkAccidentCatDocumentCard report={report} />
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
