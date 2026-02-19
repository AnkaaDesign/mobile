import React from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ScrollView, View, RefreshControl, StyleSheet, TouchableOpacity, Alert as RNAlert } from "react-native";
import { usePaintDetail, usePaintMutations, useScreenReady } from "@/hooks";
import {
  PaintFormulasCard,
  PaintTasksCard,
  PaintRelatedPaintsCard,
  PaintSpecificationsCard,
  PaintGroundPaintsCard,
  PaintProductionHistoryCard,
} from "@/components/painting/catalog/detail";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import { IconEdit, IconTrash, IconPaint } from "@tabler/icons-react-native";


import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deletePaint } = usePaintMutations();
  const [refreshing, setRefreshing] = React.useState(false);

  // End navigation loading overlay when screen mounts

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const userPrivilege = user?.sector?.privileges;

  // Only WAREHOUSE and ADMIN can see production history (full catalogue only accessible by these roles)
  const canSeeProductionHistory = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN;

  // Formula navigation always allowed in full catalogue (restricted to WAREHOUSE/ADMIN)
  const canNavigateToFormulas = true;

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
          paintProduction: true,
          paint: true,
        },
        // Include calculated fields for pricePerLiter and density
        // These should be computed by the backend
      },
      relatedPaints: true,
      relatedTo: true,
      paintGrounds: {
        include: {
          groundPaint: {
            include: {
              paintType: true,
              paintBrand: true,
            },
          },
        },
      },
      generalPaintings: {
        select: {
          id: true,
          name: true,
          status: true,
          customer: {
            select: {
              id: true,
              fantasyName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
          services: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      logoTasks: {
        select: {
          id: true,
          name: true,
          status: true,
          customer: {
            select: {
              id: true,
              fantasyName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
          services: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  useScreenReady(!isLoading);

  const paint = paintResponse?.data;

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      RNAlert.alert("Erro", "Você não tem permissão para editar");
      return;
    }
    router.push(`/pintura/catalogo/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      RNAlert.alert("Erro", "Você não tem permissão para excluir");
      return;
    }

    RNAlert.alert(
      "Excluir Tinta",
      `Tem certeza que deseja excluir "${paint?.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePaint(id as string);
              RNAlert.alert("Sucesso", "Tinta excluída com sucesso");
              router.back();
            } catch (_error) {
              // API client already shows error alert
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
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 16, gap: 16, paddingBottom: 32 }}>
            {/* Header card skeleton: icon + name + action buttons */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Skeleton style={{ width: 40, height: 40, borderRadius: 8 }} />
                <Skeleton style={{ height: 20, flex: 1, borderRadius: 4 }} />
                <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
                <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
              </View>
            </View>
            {/* Color preview + specs card */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
              <Skeleton style={{ height: 100, borderRadius: 0 }} />
              <View style={{ padding: 16, gap: 10 }}>
                <Skeleton style={{ height: 14, width: '50%', borderRadius: 4 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton style={{ height: 13, width: '35%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 13, width: '40%', borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton style={{ height: 13, width: '40%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 13, width: '30%', borderRadius: 4 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton style={{ height: 13, width: '30%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 13, width: '45%', borderRadius: 4 }} />
                </View>
              </View>
            </View>
            {/* Formulas card skeleton */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 16, width: '40%', borderRadius: 4 }} />
              </View>
              {[1, 2].map((i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                  <Skeleton style={{ height: 14, width: '55%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 22, width: 60, borderRadius: 4 }} />
                </View>
              ))}
            </View>
            {/* Tasks card skeleton */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 16, width: '35%', borderRadius: 4 }} />
              </View>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                  <Skeleton style={{ height: 14, width: '60%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 22, width: 70, borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
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
        <ErrorScreen title="Erro ao carregar tinta" message={error?.message || "Tinta não encontrada"} />
      </>
    );
  }

  // Calculate comprehensive paint metrics
  const calculatePaintMetrics = () => {
    if (!paint?.formulas || paint.formulas.length === 0) {
      return null;
    }

    let totalComponents = 0;
    let formulasWithWeightData = 0;
    let formulasWithVolumeData = 0;
    let formulasWithDensityData = 0;
    let avgDensity = 0;
    let densityCount = 0;

    paint.formulas.forEach((formula) => {
      if (formula.components) {
        totalComponents += formula.components.length;

        let hasWeight = false;
        let hasVolume = false;
        let hasDensity = false;

        formula.components.forEach((component) => {
          if (component.ratio) hasWeight = true;
          if (component.ratio) hasVolume = true;
          if (component.ratio) hasDensity = true;
        });

        if (hasWeight) formulasWithWeightData++;
        if (hasVolume) formulasWithVolumeData++;
        if (hasDensity) formulasWithDensityData++;

        if (formula.density) {
          avgDensity += formula.density;
          densityCount++;
        }
      }
    });

    return {
      totalFormulas: paint.formulas.length,
      totalComponents,
      formulasWithWeightData,
      formulasWithVolumeData,
      formulasWithDensityData,
      avgDensity: densityCount > 0 ? avgDensity / densityCount : null,
      measureDataCompleteness: paint.formulas.length > 0 ? ((formulasWithWeightData + formulasWithVolumeData) / (paint.formulas.length * 2)) * 100 : 0,
    };
  };

  const metrics = calculatePaintMetrics();

  return (
    <>
      <Stack.Screen
        options={{
          title: paint?.name || "Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.container}>
          {/* Header Card with Paint Name and Actions */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <IconPaint size={24} color={colors.primary} />
              </View>
              <View style={styles.headerLeft}>
                <ThemedText style={[styles.paintTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {paint.name}
                </ThemedText>
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
            </View>
          </Card>

          {/* Specifications Card - Detailed info with color codes */}
          <PaintSpecificationsCard paint={paint!} />

          {/* Ground Paints Card - Recommended base paints */}
          <PaintGroundPaintsCard paint={paint!} />

          {/* Formulas Card */}
          <PaintFormulasCard paint={paint!} canNavigate={canNavigateToFormulas} />

          {/* Tasks Table Card */}
          <PaintTasksCard paint={paint!} maxHeight={500} />

          {/* Production History Card - Only for WAREHOUSE and ADMIN */}
          {canSeeProductionHistory && (
            <PaintProductionHistoryCard paint={paint!} maxHeight={400} />
          )}

          {/* Related Paints Card */}
          <PaintRelatedPaintsCard paint={paint!} />

          {/* Alerts */}
          {metrics && metrics.measureDataCompleteness < 50 && (
            <Alert variant="default">
              <Icon name="info" size={16} />
              <AlertDescription>
                Esta tinta possui dados de medida incompletos. Para melhor precisão na produção, considere adicionar informações de peso e volume aos componentes das fórmulas.
              </AlertDescription>
            </Alert>
          )}

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  paintTitle: {
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
  previewContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  hexBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hexText: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#FFFFFF",
    fontWeight: "600",
  },
  headerInfo: {
    gap: spacing.xs,
  },
  paintName: {
    fontSize: 24,
    fontWeight: "700",
  },
  paintCode: {
    fontSize: 14,
  },
  finishBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
  },
  finishText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
