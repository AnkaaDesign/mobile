import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useItem, usePpeSizes, usePpeDeliveries, usePpeDeliverySchedules } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconShield, IconRefresh, IconEdit, IconHistory } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";

// Import modular components
import { PpeCard, ItemCard, SizesCard, DeliveriesCard, SchedulesCard } from "@/components/human-resources/ppe/detail";
import { PpeDetailSkeleton } from "@/components/human-resources/ppe/skeleton";

export default function PPEDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Fetch the item (PPE config is now part of Item)
  const {
    data: itemResponse,
    isLoading: itemLoading,
    error: itemError,
    refetch: refetchItem,
  } = useItem(id, {
    include: {
      brand: true,
      category: true,
      supplier: true,
      measures: true,
      prices: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    enabled: !!id && id !== "",
  });

  const item = itemResponse?.data;

  // Fetch PPE sizes for the first user (if item has associated deliveries)
  const {
    data: sizesResponse,
    isLoading: sizesLoading,
  } = usePpeSizes({
    where: item?.ppeDeliveries?.[0]?.userId ? { userId: item.ppeDeliveries[0].userId } : undefined,
    take: 1,
  }, {
    enabled: !!item && !!item.ppeDeliveries?.[0]?.userId,
  });

  const userSizes = sizesResponse?.data?.[0];

  // Fetch recent deliveries for this item
  const {
    data: deliveriesResponse,
    isLoading: deliveriesLoading,
  } = usePpeDeliveries({
    where: { itemId: id },
    include: {
      user: { select: { name: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  }, {
    enabled: !!id && id !== "",
  });

  const deliveries = deliveriesResponse?.data || [];

  // Fetch delivery schedules related to this PPE type
  const {
    data: schedulesResponse,
    isLoading: schedulesLoading,
  } = usePpeDeliverySchedules({
    where: item?.ppeType ? { ppes: { has: item.ppeType } } : undefined,
    include: {
      user: { select: { name: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  }, {
    enabled: !!item && !!item.ppeType,
  });

  const schedules = schedulesResponse?.data || [];

  const handleEdit = () => {
    if (item) {
      router.push(routeToMobilePath(routes.inventory.products.edit(item.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refetchItem(),
    ]).finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetchItem]);

  if (itemLoading) {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <PpeDetailSkeleton />
        </View>
      </ScrollView>
    );
  }

  if (itemError || !item || !id || id === "" || !item.ppeType) {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconShield size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                EPI não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O EPI solicitado não foi encontrado ou pode ter sido removido.
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
      {/* Header */}
      <Header
        title={item.name}
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
          {/* PPE Information Card */}
          <PpeCard item={item} />

          {/* Linked Item Information */}
          <ItemCard item={item} />

          {/* Size Configuration (if applicable) */}
          {userSizes && <SizesCard item={item} userSizes={userSizes} />}

          {/* Recent Deliveries */}
          <DeliveriesCard item={item} deliveries={deliveries} />

          {/* Delivery Schedules */}
          <SchedulesCard item={item} schedules={schedules} />

          {/* Changelog Timeline */}
          <Card>
            <View style={styles.changelogHeader}>
              <View style={styles.titleRow}>
                <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                  <IconHistory size={18} color={colors.primary} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </View>
            <View style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.PPE_CONFIG}
                entityId={item.id}
                entityName={item.name}
                entityCreatedAt={item.createdAt}
                maxHeight={400}
              />
            </View>
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
  changelogHeader: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
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
