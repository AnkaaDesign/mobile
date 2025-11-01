import { useState, useMemo } from "react";
import { View, TouchableOpacity, Modal, ScrollView } from "react-native";
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
import { MEASURE_UNIT } from "../../../constants";
import { formatCurrency, measureUtils } from "../../../utils";
import { useTheme } from "@/lib/theme";
import type { PaintFormula } from "../../../types";
import { IconAlertTriangle, IconCheck, IconX, IconExclamationCircle } from "@tabler/icons-react-native";

interface MobilePaintFormulaCalculatorProps {
  formula: PaintFormula;
}

// Predefined volume options
const PREDEFINED_VOLUMES = [
  { label: "100ml", value: 100 },
  { label: "1L", value: 1000 },
  { label: "2L", value: 2000 },
  { label: "3.6L", value: 3600 },
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
  const [targetVolume, setTargetVolume] = useState<string>("2000");
  const [showPrices, setShowPrices] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [errorComponent, setErrorComponent] = useState<ErrorComponent | null>(null);
  const [tempErrorComponentId, setTempErrorComponentId] = useState<string>("");
  const [tempActualWeight, setTempActualWeight] = useState<string>("");
  const [alreadyAddedComponents, setAlreadyAddedComponents] = useState<Set<string>>(new Set());

  const components = formula.components || [];
  const targetVolumeInMl = parseFloat(targetVolume) || 0;
  const formulaDensity = Number(formula.density) || 1.0;
  const targetWeightInGrams = targetVolumeInMl * formulaDensity;

  // Normalize ratios if needed (matching web logic)
  const normalizedComponents = useMemo(() => {
    const sumRatio = components.reduce((sum, c) => sum + (c.ratio || 0), 0);

    // If ratios are in decimal format (0-10 range), multiply by 100
    if (sumRatio > 0 && sumRatio <= 10) {
      return components.map(c => ({
        ...c,
        ratio: (c.ratio || 0) * 100
      }));
    }

    return components;
  }, [components]);

  const handlePredefinedVolume = (value: number) => {
    setTargetVolume(value.toString());
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
    const component = normalizedComponents.find(c => c.id === tempErrorComponentId);
    if (component && tempActualWeight) {
      const expectedWeight = (component.ratio / 100) * targetWeightInGrams;
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
        normalizedComponents.forEach(c => {
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

  // Calculate component requirements based on ratios
  const componentCalculations = useMemo((): ComponentCalculation[] => {
    return normalizedComponents.map((comp) => {
      const baseWeight = (comp.ratio / 100) * targetWeightInGrams;
      let calculatedWeight = baseWeight;
      let correctedWeight: number | undefined;
      let additionalWeight: number | undefined;
      let isErrorComponent = false;
      let wasAlreadyAdded = false;

      // Apply correction logic if in correction mode
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
          : formulaDensity;

      // Calculate volume based on weight and density
      const calculatedVolume = calculatedWeight / itemDensity;

      // Determine stock unit and calculate required units
      const stockUnit = item?.measures?.[0]?.unit || MEASURE_UNIT.UNIT;
      let requiredUnits = calculatedWeight;

      if (stockUnit === MEASURE_UNIT.KILOGRAM) {
        requiredUnits = calculatedWeight / 1000;
      } else if (stockUnit === MEASURE_UNIT.GRAM) {
        requiredUnits = calculatedWeight;
      } else if (stockUnit === MEASURE_UNIT.MILLILITER) {
        requiredUnits = calculatedVolume;
      } else if (stockUnit === MEASURE_UNIT.LITER) {
        requiredUnits = calculatedVolume / 1000;
      } else if (weightMeasure?.value) {
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
  }, [normalizedComponents, targetWeightInGrams, formulaDensity, correctionMode, errorComponent, alreadyAddedComponents]);

  // Sort components by ratio (highest first)
  const sortedCalculations = [...componentCalculations].sort((a, b) => b.ratio - a.ratio);

  // Calculate totals
  const totalCost = sortedCalculations.reduce((sum, calc) => sum + calc.totalCost, 0);
  const totalWeight = sortedCalculations.reduce((sum, calc) => sum + (calc.correctedWeight || calc.calculatedWeight), 0);
  const totalVolume = totalWeight / formulaDensity;
  const pricePerLiter = totalVolume > 0 ? (totalCost / (totalVolume / 1000)) : 0;
  const allInStock = sortedCalculations.every((calc) => calc.hasStock);
  const missingComponents = sortedCalculations.filter((calc) => !calc.hasStock);

  // Validate ratio sum
  const ratioSum = normalizedComponents.reduce((sum, c) => sum + (c.ratio || 0), 0);
  const isValidRatioSum = Math.abs(ratioSum - 100) < 0.1;

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="p-2 rounded-lg bg-primary/10">
          <Icon name="calculator" size={20} className="text-primary" />
        </View>
        <Text className="text-lg font-semibold text-foreground">Calculadora de Fórmula</Text>
      </View>

      {!isValidRatioSum && (
        <Alert variant="destructive" style={{ marginBottom: 16 }}>
          <IconAlertTriangle size={16} color={colors.destructive} />
          <AlertDescription>
            A soma das proporções ({ratioSum.toFixed(1)}%) deve ser igual a 100%
          </AlertDescription>
        </Alert>
      )}

      <View className="gap-4">
        {/* Volume Input */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Volume Desejado (ml)</Text>

          {/* Predefined Volume Buttons */}
          <View className="flex-row gap-2 flex-wrap">
            {PREDEFINED_VOLUMES.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handlePredefinedVolume(option.value)}
                className="px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: targetVolume === option.value.toString() ? colors.primary : 'transparent',
                  borderColor: targetVolume === option.value.toString() ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: targetVolume === option.value.toString() ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Volume Input */}
          <Input
            value={targetVolume}
            onChangeText={setTargetVolume}
            keyboardType="numeric"
            placeholder="2000"
          />
        </View>

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

        {targetVolumeInMl > 0 && (
          <>
            {/* Components Table */}
            <View className="gap-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-foreground">Componentes</Text>
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

              {sortedCalculations.map((calc, index) => {
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

            {/* Production Summary */}
            <View className="bg-primary/10 rounded-lg p-3 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">Volume Total</Text>
                <Text className="text-base font-bold">
                  {(totalVolume / 1000).toFixed(2)} L ({totalVolume.toFixed(0)} ml)
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">Peso Total</Text>
                <Text className="text-base font-bold">
                  {(totalWeight / 1000).toFixed(2)} kg ({totalWeight.toFixed(0)} g)
                </Text>
              </View>

              {showPrices && (
                <>
                  <Separator className="my-1" />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-foreground">Custo Total</Text>
                    <Text className="text-lg font-bold text-primary">
                      {formatCurrency(totalCost)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">Custo por Litro</Text>
                    <Text className="text-xs font-medium">
                      {formatCurrency(pricePerLiter)}
                    </Text>
                  </View>
                </>
              )}
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

            {correctionMode && errorComponent && (
              <Alert>
                <IconExclamationCircle size={16} color={colors.primary} />
                <AlertDescription>
                  Modo correção ativo. Componente com erro: {
                    sortedCalculations.find(c => c.id === errorComponent.componentId)?.name
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
                  {sortedCalculations.map((calc) => (
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
                  {tempActualWeight && parseFloat(tempActualWeight) < sortedCalculations.find(c => c.id === tempErrorComponentId)?.calculatedWeight! && (
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
                    parseFloat(tempActualWeight) < sortedCalculations.find(c => c.id === tempErrorComponentId)?.calculatedWeight!}
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