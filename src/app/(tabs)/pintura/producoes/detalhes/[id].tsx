
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { usePaintProductionDetail } from '../../../../../hooks';
import { MobileProductionCalculator } from "@/components/painting";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { measureUtils } from '../../../../../utils';
import { MEASURE_UNIT } from '../../../../../constants';

export default function ProductionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: productionResponse,
    isLoading,
    error,
  } = usePaintProductionDetail(id as string, {
    include: {
      formula: {
        include: {
          paint: true,
          components: {
            include: {
              item: true,
            },
          },
        },
      },
    },
  });

  const production = productionResponse?.data;

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

  if (error || !production) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen title="Erro ao carregar produção" message={error?.message || "Produção não encontrada"} />
      </>
    );
  }

  // Calculate production metrics with enhanced measures
  const calculateProductionMetrics = () => {
    if (!production?.formula || !production.formula.components) {
      return null;
    }

    const formula = production.formula;
    let calculatedWeight = 0;
    let calculatedVolume = 0;
    let hasWeightData = false;
    let hasVolumeData = false;

    formula.components?.forEach((component) => {
      if (component.ratio) {
        calculatedWeight += component.ratio;
        hasWeightData = true;
      }
      if (component.ratio) {
        calculatedVolume += component.ratio;
        hasVolumeData = true;
      }
    });

    const actualDensity = formula.density; // Use formula density as we no longer have weight
    const formulaDensity = formula.density;
    const calculatedDensity = hasWeightData && hasVolumeData && calculatedVolume > 0 ? calculatedWeight / calculatedVolume : null;

    return {
      actualWeight: production.volumeLiters * 1000 * formula.density, // Calculate weight from volume
      actualVolume: production.volumeLiters * 1000, // Convert to ml
      calculatedWeight: hasWeightData ? calculatedWeight : null,
      calculatedVolume: hasVolumeData ? calculatedVolume : null,
      actualDensity,
      formulaDensity,
      calculatedDensity,
      weightAccuracy: hasWeightData && calculatedWeight > 0 ? (1 - Math.abs(production.volumeLiters * 1000 * formula.density - calculatedWeight) / calculatedWeight) * 100 : null,
      volumeAccuracy: hasVolumeData && calculatedVolume > 0 ? (1 - Math.abs(production.volumeLiters * 1000 - calculatedVolume) / calculatedVolume) * 100 : null,
      densityVariation: actualDensity && formulaDensity ? (Math.abs(actualDensity - formulaDensity) / formulaDensity) * 100 : null,
    };
  };

  const metrics = calculateProductionMetrics();

  return (
    <>
      <Stack.Screen
        options={{
          title: `Produção #${id}`,
          headerBackTitle: "Voltar",
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 space-y-4">
          {/* Production Header */}
          <Card className="p-4">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground mb-1">Produção de Tinta</Text>
                <Text className="text-sm text-muted-foreground mb-2">{production?.formula?.paint?.name || "Tinta não especificada"}</Text>
                <Badge variant="secondary">{production?.volumeLiters}L produzidos</Badge>
              </View>

              <Icon name="beaker" size={24} className="text-primary" />
            </View>

            {production?.formula?.description && <Text className="text-sm text-muted-foreground">Fórmula: {production.formula.description}</Text>}
          </Card>

          {/* Enhanced Production Metrics */}
          {metrics && (
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="target" size={16} className="text-primary" />
                <Text className="text-base font-medium text-foreground">Análise de Precisão</Text>
              </View>

              <View className="space-y-4">
                {/* Actual vs Calculated */}
                <View className="grid grid-cols-2 gap-4">
                  <View className="bg-muted/30 rounded-lg p-3">
                    <Text className="text-xs text-muted-foreground mb-1">Peso Real</Text>
                    <Text className="text-sm font-medium">
                      {measureUtils.formatMeasure({
                        value: metrics.actualWeight,
                        unit: MEASURE_UNIT.GRAM,
                      })}
                    </Text>
                    {metrics.calculatedWeight && (
                      <Text className="text-xs text-muted-foreground">
                        Esperado:{" "}
                        {measureUtils.formatMeasure({
                          value: metrics.calculatedWeight,
                          unit: MEASURE_UNIT.GRAM,
                        })}
                      </Text>
                    )}
                  </View>

                  <View className="bg-muted/30 rounded-lg p-3">
                    <Text className="text-xs text-muted-foreground mb-1">Volume Real</Text>
                    <Text className="text-sm font-medium">
                      {measureUtils.formatMeasure({
                        value: metrics.actualVolume,
                        unit: MEASURE_UNIT.MILLILITER,
                      })}
                    </Text>
                    {metrics.calculatedVolume && (
                      <Text className="text-xs text-muted-foreground">
                        Esperado:{" "}
                        {measureUtils.formatMeasure({
                          value: metrics.calculatedVolume,
                          unit: MEASURE_UNIT.MILLILITER,
                        })}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Accuracy Metrics */}
                <View className="space-y-2">
                  {metrics.weightAccuracy !== null && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Precisão do Peso:</Text>
                      <Badge variant={metrics.weightAccuracy >= 95 ? "default" : metrics.weightAccuracy >= 90 ? "secondary" : "destructive"}>
                        {metrics.weightAccuracy.toFixed(1)}%
                      </Badge>
                    </View>
                  )}

                  {metrics.volumeAccuracy !== null && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Precisão do Volume:</Text>
                      <Badge variant={metrics.volumeAccuracy >= 95 ? "default" : metrics.volumeAccuracy >= 90 ? "secondary" : "destructive"}>
                        {metrics.volumeAccuracy.toFixed(1)}%
                      </Badge>
                    </View>
                  )}
                </View>

                {/* Density Analysis */}
                <Separator />
                <View className="space-y-2">
                  <Text className="text-sm font-medium text-foreground">Análise de Densidade:</Text>

                  <View className="grid grid-cols-3 gap-2 text-xs">
                    {metrics.actualDensity && (
                      <View className="text-center">
                        <Text className="text-muted-foreground">Real</Text>
                        <Text className="font-medium">{metrics.actualDensity.toFixed(4)} g/ml</Text>
                      </View>
                    )}

                    {metrics.formulaDensity && (
                      <View className="text-center">
                        <Text className="text-muted-foreground">Fórmula</Text>
                        <Text className="font-medium">{metrics.formulaDensity.toFixed(4)} g/ml</Text>
                      </View>
                    )}

                    {metrics.calculatedDensity && (
                      <View className="text-center">
                        <Text className="text-muted-foreground">Calculada</Text>
                        <Text className="font-medium">{metrics.calculatedDensity.toFixed(4)} g/ml</Text>
                      </View>
                    )}
                  </View>

                  {metrics.densityVariation !== null && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">Variação da Densidade:</Text>
                      <Badge variant={metrics.densityVariation <= 5 ? "default" : metrics.densityVariation <= 10 ? "secondary" : "destructive"}>
                        {metrics.densityVariation.toFixed(1)}%
                      </Badge>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Quality Alerts */}
          {metrics && (
            <>
              {metrics.weightAccuracy !== null && metrics.weightAccuracy < 90 && (
                <Alert variant="destructive">
                  <Icon name="alert-triangle" size={16} />
                  <AlertDescription>Baixa precisão no peso ({metrics.weightAccuracy.toFixed(1)}%). Verifique a balança e os procedimentos de pesagem.</AlertDescription>
                </Alert>
              )}

              {metrics.densityVariation !== null && metrics.densityVariation > 10 && (
                <Alert variant="destructive">
                  <Icon name="alert-triangle" size={16} />
                  <AlertDescription>
                    Alta variação na densidade ({metrics.densityVariation.toFixed(1)}%). Pode indicar problema na mistura ou medição dos componentes.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Production Calculator */}
          {production?.formula && (
            <>
              <Separator />
              <View>
                <Text className="text-lg font-semibold text-foreground mb-3">Calculadora para Nova Produção</Text>
                <MobileProductionCalculator formula={production.formula} targetQuantity={1} />
              </View>
            </>
          )}

          {/* Missing Formula Warning */}
          {!production?.formula && (
            <Alert>
              <Icon name="info" size={16} />
              <AlertDescription>Esta produção não possui fórmula associada. Não é possível realizar análises detalhadas de precisão.</AlertDescription>
            </Alert>
          )}
        </View>
      </ScrollView>
    </>
  );
}
