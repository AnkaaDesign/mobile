import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useItemCategory, useScreenReady } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE, ORDER_STATUS, STOCK_LEVEL, STOCK_LEVEL_LABELS, ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from "@/constants";
import { formatDate, formatCurrency, determineStockLevel } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";

import { Header } from "@/components/ui/header";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { useTheme } from "@/lib/theme";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import {
  IconLayout,
  IconPackage,
  IconHistory,
  IconInfoCircle,
  IconCalendar,

  IconShieldCheck,
  IconBox,

  IconAlertCircle,
  IconAlertTriangle,
  IconRefresh,
  IconEdit,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
import { TouchableOpacity } from "react-native";
// import { showToast } from "@/components/ui/toast";

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { pushWithLoading, goBack } = useNavigationLoading();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // End navigation loading overlay when screen mounts

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useItemCategory(id, {
    // Use select to fetch only fields needed for detail view
    select: {
      // Core category fields
      id: true,
      name: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      // Items - only fields displayed in the UI
      items: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          quantity: true,
          reorderPoint: true,
          maxQuantity: true,
          totalPrice: true,
          isActive: true,
          ppeCA: true,
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          // Only need order status for stock level calculation
          orderItems: {
            select: {
              order: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
      // Count for statistics
      _count: {
        select: {
          items: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const category = response?.data;
  const items = category?.items || [];

  // Sort items by quantity (low stock first) and name
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Check if items have active orders
      const activeOrderStatuses = [ORDER_STATUS.CREATED, ORDER_STATUS.PARTIALLY_FULFILLED, ORDER_STATUS.FULFILLED, ORDER_STATUS.PARTIALLY_RECEIVED];

      const aHasActiveOrder = a.orderItems?.some((orderItem) => orderItem.order && activeOrderStatuses.includes(orderItem.order.status)) || false;

      const bHasActiveOrder = b.orderItems?.some((orderItem) => orderItem.order && activeOrderStatuses.includes(orderItem.order.status)) || false;

      // First sort by stock level priority (critical items first)
      const aLevel = determineStockLevel(a.quantity || 0, a.reorderPoint || null, a.maxQuantity || null, aHasActiveOrder);
      const bLevel = determineStockLevel(b.quantity || 0, b.reorderPoint || null, b.maxQuantity || null, bHasActiveOrder);

      const levelPriority = { NEGATIVE_STOCK: 0, OUT_OF_STOCK: 1, CRITICAL: 2, LOW: 3, OPTIMAL: 4, OVERSTOCKED: 5 };
      const aPriority = levelPriority[aLevel] ?? 6;
      const bPriority = levelPriority[bLevel] ?? 6;

      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then sort by name
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalItems = items.length;
    const activeItems = items.filter((item) => item.isActive).length;
    const inactiveItems = totalItems - activeItems;
    const totalValue = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const ppeItems = items.filter((item) => item.ppeCA).length;

    const stockLevels = items.reduce(
      (acc, item) => {
        // Check if item has active orders
        const activeOrderStatuses = [ORDER_STATUS.CREATED, ORDER_STATUS.PARTIALLY_FULFILLED, ORDER_STATUS.FULFILLED, ORDER_STATUS.PARTIALLY_RECEIVED];

        const hasActiveOrder = item.orderItems?.some((orderItem) => orderItem.order && activeOrderStatuses.includes(orderItem.order.status)) || false;

        const level = determineStockLevel(item.quantity || 0, item.reorderPoint || null, item.maxQuantity || null, hasActiveOrder);
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalItems,
      activeItems,
      inactiveItems,
      totalValue,
      ppeItems,
      stockLevels,
    };
  }, [items]);

  const handleEdit = () => {
    if (category) {
      pushWithLoading(routeToMobilePath(routes.inventory.products.categories.edit(category.id)));
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  const handleItemPress = (itemId: string) => {
    pushWithLoading(routeToMobilePath(routes.inventory.products.details(itemId)));
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Carregando..." showBackButton={true} onBackPress={() => goBack()} />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.contentContainer}>
            <SkeletonCard style={styles.fullWidthSkeleton} />
            <SkeletonCard style={styles.fullWidthSkeleton} />
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (error || !category || !id || id === "") {
    return (
      <ThemedView style={styles.container}>
        <Header title="Erro" showBackButton={true} onBackPress={() => goBack()} />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.contentContainer}>
            <Card>
              <CardContent style={styles.errorContent}>
                <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                  <IconLayout size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Categoria não encontrada</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>A categoria solicitada não foi encontrada ou pode ter sido removida.</ThemedText>
                <Button onPress={() => goBack()}>
                  <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
                </Button>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title={category.name}
        showBackButton={true}
        onBackPress={() => goBack()}
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
        <View style={styles.contentContainer}>
          {/* Basic Information Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconInfoCircle size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Informações da Categoria</ThemedText>
              </View>
            </View>
            <View style={styles.cardContent}>
              {/* Basic Information Section */}
              <View style={styles.infoSection}>
                <ThemedText style={StyleSheet.flatten([styles.sectionLabel, { color: colors.foreground }])}>Informações Básicas</ThemedText>
                <View style={styles.infoGrid}>
                  <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Nome</ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{category.name}</ThemedText>
                  </View>
                  <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Tipo</ThemedText>
                    <View style={styles.infoValueRow}>
                      {category.type === ITEM_CATEGORY_TYPE.PPE ? (
                        <>
                          <IconShieldCheck size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
                          <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: isDark ? "#60a5fa" : "#2563eb" }])}>{ITEM_CATEGORY_TYPE_LABELS[ITEM_CATEGORY_TYPE.PPE]}</ThemedText>
                        </>
                      ) : (
                        <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                          {ITEM_CATEGORY_TYPE_LABELS[category.type as keyof typeof ITEM_CATEGORY_TYPE_LABELS]}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <View style={StyleSheet.flatten([styles.infoRow, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Produtos Cadastrados</ThemedText>
                    <View style={styles.infoValueRow}>
                      <IconBox size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                        {items.length} {items.length === 1 ? "produto" : "produtos"}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Timestamps Section */}
              <View style={StyleSheet.flatten([styles.infoSection, styles.borderTop])}>
                <ThemedText style={StyleSheet.flatten([styles.sectionLabel, { color: colors.foreground }])}>Histórico</ThemedText>
                <View style={styles.timestampGrid}>
                  <View style={styles.timestampItem}>
                    <View style={styles.timestampRow}>
                      <IconCalendar size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Data de Criação</ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.timestampValue, { color: colors.foreground }])}>{formatDate(category.createdAt)}</ThemedText>
                  </View>
                  <View style={styles.timestampItem}>
                    <View style={styles.timestampRow}>
                      <IconCalendar size={16} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Última Atualização</ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.timestampValue, { color: colors.foreground }])}>{formatDate(category.updatedAt)}</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Related Items Card */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconPackage size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Produtos Relacionados</ThemedText>
              </View>
            </View>
            <View style={styles.cardContent}>
              {items.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconAlertCircle size={48} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>Nenhum produto associado a esta categoria.</ThemedText>
                </View>
              ) : (
                <>
                  {/* Statistics Summary */}
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                      <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>Total de Produtos</ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>{statistics.totalItems}</ThemedText>
                    </View>
                    <View
                      style={[
                        styles.statCard,
                        {
                          backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                          borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.2)",
                        },
                      ]}
                    >
                      <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: isDark ? "#60a5fa" : "#2563eb" }])}>Valor Total</ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.statValue, { color: isDark ? "#60a5fa" : "#2563eb" }])}>{formatCurrency(statistics.totalValue)}</ThemedText>
                    </View>
                  </View>

                  {/* Stock Level Summary */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stockLevelContainer}>
                    <View style={styles.stockLevelRow}>
                      {[STOCK_LEVEL.NEGATIVE_STOCK, STOCK_LEVEL.OUT_OF_STOCK, STOCK_LEVEL.CRITICAL, STOCK_LEVEL.LOW, STOCK_LEVEL.OPTIMAL, STOCK_LEVEL.OVERSTOCKED].map((level) => {
                        const count = statistics.stockLevels[level] || 0;

                        const stockLevelColors = {
                          [STOCK_LEVEL.NEGATIVE_STOCK]: {
                            bg: isDark ? "rgba(163, 163, 163, 0.2)" : "rgba(115, 115, 115, 0.1)",
                            text: isDark ? "#a3a3a3" : "#525252",
                          },
                          [STOCK_LEVEL.OUT_OF_STOCK]: {
                            bg: isDark ? "rgba(248, 113, 113, 0.2)" : "rgba(220, 38, 38, 0.1)",
                            text: isDark ? "#f87171" : "#dc2626",
                          },
                          [STOCK_LEVEL.CRITICAL]: {
                            bg: isDark ? "rgba(251, 146, 60, 0.2)" : "rgba(249, 115, 22, 0.1)",
                            text: isDark ? "#fb923c" : "#f97316",
                          },
                          [STOCK_LEVEL.LOW]: {
                            bg: isDark ? "rgba(251, 191, 36, 0.2)" : "rgba(234, 179, 8, 0.1)",
                            text: isDark ? "#fbbf24" : "#eab308",
                          },
                          [STOCK_LEVEL.OPTIMAL]: {
                            bg: isDark ? "rgba(74, 222, 128, 0.2)" : "rgba(34, 197, 94, 0.1)",
                            text: isDark ? "#4ade80" : "#22c55e",
                          },
                          [STOCK_LEVEL.OVERSTOCKED]: {
                            bg: isDark ? "rgba(168, 85, 247, 0.2)" : "rgba(147, 51, 234, 0.1)",
                            text: isDark ? "#a855f7" : "#9333ea",
                          },
                        };
                        const levelColors = stockLevelColors[level as keyof typeof stockLevelColors];

                        return (
                          <View key={level} style={StyleSheet.flatten([styles.stockLevelBadge, { backgroundColor: levelColors.bg }])}>
                            <ThemedText style={StyleSheet.flatten([styles.stockLevelText, { color: levelColors.text }])}>
                              {STOCK_LEVEL_LABELS[level as keyof typeof STOCK_LEVEL_LABELS]} ({count})
                            </ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Items Horizontal Scroll */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScrollContainer} contentContainerStyle={styles.itemsScrollContent}>
                    {sortedItems.map((item) => {
                      // Check if item has active orders
                      const activeOrderStatuses = [ORDER_STATUS.CREATED, ORDER_STATUS.PARTIALLY_FULFILLED, ORDER_STATUS.FULFILLED, ORDER_STATUS.PARTIALLY_RECEIVED];

                      const hasActiveOrder = item.orderItems?.some((orderItem) => orderItem.order && activeOrderStatuses.includes(orderItem.order.status)) || false;

                      const stockLevel = determineStockLevel(item.quantity || 0, item.reorderPoint || null, item.maxQuantity || null, hasActiveOrder);
                      const quantity = item.quantity || 0;

                      // Get proper stock color
                      const stockColors = {
                        [STOCK_LEVEL.NEGATIVE_STOCK]: colors.mutedForeground,
                        [STOCK_LEVEL.OUT_OF_STOCK]: isDark ? "#f87171" : "#dc2626",
                        [STOCK_LEVEL.CRITICAL]: isDark ? "#fb923c" : "#f97316",
                        [STOCK_LEVEL.LOW]: "#facc15",
                        [STOCK_LEVEL.OPTIMAL]: isDark ? "#4ade80" : "#22c55e",
                        [STOCK_LEVEL.OVERSTOCKED]: isDark ? "#a855f7" : "#9333ea",
                      };
                      const iconColor = stockColors[stockLevel] || colors.mutedForeground;

                      return (
                        <TouchableOpacity key={item.id} onPress={() => handleItemPress(item.id)} activeOpacity={0.7} style={styles.itemCardWrapper}>
                          <View style={[styles.itemCard, { backgroundColor: isDark ? colors.card : colors.background, borderColor: colors.border }]}>
                            <View style={styles.itemCardContent}>
                              <View>
                                <View style={styles.itemCardTopRow}>
                                  <ThemedText style={StyleSheet.flatten([styles.itemCardName, { color: colors.foreground }])} numberOfLines={2}>
                                    {item.name}
                                  </ThemedText>
                                </View>

                                {item.brand && (
                                  <ThemedText style={StyleSheet.flatten([styles.itemCardBrand, { color: colors.mutedForeground }])} numberOfLines={1}>
                                    {item.brand.name}
                                  </ThemedText>
                                )}

                                {!item.isActive && (
                                  <View style={styles.inactiveBadgeWrapper}>
                                    <Badge variant="secondary">
                                      <ThemedText style={styles.badgeText}>Inativo</ThemedText>
                                    </Badge>
                                  </View>
                                )}
                              </View>

                              <View style={styles.itemCardBottom}>
                                <View style={styles.itemCardStockRow}>
                                  <View style={styles.stockInfo}>
                                    <IconAlertTriangle size={16} color={iconColor} />
                                    <ThemedText style={StyleSheet.flatten([styles.stockQuantity, { color: colors.foreground }])}>{quantity.toLocaleString("pt-BR")} un</ThemedText>
                                  </View>

                                  {item.totalPrice && item.totalPrice > 0 && (
                                    <ThemedText style={StyleSheet.flatten([styles.itemPrice, { color: colors.mutedForeground }])}>{formatCurrency(item.totalPrice)}</ThemedText>
                                  )}
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>
          </Card>

          {/* Changelog Timeline */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconHistory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
              </View>
            </View>
            <View style={styles.cardContent}>
              <ChangelogTimeline entityType={CHANGE_LOG_ENTITY_TYPE.ITEM_CATEGORY} entityId={category.id} entityName={category.name} entityCreatedAt={category.createdAt} />
            </View>
          </Card>

          {/* Bottom spacing */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  cardContent: {
    gap: spacing.sm,
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
  // Basic Info Styles
  infoSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  borderTop: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  timestampGrid: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  timestampItem: {
    flex: 1,
    gap: spacing.xs,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  timestampValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  // Related Items Styles
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fontSize.base,
    marginTop: spacing.md,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xxs,
  },
  stockLevelContainer: {
    marginBottom: spacing.md,
  },
  stockLevelRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  stockLevelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  stockLevelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  itemsScrollContainer: {
    marginHorizontal: -spacing.md,
  },
  itemsScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  itemCardWrapper: {
    width: 260,
  },
  itemCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minHeight: 140,
    padding: spacing.sm,
  },
  itemCardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemCardTopRow: {
    marginBottom: spacing.xs,
  },
  itemCardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * 1.3,
  },
  itemCardBrand: {
    fontSize: fontSize.xs,
  },
  inactiveBadgeWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  itemCardBottom: {
    marginTop: spacing.sm,
  },
  itemCardStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stockQuantity: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  itemPrice: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  separator: {
    marginVertical: spacing.xs,
  },
});
