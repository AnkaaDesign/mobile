import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useUser } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconUser, IconHistory } from "@tabler/icons-react-native";

import {
  BasicInfoCard,
  AddressCard,
  PpeSizesCard,
  LoginInfoCard,
  ProfessionalInfoCard,
  ContractPhasesCard,
  WarningsTable,
  PpeDeliveriesTable,
} from "@/components/administration/employee/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function EmployeeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useUser(id as string, {
    // GetById honors `include` (not `select`) for relations — request relations
    // here or they fall back to the default include and never load.
    include: {
      currentContract: { include: { phaseHistory: { orderBy: { startDate: "asc" } } } },
      contracts: { orderBy: { sequence: "asc" }, include: { phaseHistory: { orderBy: { startDate: "asc" } } } },
      avatar: true,
      position: true,
      sector: true,
      ledSector: true,
      ppeSize: true,
      _count: { select: { tasks: true, activities: true, borrows: true, changeLogs: true } },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconUser}
      title={(e) => e.name ?? "Colaborador"}
      privilege={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
      editRoute={(e) => mobileRoute(routes.administration.collaborators.edit(e.id))}
      notFoundFallback={mobileRoute(routes.administration.collaborators.list)}
    >
      {(employee) => (
        <View style={styles.body}>
          <BasicInfoCard employee={employee} />
          <AddressCard employee={employee} />
          <ProfessionalInfoCard employee={employee} />
          <ContractPhasesCard employee={employee} />
          <LoginInfoCard employee={employee} />
          <PpeSizesCard employee={employee} />
          <WarningsTable employee={employee} maxHeight={400} />
          <PpeDeliveriesTable employee={employee} maxHeight={400} />
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
              </View>
            </View>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.USER}
              entityId={employee.id}
              entityName={employee.name}
              entityCreatedAt={employee.createdAt}
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
