import React, { useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormula } from '../../../../../hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from '../../../../../constants';
import { hasPrivilege } from '../../../../../utils';
import { showToast } from "@/components/ui/toast";
import {
  IconFlask,
  IconDroplet,
  IconCurrencyReal,
  IconRefresh,
  IconEdit,
  IconList,
  IconPalette,
} from "@tabler/icons-react-native";

export default function FormulasDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);

  // Fetch formula details
  const { data: response, isLoading, error, refetch } = usePaintFormula(id as string, {
    include: {
      paint: {
        include: {
          paintType: true,
          paintBrand: true,
        },
      },
      _count: {
        select: {
          components: true,
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
    showToast({ message: "Fórmula atualizada", type: "success" });
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/painting/formulas/edit/${id}`);
  };

  // Handle view components
  const handleViewComponents = () => {
    router.push(`/painting/formulas/${id}/components/list`);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Format number with decimals
  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

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

  const componentCount = formula._count?.components || 0;
  const hasValidDensity = formula.density && Number(formula.density) > 0;
  const hasValidPrice = formula.pricePerLiter && Number(formula.pricePerLiter) > 0;

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

        {/* Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconFlask size={24} color={colors.primary} />
              <View style={styles.headerInfo}>
                <ThemedText style={StyleSheet.flatten([styles.formulaTitle, { color: colors.foreground }])}>
                  {formula.paint?.name || "Tinta"}
                </ThemedText>
                {formula.description && (
                  <ThemedText style={StyleSheet.flatten([styles.formulaDescription, { color: colors.mutedForeground }])}>
                    {formula.description}
                  </ThemedText>
                )}
                {formula.paint?.code && (
                  <ThemedText style={StyleSheet.flatten([styles.formulaCode, { color: colors.mutedForeground }])}>
                    Código: {formula.paint.code}
                  </ThemedText>
                )}
              </View>
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
            </View>
          </CardContent>
        </Card>

        {/* Formula Stats */}
        <View style={styles.statsGrid}>
          {hasValidPrice && (
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <IconCurrencyReal size={20} color={colors.primary} />
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                    Preço/Litro
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                    {formatCurrency(Number(formula.pricePerLiter))}
                  </ThemedText>
                </View>
              </CardContent>
            </Card>
          )}
          {hasValidDensity && (
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <IconDroplet size={20} color={colors.primary} />
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                    Densidade
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                    {formatNumber(Number(formula.density), 2)} g/ml
                  </ThemedText>
                </View>
              </CardContent>
            </Card>
          )}
        </View>

        {/* Paint Information */}
        {formula.paint && (
          <Card>
            <CardContent style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <IconPalette size={20} color={colors.primary} />
                <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
                  Informações da Tinta
                </ThemedText>
              </View>
              <View style={styles.infoGrid}>
                {formula.paint.paintBrand && (
                  <View style={styles.infoRow}>
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                      Marca
                    </ThemedText>
                    <Badge variant="outline">
                      {formula.paint.paintBrand.name}
                    </Badge>
                  </View>
                )}
                {formula.paint.paintType && (
                  <View style={styles.infoRow}>
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                      Tipo
                    </ThemedText>
                    <Badge variant="outline">
                      {formula.paint.paintType.name}
                    </Badge>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Components Section */}
        <Card>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <IconList size={20} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
                Componentes
              </ThemedText>
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {componentCount}
              </Badge>
            </View>
            <TouchableOpacity
              style={StyleSheet.flatten([styles.viewComponentsButton, { backgroundColor: colors.primary }])}
              onPress={handleViewComponents}
              activeOpacity={0.7}
            >
              <ThemedText style={StyleSheet.flatten([styles.viewComponentsText, { color: colors.primaryForeground }])}>
                Ver Componentes
              </ThemedText>
            </TouchableOpacity>
          </CardContent>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  formulaTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  formulaDescription: {
    fontSize: fontSize.md,
    marginBottom: 4,
  },
  formulaCode: {
    fontSize: fontSize.sm,
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
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  sectionContent: {
    paddingVertical: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  viewComponentsButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  viewComponentsText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
