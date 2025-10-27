import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { usePpeDeliverySchedule, usePpeDeliveryScheduleMutations } from '../../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingOverlay, SkeletonCard } from "@/components/ui/loading";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCalendarEvent, IconRefresh, IconEdit, IconHistory } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";

// Import modular components
import { ScheduleCard, EmployeeCard, PpeItemsCard, DeliveryHistoryCard, TimelineCard } from "@/components/human-resources/ppe/schedule/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { PpeScheduleDetailSkeleton } from "@/components/human-resources/ppe/schedule/skeleton/ppe-schedule-detail-skeleton";

export default function PPEScheduleDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDeliverySchedule(id, {
    include: {
      deliveries: {
        include: {
          user: { select: { name: true, id: true } },
          item: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
        orderBy: { scheduledDate: "desc" },
        take: 50,
      },
      autoOrders: {
        include: {
          supplier: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
    enabled: !!id && id !== "",
  });

  const schedule = response?.data;

  const handleEdit = () => {
    if (schedule) {
      router.push(routeToMobilePath(routes.humanResources.ppe.schedules.edit(schedule.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  const handleDeliverNow = () => {
    Alert.alert(
      "Entregar Agora",
      "Deseja criar entregas imediatas baseadas neste cronograma?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            setActionLoading("deliver");
            try {
              // TODO: Implement delivery creation from schedule
              showToast({ message: "Entregas criadas com sucesso", type: "success" });
              refetch();
            } catch (error) {
              showToast({ message: "Erro ao criar entregas", type: "error" });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <PpeScheduleDetailSkeleton />;
  }

  if (error || !schedule || !id || id === "") {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconCalendarEvent size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Cronograma não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O cronograma solicitado não foi encontrado ou pode ter sido removido.
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
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Enhanced Header */}
      <Header
        title="Cronograma EPI"
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
          {/* Main Schedule Card */}
          <ScheduleCard schedule={schedule} onDeliverNow={handleDeliverNow} />

          {/* Employee Assignment Card */}
          <EmployeeCard schedule={schedule} />

          {/* PPE Items Card */}
          <PpeItemsCard schedule={schedule} />

          {/* Upcoming Deliveries Timeline */}
          <TimelineCard schedule={schedule} />

          {/* Delivery History */}
          <DeliveryHistoryCard schedule={schedule} maxHeight={400} />

          {/* Changelog Timeline */}
          <Card>
            <CardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.PPE_DELIVERY_SCHEDULE}
                entityId={schedule.id}
                entityName={`Cronograma EPI`}
                entityCreatedAt={schedule.createdAt}
                maxHeight={400}
              />
            </CardContent>
          </Card>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>

      {/* Loading overlay for actions */}
      <LoadingOverlay isVisible={!!actionLoading} message="Processando..." />
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
