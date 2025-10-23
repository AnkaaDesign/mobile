import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintTypeDetail, usePaintTypeMutations, usePaintsInfinite } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE, PAINT_TYPE_ENUM_LABELS } from "@/constants";
import { hasPrivilege } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Alert as AlertComponent } from "@/components/ui/alert";
import {
  IconEdit,
  IconTrash,
  IconCategory,
  IconAlertTriangle,
  IconDroplet,
  IconPackage,
  IconPalette,
  IconChevronRight,
} from "@tabler/icons-react-native";

export default function PaintTypeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { delete: deletePaintType } = usePaintTypeMutations();

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
                  hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch paint type details
  const {
    data: paintTypeResponse,
    isLoading,
    error,
    refetch,
  } = usePaintTypeDetail(id as string, {
    include: {
      paints: {
        include: {
          paintBrand: true,
        },
        take: 10,
      },
      componentItems: true,
      _count: {
        select: {
          paints: true,
          componentItems: true,
        },
      },
    },
  });

  const paintType = paintTypeResponse?.data;

  // Fetch paints for this type
  const {
    data: paintsData,
    isLoading: isPaintsLoading
  } = usePaintsInfinite({
    where: { paintTypeId: id },
    include: {
      paintBrand: true,
      _count: {
        select: {
          formulas: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  const paints = paintsData?.pages.flatMap((page) => page.data) || [];

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      showToast({ message: "Detalhes atualizados", type: "success" });
    } catch (error) {
      showToast({ message: "Erro ao atualizar dados", type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/(tabs)/painting/paint-types/edit/${id}`);
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
              await deletePaintType(id as string);
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
    return (
      <>
        <Stack.Screen
          options={{
            title: "Carregando...",
            headerBackTitle: "Voltar",
          }}
        />
        <LoadingScreen message="Carregando detalhes do tipo de tinta..." />
      </>
    );
  }

  if (error || !paintType) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen
          message="Erro ao carregar detalhes do tipo de tinta"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: paintType.name || "Tipo de Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
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
          {/* Paint Type Name Header Card */}
          <Card>
            <CardContent style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <ThemedText
                  style={[styles.paintTypeTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {paintType.name}
                </ThemedText>
                {paintType.type && (
                  <Badge variant="secondary" style={styles.typeBadge}>
                    {PAINT_TYPE_ENUM_LABELS[paintType.type as keyof typeof PAINT_TYPE_ENUM_LABELS] || paintType.type}
                  </Badge>
                )}
              </View>
              <View style={styles.headerActions}>
                {canEdit && (
                  <TouchableOpacity
                    onPress={handleEdit}
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    activeOpacity={0.7}
                  >
                    <IconEdit size={18} color={colors.primaryForeground} />
                  </TouchableOpacity>
                )}
                {canDelete && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                    activeOpacity={0.7}
                  >
                    <IconTrash size={18} color={colors.destructiveForeground} />
                  </TouchableOpacity>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Type Info Card */}
          <Card style={styles.card}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <IconCategory size={20} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Informações do Tipo
              </ThemedText>
            </View>
            <View style={styles.infoContent}>
              {/* Ground requirement alert */}
              {paintType.needGround && (
                <AlertComponent
                  variant="warning"
                  icon={<IconAlertTriangle size={18} />}
                  style={styles.groundAlert}
                >
                  <View>
                    <ThemedText style={[styles.alertTitle, { color: colors.foreground }]}>
                      Requer Aplicação de Fundo
                    </ThemedText>
                    <ThemedText style={[styles.alertDescription, { color: colors.mutedForeground }]}>
                      Tintas deste tipo necessitam de uma camada de fundo/primer antes da aplicação final para garantir melhor aderência e acabamento.
                    </ThemedText>
                  </View>
                </AlertComponent>
              )}

              {/* Statistics */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
                  <View style={styles.statIcon}>
                    <IconPalette size={24} color={colors.primary} />
                  </View>
                  <View style={styles.statInfo}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                      {paintType._count?.paints || 0}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                      Tintas Cadastradas
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
                  <View style={styles.statIcon}>
                    <IconPackage size={24} color={colors.primary} />
                  </View>
                  <View style={styles.statInfo}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                      {paintType._count?.componentItems || 0}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                      Componentes
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Associated Paints Card */}
          {paints.length > 0 && (
            <Card style={styles.card}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <IconDroplet size={20} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Tintas Deste Tipo
                </ThemedText>
                <Badge variant="secondary">
                  {paintType._count?.paints || 0}
                </Badge>
              </View>
              <View style={styles.paintsList}>
                {paints.slice(0, 10).map((paint: any) => (
                  <TouchableOpacity
                    key={paint.id}
                    style={[styles.paintItem, { borderColor: colors.border }]}
                    onPress={() => router.push(`/(tabs)/painting/catalog/details/${paint.id}`)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.paintColorPreview,
                        {
                          backgroundColor: paint.hex,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <View style={styles.paintInfo}>
                      <ThemedText style={[styles.paintName, { color: colors.foreground }]}>
                        {paint.name}
                      </ThemedText>
                      {paint.code && (
                        <ThemedText style={[styles.paintCode, { color: colors.mutedForeground }]}>
                          {paint.code}
                        </ThemedText>
                      )}
                      {paint.paintBrand && (
                        <ThemedText style={[styles.paintBrand, { color: colors.mutedForeground }]}>
                          {paint.paintBrand.name}
                        </ThemedText>
                      )}
                    </View>
                    {paint._count?.formulas !== undefined && (
                      <Badge variant="outline" style={styles.formulasBadge}>
                        {paint._count.formulas} fórmula{paint._count.formulas !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <IconChevronRight size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
                {paintType._count?.paints && paintType._count.paints > 10 && (
                  <TouchableOpacity
                    style={[styles.viewAllButton, { borderColor: colors.primary }]}
                    onPress={() => router.push(`/(tabs)/painting/catalog?typeId=${id}`)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>
                      Ver todas as {paintType._count.paints} tintas
                    </ThemedText>
                    <IconChevronRight size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}

          {/* Component Items Card */}
          {paintType.componentItems && paintType.componentItems.length > 0 && (
            <Card style={styles.card}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <IconPackage size={20} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Componentes Compatíveis
                </ThemedText>
                <Badge variant="secondary">
                  {paintType.componentItems.length}
                </Badge>
              </View>
              <View style={styles.componentsList}>
                {paintType.componentItems.map((item: any) => (
                  <View key={item.id} style={[styles.componentItem, { borderColor: colors.border }]}>
                    <ThemedText style={[styles.componentName, { color: colors.foreground }]}>
                      {item.name}
                    </ThemedText>
                    {item.code && (
                      <ThemedText style={[styles.componentCode, { color: colors.mutedForeground }]}>
                        {item.code}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Changelog History */}
          <Card style={styles.card}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Histórico de Alterações
              </ThemedText>
            </View>
            <View style={{ paddingHorizontal: spacing.md }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.PAINT_TYPE}
                entityId={paintType.id}
                entityName={paintType.name}
                entityCreatedAt={paintType.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </>
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
    gap: spacing.xs,
  },
  paintTypeTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  typeBadge: {
    alignSelf: "flex-start",
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
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  infoContent: {
    gap: spacing.md,
  },
  groundAlert: {
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
  },
  paintsList: {
    gap: spacing.sm,
  },
  paintItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  paintColorPreview: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  paintInfo: {
    flex: 1,
    gap: 2,
  },
  paintName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  paintCode: {
    fontSize: fontSize.xs,
  },
  paintBrand: {
    fontSize: fontSize.xs,
  },
  formulasBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderStyle: "dashed",
    marginTop: spacing.sm,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  componentsList: {
    gap: spacing.sm,
  },
  componentItem: {
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  componentName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  componentCode: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});