import React from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { measureUtils } from '../../../utils';
import { MEASURE_UNIT } from '../../../constants';
import type { PaintFormulaComponent } from '../../../types';

interface PaintFormulaComponentCardProps {
  component: PaintFormulaComponent;
  showCalculations?: boolean;
}

export function PaintFormulaComponentCard({ component, showCalculations = true }: PaintFormulaComponentCardProps) {
  const item = component.item;
  const hasRatio = typeof component.ratio === 'number';

  // Get item measures
  const weightMeasure = item?.measures?.find((m) => m.measureType === "WEIGHT");
  const volumeMeasure = item?.measures?.find((m) => m.measureType === "VOLUME");
  const hasItemMeasures = !!(weightMeasure || volumeMeasure);

  // Format measures safely
  const formatWeight = (value: number | null) => {
    if (value === null || value === undefined) return null;
    return measureUtils.formatMeasure({ value, unit: MEASURE_UNIT.GRAM });
  };

  const formatVolume = (value: number | null) => {
    if (value === null || value === undefined) return null;
    return measureUtils.formatMeasure({ value, unit: MEASURE_UNIT.MILLILITER });
  };

  return (
    <Card className="p-4">
      {/* Component Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-medium text-foreground mb-1">{item?.name || "Item não encontrado"}</Text>
          <View className="flex-row items-center gap-2">
            {hasRatio && (
              <Badge variant="secondary">
                <Icon name="calculator" size={12} className="mr-1" />
                {component.ratio.toFixed(1)}%
              </Badge>
            )}
            {item && (
              <Text className="text-xs text-muted-foreground">
                Estoque: {item.quantity} {item.measures?.[0]?.unit || "un"}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Component Ratio & Item Measures */}
      {showCalculations && (hasRatio || hasItemMeasures) && (
        <View className="bg-muted/30 rounded-lg p-3 mb-3">
          <View className="flex-row items-center gap-2 mb-3">
            <Icon name="calculator" size={16} className="text-primary" />
            <Text className="text-sm font-medium text-foreground">Informações da Fórmula</Text>
          </View>

          <View className="space-y-3">
            {/* Ratio */}
            {hasRatio && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon name="percent" size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">Proporção:</Text>
                </View>
                <Text className="text-sm font-medium text-primary">{component.ratio.toFixed(1)}%</Text>
              </View>
            )}

            {/* Item Weight Measure */}
            {weightMeasure && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon name="scale" size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">Peso unitário:</Text>
                </View>
                <Text className="text-sm font-medium">
                  {measureUtils.formatMeasure({
                    value: weightMeasure.value,
                    unit: weightMeasure.unit,
                  })}
                </Text>
              </View>
            )}

            {/* Item Volume Measure */}
            {volumeMeasure && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon name="droplet" size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">Volume unitário:</Text>
                </View>
                <Text className="text-sm font-medium">
                  {measureUtils.formatMeasure({
                    value: volumeMeasure.value,
                    unit: volumeMeasure.unit,
                  })}
                </Text>
              </View>
            )}

            {/* Item Density if both measures exist */}
            {weightMeasure && volumeMeasure && typeof weightMeasure.value === 'number' && typeof volumeMeasure.value === 'number' && volumeMeasure.value > 0 && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon name="gauge" size={14} className="text-muted-foreground" />
                  <Text className="text-sm text-muted-foreground">Densidade do item:</Text>
                </View>
                <Text className="text-sm font-medium">{(weightMeasure.value / volumeMeasure.value).toFixed(4)} g/ml</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Conversion Ratios */}
      {showCalculations && weightMeasure && volumeMeasure && typeof weightMeasure.value === 'number' && typeof volumeMeasure.value === 'number' && volumeMeasure.value > 0 && weightMeasure.value > 0 && (
        <View className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon name="arrows-exchange" size={14} className="text-blue-600" />
            <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">Conversões do Item</Text>
          </View>

          <View className="space-y-1">
            <Text className="text-xs text-blue-600 dark:text-blue-400">1ml ≈ {(weightMeasure.value / volumeMeasure.value).toFixed(3)}g</Text>
            <Text className="text-xs text-blue-600 dark:text-blue-400">1g ≈ {(volumeMeasure.value / weightMeasure.value).toFixed(3)}ml</Text>
          </View>
        </View>
      )}

      {/* Missing Measures Notice */}
      {showCalculations && !hasItemMeasures && (
        <Alert>
          <Icon name="info" size={16} />
          <AlertDescription>Item precisa ter medidas de peso e volume para cálculos precisos</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
