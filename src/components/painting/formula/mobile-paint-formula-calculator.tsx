import { useState, useMemo } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert as RNAlert } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { formatNumberWithDecimals, formatCurrency } from "@/utils";
import { useTheme } from "@/lib/theme";
import type { PaintFormula, Item } from "../../../types";
import { IconAlertTriangle, IconCheck, IconX, IconAlertCircle, IconLoader2, IconCurrencyDollar, IconAdjustments, IconCalculator } from "@tabler/icons-react-native";
import { usePaintProductionMutations, useKeyboardAwareScroll } from "@/hooks";
import { useItems } from "../../../hooks";
// import { showToast } from "@/components/ui/toast";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { formSpacing } from "@/constants/form-styles";

interface MobilePaintFormulaCalculatorProps {
  formula: PaintFormula;
  /** If false, the price toggle and all price columns will be hidden */
  allowPriceVisibility?: boolean;
}

// Quick volume buttons (mobile optimized)
const QUICK_VOLUMES = [100, 1000, 2000, 3600];

interface ComponentCalculation {
  id: string;
  itemId: string;
  name: string;
  code: string;
  ratio: number;
  weightInGrams: number;
  volumeInMl: number;
  density: number;
  price: number;
  pricePerLiter: number;
  hasStock: boolean;
  stockQuantity: number;
  correctedWeightInGrams?: number;
  correctedVolumeInMl?: number;
  additionalWeightNeeded?: number;
  wasAlreadyAdded?: boolean;
  hasError?: boolean;
}

