import { useState, useEffect, useMemo } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { measureUtils, formatCurrency } from "@/utils";
import { MEASURE_UNIT } from "@/constants";
import type { PaintFormula, PaintFormulaComponent } from '../../../types';

interface MobileProductionCalculatorProps {
  formula: PaintFormula;
  targetQuantity?: number;
  onCalculationComplete?: (result: ProductionCalculation) => void;
}

interface ComponentCalculation {
  component: PaintFormulaComponent;
  calculatedWeight: number;
  calculatedVolume: number;
  availableStock: number;
  hasEnoughStock: boolean;
  requiredUnits: number;
  unitCost: number;
  totalCost: number;
  density: number;
  percentageOfFormula: number;
}

interface ProductionCalculation {
  targetQuantity: number;
  scaleFactor: number;
  totalWeight: number;
  totalVolume: number;
  estimatedDensity: number;
  totalCost: number;
  components: ComponentCalculation[];
  canProduce: boolean;
  missingComponents: string[];
  pricePerLiter: number;
}

export function MobileProductionCalculator({ formula, targetQuantity = 1, onCalculationComplete }: MobileProductionCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState(1000); // Default 1kg
  const [targetWeightUnit, setTargetWeightUnit] = useState<MEASURE_UNIT>(MEASURE_UNIT.GRAM);
  const [productionMode, setProductionMode] = useState<"weight" | "volume">("weight");
  const [targetVolume, setTargetVolume] = useState(1); // Default 1L
  const [isCalculating, setIsCalculating] = useState(false);

  const components = formula.components || [];
  const formulaDensity = Number(formula.density) || 1.0;

  // Calculate base formula metrics
  const baseFormulaMetrics = useMemo(() => {
    const totalWeight = components.reduce((sum, comp) => sum + (comp.ratio || 0), 0);
    const totalVolume = components.reduce((sum, comp) => sum + (comp.ratio || 0), 0);
    const averageDensity = totalVolume > 0 ? totalWeight / totalVolume : formulaDensity;

    return { totalWeight, totalVolume, averageDensity };
  }, [components, formulaDensity]);

  // Calculate production requirements
  const calculation = useMemo((): ProductionCalculation => {
    let targetWeightInGrams: number;
    let estimatedVolume: number;

    if (productionMode === "weight") {
      targetWeightInGrams = targetWeightUnit === MEASURE_UNIT.KILOGRAM ? targetWeight * 1000 : targetWeight;
      estimatedVolume = targetWeightInGrams / baseFormulaMetrics.averageDensity; // in ml
    } else {
      estimatedVolume = targetVolume * 1000; // Convert L to ml
      targetWeightInGrams = estimatedVolume * baseFormulaMetrics.averageDensity;
    }

    const scalingFactor = baseFormulaMetrics.totalWeight > 0 ? targetWeightInGrams / baseFormulaMetrics.totalWeight : 0;

    const componentCalculations: ComponentCalculation[] = components.map((comp) => {
      const item = comp.item;
      const baseWeight = comp.ratio || 0;
      const baseVolume = comp.ratio || 0;

      // Production calculations (weight-based)
      const calculatedWeight = baseWeight * scalingFactor;
      const calculatedVolume = baseVolume * scalingFactor;

      // Get weight and volume measures
      const weightMeasure = item?.measures?.find((m) => m.measureType === "WEIGHT" && m.unit === MEASURE_UNIT.GRAM);
      const volumeMeasure = item?.measures?.find((m) => m.measureType === "VOLUME" && m.unit === MEASURE_UNIT.MILLILITER);

      // Calculate item density
      const itemDensity = weightMeasure?.value && volumeMeasure?.value && volumeMeasure.value > 0
        ? weightMeasure.value / volumeMeasure.value
        : formulaDensity;

      // Inventory calculations (based on item's unit)
      let requiredUnits = calculatedWeight; // Default to grams
      const firstMeasure = item?.measures?.[0];
      const stockUnit = firstMeasure?.unit || MEASURE_UNIT.UNIT;
      const availableStock = item?.quantity || 0;

      if (stockUnit === MEASURE_UNIT.KILOGRAM) {
        requiredUnits = calculatedWeight / 1000;
      } else if (stockUnit === MEASURE_UNIT.LITER) {
        requiredUnits = calculatedVolume / 1000;
      } else if (stockUnit === MEASURE_UNIT.MILLILITER) {
        requiredUnits = calculatedVolume;
      } else if (firstMeasure?.value) {
        requiredUnits = calculatedWeight / firstMeasure.value;
      }

      const unitCost = item?.prices?.[0]?.value || 0;
      const totalCost = requiredUnits * unitCost;
      const hasEnoughStock = availableStock >= requiredUnits;
      const percentageOfFormula = baseFormulaMetrics.totalWeight > 0 ? (baseWeight / baseFormulaMetrics.totalWeight) * 100 : 0;

      return {
        component: comp,
        calculatedWeight,
        calculatedVolume,
        availableStock,
        hasEnoughStock,
        requiredUnits,
        unitCost,
        totalCost,
        density: itemDensity,
        percentageOfFormula,
      };
    });

    const totalCost = componentCalculations.reduce((sum, req) => sum + req.totalCost, 0);
    const totalWeight = componentCalculations.reduce((sum, calc) => sum + calc.calculatedWeight, 0);
    const totalVolume = componentCalculations.reduce((sum, calc) => sum + calc.calculatedVolume, 0);
    const estimatedDensity = totalVolume > 0 ? totalWeight / totalVolume : formulaDensity;
    const missingComponents = componentCalculations.filter((req) => !req.hasEnoughStock).map((req) => req.component.item?.name || "Item desconhecido");
    const canProduce = missingComponents.length === 0;
    const pricePerLiter = estimatedVolume > 0 ? (totalCost / (estimatedVolume / 1000)) : 0;

    return {
      targetQuantity: targetWeightInGrams / 1000,
      scaleFactor: scalingFactor,
      totalWeight,
      totalVolume,
      estimatedDensity,
      totalCost,
      components: componentCalculations,
      canProduce,
      missingComponents,
      pricePerLiter,
    };
  }, [targetWeight, targetWeightUnit, targetVolume, productionMode, components, baseFormulaMetrics, formulaDensity]);

  useEffect(() => {
    onCalculationComplete?.(calculation);
  }, [calculation, onCalculationComplete]);

  const stockStatusPercentage =
    calculation.components.length > 0
      ? (calculation.components.filter((req) => req.hasEnoughStock).length / calculation.components.length) * 100
      : 0;

  return (
    <ScrollView className="flex-1">
      <View className="p-4 space-y-4">
        {/* Input Section */}
        <Card className="p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Icon name="calculator" size={20} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground">Calculadora de Produção</Text>
          </View>

          <View className="space-y-3">
            {/* Mode Selection */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setProductionMode("weight")}
                className={`flex-1 px-4 py-2 rounded-lg border ${productionMode === "weight" ? "bg-primary border-primary" : "bg-transparent border-border"}`}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Icon name="scale" size={16} className={productionMode === "weight" ? "text-primary-foreground" : "text-foreground"} />
                  <Text className={`text-sm font-medium ${productionMode === "weight" ? "text-primary-foreground" : "text-foreground"}`}>Por Peso</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setProductionMode("volume")}
                className={`flex-1 px-4 py-2 rounded-lg border ${productionMode === "volume" ? "bg-primary border-primary" : "bg-transparent border-border"}`}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Icon name="flask" size={16} className={productionMode === "volume" ? "text-primary-foreground" : "text-foreground"} />
                  <Text className={`text-sm font-medium ${productionMode === "volume" ? "text-primary-foreground" : "text-foreground"}`}>Por Volume</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Target Input */}
            {productionMode === "weight" ? (
              <View>
                <Label nativeID="targetWeight">Peso desejado</Label>
                <View className="flex-row items-center gap-2 mt-1">
                  <Input
                    id="targetWeight"
                    value={targetWeight.toString()}
                    onChangeText={(text) => setTargetWeight(Number(text) || 0)}
                    keyboardType="numeric"
                    placeholder="1000"
                    className="flex-1"
                  />
                  <TouchableOpacity
                    onPress={() => setTargetWeightUnit(targetWeightUnit === MEASURE_UNIT.GRAM ? MEASURE_UNIT.KILOGRAM : MEASURE_UNIT.GRAM)}
                    className="px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <Text className="text-sm">{targetWeightUnit === MEASURE_UNIT.GRAM ? "g" : "kg"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Label nativeID="targetVolume">Volume desejado (L)</Label>
                <Input
                  id="targetVolume"
                  value={targetVolume.toString()}
                  onChangeText={(text) => setTargetVolume(Number(text) || 0)}
                  keyboardType="numeric"
                  placeholder="1"
                  className="mt-1"
                />
              </View>
            )}

            {/* Production Summary */}
            <View className="bg-muted/30 rounded-lg p-3">
              <Text className="text-xs text-muted-foreground mb-1">Produção Estimada</Text>
              <Text className="text-lg font-bold">
                {measureUtils.formatMeasure({
                  value: calculation.totalWeight,
                  unit: MEASURE_UNIT.GRAM,
                })}
              </Text>
              <Text className="text-xs text-muted-foreground">Volume: {(calculation.totalVolume / 1000).toFixed(2)} L</Text>
              <Text className="text-xs text-muted-foreground">Densidade: {calculation.estimatedDensity.toFixed(3)} g/ml</Text>
            </View>
          </View>
        </Card>

        {/* Stock Status */}
        <Card className="p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Icon name="shopping-cart" size={16} className="text-primary" />
            <Text className="text-base font-medium text-foreground">Status de Estoque</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm">Disponibilidade dos Componentes</Text>
              <Text className="text-sm font-medium">{stockStatusPercentage.toFixed(0)}%</Text>
            </View>
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${stockStatusPercentage}%` }}
              />
            </View>

            {calculation.missingComponents.length > 0 && (
              <Alert variant="destructive">
                <Icon name="alert-triangle" size={16} />
                <AlertDescription>
                  <Text className="font-medium">Componentes em falta:</Text>
                  <View className="mt-1">
                    {calculation.missingComponents.map((component, index) => (
                      <Text key={index} className="text-sm">• {component}</Text>
                    ))}
                  </View>
                </AlertDescription>
              </Alert>
            )}
          </View>
        </Card>

        {/* Results Section */}
        {calculation && (
          <>
            {/* Summary */}
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="clipboard-check" size={16} className="text-green-600" />
                <Text className="text-base font-medium text-foreground">Resumo da Produção</Text>
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View className="bg-muted/30 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground mb-1">Peso Total</Text>
                  <Text className="text-sm font-medium">
                    {measureUtils.formatMeasure({
                      value: calculation.totalWeight,
                      unit: MEASURE_UNIT.GRAM,
                    })}
                  </Text>
                </View>

                <View className="bg-muted/30 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground mb-1">Volume Total</Text>
                  <Text className="text-sm font-medium">
                    {(calculation.totalVolume / 1000).toFixed(2)} L
                  </Text>
                </View>

                <View className="bg-muted/30 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground mb-1">Custo Total</Text>
                  <Text className="text-sm font-medium text-primary">{formatCurrency(calculation.totalCost)}</Text>
                </View>

                <View className="bg-muted/30 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground mb-1">Custo por Litro</Text>
                  <Text className="text-sm font-medium">{formatCurrency(calculation.pricePerLiter)}</Text>
                </View>
              </View>
            </Card>

            {/* Production Status */}
            <Alert variant={calculation.canProduce ? "default" : "destructive"}>
              <Icon name={calculation.canProduce ? "check-circle" : "alert-circle"} size={16} />
              <AlertDescription>
                {calculation.canProduce
                  ? `Produção possível! Todos os componentes estão disponíveis.`
                  : `Não é possível produzir. Componentes em falta: ${calculation.missingComponents.join(", ")}`}
              </AlertDescription>
            </Alert>

            {/* Component Details */}
            <Card className="p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Icon name="list" size={16} className="text-primary" />
                <Text className="text-base font-medium text-foreground">Requisitos dos Componentes</Text>
              </View>

              <View className="space-y-3">
                {calculation.components.map((calc, index) => (
                  <View key={calc.component.id || index} className="border border-border rounded-lg p-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-medium text-foreground">{calc.component.item?.name || "Item não encontrado"}</Text>
                          <Icon name={calc.hasEnoughStock ? "circle-check" : "alert-triangle"} size={16} className={calc.hasEnoughStock ? "text-green-500" : "text-red-500"} />
                        </View>

                        <View className="flex-row flex-wrap gap-2 mt-2">
                          {/* Production Weight */}
                          <View className="bg-muted/30 rounded px-2 py-1">
                            <View className="flex-row items-center gap-1">
                              <Icon name="scale" size={12} className="text-muted-foreground" />
                              <Text className="text-xs text-muted-foreground">Produção:</Text>
                            </View>
                            <Badge variant="secondary" size="sm">
                              {measureUtils.formatMeasure({
                                value: calc.calculatedWeight,
                                unit: MEASURE_UNIT.GRAM,
                              })}
                            </Badge>
                          </View>

                          {/* Volume */}
                          <View className="bg-muted/30 rounded px-2 py-1">
                            <View className="flex-row items-center gap-1">
                              <Icon name="droplet" size={12} className="text-muted-foreground" />
                              <Text className="text-xs text-muted-foreground">Volume:</Text>
                            </View>
                            <Badge variant="secondary" size="sm">
                              {measureUtils.formatMeasure({
                                value: calc.calculatedVolume,
                                unit: MEASURE_UNIT.MILLILITER,
                              })}
                            </Badge>
                          </View>

                          {/* Inventory Units */}
                          <View className="bg-muted/30 rounded px-2 py-1">
                            <View className="flex-row items-center gap-1">
                              <Icon name="shopping-cart" size={12} className="text-muted-foreground" />
                              <Text className="text-xs text-muted-foreground">Estoque:</Text>
                            </View>
                            <Badge variant={calc.hasEnoughStock ? "default" : "destructive"} size="sm">
                              {calc.requiredUnits.toFixed(2)} {calc.component.item?.measureUnit || "un"}
                            </Badge>
                          </View>

                          {/* Cost */}
                          <View className="bg-muted/30 rounded px-2 py-1">
                            <View className="flex-row items-center gap-1">
                              <Icon name="currency-dollar" size={12} className="text-muted-foreground" />
                              <Text className="text-xs text-muted-foreground">Custo:</Text>
                            </View>
                            <Badge variant="outline" size="sm">
                              {formatCurrency(calc.totalCost)}
                            </Badge>
                          </View>
                        </View>

                        <View className="mt-2">
                          <Text className="text-xs text-muted-foreground">
                            Disponível: {calc.availableStock.toFixed(2)} {calc.component.item?.measureUnit || "un"}
                            {" • "}
                            Densidade: {calc.density.toFixed(3)} g/ml
                            {" • "}
                            {calc.percentageOfFormula.toFixed(1)}% da fórmula
                          </Text>
                        </View>
                      </View>
                    </View>

                    {index < calculation.components.length - 1 && <Separator className="mt-2" />}
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}
