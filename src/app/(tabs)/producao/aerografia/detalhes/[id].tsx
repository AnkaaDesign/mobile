import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useAirbrushingDetail, useAirbrushingMutations } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBrush, IconTag } from "@tabler/icons-react-native";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { EDITABLE_AIRBRUSHING_STATUSES } from "@/constants/editable-statuses";
import { DetailScreen } from "@/components/screens/detail-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { formatDate } from "@/utils";

import {
  AirbrushingTaskCard,
  AirbrushingDatesCard,
  AirbrushingFilesCard,
} from "@/components/production/airbrushing/detail";

export default function AirbrushingDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { deleteMutation } = useAirbrushingMutations();

  const id = params?.id || "";

  const query = useAirbrushingDetail(id, {
    include: {
      task: {
        include: {
          customer: { include: { logo: true } },
          sector: true,
        },
      },
      receipts: true,
      invoices: true,
      artworks: true,
    },
    enabled: !!id && id !== "",
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconBrush}
      title={(a) => a.task?.name ?? "Airbrushing"}
      privilege={{ any: [SECTOR_PRIVILEGES.PRODUCTION, SECTOR_PRIVILEGES.ADMIN] }}
      editGuard={{ editable: EDITABLE_AIRBRUSHING_STATUSES }}
      editRoute={(a) => mobileRoute(routes.production.airbrushings.edit(a.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir este airbrushing? Esta ação é irreversível.",
        successRoute: mobileRoute(routes.production.airbrushings.root),
      }}
      notFoundFallback={mobileRoute(routes.production.airbrushings.root)}
    >
      {(airbrushing) => (
        <View style={styles.body}>
          <AirbrushingTaskCard airbrushing={airbrushing} />
          <AirbrushingDatesCard airbrushing={airbrushing} />
          <AirbrushingFilesCard airbrushing={airbrushing} />

          <Card style={styles.card}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.AIRBRUSHING}
              entityId={airbrushing.id}
              entityName={airbrushing.task?.name}
              entityCreatedAt={airbrushing.createdAt}
              maxHeight={500}
              limit={50}
            />
          </Card>

          <Card style={styles.card}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.sectionHeaderLeft}>
                <IconTag size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.sectionTitle}>Informações do Sistema</ThemedText>
              </View>
            </View>
            <View style={styles.metadataContainer}>
              <View style={[styles.metadataRow, { backgroundColor: colors.muted + "50" }]}>
                <ThemedText style={[styles.metadataLabel, { color: colors.mutedForeground }]}>
                  Criado em
                </ThemedText>
                <ThemedText style={[styles.metadataValue, { color: colors.foreground }]}>
                  {formatDate(airbrushing.createdAt)}
                </ThemedText>
              </View>
              <View style={[styles.metadataRow, { backgroundColor: colors.muted + "50" }]}>
                <ThemedText style={[styles.metadataLabel, { color: colors.mutedForeground }]}>
                  Atualizado em
                </ThemedText>
                <ThemedText style={[styles.metadataValue, { color: colors.foreground }]}>
                  {formatDate(airbrushing.updatedAt)}
                </ThemedText>
              </View>
            </View>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  metadataContainer: {
    gap: spacing.md,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  metadataLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  metadataValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
