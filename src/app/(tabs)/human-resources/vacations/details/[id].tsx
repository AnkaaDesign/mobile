import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useVacation } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, VACATION_STATUS } from '../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { ThemedText } from "@/components/ui/themed-text";
import { IconBeach, IconEdit, IconRefresh } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";
import { routeToMobilePath } from "@/lib/route-mapper";

// Import modular components
import { VacationCard, EmployeeCard, TimelineCard, ApprovalCard } from "@/components/human-resources/vacation/detail";
import { VacationDetailSkeleton } from "@/components/human-resources/vacation/skeleton/vacation-detail-skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function VacationDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useVacation(id, {
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
    },
    enabled: !!id && id !== "",
  });

  const vacation = response?.data;

  const handleEdit = () => {
    if (vacation) {
      router.push(routeToMobilePath(routes.humanResources.vacations.edit(vacation.id)) as any);
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
          <VacationDetailSkeleton />
        </View>
      </ScrollView>
    );
  }

  if (error || !vacation || !id || id === "") {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconBeach size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Férias não encontradas
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                As férias solicitadas não foram encontradas ou podem ter sido removidas.
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

  // Check if vacation can be edited (only PENDING status)
  const canEdit = vacation.status === VACATION_STATUS.PENDING;

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Header */}
      <Header
        title="Detalhes das Férias"
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
            {canEdit && (
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
            )}
          </View>
        }
      />

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
          {/* Vacation Information Card */}
          <VacationCard vacation={vacation} />

          {/* Employee Card */}
          <EmployeeCard vacation={vacation} />

          {/* Timeline Card */}
          <TimelineCard vacation={vacation} />

          {/* Approval/Rejection Card (if applicable) */}
          <ApprovalCard vacation={vacation} />

          {/* Changelog Timeline */}
          <Card>
            <CardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.VACATION}
                entityId={vacation.id}
                entityName={`Férias - ${vacation.user?.name || "Funcionário"}`}
                entityCreatedAt={vacation.createdAt}
                maxHeight={400}
              />
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
});
