import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormula, usePaintFormulaMutations } from '../../../../../hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../../constants';
import { hasPrivilege, formatCurrency, formatDateTime } from '../../../../../utils';
import { showToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconFlask,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconDroplet,
  IconCurrencyReal,
  IconPaint,
  IconTag,
  IconBarcode,
  IconPackage,
  IconPercentage,
  IconCalendar,
  IconClipboardList,
  IconBuildingFactory,
} from "@tabler/icons-react-native";

export default function FormulaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
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
      _count: {
        select: {
          components: true,
          productions: true,
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
    // Navigate to edit page when implemented
    showToast({ message: "Edição em desenvolvimento", type: "info" });
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
        {/* Formula Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.formulaTitle, { color: colors.foreground }])} numberOfLines={2}>
                {formula.description || (formula.paint?.name ? `Fórmula de ${formula.paint.name}` : "Fórmula de Tinta")}
              </ThemedText>
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
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color={colors.destructiveForeground} />
                </TouchableOpacity>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Basic Information Card */}
        <Card style={styles.card}>
          <View style={StyleSheet.flatten([styles.sectionHeader, { borderBottomColor: colors.border }])}>
            <IconFlask size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            {formula.description && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Descrição:
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formula.description}
                </ThemedText>
              </View>
            )}
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Componentes:
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {totalComponents} {totalComponents === 1 ? "componente" : "componentes"}
              </ThemedText>
            </View>
            {formula._count?.productions !== undefined && (
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Produções:
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formula._count.productions} {formula._count.productions === 1 ? "produção" : "produções"}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Formula Details Card */}
        <Card style={styles.card}>
          <View style={StyleSheet.flatten([styles.sectionHeader, { borderBottomColor: colors.border }])}>
            <IconDroplet size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Especificações Técnicas</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Densidade:
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {formula.density ? `${Number(formula.density).toFixed(3)} g/ml` : "N/A"}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Preço por Litro:
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.primary }])}>
                {formula.pricePerLiter ? formatCurrency(Number(formula.pricePerLiter)) : "N/A"}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Proporção Total:
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {totalRatio.toFixed(2)}%
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Paint Information Card */}
        {formula.paint && (
          <Card style={styles.card}>
            <View style={StyleSheet.flatten([styles.sectionHeader, { borderBottomColor: colors.border }])}>
              <IconPaint size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Informações da Tinta</ThemedText>
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                  Nome:
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                  {formula.paint.name}
                </ThemedText>
              </View>
              {formula.paint.code && (
                <View style={styles.detailRow}>
                  <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                    Código:
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                    {formula.paint.code}
                  </ThemedText>
                </View>
              )}
              <View style={styles.badgeContainer}>
                {formula.paint.paintType && (
                  <Badge variant="outline" style={styles.typeBadge}>
                    <IconTag size={14} color={colors.foreground} />
                    <ThemedText style={styles.badgeText}>{formula.paint.paintType.name}</ThemedText>
                  </Badge>
                )}
                {formula.paint.paintBrand && (
                  <Badge variant="outline" style={styles.brandBadge}>
                    <IconBuildingFactory size={14} color={colors.foreground} />
                    <ThemedText style={styles.badgeText}>{formula.paint.paintBrand.name}</ThemedText>
                  </Badge>
                )}
                {formula.paint.color && (
                  <Badge variant="outline" style={styles.colorBadge}>
                    <View style={[styles.colorSwatch, { backgroundColor: formula.paint.color.hexCode || colors.muted }]} />
                    <ThemedText style={styles.badgeText}>{formula.paint.color.name}</ThemedText>
                  </Badge>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Components Section */}
        {formula.components && formula.components.length > 0 && (
          <Card style={styles.card}>
            <View style={StyleSheet.flatten([styles.sectionHeader, { borderBottomColor: colors.border }])}>
              <IconPackage size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Componentes</ThemedText>
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {formula.components.length}
              </Badge>
            </View>
            <View style={styles.componentsList}>
              {formula.components.map((component, index) => (
                <View
                  key={component.id}
                  style={StyleSheet.flatten([
                    styles.componentCard,
                    {
                      backgroundColor: colors.muted + '20',
                      borderColor: colors.border,
                    },
                    index < formula.components!.length - 1 && styles.componentCardMargin
                  ])}
                >
                  <View style={styles.componentHeader}>
                    <View style={styles.componentInfo}>
                      <ThemedText style={styles.componentName} numberOfLines={1}>
                        {component.item?.name || "Item desconhecido"}
                      </ThemedText>
                      {component.item?.uniCode && (
                        <View style={styles.componentCode}>
                          <IconBarcode size={12} color={colors.mutedForeground} />
                          <ThemedText style={styles.componentCodeText}>
                            {component.item.uniCode}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <View style={styles.componentRatio}>
                      <IconPercentage size={16} color={colors.primary} />
                      <ThemedText style={StyleSheet.flatten([styles.ratioText, { color: colors.primary }])}>
                        {component.ratio ? component.ratio.toFixed(2) : '0.00'}%
                      </ThemedText>
                    </View>
                  </View>
                  {(component.item?.brand || component.item?.category) && (
                    <View style={styles.componentBadges}>
                      {component.item?.brand && (
                        <Badge variant="outline" size="sm">
                          <ThemedText style={styles.componentBadgeText}>
                            {component.item.brand.name}
                          </ThemedText>
                        </Badge>
                      )}
                      {component.item?.category && (
                        <Badge variant="outline" size="sm">
                          <ThemedText style={styles.componentBadgeText}>
                            {component.item.category.name}
                          </ThemedText>
                        </Badge>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Productions Summary Card */}
        {formula._count?.productions !== undefined && formula._count.productions > 0 && (
          <Card style={styles.card}>
            <View style={StyleSheet.flatten([styles.sectionHeader, { borderBottomColor: colors.border }])}>
              <IconClipboardList size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Produções</ThemedText>
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {formula._count.productions}
              </Badge>
            </View>
            <View style={styles.itemDetails}>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.mutedForeground }])}>
                Esta fórmula foi utilizada em {formula._count.productions} {formula._count.productions === 1 ? "produção" : "produções"}.
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Metadata Card */}
        <Card style={styles.card}>
          <View style={StyleSheet.flatten([styles.sectionHeader, { borderBottomColor: colors.border }])}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Informações do Sistema</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Criado em:
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {formatDateTime(formula.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Atualizado em:
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {formatDateTime(formula.updatedAt)}
              </ThemedText>
            </View>
          </View>
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
    width: 36,
    height: 36,
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
