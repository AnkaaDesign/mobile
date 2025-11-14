import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { measureUtils } from "@/utils";
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
}

interface ProductionCalculation {
  targetQuantity: number;
  scaleFactor: number;
  totalWeight: number;
  totalVolume: number;
  estimatedDensity: number;
  components: ComponentCalculation[];
  canProduce: boolean;
  missingComponents: string[];
}

export function MobileProductionCalculator({ formula, targetQuantity = 1, onCalculationComplete }: MobileProductionCalculatorProps) {
  const [quantity, setQuantity] = useState(targetQuantity);
  const [calculation, setCalculation] = useState<ProductionCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Convert target quantity to weight in grams
  const targetWeightInGrams = quantity * 1000; // Assuming quantity is in kg

  const performCalculation = () => {
    if (!formula.components || formula.components.length === 0) {
      return;
    }

    setIsCalculating(true);

    try {
      const componentCalculations: ComponentCalculation[] = formula.components.map((component) => {
        // Calculate weight based on ratio
        const calculatedWeight = (component.ratio / 100) * targetWeightInGrams;

        const item = component.item;
        const availableStock = item?.quantity || 0;

        // Get weight and volume measures
        const weightMeasure = item?.measures?.find((m) => m.measureType === "WEIGHT" && m.unit === MEASURE_UNIT.GRAM);
        const volumeMeasure = item?.measures?.find((m) => m.measureType === "VOLUME" && m.unit === MEASURE_UNIT.MILLILITER);

        // Calculate item density and volume
        const itemDensity = weightMeasure?.value && volumeMeasure?.value && volumeMeasure.value > 0 ? weightMeasure.value / volumeMeasure.value : formula.density || 1.0;
        const calculatedVolume = calculatedWeight / itemDensity;

        // Calculate required units based on item's measure unit
        let requiredUnits = calculatedWeight;
        let hasEnoughStock = false;

        if (item) {
          const firstMeasure = item.measures?.[0];
          const itemUnit = firstMeasure?.unit || MEASURE_UNIT.UNIT;

          if (itemUnit === MEASURE_UNIT.GRAM) {
            requiredUnits = calculatedWeight;
            hasEnoughStock = availableStock >= requiredUnits;
          } else if (itemUnit === MEASURE_UNIT.KILOGRAM) {
            requiredUnits = calculatedWeight / 1000;
            hasEnoughStock = availableStock >= requiredUnits;
          } else if (itemUnit === MEASURE_UNIT.MILLILITER) {
            requiredUnits = calculatedVolume;
            hasEnoughStock = availableStock >= requiredUnits;
          } else if (itemUnit === MEASURE_UNIT.LITER) {
            requiredUnits = calculatedVolume / 1000;
            hasEnoughStock = availableStock >= requiredUnits;
          } else if (weightMeasure?.value) {
            // For items with specific weight per unit
            requiredUnits = calculatedWeight / weightMeasure.value;
            hasEnoughStock = availableStock >= requiredUnits;
          } else {
            // Fallback
            hasEnoughStock = availableStock >= requiredUnits;
          }
        }

        return {
          component,
          calculatedWeight,
          calculatedVolume,
          availableStock,
          hasEnoughStock,
          requiredUnits,
        };
      });

      const totalWeight = componentCalculations.reduce((sum, calc) => sum + calc.calculatedWeight, 0);
      const totalVolume = componentCalculations.reduce((sum, calc) => sum + calc.calculatedVolume, 0);
      const estimatedDensity = totalVolume > 0 ? totalWeight / totalVolume : formula.density || 0;

      const missingComponents = componentCalculations.filter((calc) => !calc.hasEnoughStock).map((calc) => calc.component.item?.name || "Item desconhecido");

      const newCalculation: ProductionCalculation = {
        targetQuantity: quantity,
        scaleFactor: targetWeightInGrams / 1000, // Convert back to kg for display
        totalWeight,
        totalVolume,
        estimatedDensity,
        components: componentCalculations,
        canProduce: missingComponents.length === 0,
        missingComponents,
      };

      setCalculation(newCalculation);
      onCalculationComplete?.(newCalculation);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    performCalculation();
  }, [quantity, formula]);

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
            <View>
              <Label nativeID="quantity">Quantidade Desejada</Label>
              <View className="flex-row items-center gap-2 mt-1">
                <Input
                  id="quantity"
                  value={quantity.toString()}
                  onChangeText={(text) => setQuantity(Number(text) || 0)}
                  keyboardType="numeric"
                  placeholder="1"
                  className="flex-1"
                />
                <Text className="text-sm text-muted-foreground px-2">batch{quantity !== 1 ? "es" : ""}</Text>
              </View>
            </View>

            <Button onPress={performCalculation} disabled={isCalculating || quantity <= 0} className="w-full">
              {isCalculating ? "Calculando..." : "Recalcular"}
            </Button>
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
                    {calculation.totalWeight > 0
                      ? measureUtils.formatMeasure({
                          value: calculation.totalWeight,
                          unit: MEASURE_UNIT.GRAM,
                        })
                      : "N/A"}
                  </Text>
                </View>

                <View className="bg-muted/30 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground mb-1">Volume Total</Text>
                  <Text className="text-sm font-medium">
                    {calculation.totalVolume > 0
                      ? measureUtils.formatMeasure({
                          value: calculation.totalVolume,
                          unit: MEASURE_UNIT.MILLILITER,
                        })
                      : "N/A"}
                  </Text>
                </View>

                <View className="bg-muted/30 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground mb-1">Densidade</Text>
                  <Text className="text-sm font-medium">{calculation.estimatedDensity > 0 ? `${calculation.estimatedDensity.toFixed(4)} g/ml` : "N/A"}</Text>
                </View>

                <View className="bg-muted/30 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground mb-1">Fator de Escala</Text>
                  <Text className="text-sm font-medium">{calculation.scaleFactor}x</Text>
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
                <Text className="text-base font-medium text-foreground">Componentes Necessários</Text>
              </View>

              <View className="space-y-3">
                {calculation.components.map((calc, index) => (
                  <View key={calc.component.id || index}>
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-foreground">{calc.component.item?.name || "Item desconhecido"}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Badge variant={calc.hasEnoughStock ? "default" : "destructive"} size="sm">
                            {calc.requiredUnits.toFixed(3)} {calc.component.item?.measureUnit || "un"}
                          </Badge>
                          <Text className="text-xs text-muted-foreground">
                            Estoque: {calc.availableStock} {calc.component.item?.measureUnit || "un"}
                          </Text>
                        </View>
                      </View>

                      <Icon name={calc.hasEnoughStock ? "check" : "x"} size={16} className={calc.hasEnoughStock ? "text-green-600" : "text-red-600"} />
                    </View>

                    {/* Enhanced Measures */}
                    {(calc.calculatedWeight || calc.calculatedVolume) && (
                      <View className="bg-muted/20 rounded p-2 ml-4">
                        <View className="flex-row gap-4">
                          {calc.calculatedWeight && (
                            <Text className="text-xs text-muted-foreground">
                              Peso:{" "}
                              {measureUtils.formatMeasure({
                                value: calc.calculatedWeight,
                                unit: MEASURE_UNIT.GRAM,
                              })}
                            </Text>
                          )}
                          {calc.calculatedVolume && (
                            <Text className="text-xs text-muted-foreground">
                              Volume:{" "}
                              {measureUtils.formatMeasure({
                                value: calc.calculatedVolume,
                                unit: MEASURE_UNIT.MILLILITER,
                              })}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

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
