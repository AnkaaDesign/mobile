import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useUser } from "@/hooks";
import { useAuth } from '../../../../../contexts/auth-context';
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUser } from "@tabler/icons-react-native";
import { showToast } from "@/components/ui/toast";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Card as UICard, CardHeader, CardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { IconHistory } from "@tabler/icons-react-native";

// Import modular components
import {
  BasicInfoCard,
  AddressCard,
  PpeSizesCard,
  LoginInfoCard,
  ProfessionalInfoCard,
  ActivitiesTimelineCard,
} from "@/components/administration/employee/detail";
import { EmployeeDetailSkeleton } from "@/components/administration/employee/skeleton";

export default function EmployeeDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user: currentUser, accessToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Debug logging
  console.log("[EMPLOYEE DETAILS] Screen mounted with ID:", id);
  console.log("[EMPLOYEE DETAILS] Full params:", params);
  console.log("[EMPLOYEE DETAILS] Current logged-in user:", currentUser ? `${currentUser.name} (${currentUser.id})` : "null");
  console.log("[EMPLOYEE DETAILS] User sector privileges:", currentUser?.sector?.privileges || currentUser?.position?.sector?.privileges || "none");
  console.log("[EMPLOYEE DETAILS] Has access token:", !!accessToken);
  console.log("[EMPLOYEE DETAILS] Is viewing own profile:", id === currentUser?.id);
  console.log("[EMPLOYEE DETAILS] Access token (first 50 chars):", accessToken ? accessToken.substring(0, 50) + "..." : "null");

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useUser(id, {
    include: {
      position: true,
      sector: true,
      managedSector: true,
      ppeSize: true,
      activities: {
        include: {
          item: true,
        },
      },
      changeLogs: true,
      vacations: true,
    },
    enabled: !!id && id !== "",
  });

  const employee = response?.data;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

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
                Colaborador não encontrado
              </ThemedText>
              <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
                O colaborador solicitado não foi encontrado ou pode ter sido removido.
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
          {/* Basic Information and Address */}
          <BasicInfoCard employee={employee} />
          <AddressCard employee={employee} />

          {/* Professional Information and Login Info */}
          <ProfessionalInfoCard employee={employee} />
          <LoginInfoCard employee={employee} />

          {/* PPE Sizes */}
          <PpeSizesCard employee={employee} />

          {/* Activities Timeline */}
          {employee.activities && employee.activities.length > 0 && (
            <ActivitiesTimelineCard employee={employee} maxHeight={500} />
          )}

          {/* Changelog Timeline */}
          <UICard>
            <CardHeader>
              <CardTitle style={styles.sectionTitle}>
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
                    <IconHistory size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                    Histórico de Alterações
                  </ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <UICardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.USER}
                entityId={employee.id}
                entityName={employee.name}
                entityCreatedAt={employee.createdAt}
                maxHeight={400}
              />
            </UICardContent>
          </UICard>

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
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
