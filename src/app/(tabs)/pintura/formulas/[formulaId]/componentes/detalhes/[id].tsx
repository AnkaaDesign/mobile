import { useMemo } from "react";
import { View, ScrollView, ActivityIndicator , StyleSheet} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { IconButton } from "@/components/ui/icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintFormulaComponent, usePaintFormulaComponentMutations } from "@/hooks";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege, formatDateTime } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { Alert } from "react-native";
import {
  IconFlask,
  IconBarcode,
  IconPercentage,
  IconPackage,
  IconTag,
  IconCalendar,
  IconBuildingFactory,
} from "@tabler/icons-react-native";

export default function ComponentDetailsScreen() {
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const { formulaId, id } = useLocalSearchParams<{ formulaId: string; id: string }>();
  const { delete: deleteComponent } = usePaintFormulaComponentMutations();

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch component details
  const {
    data: component,
    isLoading,
    error,
    refetch,
  } = usePaintFormulaComponent(id!, {
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
          price: true,
        }
      }
    }
  });

  // Memoize component data for display
  const componentData = useMemo(() => {
    if (!component?.data) return null;

    return {
      item: component.data.item,
      ratio: component.data.ratio,
      formula: component.data.formula,
      createdAt: component.data.createdAt,
      updatedAt: component.data.updatedAt,
    };
  }, [component]);

  // Handle actions
  const handleEdit = () => {
    if (!canEdit) {
      showToast("Você não tem permissão para editar", "error");
      return;
    }
    router.push(`/pintura/formulas/${formulaId}/componentes/editar/${id}`);
  };

  const handleDelete = () => {
    if (!canDelete) {
      showToast("Você não tem permissão para excluir", "error");
      return;
    }

    Alert.alert(
      "Remover Componente",
      `Tem certeza que deseja remover "${componentData?.item?.name}" da fórmula? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteComponent(id!);
              showToast("Componente removido com sucesso", "success");
              router.back();
            } catch (error) {
              showToast("Erro ao remover componente", "error");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando componente...</ThemedText>
      </View>
    );
  }

  if (error || !componentData) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Erro ao carregar componente</ThemedText>
        <IconButton
          name="refresh-cw"
          variant="default"
          onPress={() => refetch()}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalhes do Componente",
          headerBackTitle: "Voltar",
          headerRight: () => (
            <View style={styles.headerActions}>
              {canEdit && (
                <IconButton
                  name="edit"
                  variant="default"
                  size="sm"
                  onPress={handleEdit}
                />
              )}
              {canDelete && (
                <IconButton
                  name="trash"
                  variant="default"
                  size="sm"
                  onPress={handleDelete}
                />
              )}
            </View>
          ),
        }}
      />
      <ScrollView
        style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Component Ratio Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPercentage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Proporção na Fórmula</ThemedText>
            </View>
          </View>
          <View style={styles.ratioDisplay}>
            <ThemedText style={styles.ratioValue}>
              {componentData.ratio.toFixed(2)}%
            </ThemedText>
            <ThemedText style={styles.ratioLabel}>do total da fórmula</ThemedText>
          </View>
        </Card>

        {/* Item Information Card */}
        {componentData.item && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconPackage size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Informações do Item</ThemedText>
              </View>
            </View>

            <View style={styles.itemInfo}>
              <ThemedText style={styles.itemName}>{componentData.item.name}</ThemedText>

              {componentData.item.uniCode && (
                <View style={styles.infoRow}>
                  <IconBarcode size={16} color={colors.muted} />
                  <ThemedText style={styles.infoLabel}>Código:</ThemedText>
                  <ThemedText style={styles.infoValue}>{componentData.item.uniCode}</ThemedText>
                </View>
              )}

              {componentData.item.category?.description && (
                <View style={styles.descriptionContainer}>
                  <ThemedText style={styles.description}>
                    {componentData.item.category.description}
                  </ThemedText>
                </View>
              )}

              <View style={styles.badgeContainer}>
                {componentData.item.brand && (
                  <Badge variant="outline" style={styles.brandBadge}>
                    <IconBuildingFactory size={14} color={colors.foreground} />
                    <ThemedText style={styles.badgeText}>{componentData.item.brand.name}</ThemedText>
                  </Badge>
                )}

                {componentData.item.category && (
                  <Badge variant="outline" style={styles.categoryBadge}>
                    <IconTag size={14} color={colors.foreground} />
                    <ThemedText style={styles.badgeText}>{componentData.item.category.name}</ThemedText>
                  </Badge>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Formula Information Card */}
        {componentData.formula && (
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconFlask size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Fórmula</ThemedText>
              </View>
            </View>

            <View style={styles.formulaInfo}>
              {componentData.formula.paint && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Tinta:</ThemedText>
                  <ThemedText style={styles.infoValue}>{componentData.formula.paint.name}</ThemedText>
                </View>
              )}

              {componentData.formula.description && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Descrição:</ThemedText>
                  <ThemedText style={styles.infoValue}>{componentData.formula.description}</ThemedText>
                </View>
              )}

              {componentData.formula.density && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Densidade:</ThemedText>
                  <ThemedText style={styles.infoValue}>{componentData.formula.density} g/mL</ThemedText>
                </View>
              )}

              {componentData.formula.pricePerLiter && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Preço por Litro:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    R$ {componentData.formula.pricePerLiter.toFixed(2)}
                  </ThemedText>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Audit Information Card */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconCalendar size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações de Auditoria</ThemedText>
            </View>
          </View>

          <View style={styles.auditInfo}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Criado em:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDateTime(componentData.createdAt)}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Última atualização:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDateTime(componentData.updatedAt)}
              </ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  errorText: {
    marginBottom: spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  loadingText: {
    marginTop: spacing.md,
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
  ratioCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    alignItems: "center",
  },
  ratioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  ratioDisplay: {
    alignItems: "center",
  },
  ratioValue: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: "#007AFF",
  },
  ratioLabel: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    marginTop: spacing.xs,
  },
  itemCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  formulaCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  auditCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  itemInfo: {
    gap: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    opacity: 0.7,
    minWidth: 80,
  },
  infoValue: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    lineHeight: 18,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255, 149, 0, 0.1)",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(52, 199, 89, 0.1)",
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  formulaInfo: {
    gap: spacing.xs,
  },
  auditInfo: {
    gap: spacing.xs,
  },
});