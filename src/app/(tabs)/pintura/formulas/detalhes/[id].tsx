import { useState, useEffect } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormula, usePaintFormulaMutations, useScreenReady } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege, formatDateTime } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobilePaintFormulaCalculator } from "@/components/painting/formula/mobile-paint-formula-calculator";
import { IconBuildingFactory } from "@tabler/icons-react-native";


import { Skeleton } from "@/components/ui/skeleton";

export default function FormulaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteFormula } = usePaintFormulaMutations();
  const [refreshing, setRefreshing] = useState(false);

  // End navigation loading overlay when screen mounts

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const userPrivilege = user?.sector?.privileges;

  // Only COMMERCIAL, ADMIN, FINANCIAL can see prices (WAREHOUSE excluded)
  const canSeePrices = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  // Fetch formula details
  const { data: response, isLoading, error, refetch } = usePaintFormula(id as string, {
    include: {
      paint: {
        include: {
          paintType: true,
          paintBrand: true,
          color: true,
        },
      },
      components: {
        include: {
          item: {
            include: {
              brand: true,
              category: true,
              supplier: true,
            },
          },
        },
        orderBy: {
          ratio: "desc",
        },
      },
      paintProduction: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          components: true,
          paintProduction: true,
        },
      },
    },
  });

  const formula = response?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    Alert.alert("Sucesso", "Detalhes atualizados");
  };


  // Calculate totals for components
  const calculateTotals = () => {
    if (!formula?.components) return { totalRatio: 0, totalComponents: 0 };

    const _totalRatio = formula.components.reduce((sum, comp) => sum + (comp.ratio || 0), 0);
    const _totalComponents = formula.components.length;

    return { totalRatio: _totalRatio, totalComponents: _totalComponents };
  };

  const { totalRatio: _totalRatio2, totalComponents: _totalComponents2 } = calculateTotals();

  useScreenReady(!isLoading);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 16, paddingBottom: 32 }}>
          {/* MobilePaintFormulaCalculator card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 16 }}>
            {/* Calculator card header: icon + title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
              <Skeleton style={{ height: 16, width: '55%', borderRadius: 4 }} />
            </View>
            {/* Volume input area */}
            <View style={{ gap: 8 }}>
              <Skeleton style={{ height: 14, width: '45%', borderRadius: 4 }} />
              <Skeleton style={{ height: 40, borderRadius: 6 }} />
              {/* Quick volume buttons row */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} style={{ height: 32, flex: 1, borderRadius: 6 }} />
                ))}
              </View>
            </View>
            {/* Components table skeleton */}
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
              {/* Table header */}
              <View style={{ flexDirection: 'row', padding: 12, backgroundColor: colors.muted, gap: 8 }}>
                <Skeleton style={{ width: 24, height: 14, borderRadius: 4 }} />
                <Skeleton style={{ height: 14, flex: 1, borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: 70, borderRadius: 4 }} />
              </View>
              {/* Component rows: color swatch + name + weight */}
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Skeleton style={{ width: 24, height: 24, borderRadius: 12 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton style={{ height: 13, width: `${50 + i * 8}%`, borderRadius: 4 }} />
                    <Skeleton style={{ height: 11, width: '30%', borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 14, width: 55, borderRadius: 4 }} />
                </View>
              ))}
              {/* Total row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.muted + '60' }}>
                <Skeleton style={{ width: 24, height: 14, borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: '25%', borderRadius: 4 }} />
                <View style={{ flex: 1 }} />
                <Skeleton style={{ height: 14, width: 55, borderRadius: 4 }} />
              </View>
            </View>
            {/* Produce button */}
            <Skeleton style={{ height: 44, borderRadius: 8 }} />
          </View>
          {/* Production history card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
              <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
              <Skeleton style={{ height: 22, width: 30, borderRadius: 10, marginLeft: 'auto' }} />
            </View>
            <Skeleton style={{ height: 13, width: '80%', borderRadius: 4 }} />
            {[1, 2].map((i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 6, backgroundColor: colors.muted + '30' }}>
                <Skeleton style={{ height: 22, width: 60, borderRadius: 4 }} />
                <Skeleton style={{ height: 12, width: '40%', borderRadius: 4 }} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !formula) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes da fórmula"
        onRetry={refetch}
      />
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Production Calculator - Main Focus (already displays components inline) */}
        {formula.components && formula.components.length > 0 && (
          <MobilePaintFormulaCalculator formula={formula} allowPriceVisibility={canSeePrices} />
        )}

        {/* Productions Summary Card - Simple and Clean */}
        {formula._count?.paintProduction !== undefined && formula._count.paintProduction > 0 && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconBuildingFactory size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Histórico de Produção</ThemedText>
              </View>
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {formula._count.paintProduction}
              </Badge>
            </View>
            <View style={styles.itemDetails}>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.mutedForeground }])}>
                Esta fórmula foi utilizada em {formula._count.paintProduction} {formula._count.paintProduction === 1 ? "produção" : "produções"}.
              </ThemedText>
              {formula.paintProduction && formula.paintProduction.length > 0 && (
                <View style={styles.productionsList}>
                  {formula.paintProduction.slice(0, 3).map((production: any) => (
                    <View key={production.id} style={[styles.productionItem, { backgroundColor: colors.muted + '30' }]}>
                      <Badge variant="outline">
                        <ThemedText style={styles.productionVolume}>
                          {production.volumeLiters?.toFixed(2)} L
                        </ThemedText>
                      </Badge>
                      <ThemedText style={[styles.productionDate, { color: colors.mutedForeground }]}>
                        {formatDateTime(production.createdAt)}
                      </ThemedText>
                    </View>
                  ))}
                  {formula._count.paintProduction > 3 && (
                    <ThemedText style={[styles.moreProductions, { color: colors.primary }]}>
                      + {formula._count.paintProduction - 3} mais produções
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.lg }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
    marginLeft: spacing.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    flex: 1,
  },
  itemDetails: {
    gap: spacing.sm,
  },
  productionsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  productionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  productionVolume: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  productionDate: {
    fontSize: fontSize.xs,
  },
  moreProductions: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
