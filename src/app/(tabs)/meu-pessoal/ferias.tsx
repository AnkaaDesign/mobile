import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { IconCalendar, IconFilter, IconLayoutGrid, IconList, IconUsers } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useVacations, useCurrentUser, useUsers } from '../../../hooks';
import { TeamVacationTable } from "@/components/my-team/vacation/team-vacation-table";
import { TeamVacationCalendar } from "@/components/my-team/vacation/team-vacation-calendar";
import { TeamVacationFilterDrawerContent } from "@/components/my-team/vacation/team-vacation-filter-drawer-content";
import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import type { VacationGetManyFormData } from '../../../schemas';

type ViewMode = "list" | "calendar";

export default function MyTeamVacationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { openFilterDrawer } = useUtilityDrawer();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<Partial<VacationGetManyFormData>>({});

  // Get current user to determine their sector
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // Get team members (users in the same sector)
  const { data: teamData, isLoading: isLoadingTeam } = useUsers({
    where: {
      sectorId: currentUser?.sectorId,
    },
    include: {
      position: true,
      sector: true,
    },
  });

  // Extract team member IDs
  const teamMemberIds = useMemo(() => {
    return teamData?.data?.map((user) => user.id) || [];
  }, [teamData]);

  // Build query params with team filter
  const queryParams = useMemo(() => {
    const baseParams: Partial<VacationGetManyFormData> = {
      ...filters,
      where: {
        ...filters.where,
        userId: { in: teamMemberIds },
      },
      include: {
        user: {
          include: {
            position: true,
          },
        },
      },
      orderBy: {
        startAt: "desc" as const,
      },
    };

    return baseParams;
  }, [filters, teamMemberIds]);

  // Fetch vacations for team members
  const {
    data: vacationsData,
    isLoading: isLoadingVacations,
    error,
    refetch,
    isRefetching,
  } = useVacations(queryParams, {
    enabled: teamMemberIds.length > 0,
  });

  const vacations = useMemo(() => vacationsData?.data || [], [vacationsData]);

  // Calculate team coverage metrics
  const coverageMetrics = useMemo(() => {
    const now = new Date();
    const currentlyOnVacation = vacations.filter((v) => {
      const start = new Date(v.startAt);
      const end = new Date(v.endAt);
      return now >= start && now <= end;
    });

    const totalTeam = teamMemberIds.length;
    const onVacationCount = currentlyOnVacation.length;
    const availableCount = totalTeam - onVacationCount;
    const coveragePercentage = totalTeam > 0 ? (availableCount / totalTeam) * 100 : 100;

    return {
      totalTeam,
      onVacationCount,
      availableCount,
      coveragePercentage,
    };
  }, [vacations, teamMemberIds]);

  const handleVacationPress = useCallback(
    (vacationId: string) => {
      router.push(`/meu-pessoal/ferias/detalhes/${vacationId}` as any);
    },
    [router],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleApplyFilters = useCallback((newFilters: Partial<VacationGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <TeamVacationFilterDrawerContent
        filters={filters}
        onFilterChange={handleApplyFilters}
        onClear={() => setFilters({})}
        teamMemberIds={teamMemberIds}
      />
    ));
  }, [openFilterDrawer, filters, handleApplyFilters, teamMemberIds]);

  const isLoading = isLoadingUser || isLoadingTeam || isLoadingVacations;

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <UtilityDrawerWrapper>
        <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconCalendar size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Férias da Equipe</ThemedText>
          </View>
        </View>

        {/* Team Coverage Metrics */}
        <View style={StyleSheet.flatten([styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }])}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <IconUsers size={20} color={colors.foreground} />
              <ThemedText style={styles.metricLabel}>Total da equipe</ThemedText>
              <ThemedText style={styles.metricValue}>{coverageMetrics.totalTeam}</ThemedText>
            </View>

            <View style={StyleSheet.flatten([styles.metricDivider, { backgroundColor: colors.border }])} />

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>De férias agora</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.primary }])}>
                {coverageMetrics.onVacationCount}
              </ThemedText>
            </View>

            <View style={StyleSheet.flatten([styles.metricDivider, { backgroundColor: colors.border }])} />

            <View style={styles.metricItem}>
              <ThemedText style={styles.metricLabel}>Disponíveis</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.success }])}>
                {coverageMetrics.availableCount}
              </ThemedText>
            </View>
          </View>

          {/* Coverage bar */}
          <View style={styles.coverageBarContainer}>
            <View style={StyleSheet.flatten([styles.coverageBarBg, { backgroundColor: colors.muted }])}>
              <View
                style={StyleSheet.flatten([
                  styles.coverageBar,
                  {
                    width: `${coverageMetrics.coveragePercentage}%`,
                    backgroundColor: coverageMetrics.coveragePercentage >= 60 ? colors.success : coverageMetrics.coveragePercentage >= 40 ? "#f59e0b" : colors.destructive,
                  },
                ])}
              />
            </View>
            <ThemedText style={styles.coverageText}>{Math.round(coverageMetrics.coveragePercentage)}% de cobertura</ThemedText>
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={StyleSheet.flatten([
                styles.viewModeButton,
                { borderColor: colors.border },
                viewMode === "list" && StyleSheet.flatten([styles.viewModeButtonActive, { backgroundColor: colors.primary }]),
              ])}
              onPress={() => setViewMode("list")}
            >
              <IconList size={20} color={viewMode === "list" ? colors.primaryForeground : colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={StyleSheet.flatten([
                styles.viewModeButton,
                { borderColor: colors.border },
                viewMode === "calendar" && StyleSheet.flatten([styles.viewModeButtonActive, { backgroundColor: colors.primary }]),
              ])}
              onPress={() => setViewMode("calendar")}
            >
              <IconLayoutGrid size={20} color={viewMode === "calendar" ? colors.primaryForeground : colors.foreground} />
            </TouchableOpacity>
          </View>

          <Button variant="outline" onPress={handleOpenFilters} style={styles.filterButton}>
            <IconFilter size={20} color={colors.foreground} />
            <ThemedText>Filtros</ThemedText>
          </Button>
        </View>

        {/* Content */}
        {viewMode === "list" ? (
          <TeamVacationTable
            vacations={vacations}
            isLoading={isLoading}
            error={error}
            onVacationPress={handleVacationPress}
            onRefresh={handleRefresh}
            refreshing={isRefetching}
            onEndReach={() => {}}
            canLoadMore={false}
            loadingMore={false}
          />
        ) : (
          <TeamVacationCalendar vacations={vacations} onVacationPress={handleVacationPress} />
        )}
        </ThemedView>
      </UtilityDrawerWrapper>
    </PrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  metricsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  metricItem: {
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 40,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  coverageBarContainer: {
    gap: spacing.xs,
  },
  coverageBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  coverageBar: {
    height: "100%",
    borderRadius: 4,
  },
  coverageText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  viewModeToggle: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  viewModeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewModeButtonActive: {
    borderWidth: 0,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
