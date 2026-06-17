import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { DetailPageLayout } from "@/components/ui/detail-page-layout";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { StatusCard, UserCard, DocumentsCard } from "@/components/personnel-department/admission/detail";
import { useAdmission } from "@/hooks/useAdmission";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { usePrivilegeGate } from "@/hooks/use-privilege-gate";
import { SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";

export default function AdmissionDetailScreen() {
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}>
      <AdmissionDetailScreenInner />
    </PrivilegeGate>
  );
}

function AdmissionDetailScreenInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: admissionResponse, isLoading, error, refetch } = useAdmission(id!, {
    include: {
      user: { include: { position: true, sector: true } },
      documents: { include: { file: true, signedFile: true, signedBy: true } },
    },
  });

  const { allowed: canManage } = usePrivilegeGate({ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] });

  useScreenReady(!isLoading);
  const admission = admissionResponse?.data;

  if (isLoading) {
    return null;
  }

  if (error || !admission) {
    return <ErrorScreen message={error?.message || "Erro ao carregar admissão"} onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Detalhes da Admissão", headerShown: true }} />
      <DetailPageLayout refreshing={isLoading} onRefresh={refetch}>
        <StatusCard admission={admission} canManage={canManage} />
        <UserCard admission={admission} />
        <DocumentsCard admission={admission} />
        <ChangelogTimeline
          entityType={CHANGE_LOG_ENTITY_TYPE.ADMISSION}
          entityId={admission.id}
          entityName={admission.user?.name}
          entityCreatedAt={admission.createdAt}
        />
      </DetailPageLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
