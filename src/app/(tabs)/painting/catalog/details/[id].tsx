import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View, RefreshControl, StyleSheet } from "react-native";
import { usePaintDetail } from '../../../../../hooks';
import { PaintCatalogCard } from "@/components/painting";
import { PaintFormulasCard } from "@/components/painting/catalog/detail/paint-formulas-card";
import { PaintTasksCard } from "@/components/painting/catalog/detail/paint-tasks-card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/components/theme-provider";
import { spacing } from "@/lib/constants";

export default function CatalogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: paintResponse,
    isLoading,
    error,
    refetch,
  } = usePaintDetail(id as string, {
    include: {
      formulas: {
        include: {
          components: {
            include: {
              item: true,
            },
          },
        },
      },
      generalPaintings: {
        include: {
          customer: true,
          createdBy: true,
          sector: true,
          services: {
            include: {
              service: true,
            },
          },
        },
      },
      logoTasks: {
        include: {
          customer: true,
          createdBy: true,
          sector: true,
          services: {
            include: {
              service: true,
            },
          },
        },
      },
      relatedPaints: true,
      relatedTo: true,
    },
  });

  const paint = paintResponse?.data;

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Carregando...",
            headerBackTitle: "Voltar",
          }}
        />
        <LoadingScreen />
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
          {/* Paint Info Card */}
          <PaintCatalogCard paint={paint!} />

          {/* Formulas Card */}
          <PaintFormulasCard paint={paint!} />

          {/* Tasks Table Card - NEW */}
          <PaintTasksCard paint={paint!} maxHeight={500} />

          {/* Metrics Card */}
          {metrics && (
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <View className="p-2 rounded-lg bg-primary/10">
                  <Icon name="bar-chart" size={20} className="text-primary" />
                </View>
                <Text className="text-lg font-semibold text-foreground">Análise de Medidas</Text>
              </View>

              <View className="gap-3">
                <View className="bg-muted/30 rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm text-muted-foreground">Completude dos Dados</Text>
                    <Badge variant={metrics.measureDataCompleteness >= 80 ? "default" : metrics.measureDataCompleteness >= 50 ? "secondary" : "destructive"}>
                      <Text className="text-xs font-medium">{metrics.measureDataCompleteness.toFixed(0)}%</Text>
                    </Badge>
                  </View>

                  <View className="flex-row justify-around">
                    <View className="items-center">
                      <Text className="text-xs text-muted-foreground mb-1">Peso</Text>
                      <Text className="text-sm font-medium">
                        {metrics.formulasWithWeightData}/{metrics.totalFormulas}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-xs text-muted-foreground mb-1">Volume</Text>
                      <Text className="text-sm font-medium">
                        {metrics.formulasWithVolumeData}/{metrics.totalFormulas}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-xs text-muted-foreground mb-1">Densidade</Text>
                      <Text className="text-sm font-medium">
                        {metrics.formulasWithDensityData}/{metrics.totalFormulas}
                      </Text>
                    </View>
                  </View>
                </View>

                {metrics.avgDensity && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">Densidade Média:</Text>
                    <Text className="text-sm font-medium">{metrics.avgDensity.toFixed(4)} g/ml</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Total de Componentes:</Text>
                  <Text className="text-sm font-medium">{metrics.totalComponents}</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Alerts */}
          {metrics && metrics.measureDataCompleteness < 50 && (
            <Alert variant="default">
              <Icon name="info" size={16} />
              <AlertDescription>
                Esta tinta possui dados de medida incompletos. Para melhor precisão na produção, considere adicionar informações de peso e volume aos componentes das fórmulas.
              </AlertDescription>
            </Alert>
          )}

          {(!paint?.formulas || paint.formulas.length === 0) && (
            <Alert>
              <Icon name="info" size={16} />
              <AlertDescription>Esta tinta ainda não possui fórmulas cadastradas. Adicione fórmulas para habilitar cálculos de produção.</AlertDescription>
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
});
