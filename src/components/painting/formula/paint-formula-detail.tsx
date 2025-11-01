
import { View, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PaintFormulaComponentCard } from "./paint-formula-component-card";
import { measureUtils } from '../../../utils';
import { MEASURE_UNIT } from '../../../constants';
import type { PaintFormula } from '../../../types';

interface PaintFormulaDetailProps {
  formula: PaintFormula;
  showComponents?: boolean;
  showCalculations?: boolean;
}

export function PaintFormulaDetail({ formula, showComponents = true, showCalculations = true }: PaintFormulaDetailProps) {
  // Calculate comprehensive formula metrics
  const calculateFormulaMetrics = () => {
    if (!formula.components || formula.components.length === 0) {
      return {
        totalComponents: 0,
        totalWeight: null,
        totalVolume: null,
        calculatedDensity: null,
        averageDensity: null,
        densityConsistency: null,
        componentStats: {
          withWeight: 0,
          withVolume: 0,
          withDensity: 0,
          withoutMeasures: 0,
        },
      };
    }

    let totalWeight = 0;
    let totalVolume = 0;
    let hasWeightData = false;
    let hasVolumeData = false;
    let densitySum = 0;
    let densityCount = 0;
    let componentStats = {
      withWeight: 0,
      withVolume: 0,
      withDensity: 0,
      withoutMeasures: 0,
    };

    const densityValues: number[] = [];

    formula.components.forEach((component) => {
      let hasData = false;

      // Use ratio for now since weightValue, volumeValue, densityValue don't exist on PaintFormulaComponent
      if (component.ratio !== null && component.ratio !== undefined) {
        totalWeight += component.ratio;
        hasWeightData = true;
        componentStats.withWeight++;
        hasData = true;

        // For now, use ratio as volume and density placeholder
        totalVolume += component.ratio;
        hasVolumeData = true;
        componentStats.withVolume++;

        densitySum += 1.0; // Default density
        densityCount++;
        densityValues.push(1.0);
        componentStats.withDensity++;
      }

      if (!hasData) {
        componentStats.withoutMeasures++;
      }
    });

    // Calculate density consistency (coefficient of variation)
    let densityConsistency = null;
    if (densityValues.length > 1) {
      const mean = densitySum / densityCount;
      const variance = densityValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / densityCount;
      const stdDev = Math.sqrt(variance);
      densityConsistency = (stdDev / mean) * 100; // Coefficient of variation as percentage
    }

    return {
      totalComponents: formula.components.length,
      totalWeight: hasWeightData ? totalWeight : null,
      totalVolume: hasVolumeData ? totalVolume : null,
      calculatedDensity: hasWeightData && hasVolumeData && totalVolume > 0 ? totalWeight / totalVolume : null,
      averageDensity: densityCount > 0 ? densitySum / densityCount : null,
      densityConsistency,
      componentStats,
    };
  };

  const metrics = calculateFormulaMetrics();

  // Check for potential issues
  const getQualityIssues = () => {
    const issues: string[] = [];

    if (metrics.totalComponents === 0) {
      issues.push("Fórmula sem componentes");
    }

    if (metrics.componentStats.withoutMeasures > 0) {
      issues.push(`${metrics.componentStats.withoutMeasures} componente(s) sem dados de medida`);
    }

    if (formula.density && metrics.calculatedDensity && Math.abs(formula.density - metrics.calculatedDensity) > 0.1) {
      issues.push("Densidade da fórmula diverge da calculada");
    }

    if (metrics.densityConsistency && metrics.densityConsistency > 20) {
      issues.push("Densidades dos componentes muito inconsistentes");
    }

    return issues;
  };

  const qualityIssues = getQualityIssues();

  return (
    <ScrollView className="flex-1">
      <View className="space-y-4">
        {/* Formula Header */}
        <Card className="p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground mb-1">{formula.description || "Fórmula sem descrição"}</Text>
              <View className="flex-row items-center gap-2">
                <Badge variant="secondary">
                  {metrics.totalComponents} componente{metrics.totalComponents !== 1 ? "s" : ""}
                </Badge>
                {formula.pricePerLiter && <Badge variant="outline">R$ {formula.pricePerLiter.toFixed(2)}/L</Badge>}
              </View>
            </View>

            <Icon name="flask" size={24} className="text-primary" />
          </View>

          {/* Quick Stats */}
          {showCalculations && metrics.totalComponents > 0 && (
            <View className="bg-muted/30 rounded-lg p-3">
              <View className="grid grid-cols-2 gap-4">
                {/* Total Weight */}
                {metrics.totalWeight && (
                  <View>
                    <Text className="text-xs text-muted-foreground mb-1">Peso Total</Text>
                    <Text className="text-sm font-medium">
                      {measureUtils.formatMeasure({
                        value: metrics.totalWeight,
                        unit: MEASURE_UNIT.GRAM,
                      })}
                    </Text>
                  </View>
                )}

                {/* Total Volume */}
                {metrics.totalVolume && (
                  <View>
                    <Text className="text-xs text-muted-foreground mb-1">Volume Total</Text>
                    <Text className="text-sm font-medium">
                      {measureUtils.formatMeasure({
                        value: metrics.totalVolume,
                        unit: MEASURE_UNIT.MILLILITER,
                      })}
                    </Text>
                  </View>
                )}

                {/* Density Comparison */}
                <View>
                  <Text className="text-xs text-muted-foreground mb-1">Densidade</Text>
                  <View className="space-y-1">
                    {formula.density && <Text className="text-sm font-medium text-primary">Fórmula: {formula.density.toFixed(4)} g/ml</Text>}
                    {metrics.calculatedDensity && <Text className="text-sm text-muted-foreground">Calculada: {metrics.calculatedDensity.toFixed(4)} g/ml</Text>}
                    {metrics.averageDensity && <Text className="text-sm text-muted-foreground">Média: {metrics.averageDensity.toFixed(4)} g/ml</Text>}
                  </View>
                </View>

                {/* Data Completeness */}
                <View>
                  <Text className="text-xs text-muted-foreground mb-1">Completude</Text>
                  <View className="space-y-1">
                    <Text className="text-xs">
                      Peso: {metrics.componentStats.withWeight}/{metrics.totalComponents}
                    </Text>
                    <Text className="text-xs">
                      Volume: {metrics.componentStats.withVolume}/{metrics.totalComponents}
                    </Text>
                    <Text className="text-xs">
                      Densidade: {metrics.componentStats.withDensity}/{metrics.totalComponents}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Quality Issues */}
        {qualityIssues.length > 0 && (
          <Alert variant={qualityIssues.some((issue) => issue.includes("diverge") || issue.includes("inconsistentes")) ? "destructive" : "default"}>
            <Icon name={qualityIssues.some((issue) => issue.includes("diverge") || issue.includes("inconsistentes")) ? "alert-triangle" : "info"} size={16} />
            <AlertDescription>
              <Text className="font-medium mb-1">Questões de Qualidade:</Text>
              {qualityIssues.map((issue, index) => (
                <Text key={index} className="text-sm">
                  • {issue}
                </Text>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Measure Analysis */}
        {showCalculations && metrics.densityConsistency !== null && (
          <Card className="p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Icon name="trending-up" size={16} className="text-primary" />
              <Text className="text-base font-medium text-foreground">Análise de Consistência</Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Variação de densidade:</Text>
                <Badge variant={metrics.densityConsistency < 10 ? "default" : metrics.densityConsistency < 20 ? "secondary" : "destructive"}>
                  {metrics.densityConsistency.toFixed(1)}%
                </Badge>
              </View>

              <Text className="text-xs text-muted-foreground">
                {metrics.densityConsistency < 10
                  ? "Excelente consistência entre componentes"
                  : metrics.densityConsistency < 20
                    ? "Boa consistência entre componentes"
                    : "Alta variação pode indicar erro nos dados"}
              </Text>
            </View>
          </Card>
        )}

        {/* Component List */}
        {showComponents && formula.components && formula.components.length > 0 && (
          <View className="space-y-3">
            <View className="flex-row items-center gap-2">
              <Icon name="list" size={16} className="text-primary" />
              <Text className="text-base font-medium text-foreground">Componentes da Fórmula</Text>
            </View>

            {formula.components.map((component, index) => (
              <View key={component.id || index}>
                <PaintFormulaComponentCard component={component} showCalculations={showCalculations} />
                {index < formula.components!.length - 1 && <Separator className="my-2" />}
              </View>
            ))}
          </View>
        )}

        {/* Conversion Helper */}
        {showCalculations && metrics.calculatedDensity && (
          <Card className="p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Icon name="calculator" size={16} className="text-blue-600" />
              <Text className="text-base font-medium text-foreground">Calculadora de Conversão</Text>
            </View>

            <View className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
              <Text className="text-xs text-blue-700 dark:text-blue-300 mb-2">Com base na densidade calculada ({metrics.calculatedDensity.toFixed(4)} g/ml):</Text>
              <View className="space-y-1">
                <Text className="text-xs text-blue-600 dark:text-blue-400">1 litro ≈ {(metrics.calculatedDensity * 1000).toFixed(0)}g</Text>
                <Text className="text-xs text-blue-600 dark:text-blue-400">100ml ≈ {(metrics.calculatedDensity * 100).toFixed(1)}g</Text>
                <Text className="text-xs text-blue-600 dark:text-blue-400">1kg ≈ {(1000 / metrics.calculatedDensity).toFixed(0)}ml</Text>
              </View>
            </View>
          </Card>
        )}

        {/* No Components Notice */}
        {(!formula.components || formula.components.length === 0) && (
          <Alert>
            <Icon name="info" size={16} />
            <AlertDescription>Esta fórmula ainda não possui componentes cadastrados. Adicione componentes para habilitar cálculos de medidas.</AlertDescription>
          </Alert>
        )}
      </View>
    </ScrollView>
  );
}
