import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { usePaintDetail } from '../../../../../hooks';
import { PaintCatalogCard } from "@/components/painting";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CatalogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: paintResponse,
    isLoading,
    error,
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
      relatedPaints: true,
      relatedTo: true,
    },
  });

  const paint = paintResponse?.data;

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
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 space-y-4">
          <PaintCatalogCard paint={paint!} showFormulas={true} />

          {metrics && (
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="bar-chart" size={16} className="text-primary" />
                <Text className="text-base font-medium text-foreground">Análise de Medidas</Text>
              </View>

              <View className="space-y-3">
                <View className="bg-muted/30 rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">Completude dos Dados</Text>
                    <Badge variant={metrics.measureDataCompleteness >= 80 ? "default" : metrics.measureDataCompleteness >= 50 ? "secondary" : "destructive"}>
                      {metrics.measureDataCompleteness.toFixed(0)}%
                    </Badge>
                  </View>

                  <View className="grid grid-cols-3 gap-2 text-xs">
                    <View className="text-center">
                      <Text className="text-muted-foreground">Peso</Text>
                      <Text className="font-medium">
                        {metrics.formulasWithWeightData}/{metrics.totalFormulas}
                      </Text>
                    </View>
                    <View className="text-center">
                      <Text className="text-muted-foreground">Volume</Text>
                      <Text className="font-medium">
                        {metrics.formulasWithVolumeData}/{metrics.totalFormulas}
                      </Text>
                    </View>
                    <View className="text-center">
                      <Text className="text-muted-foreground">Densidade</Text>
                      <Text className="font-medium">
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
