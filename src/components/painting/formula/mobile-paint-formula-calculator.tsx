import React, { useState, useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { MEASURE_UNIT } from "../../../constants";
import { formatCurrency, measureUtils } from "../../../utils";
import { useTheme } from "@/lib/theme";
import type { PaintFormula } from "../../../types";

interface MobilePaintFormulaCalculatorProps {
  formula: PaintFormula;
}

// Predefined weight options like web version
const PREDEFINED_WEIGHTS = [
  { label: "100g", value: 100 },
  { label: "500g", value: 500 },
  { label: "1kg", value: 1000 },
  { label: "5kg", value: 5000 },
];

interface ComponentCalculation {
  id: string;
  name: string;
  ratio: number;
  calculatedWeight: number;
  calculatedVolume: number;
  availableStock: number;
  stockUnit: string;
  requiredUnits: number;
  unitPrice: number;
  totalCost: number;
  hasStock: boolean;
  itemDensity: number;
}

export function MobilePaintFormulaCalculator({ formula }: MobilePaintFormulaCalculatorProps) {
  const { colors } = useTheme();
  const [targetWeight, setTargetWeight] = useState<string>("1000");
  const [showDetails, setShowDetails] = useState(false);

  const components = formula.components || [];
  const targetWeightInGrams = parseFloat(targetWeight) || 0;

  const handlePredefinedWeight = (value: number) => {
    setTargetWeight(value.toString());
  };

  // Calculate component requirements based on ratios
  const componentCalculations = useMemo((): ComponentCalculation[] => {
    return components.map((comp) => {
      const calculatedWeight = (comp.ratio / 100) * targetWeightInGrams;

      const item = comp.item;
      const unitPrice = item?.prices?.[0]?.value || 0;
      const availableStock = item?.quantity || 0;

      // Get weight and volume measures
      const weightMeasure = item?.measures?.find(
        (m) => m.measureType === "WEIGHT" && m.unit === MEASURE_UNIT.GRAM
      );
      const volumeMeasure = item?.measures?.find(
        (m) => m.measureType === "VOLUME" && m.unit === MEASURE_UNIT.MILLILITER
      );

      // Calculate item density
      const itemDensity =
        weightMeasure?.value && volumeMeasure?.value && volumeMeasure.value > 0
          ? weightMeasure.value / volumeMeasure.value
          : Number(formula.density) || 1.0;

      // Calculate volume based on weight and density
      const calculatedVolume = calculatedWeight / itemDensity;

      // Determine stock unit and calculate required units
      const stockUnit = item?.measures?.[0]?.unit || MEASURE_UNIT.UNIT;
      let requiredUnits = calculatedWeight;

      if (stockUnit === MEASURE_UNIT.KILOGRAM) {
        requiredUnits = calculatedWeight / 1000;
      } else if (stockUnit === MEASURE_UNIT.GRAM) {
        requiredUnits = calculatedWeight;
      } else if (weightMeasure?.value) {
        requiredUnits = calculatedWeight / weightMeasure.value;
      }

      const totalCost = requiredUnits * unitPrice;
      const hasStock = availableStock >= requiredUnits;

      return {
        id: comp.id || "",
        name: item?.name || `Componente`,
        ratio: comp.ratio,
        calculatedWeight,
        calculatedVolume,
        availableStock,
        stockUnit,
        requiredUnits,
        unitPrice,
        totalCost,
        hasStock,
        itemDensity,
      };
    });
  }, [components, targetWeightInGrams, formula.density]);

  // Calculate totals
  const totalCost = componentCalculations.reduce((sum, calc) => sum + calc.totalCost, 0);
  const allInStock = componentCalculations.every((calc) => calc.hasStock);
  const missingComponents = componentCalculations.filter((calc) => !calc.hasStock);

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="p-2 rounded-lg bg-primary/10">
          <Icon name="calculator" size={20} className="text-primary" />
        </View>
        <Text className="text-lg font-semibold text-foreground">Calculadora de Produção</Text>
      </View>

      <View className="gap-4">

        {/* Target Weight Input */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Quantidade Desejada</Text>

          {/* Predefined Weight Buttons */}
          <View className="flex-row gap-2 flex-wrap">
            {PREDEFINED_WEIGHTS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handlePredefinedWeight(option.value)}
                className="px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: targetWeight === option.value.toString() ? colors.primary : 'transparent',
                  borderColor: targetWeight === option.value.toString() ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: targetWeight === option.value.toString() ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Weight Input */}
          <Input
            value={targetWeight}
            onChangeText={setTargetWeight}
            keyboardType="numeric"
            placeholder="1000"
          />
        </View>

        {targetWeightInGrams > 0 && (
          <>
            {/* Components List */}
            <View className="gap-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-foreground">Componentes Necessários</Text>
                <Badge
                  variant={allInStock ? "default" : "destructive"}
                  style={{
                    backgroundColor: allInStock ? "#16a34a" : colors.destructive,
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: "#FFFFFF" }}>
                    {allInStock ? "Estoque OK" : "Falta Estoque"}
                  </Text>
                </Badge>
              </View>

              {/* Show Details Checkbox */}
              <View className="flex-row items-center gap-2 mb-2">
                <Checkbox
                  checked={showDetails}
                  onCheckedChange={setShowDetails}
                />
                <Text className="text-sm text-muted-foreground">Mostrar detalhes completos</Text>
              </View>

              {componentCalculations.map((calc, index) => {
                // Get the component to access unicode
                const component = components.find(c => c.id === calc.id);
                const displayName = component?.item?.uniCode
                  ? `${component.item.uniCode} - ${calc.name}`
                  : calc.name;

                return (
                  <View key={calc.id}>
                    <View
                      className="bg-muted/30 rounded-lg p-3"
                      style={{
                        borderWidth: 1,
                        borderColor: calc.hasStock ? colors.border : colors.destructive + "40",
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <Text className="text-sm font-medium text-foreground flex-1">
                          {displayName}
                        </Text>
                        <Badge variant="outline" className="ml-2">
                          <Text className="text-xs">{calc.ratio.toFixed(1)}%</Text>
                        </Badge>
                      </View>

                      <View className="gap-2">
                        {/* Weight - Always shown */}
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-1">
                            <Icon name="scale" size={14} className="text-muted-foreground" />
                            <Text className="text-xs text-muted-foreground">Peso:</Text>
                          </View>
                          <Text className="text-xs font-medium">
                            {measureUtils.formatMeasure({
                              value: calc.calculatedWeight,
                              unit: MEASURE_UNIT.GRAM,
                            })}
                          </Text>
                        </View>

                        {/* Details - shown only if showDetails is true */}
                        {showDetails && (
                          <>
                            {/* Volume */}
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center gap-1">
                                <Icon name="droplet" size={14} className="text-muted-foreground" />
                                <Text className="text-xs text-muted-foreground">Volume:</Text>
                              </View>
                              <Text className="text-xs font-medium">
                                {measureUtils.formatMeasure({
                                  value: calc.calculatedVolume,
                                  unit: MEASURE_UNIT.MILLILITER,
                                })}
                              </Text>
                            </View>

                            {/* Required Units */}
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center gap-1">
                                <Icon name="package" size={14} className="text-muted-foreground" />
                                <Text className="text-xs text-muted-foreground">Necessário:</Text>
                              </View>
                              <Text className="text-xs font-medium">
                                {calc.requiredUnits.toFixed(3)} {calc.stockUnit}
                              </Text>
                            </View>

                            {/* Stock Status */}
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center gap-1">
                                <Icon
                                  name="database"
                                  size={14}
                                  className={calc.hasStock ? "text-green-600" : "text-red-600"}
                                />
                                <Text
                                  className="text-xs"
                                  style={{ color: calc.hasStock ? "#16a34a" : "#dc2626" }}
                                >
                                  Estoque:
                                </Text>
                              </View>
                              <Text
                                className="text-xs font-medium"
                                style={{ color: calc.hasStock ? "#16a34a" : "#dc2626" }}
                              >
                                {calc.availableStock.toFixed(3)} {calc.stockUnit}
                              </Text>
                            </View>

                            {/* Cost */}
                            {calc.unitPrice > 0 && (
                              <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-1">
                                  <Icon name="currency-real" size={14} className="text-muted-foreground" />
                                  <Text className="text-xs text-muted-foreground">Custo:</Text>
                                </View>
                                <Text className="text-xs font-medium text-primary">
                                  {formatCurrency(calc.totalCost)}
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    </View>

                    {index < componentCalculations.length - 1 && <Separator className="my-2" />}
                  </View>
                );
              })}
              </View>

              {/* Summary */}
              <View className="bg-primary/10 rounded-lg p-3 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">Custo Total Estimado</Text>
                  <Text className="text-lg font-bold text-primary">
                    {formatCurrency(totalCost)}
                  </Text>
                </View>
                {formula.pricePerLiter && typeof formula.pricePerLiter === 'number' && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">Custo por Litro</Text>
                    <Text className="text-xs font-medium">
                      {formatCurrency(formula.pricePerLiter)}
                    </Text>
                  </View>
                )}
              </View>

            {/* Warnings */}
            {!allInStock && (
              <Alert variant="destructive">
                <Icon name="alert-triangle" size={16} />
                <AlertDescription>
                  {missingComponents.length} componente{missingComponents.length > 1 ? "s" : ""}{" "}
                  sem estoque suficiente
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </View>
    </Card>
  );
}
