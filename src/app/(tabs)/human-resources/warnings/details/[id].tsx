import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useWarning } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, WARNING_SEVERITY_LABELS } from '../../../../../constants';
import { formatDate } from '../../../../../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconAlertTriangle, IconRefresh, IconEdit, IconHistory, IconCalendar } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";

// Import modular components
import { WarningCard, EmployeeCard, DescriptionCard, IssuerCard } from "@/components/human-resources/warning/detail";
import { WarningDetailSkeleton } from "@/components/human-resources/warning/skeleton/warning-detail-skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function WarningDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useWarning(id, {
    include: {
      collaborator: {
        include: {
          position: true,
          sector: true,
          warnings: {
            where: {
              id: {
                not: id,
              },
            },
          },
        },
      },
      supervisor: {
        include: {
          position: true,
          sector: true,
        },
      },
      witness: true,
      attachments: true,
    },
    enabled: !!id && id !== "",
  });

  const warning = response?.data;

  const handleEdit = () => {
    if (warning) {
      router.push(routeToMobilePath(routes.humanResources.warnings.edit(warning.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  // Get severity color
  const getSeverityColor = () => {
    if (!warning) return { bg: colors.muted, text: colors.foreground, icon: colors.foreground };

    switch (warning.severity) {
      case "VERBAL":
        return { bg: extendedColors.blue[100], text: extendedColors.blue[700], icon: extendedColors.blue[600] };
      case "WRITTEN":
        return { bg: extendedColors.yellow[100], text: extendedColors.yellow[700], icon: extendedColors.yellow[600] };
      case "SUSPENSION":
        return { bg: extendedColors.orange[100], text: extendedColors.orange[700], icon: extendedColors.orange[600] };
      case "FINAL_WARNING":
        return { bg: extendedColors.red[100], text: extendedColors.red[700], icon: extendedColors.red[600] };
      default:
        return { bg: colors.muted, text: colors.foreground, icon: colors.foreground };
    }
  };

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header title="Detalhes da Advertência" showBackButton={true} onBackPress={() => router.back()} />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <WarningDetailSkeleton />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !warning || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header title="Detalhes da Advertência" showBackButton={true} onBackPress={() => router.back()} />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <Card>
              <CardContent style={styles.errorContent}>
                <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                  <IconAlertTriangle size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Advertência não encontrada</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                  A advertência solicitada não foi encontrada ou pode ter sido removida.
                </ThemedText>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>
    );
  }

  const severityColor = getSeverityColor();
  const daysUntilFollowUp = warning.followUpDate ? Math.ceil((new Date(warning.followUpDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Enhanced Header */}
      <Header
        title={`${WARNING_SEVERITY_LABELS[warning.severity]}`}
        subtitle={warning.collaborator?.name}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightAction={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <IconRefresh size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <IconEdit size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Quick Stats Cards */}
          <View style={styles.statsGrid}>
            {/* Severity Card */}
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: severityColor.bg }]}>
                  <IconAlertTriangle size={20} color={severityColor.icon} />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: severityColor.text }])}>{WARNING_SEVERITY_LABELS[warning.severity]}</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>gravidade</ThemedText>
                </View>
              </CardContent>
            </Card>

            {/* Follow-up Date Card */}
            {warning.followUpDate && (
              <Card style={styles.statCard}>
                <CardContent style={styles.statContent}>
                  <View
                    style={[
                      styles.statIcon,
                      {
                        backgroundColor: daysUntilFollowUp && daysUntilFollowUp < 0 ? extendedColors.red[100] : daysUntilFollowUp && daysUntilFollowUp <= 7 ? extendedColors.yellow[100] : extendedColors.blue[100],
                      },
                    ]}
                  >
                    <IconCalendar
                      size={20}
                      color={daysUntilFollowUp && daysUntilFollowUp < 0 ? extendedColors.red[600] : daysUntilFollowUp && daysUntilFollowUp <= 7 ? extendedColors.yellow[600] : extendedColors.blue[600]}
                    />
                  </View>
                  <View style={styles.statInfo}>
                    <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{formatDate(warning.followUpDate)}</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                      acompanhamento{daysUntilFollowUp !== null && daysUntilFollowUp > 0 ? ` (${daysUntilFollowUp}d)` : ""}
                    </ThemedText>
                  </View>
                </CardContent>
              </Card>
            )}
          </View>

          {/* Modular Components */}
          <WarningCard warning={warning} />
          <EmployeeCard warning={warning} />
          <DescriptionCard warning={warning} />
          <IssuerCard warning={warning} />

          {/* Changelog Timeline */}
          <Card>
            <CardHeader>
              <CardTitle style={styles.sectionTitle}>
                <View style={styles.titleRow}>
                  <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                    <IconHistory size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Histórico de Alterações</ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline entityType={CHANGE_LOG_ENTITY_TYPE.WARNING} entityId={warning.id} entityName={`Advertência - ${warning.collaborator?.name}`} entityCreatedAt={warning.createdAt} maxHeight={400} />
            </CardContent>
          </Card>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
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
    fontSize: fontSize.base,
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
