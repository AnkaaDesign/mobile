import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSector } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import {
  IconBuildingSkyscraper,
  IconRefresh,
  IconEdit,
  IconHistory,
  IconUsers,
  IconClipboardList,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";

// Import modular components
import { SectorInfoCard, UsersCard, TasksCard } from "@/components/administration/sector/detail";
import { SkeletonCard } from "@/components/ui/loading";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function SectorDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useSector(id, {
    include: {
      users: {
        include: {
          position: true,
          sector: true,
        },
        orderBy: { name: "asc" },
        take: 50,
      },
      managedByUsers: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          users: true,
          tasks: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const sector = response?.data;

  const handleEdit = () => {
    if (sector) {
      router.push(routeToMobilePath(routes.administration.sectors.edit(sector.id)) as any);
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
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <View style={styles.skeletonContainer}>
            <SkeletonCard style={styles.headerSkeleton} />
            <SkeletonCard style={styles.fullWidthSkeleton} />
            <SkeletonCard style={styles.fullWidthSkeleton} />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !sector || !id || id === "") {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconBuildingSkyscraper size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Setor não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O setor solicitado não foi encontrado ou pode ter sido removido.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
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
        {/* Sector Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconBuildingSkyscraper size={24} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.sectorName, { color: colors.foreground }])}>
                {sector.name}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.muted }])}
                activeOpacity={0.7}
                disabled={refreshing}
              >
                <IconRefresh size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                activeOpacity={0.7}
              >
                <IconEdit size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: extendedColors.blue[100] }]}>
                <IconUsers size={20} color={extendedColors.blue[600]} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                  {sector._count?.users || 0}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                  {sector._count?.users === 1 ? 'usuário' : 'usuários'}
                </ThemedText>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={[styles.statIcon, { backgroundColor: extendedColors.green[100] }]}>
                <IconClipboardList size={20} color={extendedColors.green[600]} />
              </View>
              <View style={styles.statInfo}>
                <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                  {sector._count?.tasks || 0}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                  {sector._count?.tasks === 1 ? 'tarefa' : 'tarefas'}
                </ThemedText>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Modular Components */}
        <SectorInfoCard sector={sector} />
        <UsersCard sector={sector} />
        <TasksCard sector={sector} />

        {/* Changelog Timeline */}
        <Card>
          <CardHeader>
            <CardTitle style={styles.sectionTitle}>
              <View style={styles.titleRow}>
                <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                  <IconHistory size={18} color={colors.primary} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent style={{ paddingHorizontal: 0 }}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.SECTOR}
              entityId={sector.id}
              entityName={sector.name}
              entityCreatedAt={sector.createdAt}
              maxHeight={400}
            />
          </CardContent>
        </Card>

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
  sectorName: {
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
  skeletonContainer: {
    gap: spacing.lg,
  },
  headerSkeleton: {
    height: 80,
  },
  fullWidthSkeleton: {
    height: 150,
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
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
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
