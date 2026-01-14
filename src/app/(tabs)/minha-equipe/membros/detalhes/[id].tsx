import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTeamStaffUsers } from "@/hooks/use-team-staff-users";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUser, IconUsers } from "@tabler/icons-react-native";
import { isTeamLeader } from "@/utils/user";

// Import modular components
import {
  BasicInfoCard,
  ProfessionalInfoCard,
  VacationsTable,
  WarningsTable,
  PpeDeliveriesTable,
} from "@/components/administration/employee/detail";
import { EmployeeDetailSkeleton } from "@/components/administration/employee/skeleton";

/**
 * Team Member Details Screen
 * Shows details of a team member for team leaders
 */
export default function TeamMemberDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";
  const userIsTeamLeader = currentUser ? isTeamLeader(currentUser) : false;

  // Build query params to filter by specific user ID
  // Using team-staff endpoint which is accessible to team leaders
  const queryParams = useMemo(() => ({
    where: { id },
    include: {
      position: true,
      sector: true,
      ppeSize: true,
    },
  }), [id]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useTeamStaffUsers(queryParams, {
    enabled: !!id && id !== "" && userIsTeamLeader,
  });

  // Extract the employee from the response (first item since we filter by ID)
  const employee = useMemo(() => {
    if (!response?.data || !Array.isArray(response.data)) return null;
    return response.data.find((user: any) => user.id === id) || response.data[0];
  }, [response, id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  // Show access denied if not a team leader
  if (!userIsTeamLeader) {
    return (
      <ThemedView style={styles.accessDeniedContainer}>
        <View style={styles.emptyContainer}>
          <Card style={styles.card}>
            <IconUsers size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.accessDeniedTitle, { color: colors.foreground }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.accessDeniedSubtitle, { color: colors.mutedForeground }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <EmployeeDetailSkeleton />
        </View>
      </ScrollView>
    );
  }

  if (error || !employee || !id || id === "") {
    return (
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
                <IconUser size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                Membro não encontrado
              </ThemedText>
              <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
                O membro da equipe solicitado não foi encontrado ou não pertence ao seu setor gerenciado.
              </ThemedText>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Basic Information */}
        <BasicInfoCard employee={employee} />

        {/* Professional Information */}
        <ProfessionalInfoCard employee={employee} />

        {/* Relation Tables */}
        <VacationsTable employee={employee} maxHeight={400} />
        <WarningsTable employee={employee} maxHeight={400} />
        <PpeDeliveriesTable employee={employee} maxHeight={400} />

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  accessDeniedContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
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
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
