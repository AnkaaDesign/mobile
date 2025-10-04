import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useCommission } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, COMMISSION_STATUS_LABELS } from '../../../../../constants';
import { formatCurrency } from '../../../../../utils';
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCash, IconRefresh, IconEdit, IconHistory, IconAlertCircle } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";
import { extendedColors } from "@/lib/theme/extended-colors";

// Import modular components
import { CommissionCard, CalculationCard, TaskCard, UserCard, PaymentCard } from "@/components/administration/commission/detail";
import { CommissionDetailSkeleton } from "@/components/administration/commission/skeleton/commission-detail-skeleton";

export default function CommissionDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useCommission(id, {
    include: {
      user: {
        include: {
          position: {
            include: {
              sector: true,
            },
          },
        },
      },
      task: {
        include: {
          customer: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const commission = response?.data;

  const handleEdit = () => {
    if (commission) {
      router.push(routeToMobilePath(routes.administration.commissions.edit(commission.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  // Get commission value for display
  const getCommissionValue = () => {
    if (!commission || !commission.task) return 0;
    const baseValue = commission.task.price || 0;
    const commissionRate = commission.user?.position?.commissionRate || 0;
    const calculatedAmount = baseValue * (commissionRate / 100);

    const multiplier = commission.status === "FULL_COMMISSION" ? 1.0 : commission.status === "PARTIAL_COMMISSION" ? 0.5 : 0.0;

    return calculatedAmount * multiplier;
  };

  if (isLoading) {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <CommissionDetailSkeleton />
      </ScrollView>
    );
  }

  if (error || !commission || !id || id === "") {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconCash size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Comissão não encontrada</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                A comissão solicitada não foi encontrada ou pode ter sido removida.
              </ThemedText>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  const commissionValue = getCommissionValue();
  const statusColor =
    commission.status === "FULL_COMMISSION"
      ? extendedColors.green[500]
      : commission.status === "PARTIAL_COMMISSION"
        ? extendedColors.yellow[500]
        : commission.status === "SUSPENDED_COMMISSION"
          ? extendedColors.red[500]
          : colors.mutedForeground;

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Header */}
      <Header
        title="Detalhes da Comissão"
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
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: isDark ? statusColor + "20" : statusColor + "15" }]}>
                  <IconCash size={20} color={statusColor} />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{formatCurrency(commissionValue)}</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>valor</ThemedText>
                </View>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: colors.muted }]}>
                  <IconAlertCircle size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: statusColor, fontSize: fontSize.base }])} numberOfLines={2}>
                    {COMMISSION_STATUS_LABELS[commission.status]}
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>status</ThemedText>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Modular Components */}
          <CommissionCard commission={commission} />
          <CalculationCard commission={commission} />
          <UserCard commission={commission} />
          <TaskCard commission={commission} />
          <PaymentCard commission={commission} />

          {/* Changelog Timeline */}
          <Card>
            <CardContent style={{ paddingHorizontal: 0 }}>
              <View style={styles.titleRow}>
                <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                  <IconHistory size={18} color={colors.primary} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Histórico de Alterações</ThemedText>
              </View>
              <View style={{ marginTop: spacing.md }}>
                <ChangelogTimeline entityType={CHANGE_LOG_ENTITY_TYPE.COMMISSION} entityId={commission.id} entityName={`Comissão #${commission.id.substring(0, 8)}`} entityCreatedAt={commission.createdAt} maxHeight={400} />
              </View>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
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
