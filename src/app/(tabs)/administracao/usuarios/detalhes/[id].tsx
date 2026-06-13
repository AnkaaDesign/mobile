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
  UserCard,
  UserTasksTable,
  UserActivitiesTable,
  UserCreatedTasksTable,
  UserLoginInfoCard,
  UserAddressCard,
  UserPpeSizesCard,
} from "@/components/administration/user/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useUser(id as string, {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      birth: true,
      currentContractType: true,
      currentContractStatus: true,
      currentContract: true,
      isActive: true,
      verified: true,
      avatarId: true,
      payrollNumber: true,
      performanceLevel: true,
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      lastLoginAt: true,
      requirePasswordChange: true,
      createdAt: true,
      updatedAt: true,
      avatar: { select: { id: true, filename: true, path: true, thumbnailUrl: true } },
      position: { select: { id: true, name: true, hierarchy: true } },
      sector: { select: { id: true, name: true, privileges: true } },
      ledSector: { select: { id: true, name: true } },
      ppeSize: true,
      _count: { select: { tasks: true, createdTasks: true, activities: true, changeLogs: true } },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconUser}
      title={(u) => u.name ?? "Usuário"}
      privilege={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
      editRoute={(u) => mobileRoute(routes.administration.collaborators.edit(u.id))}
      notFoundFallback={mobileRoute(routes.administration.users.list)}
    >
      {(user) => (
        <View style={styles.body}>
          <UserCard user={user} />
          <UserAddressCard user={user} />
          <UserLoginInfoCard user={user} />
          <UserPpeSizesCard user={user} />
          <UserTasksTable user={user} maxHeight={400} />
          <UserCreatedTasksTable user={user} maxHeight={400} />
          <UserActivitiesTable user={user} maxHeight={400} />
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
              </View>
            </View>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.USER}
              entityId={user.id}
              entityName={user.name}
              entityCreatedAt={user.createdAt}
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
