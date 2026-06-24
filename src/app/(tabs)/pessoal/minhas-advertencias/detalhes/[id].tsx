import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useWarning } from "@/hooks";
import { CHANGE_LOG_ENTITY_TYPE, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { spacing } from "@/constants/design-system";
import { IconAlertTriangle, IconHistory } from "@tabler/icons-react-native";
import type { Warning } from "@/types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import {
  WarningCard,
  WarningDetailsCard,
  WarningEmployeeCard,
  WarningDescriptionCard,
  WarningAttachmentsCard,
  SignWarningButton,
  WarningSignatureEvidenceCard,
} from "@/components/personal/warning/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function PersonalWarningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useWarning(id || "", {
    include: {
      collaborator: { include: { position: true } },
      supervisor: { include: { position: true } },
      witness: true,
      attachments: true,
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<Warning>
      query={query as any}
      icon={IconAlertTriangle}
      title={() => "Minha Advertência"}
      // Read-only mirror — usuários nunca editam suas próprias advertências.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute(routes.personal.myWarnings.root)}
    >
      {(warning) => (
        <View style={styles.body}>
          <WarningCard warning={warning} />
          <WarningEmployeeCard warning={warning} />
          <WarningDetailsCard warning={warning} />
          <WarningDescriptionCard warning={warning} />
          <WarningAttachmentsCard warning={warning} />

          {/* In-app electronic signature — collaborator or witness */}
          <SignWarningButton warning={warning} />
          <WarningSignatureEvidenceCard warning={warning} />

          <Card style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} />
                <ThemedText style={styles.title}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </View>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.WARNING}
              entityId={warning.id}
              entityName={`Advertência - ${warning.collaborator?.name || "Sem nome"}`}
              entityCreatedAt={warning.createdAt}
              maxHeight={400}
            />
          </Card>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
  },
});
