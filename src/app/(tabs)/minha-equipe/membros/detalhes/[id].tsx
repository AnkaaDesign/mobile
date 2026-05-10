import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useTeamStaffUsers } from "@/hooks/use-team-staff-users";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { IconUser, IconUsers } from "@tabler/icons-react-native";
import { isTeamLeader } from "@/utils/user";
import { mobileRoute } from "@/constants/routes.types";

import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import {
  BasicInfoCard,
  ProfessionalInfoCard,
  WarningsTable,
  PpeDeliveriesTable,
} from "@/components/administration/employee/detail";

export default function TeamMemberDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();

  const userIsTeamLeader = currentUser ? isTeamLeader(currentUser) : false;

  const queryParams = useMemo(
    () => ({
      where: { id },
      include: {
        position: true,
        sector: true,
        ppeSize: true,
      },
    }),
    [id],
  );

  const query = useTeamStaffUsers(queryParams, {
    enabled: !!id && id !== "" && userIsTeamLeader,
  });

  // Custom unwrap: useTeamStaffUsers returns { data: User[] }, find by id.
  // Pass-through synthesized query for the DetailScreen.
  const synthesizedQuery = useMemo(() => {
    if (!query.data) return query;
    const list = (query.data as any)?.data;
    if (!Array.isArray(list)) return query;
    const employee = list.find((u: any) => u.id === id) || list[0];
    return { ...query, data: employee ? { data: employee } : undefined };
  }, [query, id]);

  if (!userIsTeamLeader) {
    return (
      <ThemedView style={styles.accessDenied}>
        <Card style={styles.accessDeniedCard}>
          <IconUsers size={48} color={colors.mutedForeground} />
          <ThemedText
            style={[styles.accessDeniedTitle, { color: colors.foreground }]}
          >
            Acesso Restrito
          </ThemedText>
          <ThemedText
            style={[styles.accessDeniedSubtitle, { color: colors.mutedForeground }]}
          >
            Esta área é exclusiva para líderes de equipe.
          </ThemedText>
        </Card>
      </ThemedView>
    );
  }

  return (
    <DetailScreen<any>
      query={synthesizedQuery as any}
      icon={IconUser}
      title={(e) => e.name || "Membro"}
      subtitle={(e) => e.position?.name}
      // Read-only mirror — team leaders only view their members.
      editGuard={{ editable: [] }}
      notFoundFallback={mobileRoute("/meu-pessoal/usuarios")}
    >
      {(employee) => (
        <View style={styles.body}>
          <BasicInfoCard employee={employee} />
          <ProfessionalInfoCard employee={employee} />
          <WarningsTable employee={employee} maxHeight={400} />
          <PpeDeliveriesTable employee={employee} maxHeight={400} />
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
  accessDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  accessDeniedCard: {
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
    borderRadius: borderRadius.md,
  },
  accessDeniedTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  accessDeniedSubtitle: {
    fontSize: fontSize.base,
    textAlign: "center",
  },
});
