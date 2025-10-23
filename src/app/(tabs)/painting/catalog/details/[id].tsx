import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePaintDetail, usePaintMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { hasPrivilege } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import {
  IconEdit,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react-native";
import { TouchableOpacity } from "react-native";

// Import new card components
import {
  PaintInfoCard,
  PaintFormulaCard,
  PaintRelatedCard,
  PaintTypeCard,
  PaintBrandCard,
} from "@/components/painting/detail";

export default function CatalogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { delete: deletePaint } = usePaintMutations();

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
                  hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch paint details with all relations
  const {
    data: paintResponse,
    isLoading,
    error,
    refetch,
  } = usePaintDetail(id as string, {
    include: {
      paintType: true,
      paintBrand: true,
      formulas: {
        include: {
          components: {
            include: {
              item: true,
            },
          },
          _count: {
            select: {
              components: true,
              productions: true,
            },
          },
        },
      },
      relatedPaints: true,
      relatedTo: true,
      paintGrounds: {
        include: {
          groundPaint: true,
        },
      },
      groundPaintFor: {
        include: {
          paint: true,
        },
      },
      _count: {
        select: {
          formulas: true,
          productions: true,
          relatedPaints: true,
          relatedTo: true,
          generalPaintings: true,
          logoPaints: true,
        },
      },
    },
  });

  const paint = paintResponse?.data;

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
    router.push(`/(tabs)/painting/catalog/edit/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Tinta",
      "Tem certeza que deseja excluir esta tinta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaint(id as string);
              showToast({ message: "Tinta excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir tinta", type: "error" });
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
        <LoadingScreen message="Carregando detalhes da tinta..." />
      </>
    );
  }

  if (error || !paint) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen
          message="Erro ao carregar detalhes da tinta"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: paint.name,
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
          {/* Paint Name Header Card */}
          <Card>
            <CardContent style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <ThemedText
                  style={[styles.paintTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {paint.name}
                </ThemedText>
                {paint.code && (
                  <ThemedText
                    style={[styles.paintCode, { color: colors.mutedForeground }]}
                  >
                    Código: {paint.code}
                  </ThemedText>
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

          {/* Paint Info Card */}
          <PaintInfoCard paint={paint} />

          {/* Paint Type Card */}
          <PaintTypeCard paintType={paint.paintType} />

          {/* Paint Brand Card */}
          <PaintBrandCard paintBrand={paint.paintBrand} />

          {/* Paint Formulas Card */}
          <PaintFormulaCard formulas={paint.formulas} paintId={paint.id} />

          {/* Related Paints Card */}
          <PaintRelatedCard
            relatedPaints={paint.relatedPaints}
            relatedTo={paint.relatedTo}
          />

          {/* Ground Paints Card (if applicable) */}
          {paint.paintGrounds && paint.paintGrounds.length > 0 && (
            <Card style={styles.card}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Tintas de Fundo
                </ThemedText>
                <Badge variant="secondary">
                  {paint.paintGrounds.length}
                </Badge>
              </View>
              <View style={styles.groundList}>
                {paint.paintGrounds.map((ground) => (
                  <TouchableOpacity
                    key={ground.id}
                    style={[styles.groundItem, { borderColor: colors.border }]}
                    onPress={() => router.push(`/(tabs)/painting/catalog/details/${ground.groundPaint?.id}`)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.groundColorPreview,
                        {
                          backgroundColor: ground.groundPaint?.hex || "#ccc",
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <View style={styles.groundInfo}>
                      <ThemedText style={[styles.groundName, { color: colors.foreground }]}>
                        {ground.groundPaint?.name || "Fundo"}
                      </ThemedText>
                      {ground.groundPaint?.code && (
                        <ThemedText style={[styles.groundCode, { color: colors.mutedForeground }]}>
                          {ground.groundPaint.code}
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Usage Statistics */}
          {paint._count && (
            <Card style={styles.card}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Estatísticas de Uso
                </ThemedText>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                    {paint._count.generalPaintings || 0}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Pinturas Gerais
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                    {paint._count.logoPaints || 0}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Pinturas de Logo
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                    {paint._count.productions || 0}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Produções
                  </ThemedText>
                </View>
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
                entityType={CHANGE_LOG_ENTITY_TYPE.PAINT}
                entityId={paint.id}
                entityName={paint.name}
                entityCreatedAt={paint.createdAt}
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
  },
  paintTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  paintCode: {
    fontSize: fontSize.sm,
    marginTop: 2,
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
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  groundList: {
    gap: spacing.sm,
  },
  groundItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  groundColorPreview: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
  groundInfo: {
    flex: 1,
  },
  groundName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  groundCode: {
    fontSize: fontSize.xs,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});