import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useItem } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE, MEASURE_UNIT_LABELS } from "@/constants";
import { formatCurrency, itemUtils } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingOverlay, SkeletonCard } from "@/components/ui/loading";

import { ThemedText } from "@/components/ui/themed-text";

import { ProgressWithMarkers } from "@/components/ui/progress-with-markers";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconPackage, IconRefresh, IconEdit, IconHistory, IconBox, IconCurrencyDollar } from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";

// Import modular components
import { MetricsCard, ActivityHistoryCard, RelatedItemsCard, SpecificationsCard, PpeInfoCard } from "@/components/inventory/item/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function ItemDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, ] = useState<string | null>(null);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useItem(id, {
    include: {
      brand: true,
      category: true,
      supplier: true,
      measures: true,
      prices: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      activities: {
        include: {
          user: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      relatedItems: {
        include: {
          brand: true,
          category: true,
        },
      },
      relatedTo: {
        include: {
          brand: true,
          category: true,
        },
      },
      orderItems: {
        include: {
          order: {
            include: {
              supplier: true,
              items: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      borrows: {
        include: {
          user: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      changeLogs: {
        include: {
          user: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          activities: true,
          borrows: true,
          orderItems: true,
          prices: true,
          measures: true,
          relatedItems: true,
          relatedTo: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const item = response?.data;

  const handleEdit = () => {
    if (item) {
      router.push(routeToMobilePath(routes.inventory.products.edit(item.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  // Get stock status
  const getStockStatus = () => {
    if (!item) return { label: "N/A", color: "secondary" as const, health: "unknown" };

    const quantity = item.quantity || 0;

    if (quantity === 0) {
      return { label: "Sem Estoque", color: "destructive" as const, health: "critical" };
    }

    if (item.reorderPoint && quantity <= item.reorderPoint) {
      return { label: "Estoque Baixo", color: "warning" as const, health: "warning" };
    }

    if (item.maxQuantity && quantity > item.maxQuantity) {
      return { label: "Estoque Alto", color: "info" as const, health: "info" };
    }

    return { label: "Estoque Normal", color: "success" as const, health: "good" };
  };

  if (isLoading) {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <View style={styles.skeletonContainer}>
            <SkeletonCard style={styles.headerSkeleton} />
            <View style={styles.infoGrid}>
              <SkeletonCard style={styles.infoCardSkeleton} />
              <SkeletonCard style={styles.infoCardSkeleton} />
              <SkeletonCard style={styles.infoCardSkeleton} />
              <SkeletonCard style={styles.infoCardSkeleton} />
            </View>
            <SkeletonCard style={styles.fullWidthSkeleton} />
            <SkeletonCard style={styles.fullWidthSkeleton} />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !item || !id || id === "") {
    return (
      <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card>
            <CardContent style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconPackage size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Produto não encontrado</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>O produto solicitado não foi encontrado ou pode ter sido removido.</ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    );
  }

  const stockStatus = getStockStatus();

  const currentPrice = item.prices?.[0]?.value;

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Item Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconPackage size={24} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.itemName, { color: colors.foreground }])}>{item.name}</ThemedText>
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
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        stockStatus.health === "critical" ? extendedColors.red[100] : stockStatus.health === "warning" ? extendedColors.yellow[100] : extendedColors.green[100],
                    },
                  ]}
                >
                  <IconPackage
                    size={20}
                    color={stockStatus.health === "critical" ? extendedColors.red[600] : stockStatus.health === "warning" ? extendedColors.yellow[600] : extendedColors.green[600]}
                  />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{itemUtils.formatItemQuantity(item)}</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                    {item.measures?.[0]?.unit ? MEASURE_UNIT_LABELS[item.measures[0].unit] : "em estoque"}
                  </ThemedText>
                </View>
              </CardContent>
            </Card>

            {currentPrice && (
              <Card style={styles.statCard}>
                <CardContent style={styles.statContent}>
                  <View style={[styles.statIcon, { backgroundColor: extendedColors.green[100] }]}>
                    <IconCurrencyDollar size={20} color={extendedColors.green[600]} />
                  </View>
                  <View style={styles.statInfo}>
                    <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{formatCurrency(currentPrice)}</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>preço unitário</ThemedText>
                  </View>
                </CardContent>
              </Card>
            )}
          </View>

          {/* Stock Management Card */}
          <Card>
            <CardHeader>
              <CardTitle style={styles.sectionTitle}>
                <View style={styles.titleRow}>
                  <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                    <IconBox size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Gestão de Estoque</ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.stockOverview}>
                {/* Stock Levels */}
                <View style={styles.stockLevels}>
                  <View style={StyleSheet.flatten([styles.stockLevelItem, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: colors.mutedForeground }])}>Mínimo</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: colors.foreground }])}>{item.reorderPoint?.toLocaleString("pt-BR") || "0"}</ThemedText>
                  </View>
                  <View style={[styles.stockLevelItem, styles.stockLevelCurrent, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
                    <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: colors.primary }])}>Atual</ThemedText>
                    <ThemedText style={[styles.stockLevelValue, styles.stockLevelCurrentValue, { color: colors.primary }]}>{item.quantity.toLocaleString("pt-BR")}</ThemedText>
                  </View>
                  {item.reorderPoint && (
                    <View
                      style={[
                        styles.stockLevelItem,
                        {
                          backgroundColor: isDark ? extendedColors.yellow[900] + "20" : extendedColors.yellow[100],
                          borderColor: isDark ? extendedColors.yellow[500] : extendedColors.yellow[600],
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.stockLevelLabel, { color: isDark ? extendedColors.yellow[400] : extendedColors.yellow[700] }]}>Reposição</ThemedText>
                      <ThemedText style={[styles.stockLevelValue, { color: isDark ? extendedColors.yellow[300] : extendedColors.yellow[800] }]}>
                        {item.reorderPoint.toLocaleString("pt-BR")}
                      </ThemedText>
                    </View>
                  )}
                  <View style={StyleSheet.flatten([styles.stockLevelItem, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: colors.mutedForeground }])}>Máximo</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: colors.foreground }])}>{item.maxQuantity?.toLocaleString("pt-BR") || "N/A"}</ThemedText>
                  </View>
                </View>

                {item.maxQuantity && (
                  <View style={styles.stockProgress}>
                    <ProgressWithMarkers
                      value={item.quantity}
                      max={item.maxQuantity}
                      minValue={item.reorderPoint || undefined}
                      reorderPoint={item.reorderPoint || undefined}
                      style={styles.progressBar}
                      indicatorStyle={{
                        backgroundColor:
                          stockStatus.health === "critical" ? extendedColors.red[500] : stockStatus.health === "warning" ? extendedColors.yellow[500] : extendedColors.green[500],
                      }}
                      showLabels={false}
                    />
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Modular Components */}
          <SpecificationsCard item={item} />
          <MetricsCard item={item} />
          {item.ppeType && <PpeInfoCard item={item} />}
          <RelatedItemsCard item={item} />
          <ActivityHistoryCard item={item} maxHeight={400} />
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
              <ChangelogTimeline entityType={CHANGE_LOG_ENTITY_TYPE.ITEM} entityId={item.id} entityName={item.name} entityCreatedAt={item.createdAt} maxHeight={400} />
            </CardContent>
          </Card>

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>

      {/* Loading overlay for actions */}
      <LoadingOverlay isVisible={!!actionLoading} message="Processando movimentação..." />
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
  itemName: {
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
    height: 120,
  },
  infoCardSkeleton: {
    flex: 1,
    minWidth: "47%",
    height: 100,
    margin: spacing.md / 2,
  },
  fullWidthSkeleton: {
    height: 200,
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
  stockOverview: {
    gap: spacing.lg,
  },
  stockLevels: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stockLevelItem: {
    flex: 1,
    minWidth: "30%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  stockLevelCurrent: {
    borderWidth: 1,
  },
  stockLevelLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  stockLevelValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  stockLevelCurrentValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  stockProgress: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: borderRadius.full,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.md / 2,
    marginVertical: -spacing.md / 2,
  },
});
