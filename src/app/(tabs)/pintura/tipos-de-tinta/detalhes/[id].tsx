import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintType, usePaintTypeMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege, formatDate } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconRefresh,
  IconEdit,
  IconTrash,
  IconPaint,
  IconSettings,
  IconComponents,
  IconInfoCircle,
  IconBrush,
  IconCalendar,
} from "@tabler/icons-react-native";

export default function PaintTypeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = usePaintTypeMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  // Fixed: PAINTING doesn't exist in SECTOR_PRIVILEGES, using PRODUCTION instead
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch paint type details
  const { data: response, isLoading, error, refetch } = usePaintType(id as string, {
    include: {
      componentItems: {
        include: {
          measures: true,
          category: true,
          brand: true,
        },
      },
      paints: {
        orderBy: { name: "asc" },
        include: {
          paintBrand: true,
          formulas: true,
        },
      },
      _count: {
        select: {
          paints: true,
          componentItems: true,
        },
      },
    },
    enabled: !!id,
  });

  const paintType = response?.data;

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
    router.push(`/pintura/tipos-de-tinta/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Tipo de Tinta",
      "Tem certeza que deseja excluir este tipo de tinta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Tipo de tinta excluído com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir tipo de tinta", type: "error" });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes do tipo de tinta..." />;
  }

  if (error || !paintType) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do tipo de tinta"
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
        {/* Header Card with Title and Actions */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.paintTypeTitle, { color: colors.foreground }])} numberOfLines={2}>
                {paintType.name}
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
          <View style={styles.sectionHeader}>
            <IconInfoCircle size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Nome</ThemedText>
              <ThemedText style={styles.detailValue}>{paintType.name}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Requer Fundo</ThemedText>
              <Badge variant={paintType.needGround ? "default" : "secondary"}>
                {paintType.needGround ? "Sim" : "Não"}
              </Badge>
            </View>
          </View>
        </Card>

        {/* Statistics Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconSettings size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Estatísticas</ThemedText>
          </View>
          <View style={styles.statisticsGrid}>
            <View style={StyleSheet.flatten([styles.statItem, { backgroundColor: colors.muted }])}>
              <IconPaint size={24} color={colors.primary} />
              <ThemedText style={styles.statValue}>{paintType._count?.paints || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Tintas</ThemedText>
            </View>
            <View style={StyleSheet.flatten([styles.statItem, { backgroundColor: colors.muted }])}>
              <IconComponents size={24} color={colors.primary} />
              <ThemedText style={styles.statValue}>{paintType._count?.componentItems || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Componentes</ThemedText>
            </View>
          </View>
        </Card>

        {/* Related Paints Section */}
        {paintType.paints && paintType.paints.length > 0 ? (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconBrush size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Tintas Relacionadas</ThemedText>
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {paintType.paints.length}
              </Badge>
            </View>
            <View style={styles.paintsList}>
              {paintType.paints.map((paint: any) => (
                <TouchableOpacity
                  key={paint.id}
                  style={StyleSheet.flatten([
                    styles.paintItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }
                  ])}
                  onPress={() => router.push(`/pintura/catalogo/detalhes/${paint.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paintItemLeft}>
                    <View
                      style={StyleSheet.flatten([
                        styles.colorPreview,
                        {
                          backgroundColor: paint.hex || colors.muted,
                          borderColor: colors.border,
                        }
                      ])}
                    />
                    <View style={styles.paintInfo}>
                      <ThemedText style={styles.paintName} numberOfLines={1}>
                        {paint.name}
                      </ThemedText>
                      {paint.paintBrand?.name && (
                        <ThemedText style={styles.paintBrand} numberOfLines={1}>
                          {paint.paintBrand.name}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <View style={styles.paintItemRight}>
                    {paint.formulas && paint.formulas.length > 0 && (
                      <Badge variant="outline" size="sm">
                        {paint.formulas.length} fórmula(s)
                      </Badge>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconBrush size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Tintas Relacionadas</ThemedText>
            </View>
            <View style={styles.emptyState}>
              <IconPaint size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
              <ThemedText style={styles.emptyStateText}>
                Nenhuma tinta cadastrada para este tipo
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Components Section */}
        {paintType.componentItems && paintType.componentItems.length > 0 ? (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconComponents size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Componentes</ThemedText>
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {paintType.componentItems.length}
              </Badge>
            </View>
            <View style={styles.componentsList}>
              {paintType.componentItems.map((component: any) => (
                <View
                  key={component.id}
                  style={StyleSheet.flatten([
                    styles.componentItem,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    }
                  ])}
                >
                  <View style={styles.componentInfo}>
                    <ThemedText style={styles.componentName} numberOfLines={1}>
                      {component.name}
                    </ThemedText>
                    <View style={styles.componentMeta}>
                      {component.brand?.name && (
                        <Badge variant="outline" size="sm">
                          {component.brand.name}
                        </Badge>
                      )}
                      {component.category?.name && (
                        <Badge variant="outline" size="sm">
                          {component.category.name}
                        </Badge>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconComponents size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Componentes</ThemedText>
            </View>
            <View style={styles.emptyState}>
              <IconComponents size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
              <ThemedText style={styles.emptyStateText}>
                Nenhum componente configurado para este tipo
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Metadata Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconCalendar size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Metadados</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Data de Criação</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(paintType.createdAt)}
              </ThemedText>
            </View>
            {paintType.updatedAt && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Última Atualização</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(paintType.updatedAt)}
                </ThemedText>
              </View>
            )}
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
  paintTypeTitle: {
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
  itemDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
  },
  statisticsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  paintsList: {
    gap: spacing.sm,
  },
  paintItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  paintItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  paintInfo: {
    flex: 1,
  },
  paintName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  paintBrand: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: 2,
  },
  paintItemRight: {
    marginLeft: spacing.sm,
  },
  componentsList: {
    gap: spacing.sm,
  },
  componentItem: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  componentInfo: {
    gap: spacing.xs,
  },
  componentName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  componentMeta: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
  },
});
