import { useState, useMemo } from "react";
import { View, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MEASURE_UNIT } from "@/constants";
import { formatCurrency, measureUtils } from "@/utils";
import { useTheme } from "@/lib/theme";
import type { PaintFormula } from "../../../types";
import { IconAlertTriangle, IconCheck, IconX, IconExclamationCircle, IconLoader } from "@tabler/icons-react-native";
import { usePaintProductionMutations } from "@/hooks";

interface MobilePaintFormulaCalculatorProps {
  formula: PaintFormula;
}

// Predefined weight options (in grams)
const PREDEFINED_WEIGHTS = [
  { label: "500g", value: 500 },
  { label: "1kg", value: 1000 },
  { label: "2kg", value: 2000 },
  { label: "3kg", value: 3000 },
];

interface ComponentCalculation {
  id: string;
  name: string;
  uniCode?: string;
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
  // Correction mode fields
  isErrorComponent?: boolean;
  wasAlreadyAdded?: boolean;
  correctedWeight?: number;
  additionalWeight?: number;
  actualWeight?: number;
}

interface ErrorComponent {
  componentId: string;
  expectedWeight: number;
  actualWeight: number;
  errorRatio: number;
}

export function MobilePaintFormulaCalculator({ formula }: MobilePaintFormulaCalculatorProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { createAsync: createProduction } = usePaintProductionMutations();

  // Main state - now weight-based like web version
  const [targetWeight, setTargetWeight] = useState<string>("1000"); // Default 1kg
  const [targetWeightUnit, setTargetWeightUnit] = useState<MEASURE_UNIT>(MEASURE_UNIT.GRAM);
  const [removedAmount, setRemovedAmount] = useState<string>("0"); // Amount removed for testing
  const [removedUnit, setRemovedUnit] = useState<MEASURE_UNIT>(MEASURE_UNIT.GRAM);
  const [isCreatingProduction, setIsCreatingProduction] = useState(false);

  // Display options
  const [showPrices, setShowPrices] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Correction mode (keeping this as a mobile-specific enhancement)
  const [correctionMode, setCorrectionMode] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorComponent, setErrorComponent] = useState<ErrorComponent | null>(null);
  const [tempErrorComponentId, setTempErrorComponentId] = useState<string>("");
  const [tempActualWeight, setTempActualWeight] = useState<string>("");
  const [alreadyAddedComponents, setAlreadyAddedComponents] = useState<Set<string>>(new Set());

  const components = formula.components || [];
  const formulaDensity = Number(formula.density) || 1.0;

  // Convert target weight to grams (matching web logic)
  const targetWeightInGrams = targetWeightUnit === MEASURE_UNIT.KILOGRAM ? (parseFloat(targetWeight) || 0) * 1000 : (parseFloat(targetWeight) || 0);

  // Convert removed amount to grams (matching web logic)
  const removedAmountInGrams = removedUnit === MEASURE_UNIT.KILOGRAM ? (parseFloat(removedAmount) || 0) * 1000 : (parseFloat(removedAmount) || 0);

  // Calculate actual weight after removal (matching web logic)
  const actualTargetWeight = targetWeightInGrams - removedAmountInGrams;

  const handlePredefinedWeight = (value: number) => {
    setTargetWeight(value.toString());
    setTargetWeightUnit(MEASURE_UNIT.GRAM);
  };

  const handleToggleCorrectionMode = (value: boolean) => {
    setCorrectionMode(value);
    if (value) {
      setShowErrorDialog(true);
      setAlreadyAddedComponents(new Set());
      setErrorComponent(null);
      setTempErrorComponentId("");
      setTempActualWeight("");
    } else {
      setErrorComponent(null);
      setAlreadyAddedComponents(new Set());
    }
  };

  const handleConfirmError = () => {
    const component = components.find(c => c.id === tempErrorComponentId);
    if (component && tempActualWeight) {
      const expectedWeight = (component.ratio / 100) * actualTargetWeight;
      const actualWeight = parseFloat(tempActualWeight);

      if (actualWeight >= expectedWeight) {
        const errorRatio = actualWeight / expectedWeight;
        setErrorComponent({
          componentId: tempErrorComponentId,
          expectedWeight,
          actualWeight,
          errorRatio
        });

        // Mark all components as already added except the error one
        const added = new Set<string>();
        components.forEach(c => {
          if (c.id !== tempErrorComponentId) {
            added.add(c.id || "");
          }
        });
        setAlreadyAddedComponents(added);

        setShowErrorDialog(false);
      }
    }
  };

  const handleComponentAdded = (componentId: string) => {
    if (!correctionMode || !errorComponent) return;

    setAlreadyAddedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  // Calculate component requirements based on ratios (matching web exactly)
  const componentCalculations = useMemo((): ComponentCalculation[] => {
    return components.map((comp) => {
      // Calculate weight based on ratio and actual target weight (after removal)
      const baseWeight = (comp.ratio / 100) * actualTargetWeight;
      let calculatedWeight = baseWeight;
      let correctedWeight: number | undefined;
      let additionalWeight: number | undefined;
      let isErrorComponent = false;
      let wasAlreadyAdded = false;

      // Apply correction logic if in correction mode (mobile-specific feature)
      if (correctionMode && errorComponent) {
        if (comp.id === errorComponent.componentId) {
          // This is the error component
          isErrorComponent = true;
          calculatedWeight = errorComponent.actualWeight;
          correctedWeight = errorComponent.actualWeight;
        } else if (alreadyAddedComponents.has(comp.id || "")) {
          // Component was already added before error
          wasAlreadyAdded = true;
          correctedWeight = baseWeight * errorComponent.errorRatio;
          additionalWeight = correctedWeight - baseWeight;
          calculatedWeight = baseWeight; // Keep original for display
        } else {
          // Component not yet added
          correctedWeight = baseWeight * errorComponent.errorRatio;
          calculatedWeight = correctedWeight;
        }
      }

      const item = comp.item;
      const unitPrice = item?.prices?.[0]?.value || 0;
      const availableStock = item?.quantity || 0;

      // Get weight and volume measures (matching web logic exactly)
      const weightMeasure = item?.measures?.find(
        (m) => m.measureType === "WEIGHT" && m.unit === MEASURE_UNIT.GRAM
      );
      const volumeMeasure = item?.measures?.find(
        (m) => m.measureType === "VOLUME" && m.unit === MEASURE_UNIT.MILLILITER
      );

      // Calculate item density (matching web logic exactly)
      const itemDensity =
        weightMeasure?.value && volumeMeasure?.value && volumeMeasure.value > 0
          ? weightMeasure.value / volumeMeasure.value
          : Number(formula.density) || 1.0;

      // Calculate volume based on weight and density
      const calculatedVolume = calculatedWeight / itemDensity;

      // Determine stock unit and calculate required units (matching web logic exactly)
      const stockUnit = item?.measures?.[0]?.unit || MEASURE_UNIT.UNIT;
      let requiredUnits = calculatedWeight;

      if (stockUnit === MEASURE_UNIT.KILOGRAM) {
        requiredUnits = calculatedWeight / 1000;
      } else if (stockUnit === MEASURE_UNIT.GRAM) {
        requiredUnits = calculatedWeight;
      } else if (weightMeasure?.value) {
        // For items with specific weight per unit
        requiredUnits = calculatedWeight / weightMeasure.value;
      }

      const totalCost = requiredUnits * unitPrice;
      const hasStock = availableStock >= requiredUnits;

      return {
        id: comp.id || "",
        name: item?.name || `Componente`,
        uniCode: item?.uniCode ?? undefined,
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
        isErrorComponent,
        wasAlreadyAdded,
        correctedWeight,
        additionalWeight,
      };
    });
  }, [components, actualTargetWeight, formula.density, correctionMode, errorComponent, alreadyAddedComponents]);

  // Calculate totals (matching web logic exactly)
  const calculatedTotals = useMemo(() => {
    const totalWeight = componentCalculations.reduce((sum, calc) => sum + calc.calculatedWeight, 0);
    const totalVolume = componentCalculations.reduce((sum, calc) => sum + calc.calculatedVolume, 0);
    const totalCost = componentCalculations.reduce((sum, calc) => sum + calc.totalCost, 0);
    const missingComponents = componentCalculations.filter((calc) => !calc.hasStock);
    const calculatedVolumeInLiters = totalVolume / 1000;
    const costPerLiter = calculatedVolumeInLiters > 0 ? totalCost / calculatedVolumeInLiters : 0;

    return {
      totalWeight,
      totalVolume,
      totalCost,
      missingComponents,
      calculatedVolumeInLiters,
      costPerLiter,
    };
  }, [componentCalculations]);

  const calculatedDensity = calculatedTotals.totalVolume > 0 ? calculatedTotals.totalWeight / calculatedTotals.totalVolume : 0;

  // Handle production start (matching web logic exactly)
  const handleStartProduction = async () => {
    try {
      setIsCreatingProduction(true);

      // Validate required data
      if (!formula.id) {
        return;
      }

      if (!formula.paint?.id) {
        return;
      }

      if (actualTargetWeight <= 0) {
        return;
      }

      // Calculate volume from weight using formula density
      const formulaDensity = Number(formula.density) || 1.0;
      const volumeInMl = actualTargetWeight / formulaDensity;
      const volumeInLiters = volumeInMl / 1000;

      // Create the production with the calculated volume (in liters)
      const result = await createProduction({
        formulaId: formula.id,
        volumeLiters: volumeInLiters,
      });

      // Navigate to the production details page
      if (result?.data?.id) {
        router.push(`/painting/production/${result.data.id}`);
      }
    } catch (error) {
      console.error("Error creating production:", error);
      // Error handled by API client
    } finally {
      setIsCreatingProduction(false);
    }
  };

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="p-2 rounded-lg bg-primary/10">
          <Icon name="calculator" size={20} className="text-primary" />
        </View>
        <Text className="text-lg font-semibold text-foreground">Calculadora de Fórmula</Text>
      </View>

      <View className="gap-4">
        {/* Target Weight Input (matching web layout) */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Peso desejado para produção</Text>

          {/* Predefined Weight Buttons */}
          <View className="flex-row gap-2 flex-wrap">
            {PREDEFINED_WEIGHTS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handlePredefinedWeight(option.value)}
                className="px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: targetWeight === option.value.toString() && targetWeightUnit === MEASURE_UNIT.GRAM ? colors.primary : 'transparent',
                  borderColor: targetWeight === option.value.toString() && targetWeightUnit === MEASURE_UNIT.GRAM ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: targetWeight === option.value.toString() && targetWeightUnit === MEASURE_UNIT.GRAM ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Weight Input with Unit Selector */}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                placeholder="1000"
              />
            </View>
            <View className="w-20">
              <Button
                variant="outline"
                onPress={() => {
                  setTargetWeightUnit(targetWeightUnit === MEASURE_UNIT.GRAM ? MEASURE_UNIT.KILOGRAM : MEASURE_UNIT.GRAM);
                }}
                className="h-full"
              >
                <Text className="text-sm font-medium">{targetWeightUnit === MEASURE_UNIT.GRAM ? 'g' : 'kg'}</Text>
              </Button>
            </View>
          </View>

          {/* Volume Estimate Display */}
          {targetWeightInGrams > 0 && (
            <View className="bg-muted/30 rounded-lg p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground">Volume Estimado</Text>
                <Text className="text-base font-bold">{calculatedTotals.calculatedVolumeInLiters.toFixed(2)} L</Text>
              </View>
              <Text className="text-xs text-muted-foreground text-right mt-1">
                Densidade: {calculatedDensity.toFixed(3)} g/ml
              </Text>
            </View>
          )}
        </View>

        {/* Removed Amount Input (matching web) */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Quantidade retirada para teste</Text>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                value={removedAmount}
                onChangeText={setRemovedAmount}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View className="w-20">
              <Button
                variant="outline"
                onPress={() => {
                  setRemovedUnit(removedUnit === MEASURE_UNIT.GRAM ? MEASURE_UNIT.KILOGRAM : MEASURE_UNIT.GRAM);
                }}
                className="h-full"
              >
                <Text className="text-sm font-medium">{removedUnit === MEASURE_UNIT.GRAM ? 'g' : 'kg'}</Text>
              </Button>
            </View>
          </View>

          <Text className="text-xs text-muted-foreground">
            Digite a quantidade de tinta que foi retirada para ajustar automaticamente os componentes
          </Text>

          {/* Adjusted Weight Display */}
          {removedAmountInGrams > 0 && actualTargetWeight > 0 && (
            <View className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground">Peso Ajustado</Text>
                <Text className="text-base font-bold text-orange-600 dark:text-orange-400">
                  {measureUtils.formatMeasure({
                    value: actualTargetWeight,
                    unit: MEASURE_UNIT.GRAM,
                  })}
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground text-right">
                após retirar {measureUtils.formatMeasure({
                  value: removedAmountInGrams,
                  unit: MEASURE_UNIT.GRAM,
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Warning for invalid removal */}
        {actualTargetWeight <= 0 && removedAmountInGrams > 0 && (
          <Alert variant="destructive">
            <IconAlertTriangle size={16} color={colors.destructive} />
            <AlertDescription>
              A quantidade retirada não pode ser maior que o peso desejado para produção.
            </AlertDescription>
          </Alert>
        )}

        {/* Toggles */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between p-3 bg-muted/30 rounded-lg">
            <View className="flex-row items-center gap-2">
              <Icon name="currency-real" size={16} className="text-muted-foreground" />
              <Text className="text-sm text-foreground">Exibir Preços</Text>
            </View>
            <Switch checked={showPrices} onCheckedChange={setShowPrices} />
          </View>

          <View className="flex-row items-center justify-between p-3 bg-muted/30 rounded-lg">
            <View className="flex-row items-center gap-2">
              <IconExclamationCircle size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground">Modo Correção</Text>
            </View>
            <Switch checked={correctionMode} onCheckedChange={handleToggleCorrectionMode} />
          </View>

          {!correctionMode && (
            <View className="flex-row items-center gap-2">
              <Checkbox
                checked={showDetails}
                onCheckedChange={setShowDetails}
              />
              <Text className="text-sm text-muted-foreground">Mostrar detalhes completos</Text>
            </View>
          )}
        </View>

        {actualTargetWeight > 0 && targetWeightInGrams > 0 && (
          <>
            {/* Components Table */}
            <View className="gap-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-foreground">Componentes</Text>
                <Badge
                  variant={calculatedTotals.missingComponents.length === 0 ? "default" : "destructive"}
                  style={{
                    backgroundColor: calculatedTotals.missingComponents.length === 0 ? "#16a34a" : colors.destructive,
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: "#FFFFFF" }}>
                    {calculatedTotals.missingComponents.length === 0 ? "Estoque OK" : "Falta Estoque"}
                  </Text>
                </Badge>
              </View>

              {componentCalculations.map((calc, index) => {
                const displayName = calc.uniCode
                  ? `${calc.uniCode} - ${calc.name}`
                  : calc.name;

                return (
                  <View key={calc.id}>
                    <TouchableOpacity
                      onPress={() => handleComponentAdded(calc.id)}
                      disabled={!correctionMode || calc.isErrorComponent}
                      className="bg-muted/30 rounded-lg p-3"
                      style={{
                        borderWidth: 1,
                        borderColor: calc.isErrorComponent
                          ? colors.destructive
                          : calc.hasStock
                            ? colors.border
                            : colors.destructive + "40",
                        opacity: correctionMode && !calc.isErrorComponent && !calc.wasAlreadyAdded ? 0.7 : 1,
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        {/* Status Icon for Correction Mode */}
                        {correctionMode && (
                          <View className="mr-2">
                            {calc.isErrorComponent ? (
                              <IconAlertTriangle size={20} color={colors.destructive} />
                            ) : calc.wasAlreadyAdded ? (
                              <IconCheck size={20} color="#16a34a" />
                            ) : (
                              <IconX size={20} color={colors.mutedForeground} />
                            )}
                          </View>
                        )}

                        {/* Component Selection (when not in correction mode) */}
                        {!correctionMode && (
                          <Checkbox
                            checked={selectedComponents.has(calc.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedComponents);
                              if (checked) {
                                newSelected.add(calc.id);
                              } else {
                                newSelected.delete(calc.id);
                              }
                              setSelectedComponents(newSelected);
                            }}
                            className="mr-2"
                          />
                        )}

                        <Text className="text-sm font-medium text-foreground flex-1">
                          {displayName}
                        </Text>
                        <Badge variant="outline" className="ml-2">
                          <Text className="text-xs">{calc.ratio.toFixed(1)}%</Text>
                        </Badge>
                      </View>

                      <View className="gap-2">
                        {/* Weight Display */}
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

                        {/* Correction Display */}
                        {correctionMode && calc.correctedWeight && (
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-1">
                              <Icon name="refresh" size={14} className="text-orange-500" />
                              <Text className="text-xs text-orange-500">Correção:</Text>
                            </View>
                            <Text
                              className="text-xs font-bold"
                              style={{
                                color: calc.isErrorComponent
                                  ? colors.destructive
                                  : calc.wasAlreadyAdded
                                    ? "#f59e0b" // amber
                                    : "#3b82f6" // blue
                              }}
                            >
                              {calc.isErrorComponent
                                ? `${calc.actualWeight?.toFixed(1)}g (real)`
                                : calc.wasAlreadyAdded && calc.additionalWeight
                                  ? `+${calc.additionalWeight.toFixed(1)}g`
                                  : `${calc.correctedWeight.toFixed(1)}g`
                              }
                            </Text>
                          </View>
                        )}

                        {/* Details - shown only if showDetails is true and not in correction mode */}
                        {showDetails && !correctionMode && (
                          <>
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

                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center gap-1">
                                <Icon name="package" size={14} className="text-muted-foreground" />
                                <Text className="text-xs text-muted-foreground">Necessário:</Text>
                              </View>
                              <Text className="text-xs font-medium">
                                {calc.requiredUnits.toFixed(3)} {calc.stockUnit}
                              </Text>
                            </View>

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
                          </>
                        )}

                        {/* Price Display */}
                        {showPrices && calc.unitPrice > 0 && (
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
                      </View>
                    </TouchableOpacity>

                    {index < sortedCalculations.length - 1 && <Separator className="my-2" />}
                  </View>
                );
              })}
            </View>

            {/* Production Summary (matching web) */}
            <Separator className="my-2" />
            <View className="gap-3">
              <View className="bg-muted/30 rounded-lg p-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-muted-foreground">Peso Total</Text>
                  <Text className="text-lg font-bold">
                    {measureUtils.formatMeasure({
                      value: calculatedTotals.totalWeight,
                      unit: MEASURE_UNIT.GRAM,
                    })}
                  </Text>
                </View>
              </View>

              <View className="bg-muted/30 rounded-lg p-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-muted-foreground">Volume Total</Text>
                  <Text className="text-lg font-bold">
                    {calculatedTotals.calculatedVolumeInLiters.toFixed(2)} L
                  </Text>
                </View>
              </View>

              {showPrices && (
                <>
                  <View className="bg-muted/30 rounded-lg p-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-muted-foreground">Custo Total</Text>
                      <Text className="text-lg font-bold text-primary">
                        {formatCurrency(calculatedTotals.totalCost)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-muted/30 rounded-lg p-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-muted-foreground">Custo por Litro</Text>
                      <Text className="text-lg font-bold">
                        {formatCurrency(calculatedTotals.costPerLiter)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Production Actions (matching web) */}
            <View className="gap-2 mt-4">
              <Button
                onPress={handleStartProduction}
                disabled={calculatedTotals.missingComponents.length > 0 || actualTargetWeight <= 0 || isCreatingProduction}
                className="w-full"
              >
                {isCreatingProduction ? (
                  <View className="flex-row items-center gap-2">
                    <IconLoader size={20} color={colors.primaryForeground} className="animate-spin" />
                    <Text style={{ color: colors.primaryForeground }}>Criando Produção...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Icon name="calculator" size={20} className="text-primary-foreground" />
                    <Text style={{ color: colors.primaryForeground }}>Iniciar Produção</Text>
                  </View>
                )}
              </Button>
            </View>

            {/* Technical Specs Card */}
            <Card className="p-3 bg-muted/20">
              <Text className="text-xs font-medium text-muted-foreground mb-2">Especificações Técnicas</Text>
              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Densidade:</Text>
                  <Text className="text-xs font-medium">{formulaDensity.toFixed(3)} g/ml</Text>
                </View>
                {formula.pricePerLiter && (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted-foreground">Preço por Litro (ref):</Text>
                    <Text className="text-xs font-medium">{formatCurrency(formula.pricePerLiter)}</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Warnings (matching web) */}
            {calculatedTotals.missingComponents.length > 0 && (
              <Alert variant="destructive">
                <IconAlertTriangle size={16} color={colors.destructive} />
                <AlertDescription>
                  <Text className="font-semibold">Estoque insuficiente:</Text> {calculatedTotals.missingComponents.length} componente{calculatedTotals.missingComponents.length > 1 ? "s" : ""} sem estoque suficiente para esta produção.
                </AlertDescription>
              </Alert>
            )}

            {correctionMode && errorComponent && (
              <Alert>
                <IconExclamationCircle size={16} color={colors.primary} />
                <AlertDescription>
                  Modo correção ativo. Componente com erro: {
                    componentCalculations.find(c => c.id === errorComponent.componentId)?.name
                  } (Razão de erro: {errorComponent.errorRatio.toFixed(2)}x)
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </View>

      {/* Error Component Selection Dialog */}
      <Modal
        visible={showErrorDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowErrorDialog(false)}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-background rounded-lg p-4 m-4 max-w-sm w-full" style={{ backgroundColor: colors.card }}>
            <Text className="text-lg font-semibold mb-4">Selecionar Componente com Erro</Text>

            <Text className="text-sm text-muted-foreground mb-3">
              Selecione o componente que teve problema e informe a quantidade real adicionada.
            </Text>

            <View className="gap-3">
              <View>
                <Text className="text-sm font-medium mb-2">Componente</Text>
                <ScrollView style={{ maxHeight: 200 }} className="border rounded-lg p-2">
                  {componentCalculations.map((calc) => (
                    <TouchableOpacity
                      key={calc.id}
                      onPress={() => setTempErrorComponentId(calc.id)}
                      className="p-2 rounded mb-1"
                      style={{
                        backgroundColor: tempErrorComponentId === calc.id ? colors.primary + "20" : 'transparent'
                      }}
                    >
                      <Text className="text-sm">
                        {calc.name} ({calc.calculatedWeight.toFixed(1)}g esperado)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {tempErrorComponentId && (
                <View>
                  <Text className="text-sm font-medium mb-2">Quantidade Real Adicionada (g)</Text>
                  <Input
                    value={tempActualWeight}
                    onChangeText={setTempActualWeight}
                    keyboardType="numeric"
                    placeholder="Ex: 150"
                  />
                  {tempActualWeight && parseFloat(tempActualWeight) < componentCalculations.find(c => c.id === tempErrorComponentId)?.calculatedWeight! && (
                    <Text className="text-xs text-destructive mt-1">
                      A quantidade real deve ser maior ou igual ao esperado
                    </Text>
                  )}
                </View>
              )}

              <View className="flex-row gap-2 mt-4">
                <Button
                  variant="outline"
                  onPress={() => {
                    setShowErrorDialog(false);
                    setCorrectionMode(false);
                  }}
                  className="flex-1"
                >
                  <Text>Cancelar</Text>
                </Button>
                <Button
                  onPress={handleConfirmError}
                  disabled={!tempErrorComponentId || !tempActualWeight ||
                    parseFloat(tempActualWeight) < componentCalculations.find(c => c.id === tempErrorComponentId)?.calculatedWeight!}
                  className="flex-1"
                >
                  <Text style={{ color: colors.primaryForeground }}>Confirmar</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}