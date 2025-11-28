import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormula, usePaintFormulaMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege, formatDateTime } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobilePaintFormulaCalculator } from "@/components/painting/formula/mobile-paint-formula-calculator";
import { IconBuildingFactory, IconFactory } from "@tabler/icons-react-native";

export default function FormulaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const { delete: deleteFormula } = usePaintFormulaMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

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
    showToast({ message: "Detalhes atualizados", type: "success" });
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/(tabs)/pintura/formulas/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Fórmula",
      "Tem certeza que deseja excluir esta fórmula? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFormula(id as string);
              showToast({ message: "Fórmula excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir fórmula", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Calculate totals for components
  const calculateTotals = () => {
    if (!formula?.components) return { totalRatio: 0, totalComponents: 0 };

    const totalRatio = formula.components.reduce((sum, comp) => sum + (comp.ratio || 0), 0);
    const totalComponents = formula.components.length;

    return { totalRatio, totalComponents };
  };

  const { totalRatio, totalComponents } = calculateTotals();

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da fórmula..." />;
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
          <MobilePaintFormulaCalculator formula={formula} />
        )}

        {/* Productions Summary Card - Simple and Clean */}
        {formula._count?.paintProduction !== undefined && formula._count.paintProduction > 0 && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconFactory size={20} color={colors.mutedForeground} />
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
