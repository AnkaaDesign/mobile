import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useUser } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconRefresh, IconEdit } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Card as UICard, CardHeader, CardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { IconHistory } from "@tabler/icons-react-native";

// Import modular components
import {
  EmployeeCard,
  PersonalInfoCard,
  EmploymentInfoCard,
  TasksCard,
  CommissionsCard,
  PerformanceCard,
} from "@/components/administration/employee/detail";
import { EmployeeDetailSkeleton } from "@/components/administration/employee/skeleton";

export default function EmployeeDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

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
      createdTasks: true,
      bonuses: true,
      vacations: true,
      warningsCollaborator: true,
      _count: {
        select: {
          createdTasks: true,
          bonuses: true,
          vacations: true,
          warningsCollaborator: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const employee = response?.data;

  const handleEdit = () => {
    if (employee) {
      router.push(routeToMobilePath(routes.administration.employees.edit(employee.id)) as any);
    }
  };

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
        {/* Employee Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconUser size={24} color={colors.primary} />
              <ThemedText style={[styles.employeeName, { color: colors.foreground }]}>
                {employee.name}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.actionButton, { backgroundColor: colors.muted }]}
                activeOpacity={0.7}
                disabled={refreshing}
              >
                <IconRefresh size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.7}
              >
                <IconEdit size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
          {/* Main Employee Card */}
          <EmployeeCard employee={employee} />

          {/* Personal Information */}
          <PersonalInfoCard employee={employee} />

          {/* Employment Information */}
          <EmploymentInfoCard employee={employee} />

          {/* Performance Card - only show if has tasks */}
          {employee.tasks && employee.tasks.length > 0 && (
            <PerformanceCard employee={employee} />
          )}

          {/* Tasks Card */}
          <TasksCard employee={employee} maxItems={5} />

          {/* Commissions Card */}
          {employee.bonuses && employee.bonuses.length > 0 && (
            <CommissionsCard employee={employee} maxItems={5} />
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  employeeName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
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