export function MobilePaintFormulaCalculator({ formula, allowPriceVisibility = true }: MobilePaintFormulaCalculatorProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { createAsync: createProduction } = usePaintProductionMutations();

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Main state - VOLUME based like web
  const [desiredVolume, setDesiredVolume] = useState("2000");
  const [showPrices, setShowPrices] = useState(false);

  // Effective price visibility: user must have permission AND toggle must be on
  const effectiveShowPrices = allowPriceVisibility && showPrices;
  const [isProducing, setIsProducing] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  // Correction mode state (matching web)
  const [correctionMode, setCorrectionMode] = useState(false);
  const [errorComponentId, setErrorComponentId] = useState<string | null>(null);
  const [actualAmount, setActualAmount] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedComponentForError, setSelectedComponentForError] = useState<string | null>(null);

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  // Get item IDs from formula components
  const itemIds = useMemo(() => {
    return formula.components?.map((c) => c.itemId).filter(Boolean) || [];
  }, [formula.components]);

  // Fetch items with measures and prices
  const { data: itemsResponse } = useItems({
    where: {
      id: { in: itemIds },
    },
    include: {
      measures: true,
      prices: true,
    },
    enabled: itemIds.length > 0,
  });

  // Create a map of items by ID for quick lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>();
    itemsResponse?.data?.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [itemsResponse]);

  // Calculate error ratio if in correction mode (matching web)
  const errorRatio = useMemo(() => {
    if (!correctionMode || !errorComponentId || !actualAmount) return 1;

    const errorComponent = formula.components?.find((c) => c.id === errorComponentId);
    if (!errorComponent) return 1;

    const ratioSum = formula.components?.reduce((sum, c) => sum + (c.ratio || 0), 0) || 0;
    const needsNormalization = ratioSum > 0 && ratioSum < 10;

    let componentRatio = errorComponent.ratio || 0;
    if (needsNormalization) {
      componentRatio = componentRatio * 100;
    }

    const volumeInMl = parseFloat(desiredVolume) || 0;
    const formulaDensity = Number(formula.density) || 1.0;
    const totalWeightInGrams = volumeInMl * formulaDensity;
    const expectedWeight = (totalWeightInGrams * componentRatio) / 100;
    const actualWeight = parseFloat(actualAmount) || 0;

    return actualWeight / expectedWeight;
  }, [correctionMode, errorComponentId, actualAmount, formula, desiredVolume]);

  // Calculate components based on desired volume (EXACT web logic)
  const calculatedComponents = useMemo((): ComponentCalculation[] => {
    if (!formula.components || formula.components.length === 0) return [];

    const volumeInMl = parseFloat(desiredVolume) || 0;
    if (volumeInMl <= 0) return [];

    // Formula density in g/ml
    const formulaDensity = Number(formula.density) || 1.0;

    // Total weight for the desired volume
    const totalWeightInGrams = volumeInMl * formulaDensity;

    // Check if ratios need to be normalized (if they sum to ~1 instead of 100)
    const ratioSum = formula.components.reduce((sum, c) => sum + (c.ratio || 0), 0);
    const needsNormalization = ratioSum > 0 && ratioSum < 10;

    // Calculate each component
    return formula.components
      .map((component) => {
        let ratio = component.ratio || 0;

        // Normalize ratio if needed (convert from decimal to percentage)
        if (needsNormalization) {
          ratio = ratio * 100;
        }

        // IMPORTANT: The ratio represents WEIGHT percentage based on the original formula
        // Calculate component weight based on the total weight needed
        const componentWeightInGrams = (totalWeightInGrams * ratio) / 100;

        // Get item info from either the component or the fetched items map
        const item = itemsMap.get(component.itemId) || component.item;

        // Get weight measure from item (weight per can/unit)
        const weightMeasure = item?.measures?.find((m) => m.measureType === "WEIGHT");

        // Calculate weight per unit in grams
        let weightPerUnitInGrams = 0;
        if (weightMeasure) {
          if (weightMeasure.unit === "KILOGRAM") {
            weightPerUnitInGrams = (weightMeasure.value || 0) * 1000;
          } else if (weightMeasure.unit === "GRAM") {
            weightPerUnitInGrams = weightMeasure.value || 0;
          }
        }

        // If no weight measure, check for volume measure and use density
        if (weightPerUnitInGrams === 0) {
          const volumeMeasure = item?.measures?.find((m) => m.measureType === "VOLUME");
          if (volumeMeasure) {
            let volumeInMl = 0;
            if (volumeMeasure.unit === "LITER") {
              volumeInMl = (volumeMeasure.value || 0) * 1000;
            } else if (volumeMeasure.unit === "MILLILITER") {
              volumeInMl = volumeMeasure.value || 0;
            }
            weightPerUnitInGrams = volumeInMl * formulaDensity;
          }
        }

        // If still no weight, assume the item quantity is already in the unit we need
        if (weightPerUnitInGrams === 0) {
          weightPerUnitInGrams = 1;
        }

        // Calculate total available weight in grams
        const totalAvailableWeight = (item?.quantity || 0) * weightPerUnitInGrams;

        // Calculate density
        const volumeMeasure = item?.measures?.find((m) => m.measureType === "VOLUME");
        let itemDensity = formulaDensity;

        if (weightMeasure?.value && volumeMeasure?.value && volumeMeasure.value > 0) {
          itemDensity = weightMeasure.value / volumeMeasure.value;
        }

        // Calculate component's proportional volume
        const componentVolumeInMl = (volumeInMl * ratio) / 100;

        // Calculate actual price based on item price and weight
        const itemPrice = item?.prices?.[0]?.value || 0;
        const pricePerGram = weightPerUnitInGrams > 0 ? itemPrice / weightPerUnitInGrams : 0;
        const componentCost = pricePerGram * componentWeightInGrams;
        const componentPricePerLiterShare = volumeInMl > 0 ? (componentCost * 1000) / volumeInMl : 0;

        // Calculate corrected amounts if in correction mode (matching web)
        let correctedWeightInGrams = componentWeightInGrams;
        let correctedVolumeInMl = componentVolumeInMl;
        let additionalWeightNeeded = 0;

        const wasAlreadyAdded = selectedComponents.includes(component.id || "");
        const isErrorComponent = component.id === errorComponentId;

        if (correctionMode && errorRatio !== 1) {
          correctedWeightInGrams = componentWeightInGrams * errorRatio;
          correctedVolumeInMl = componentVolumeInMl * errorRatio;

          if (wasAlreadyAdded && !isErrorComponent) {
            additionalWeightNeeded = correctedWeightInGrams - componentWeightInGrams;
          }
        }

        return {
          id: component.id || "",
          itemId: component.itemId,
          name: item?.name || "Item não encontrado",
          code: item?.uniCode || "SEM CÓDIGO",
          ratio,
          weightInGrams: componentWeightInGrams,
          volumeInMl: componentVolumeInMl,
          density: itemDensity,
          price: componentCost,
          pricePerLiter: componentPricePerLiterShare,
          hasStock: totalAvailableWeight >= (correctionMode ? correctedWeightInGrams : componentWeightInGrams),
          stockQuantity: totalAvailableWeight,
          correctedWeightInGrams: correctionMode ? correctedWeightInGrams : undefined,
          correctedVolumeInMl: correctionMode ? correctedVolumeInMl : undefined,
          additionalWeightNeeded: correctionMode ? additionalWeightNeeded : undefined,
          wasAlreadyAdded,
          hasError: isErrorComponent,
        };
      })
      .sort((a, b) => a.ratio - b.ratio); // Sort by ratio (lowest first)
  }, [formula, desiredVolume, itemsMap, correctionMode, errorRatio, errorComponentId, selectedComponents]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalWeight = calculatedComponents.reduce((sum, comp) => sum + comp.weightInGrams, 0);
    const totalVolume = calculatedComponents.reduce((sum, comp) => sum + comp.volumeInMl, 0);
    const totalCost = calculatedComponents.reduce((sum, comp) => sum + comp.price, 0);
    const allInStock = calculatedComponents.every((comp) => comp.hasStock);

    const volumeInLiters = totalVolume / 1000;
    const pricePerLiter = volumeInLiters > 0 ? totalCost / volumeInLiters : 0;

    const totalRatio = calculatedComponents.reduce((sum, comp) => sum + comp.ratio, 0);
    const ratioIsValid = Math.abs(totalRatio - 100) <= 0.1;

    return {
      weight: totalWeight,
      volume: totalVolume,
      price: totalCost,
      allInStock,
      pricePerLiter,
      totalRatio,
      ratioIsValid,
      isValid: ratioIsValid && allInStock && totalWeight > 0,
    };
  }, [calculatedComponents]);

  const handleToggleComponent = (componentId: string) => {
    // Allow toggling checkboxes in both normal and correction mode
    setSelectedComponents((prev) =>
      prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId]
    );
  };

  const handleComponentError = (componentId: string) => {
    setSelectedComponentForError(componentId);
    setShowErrorDialog(true);
  };

  const handleConfirmError = () => {
    if (selectedComponentForError && actualAmount) {
      setErrorComponentId(selectedComponentForError);
      setCorrectionMode(true);
      setShowErrorDialog(false);
    }
  };

  const handleResetCorrection = () => {
    setCorrectionMode(false);
    setErrorComponentId(null);
    setActualAmount("");
  };

  const handleProduction = async () => {
    if (!totals.allInStock || totals.weight <= 0) {
      RNAlert.alert(
        "Não é possível produzir",
        totals.allInStock ? "Peso inválido" : "Estoque insuficiente"
      );
      return;
    }

    setIsProducing(true);
    try {
      const volumeInLiters = parseFloat(desiredVolume) / 1000;
      const result = await createProduction({
        formulaId: formula.id,
        volumeLiters: volumeInLiters,
      });

      if (result?.data?.id) {
        // API client already shows success alert, just navigate
        setSelectedComponents([]);
        router.push("/(tabs)/pintura/catalogo/listar");
      }
    } catch (error) {
      console.error("Error creating production:", error);
      // API client already shows error alert
    } finally {
      setIsProducing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        ref={refs.scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onLayout={handlers.handleScrollViewLayout}
        onScroll={handlers.handleScroll}
        scrollEventThrottle={16}
      >
        <KeyboardAwareFormProvider value={keyboardContextValue}>
          <Card style={styles.card}>
            {/* Card Header */}
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <IconCalculator size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Calculadora de Produção
              </Text>
            </View>

            <View style={styles.container}>
              {/* Controls Section */}
              <View style={styles.controls}>
                {/* Volume Input */}
                <View
                  style={styles.inputSection}
                  onLayout={(e) => handlers.handleFieldLayout('volumeInput', e)}
                >
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Volume Desejado (ml)
                  </Text>
                <Input
                  value={desiredVolume}
                  onChangeText={(value) => setDesiredVolume(value?.toString() || "")}
                  keyboardType="numeric"
                  placeholder="Digite o volume desejado em ml"
                  style={styles.input}
                  onFocus={() => handlers.handleFieldFocus('volumeInput')}
                />
          {/* Quick Buttons and Action Icons Row */}
          <View style={styles.quickButtonsRow}>
            <View style={styles.quickButtons}>
              {QUICK_VOLUMES.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => setDesiredVolume(amount.toString())}
                  style={[
                    styles.quickButton,
                    {
                      backgroundColor: parseInt(desiredVolume) === amount ? colors.primary : colors.card,
                      borderColor: parseInt(desiredVolume) === amount ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      {
                        color: parseInt(desiredVolume) === amount ? colors.primaryForeground : colors.foreground,
                      },
                    ]}
                  >
                    {amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Icon Action Buttons */}
            <View style={styles.actionButtons}>
              {/* Price toggle - only show if user has permission */}
              {allowPriceVisibility && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPrices(!showPrices)}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: showPrices ? colors.primary : colors.card,
                      borderColor: showPrices ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <IconCurrencyDollar
                    size={20}
                    color={showPrices ? colors.primaryForeground : colors.foreground}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (!correctionMode) {
                    // Find the last checked component (the proper marked item itself is the wrong one)
                    const checkedComponents = calculatedComponents.filter((c) => selectedComponents.includes(c.id));
                    const lastChecked = checkedComponents.length > 0 ? checkedComponents[checkedComponents.length - 1] : null;
                    if (lastChecked) {
                      handleComponentError(lastChecked.id);
                    }
                  } else {
                    handleResetCorrection();
                  }
                }}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: correctionMode ? colors.primary : colors.card,
                    borderColor: correctionMode ? colors.primary : colors.border,
                  },
                ]}
                disabled={parseFloat(desiredVolume) <= 0}
              >
                <IconAdjustments
                  size={20}
                  color={correctionMode ? colors.primaryForeground : colors.foreground}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Components Table */}
      {calculatedComponents.length > 0 && (
        <View style={[styles.table, { borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.tableHeader, { backgroundColor: colors.muted }]}>
            <View style={styles.checkboxCell}>
              <Checkbox
                checked={calculatedComponents.length > 0 && calculatedComponents.every((c) => selectedComponents.includes(c.id))}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedComponents(calculatedComponents.map((c) => c.id));
                  } else {
                    setSelectedComponents([]);
                  }
                }}
                disabled={correctionMode}
              />
            </View>
            <Text style={[styles.headerText, { color: colors.foreground }]}>Item</Text>
            <Text style={[styles.headerTextRight, { color: colors.foreground }]}>Peso (g)</Text>
            {correctionMode && <Text style={[styles.headerTextRight, { color: colors.foreground }]}>Correção</Text>}
            {effectiveShowPrices && <Text style={[styles.headerTextRight, { color: colors.foreground }]}>Preço</Text>}
          </View>

          {/* Rows */}
          <ScrollView>
            {calculatedComponents.map((component) => (
              <TouchableOpacity
                key={component.id}
                onPress={() => handleToggleComponent(component.id)}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: selectedComponents.includes(component.id) ? colors.muted + "50" : "transparent",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={styles.checkboxCell}>
                  {correctionMode && component.hasError ? (
                    <IconAlertCircle size={16} color={colors.destructive} />
                  ) : (
                    <Checkbox
                      checked={selectedComponents.includes(component.id)}
                      onCheckedChange={() => handleToggleComponent(component.id)}
                    />
                  )}
                </View>
                <View style={styles.itemCell}>
                  <Text style={[styles.itemText, { color: colors.foreground }]} numberOfLines={2}>
                    <Text style={[styles.itemCode, { color: colors.mutedForeground }]}>{component.code}</Text>
                    {" "}
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{component.name}</Text>
                  </Text>
                  {!component.hasStock && (
                    <IconAlertCircle size={16} color={colors.destructive} style={styles.stockIcon} />
                  )}
                </View>
                <View style={styles.weightCell}>
                  <Text style={[styles.weightText, { color: colors.foreground }]}>
                    {component.weightInGrams > 20
                      ? Math.round(component.weightInGrams)
                      : formatNumberWithDecimals(component.weightInGrams, 1)}
                  </Text>
                </View>
                {correctionMode && (
                  <View style={styles.weightCell}>
                    {component.hasError ? (
                      <Text style={[styles.weightText, { color: colors.destructive, fontWeight: "600" }]}>
                        {parseFloat(actualAmount) > 20
                          ? Math.round(parseFloat(actualAmount))
                          : formatNumberWithDecimals(parseFloat(actualAmount) || 0, 1)}
                      </Text>
                    ) : component.correctedWeightInGrams ? (
                      component.wasAlreadyAdded && component.additionalWeightNeeded !== undefined ? (
                        <Text style={[styles.weightText, { color: "#f59e0b", fontWeight: "600" }]}>
                          {component.additionalWeightNeeded >= 0 ? "+" : ""}
                          {component.additionalWeightNeeded > 20 || component.additionalWeightNeeded < -20
                            ? Math.round(component.additionalWeightNeeded)
                            : formatNumberWithDecimals(component.additionalWeightNeeded, 1)}
                        </Text>
                      ) : (
                        <Text style={[styles.weightText, { color: "#3b82f6", fontWeight: "600" }]}>
                          {component.correctedWeightInGrams > 20
                            ? Math.round(component.correctedWeightInGrams)
                            : formatNumberWithDecimals(component.correctedWeightInGrams, 1)}
                        </Text>
                      )
                    ) : null}
                  </View>
                )}
                {effectiveShowPrices && (
                  <View style={styles.priceCell}>
                    <Text style={[styles.priceText, { color: colors.foreground }]}>
                      {formatCurrency(component.price)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Total Row */}
            <View style={[styles.tableRow, styles.totalRow, { backgroundColor: colors.muted + "80" }]}>
              <View style={styles.checkboxCell} />
              <View style={styles.itemCell}>
                <Text style={[styles.totalText, { color: colors.foreground }]}>Total</Text>
              </View>
              <View style={styles.weightCell}>
                <Text style={[styles.totalText, { color: colors.foreground }]}>
                  {totals.weight > 20 ? Math.round(totals.weight) : formatNumberWithDecimals(totals.weight, 1)}
                </Text>
              </View>
              {correctionMode && (
                <View style={styles.weightCell}>
                  <Text style={[styles.totalText, { color: "#3b82f6" }]}>
                    {totals.weight * errorRatio > 20
                      ? Math.round(totals.weight * errorRatio)
                      : formatNumberWithDecimals(totals.weight * errorRatio, 1)}
                  </Text>
                </View>
              )}
              {effectiveShowPrices && (
                <View style={styles.priceCell}>
                  <Text style={[styles.totalText, { color: colors.primary }]}>
                    {formatCurrency(totals.price)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Warnings */}
      {!totals.allInStock && (
        <Alert variant="destructive" style={styles.alert}>
          <IconAlertTriangle size={16} color={colors.destructive} />
          <AlertDescription>
            Alguns componentes não têm estoque suficiente
          </AlertDescription>
        </Alert>
      )}

      {/* Production Button */}
      <Button
        onPress={handleProduction}
        disabled={!totals.allInStock || totals.weight <= 0 || isProducing}
        style={styles.productionButton}
      >
        {isProducing ? (
          <View style={styles.buttonContent}>
            <IconLoader2 size={20} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Criando Produção...</Text>
          </View>
        ) : (
          <Text style={{ color: colors.primaryForeground }}>Produzir</Text>
        )}
      </Button>

            </View>
          </Card>
        </KeyboardAwareFormProvider>
      </ScrollView>

      {/* Error Dialog */}
      <Modal
        visible={showErrorDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowErrorDialog(false);
          if (!errorComponentId) {
            setCorrectionMode(false);
            setActualAmount("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Informar Quantidade Real</Text>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              {selectedComponentForError &&
                (() => {
                  const component = calculatedComponents.find((c) => c.id === selectedComponentForError);
                  return component ? (
                    <>
                      Você está marcando o componente <Text style={{ fontWeight: "600" }}>{component.name}</Text> como tendo um erro. A quantidade esperada era de{" "}
                      <Text style={{ fontWeight: "600" }}>{formatNumberWithDecimals(component.weightInGrams, 1)}g</Text>. Por favor, informe a quantidade real que foi adicionada.
                    </>
                  ) : null;
                })()}
            </Text>

            <View
              style={styles.modalInput}
              onLayout={(e) => handlers.handleFieldLayout('actualAmount', e)}
            >
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Quantidade Real (g)</Text>
              <Input
                value={actualAmount}
                onChangeText={(value) => setActualAmount(value?.toString() || "")}
                keyboardType="numeric"
                placeholder="Digite a quantidade real em gramas"
                onFocus={() => handlers.handleFieldFocus('actualAmount')}
              />
              {selectedComponentForError &&
                (() => {
                  const component = calculatedComponents.find((c) => c.id === selectedComponentForError);
                  const expectedWeight = component?.weightInGrams || 0;
                  const typedValue = parseFloat(actualAmount) || 0;

                  if (actualAmount && typedValue < expectedWeight) {
                    return (
                      <Text style={[styles.errorText, { color: colors.destructive }]}>
                        A quantidade não pode ser menor que o esperado ({formatNumberWithDecimals(expectedWeight, 1)}g)
                      </Text>
                    );
                  }
                  return null;
                })()}
            </View>

            <View style={styles.modalActions}>
              <View style={styles.modalButton}>
                <Button
                  variant="outline"
                  onPress={() => {
                    setShowErrorDialog(false);
                    setCorrectionMode(false);
                    setActualAmount("");
                    setSelectedComponentForError(null);
                  }}
                >
                  <Text>Cancelar</Text>
                </Button>
              </View>
              <View style={styles.modalButton}>
                <Button
                  onPress={handleConfirmError}
                  disabled={(() => {
                    if (!actualAmount) return true;
                    const component = calculatedComponents.find((c) => c.id === selectedComponentForError);
                    const expectedWeight = component?.weightInGrams || 0;
                    const typedValue = parseFloat(actualAmount) || 0;
                    return typedValue < expectedWeight;
                  })()}
                >
                  <Text style={{ color: colors.primaryForeground }}>Confirmar Erro</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    gap: 16,
  },
  controls: {
    gap: 16,
  },
  inputSection: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    height: 40,
  },
  quickButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  checkboxCell: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  headerTextRight: {
    width: 100,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  itemCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 40,
  },
  itemText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  itemCode: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemName: {
    fontSize: 14,
  },
  stockIcon: {
    marginLeft: 4,
  },
  weightCell: {
    width: 100,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 8,
  },
  weightText: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  priceCell: {
    width: 100,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  priceText: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  totalRow: {
    borderBottomWidth: 0,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
  },
  alert: {
    marginVertical: 8,
  },
  productionButton: {
    width: "100%",
    marginTop: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalInput: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
