import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useSector } from "@/hooks";
import { useDeleteSector } from "@/hooks/useSector";
import { routes, CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconHistory, IconBuilding } from "@tabler/icons-react-native";

import { SpecificationsCard, UsersTable, TasksTable } from "@/components/administration/sector/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function SectorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const deleteMutation = useDeleteSector();

  const query = useSector(id as string, {
    include: {
      users: {
        include: { position: true, sector: true, ledSector: true },
        orderBy: { name: "asc" },
      },
      leader: true,
      changelogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { users: true, tasks: true } },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconBuilding}
      privilege={SECTOR_PRIVILEGES.ADMIN}
      editRoute={(s) => mobileRoute(routes.administration.sectors.edit(s.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir este setor? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.administration.sectors.list),
      }}
      notFoundFallback={mobileRoute(routes.administration.sectors.list)}
    >
      {(sector) => (
        <View style={styles.body}>
          <SpecificationsCard sector={sector} />
          <UsersTable sector={sector} maxHeight={500} />
          <TasksTable sector={sector} maxHeight={500} />
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
              </View>
            </View>
            <View>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.SECTOR}
                entityId={sector.id}
                entityName={sector.name}
                entityCreatedAt={sector.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
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
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
});
