import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormula, usePaintFormulaMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { hasPrivilege, formatCurrency, formatDateTime, formatDensity } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobilePaintFormulaCalculator } from "@/components/painting/formula/mobile-paint-formula-calculator";
import { FormulaComponentsTable } from "@/components/painting/formula/detail/components-table";
import { FormulaProductionsTable } from "@/components/painting/formula/detail/productions-table";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import {
  IconFlask,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconDroplet,
  IconClipboardList,
  IconHistory,
} from "@tabler/icons-react-native";

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
        {/* Header with Edit Button */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.formulaTitle}>
              {formula.description || (formula.paint?.name ? `Fórmula de ${formula.paint.name}` : "Fórmula de Tinta")}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            {canEdit && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <IconEdit size={20} color={colors.primaryForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Production Calculator - Main Focus */}
        {formula.components && formula.components.length > 0 && (
          <MobilePaintFormulaCalculator formula={formula} />
        )}

        {/* Specifications Card */}
        <Card style={[styles.card, { backgroundColor: colors.muted + "30" }]}>
          <View style={styles.sectionHeader}>
            <IconDroplet size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Especificações</ThemedText>
          </View>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <ThemedText style={[styles.specLabel, { color: colors.mutedForeground }]}>
                Densidade
              </ThemedText>
              <ThemedText style={[styles.specValue, { color: colors.foreground }]}>
                {formatDensity(Number(formula.density))} g/ml
              </ThemedText>
            </View>
            <View style={styles.specItem}>
              <ThemedText style={[styles.specLabel, { color: colors.mutedForeground }]}>
                Preço por Litro
              </ThemedText>
              <ThemedText style={[styles.specValue, { color: colors.foreground }]}>
                {formatCurrency(formula.pricePerLiter)}
              </ThemedText>
            </View>
          </View>
          {formula.description && (
            <View style={styles.descriptionSection}>
              <ThemedText style={[styles.specLabel, { color: colors.mutedForeground }]}>
                Descrição
              </ThemedText>
              <ThemedText style={[styles.descriptionText, { color: colors.foreground }]}>
                {formula.description}
              </ThemedText>
            </View>
          )}
        </Card>

        {/* Components Table */}
        <FormulaComponentsTable formula={formula} maxHeight={400} />

        {/* Productions Table */}
        <FormulaProductionsTable formula={formula} maxHeight={400} />

        {/* Changelog History */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <IconHistory size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
          </View>
          <ThemedText style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Acompanhe todas as modificações realizadas nesta fórmula
          </ThemedText>
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.PAINT_FORMULA}
            entityId={formula.id}
            entityName={formula.paint?.name || "Fórmula"}
            entityCreatedAt={formula.createdAt}
            maxHeight={400}
            limit={50}
          />
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  formulaTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  specsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  specItem: {
    flex: 1,
    gap: spacing.xs,
  },
  specLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  specValue: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  descriptionSection: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    width: 120,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    flex: 1,
  },
  itemDetails: {
    gap: spacing.sm,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  colorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  colorSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  componentsList: {
    gap: spacing.sm,
  },
  componentCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  componentCardMargin: {
    marginBottom: spacing.xs,
  },
  componentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  componentInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  componentName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  componentCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  componentCodeText: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  componentRatio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  ratioText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  componentBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  componentBadgeText: {
    fontSize: fontSize.xs,
  },
});
