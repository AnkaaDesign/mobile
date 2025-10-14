import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { IconCalendar, IconList, IconLayoutGrid } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { useVacationsInfiniteMobile } from '../../../hooks';
import { VACATION_STATUS } from '../../../constants';
import { MyVacationBalance } from "@/components/personal/vacation/my-vacation-balance";
import { MyVacationList } from "@/components/personal/vacation/my-vacation-list";
import { MyVacationCalendar } from "@/components/personal/vacation/my-vacation-calendar";
import type { VacationGetManyFormData } from '../../../schemas';

type ViewMode = "list" | "calendar";
type FilterStatus = VACATION_STATUS | "ALL";
type FilterTime = "ALL" | "UPCOMING" | "ACTIVE" | "PAST";

export default function MyVacationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterTime, setFilterTime] = useState<FilterTime>("ALL");
  const [currentYear] = useState(new Date().getFullYear());

  // Build query filters
  const queryFilters = useMemo<Partial<VacationGetManyFormData>>(() => {
    const filters: Partial<VacationGetManyFormData> = {
      include: {
        user: true,
      },
      orderBy: {
        startAt: "desc" as const,
      },
    };

    // Filter by current user OR collective vacations
    const whereConditions: any[] = [
      { userId: user?.id },
      { isCollective: true },
    ];

    filters.where = {
      OR: whereConditions,
    };

    // Apply status filter
    if (filterStatus !== "ALL") {
      filters.where = {
        ...filters.where,
        status: filterStatus,
      };
    }

    // Apply time filter
    const now = new Date();
    if (filterTime === "UPCOMING") {
      filters.where = {
        ...filters.where,
        startAt: { gt: now },
      };
    } else if (filterTime === "ACTIVE") {
      filters.isActive = true;
    } else if (filterTime === "PAST") {
      filters.where = {
        ...filters.where,
        endAt: { lt: now },
      };
    }

    return filters;
  }, [user?.id, filterStatus, filterTime]);

  // Fetch all vacations for the current user (for balance calculation)
  const { data: allVacationsData } = useVacationsInfiniteMobile({
    where: {
      OR: [
        { userId: user?.id },
        { isCollective: true },
      ],
    },
    year: currentYear,
  });

  // Fetch filtered vacations for display
  const {
    data: vacationsData,
    isLoading,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useVacationsInfiniteMobile(queryFilters);

  // Flatten vacations for display
  const vacations = useMemo(() => {
    return vacationsData || [];
  }, [vacationsData]);

  // All vacations for balance calculation
  const allVacations = useMemo(() => {
    return allVacationsData || [];
  }, [allVacationsData]);

  // Calculate vacation balance
  const vacationBalance = useMemo(() => {
    const userVacations = allVacations.filter((v) => v.userId === user?.id);
    const totalDays = 30;

    const usedDays = userVacations
      .filter((v) => v.status === VACATION_STATUS.IN_PROGRESS || v.status === VACATION_STATUS.COMPLETED)
      .reduce((total, v) => {
        const days = Math.ceil((new Date(v.endAt).getTime() - new Date(v.startAt).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + days;
      }, 0);

    const pendingDays = userVacations
      .filter((v) => v.status === VACATION_STATUS.PENDING || v.status === VACATION_STATUS.APPROVED)
      .reduce((total, v) => {
        const days = Math.ceil((new Date(v.endAt).getTime() - new Date(v.startAt).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + days;
      }, 0);

    const remainingDays = Math.max(totalDays - usedDays - pendingDays, 0);

    return {
      totalDays,
      usedDays,
      pendingDays,
      remainingDays,
    };
  }, [allVacations, user?.id]);

  const handleVacationPress = useCallback(
    (vacationId: string) => {
      router.push(`/personal/my-vacations/details/${vacationId}` as any);
    },
    [router],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconCalendar size={24} color={colors.primary} />
        <ThemedText style={styles.title}>Minhas Férias</ThemedText>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceContainer}>
        <MyVacationBalance vacations={allVacations} year={currentYear} />
      </View>

      {/* Filters and View Toggle */}
      <View style={styles.controlsContainer}>
        {/* Time Filter Pills */}
        <View style={styles.filterPills}>
          {[
            { value: "ALL", label: "Todas" },
            { value: "UPCOMING", label: "Futuras" },
            { value: "ACTIVE", label: "Ativas" },
            { value: "PAST", label: "Passadas" },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={StyleSheet.flatten([
                styles.filterPill,
                { backgroundColor: colors.card, borderColor: colors.border },
                filterTime === item.value && StyleSheet.flatten([styles.filterPillActive, { backgroundColor: colors.primary, borderColor: colors.primary }]),
              ])}
              onPress={() => setFilterTime(item.value as FilterTime)}
            >
              <ThemedText
                style={StyleSheet.flatten([
                  styles.filterPillText,
                  filterTime === item.value && StyleSheet.flatten([styles.filterPillTextActive, { color: colors.primaryForeground }]),
                ])}
              >
                {item.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={StyleSheet.flatten([
              styles.viewButton,
              { borderColor: colors.border },
              viewMode === "list" && StyleSheet.flatten([styles.viewButtonActive, { backgroundColor: colors.primary }]),
            ])}
            onPress={() => setViewMode("list")}
          >
            <IconList size={20} color={viewMode === "list" ? colors.primaryForeground : colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={StyleSheet.flatten([
              styles.viewButton,
              { borderColor: colors.border },
              viewMode === "calendar" && StyleSheet.flatten([styles.viewButtonActive, { backgroundColor: colors.primary }]),
            ])}
            onPress={() => setViewMode("calendar")}
          >
            <IconLayoutGrid size={20} color={viewMode === "calendar" ? colors.primaryForeground : colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === "list" ? (
        <MyVacationList
          vacations={vacations}
          isLoading={isLoading}
          error={error}
          onVacationPress={handleVacationPress}
          onRefresh={handleRefresh}
          refreshing={isRefetching}
          onEndReach={handleLoadMore}
          canLoadMore={hasNextPage || false}
          loadingMore={isFetchingNextPage}
        />
      ) : (
        <MyVacationCalendar vacations={vacations} onVacationPress={handleVacationPress} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  balanceContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  filterPills: {
    flexDirection: "row",
    gap: spacing.xs,
    flex: 1,
  },
  filterPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActive: {
    borderWidth: 2,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "500",
  },
  filterPillTextActive: {
    fontWeight: "700",
  },
  viewToggle: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  viewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewButtonActive: {
    borderWidth: 0,
  },
});
