import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { measureUtils } from '../../../utils';
import { MEASURE_UNIT } from '../../../constants';

interface MobileMeasureInputProps {
  initialWeight?: number | null;
  initialVolume?: number | null;
  initialDensity?: number | null;
  onMeasureChange?: (measures: { weightValue?: number; volumeValue?: number; densityValue?: number }) => void;
  showDensityCalculator?: boolean;
  allowManualDensity?: boolean;
  title?: string;
  subtitle?: string;
}

export function MobileMeasureInput({
  initialWeight = null,
  initialVolume = null,
  initialDensity = null,
  onMeasureChange,
  showDensityCalculator = true,
  allowManualDensity = true,
  title = "Medidas do Componente",
  subtitle = "Configure peso, volume e densidade",
}: MobileMeasureInputProps) {
  const [weight, setWeight] = useState<string>(initialWeight?.toString() || "");
  const [volume, setVolume] = useState<string>(initialVolume?.toString() || "");
  const [density, setDensity] = useState<string>(initialDensity?.toString() || "");
  const [autoCalculateDensity, setAutoCalculateDensity] = useState(true);
  const [calculationResult, setCalculationResult] = useState<{
    success: boolean;
    density?: number;
    error?: string;
  } | null>(null);

  // Auto-calculate density when weight and volume change
  useEffect(() => {
    if (autoCalculateDensity && weight && volume) {
      const weightValue = parseFloat(weight);
      const volumeValue = parseFloat(volume);

      if (weightValue > 0 && volumeValue > 0) {
        const result = measureUtils.calculateDensityInGramsMl({ value: weightValue, unit: MEASURE_UNIT.GRAM }, { value: volumeValue, unit: MEASURE_UNIT.MILLILITER });

        if (result.success) {
          setCalculationResult({
            success: true,
            density: result.density,
          });
          setDensity(result.density.toFixed(4));
        } else {
          setCalculationResult({
            success: false,
            error: (result as any).error,
          });
        }
      } else {
        setCalculationResult(null);
      }
    }
  }, [weight, volume, autoCalculateDensity]);

  // Notify parent of measure changes
  useEffect(() => {
    const measures = {
      weightValue: weight ? parseFloat(weight) : undefined,
      volumeValue: volume ? parseFloat(volume) : undefined,
      densityValue: density ? parseFloat(density) : undefined,
    };

    onMeasureChange?.(measures);
  }, [weight, volume, density, onMeasureChange]);

  const handleWeightChange = (value: string) => {
    setWeight(value);
    // Auto-calculate volume if density is set and auto-calc is off
    if (!autoCalculateDensity && density && value) {
      const weightValue = parseFloat(value);
      const densityValue = parseFloat(density);
      if (weightValue > 0 && densityValue > 0) {
        const calculatedVolume = weightValue / densityValue;
        setVolume(calculatedVolume.toFixed(3));
      }
    }
  };

  const handleVolumeChange = (value: string) => {
    setVolume(value);
    // Auto-calculate weight if density is set and auto-calc is off
    if (!autoCalculateDensity && density && value) {
      const volumeValue = parseFloat(value);
      const densityValue = parseFloat(density);
      if (volumeValue > 0 && densityValue > 0) {
        const calculatedWeight = volumeValue * densityValue;
        setWeight(calculatedWeight.toFixed(3));
      }
    }
  };

  const handleDensityChange = (value: string) => {
    setDensity(value);
    setAutoCalculateDensity(false);
    setCalculationResult(null);
  };

  const calculateDensityManually = () => {
    if (!weight || !volume) {
      setCalculationResult({
        success: false,
        error: "Informe peso e volume para calcular densidade",
      });
      return;
    }

    const weightValue = parseFloat(weight);
    const volumeValue = parseFloat(volume);

    const result = measureUtils.calculateDensityInGramsMl({ value: weightValue, unit: MEASURE_UNIT.GRAM }, { value: volumeValue, unit: MEASURE_UNIT.MILLILITER });

    if (result.success) {
      setCalculationResult({
        success: true,
        density: result.density,
      });
      setDensity(result.density.toFixed(4));
      setAutoCalculateDensity(false);
    } else {
      setCalculationResult({
        success: false,
        error: (result as any).error,
      });
    }
  };

  const resetCalculation = () => {
    setAutoCalculateDensity(true);
    setCalculationResult(null);
  };

  // Validate inputs
  const getValidationErrors = () => {
    const errors: string[] = [];

    if (weight && parseFloat(weight) <= 0) {
      errors.push("Peso deve ser maior que zero");
    }

    if (volume && parseFloat(volume) <= 0) {
      errors.push("Volume deve ser maior que zero");
    }

    if (density && parseFloat(density) <= 0) {
      errors.push("Densidade deve ser maior que zero");
    }

    return errors;
  };

  const validationErrors = getValidationErrors();

  return (
    <Card className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <Icon name="scale" size={20} className="text-primary" />
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
          <Text className="text-sm text-muted-foreground">{subtitle}</Text>
        </View>
      </View>

      <View className="space-y-4">
        {/* Weight Input */}
        <View>
          <Label nativeID="weight">Peso (gramas)</Label>
          <View className="flex-row items-center gap-2 mt-1">
            <Input id="weight" value={weight} onChangeText={handleWeightChange} keyboardType="numeric" placeholder="250" className="flex-1" />
            <Badge variant="secondary">
              g
            </Badge>
          </View>
        </View>

        {/* Volume Input */}
        <View>
          <Label nativeID="volume">Volume (mililitros)</Label>
          <View className="flex-row items-center gap-2 mt-1">
            <Input id="volume" value={volume} onChangeText={handleVolumeChange} keyboardType="numeric" placeholder="200" className="flex-1" />
            <Badge variant="secondary">
              ml
            </Badge>
          </View>
        </View>

        <Separator />

        {/* Density Section */}
        {showDensityCalculator && (
          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Label nativeID="density">Densidade (g/ml)</Label>
              {allowManualDensity && (
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-muted-foreground">Auto</Text>
                  <Switch checked={autoCalculateDensity} onCheckedChange={setAutoCalculateDensity} />
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <Input
                id="density"
                value={density}
                onChangeText={handleDensityChange}
                keyboardType="numeric"
                placeholder="1.25"
                className="flex-1"
                editable={!autoCalculateDensity || allowManualDensity}
              />
              <Badge variant="secondary">
                g/ml
              </Badge>
              {!autoCalculateDensity && (
                <Button variant="outline" size="sm" onPress={calculateDensityManually} disabled={!weight || !volume}>
                  <Icon name="calculator" size={14} />
                </Button>
              )}
            </View>
          </View>
        )}

        {/* Calculation Result */}
        {calculationResult && (
          <Alert variant={calculationResult.success ? "default" : "destructive"}>
            <Icon name={calculationResult.success ? "check-circle" : "alert-circle"} size={16} />
            <AlertDescription>
              {calculationResult.success ? (
                <View>
                  <Text className="font-medium">Densidade calculada:</Text>
                  <Text>{calculationResult.density?.toFixed(4)} g/ml</Text>
                  {autoCalculateDensity && <Text className="text-xs mt-1">Calculada automaticamente a partir do peso e volume</Text>}
                </View>
              ) : (
                <Text>{calculationResult.error}</Text>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <Icon name="alert-triangle" size={16} />
            <AlertDescription>
              {validationErrors.map((error, index) => (
                <Text key={index} className="text-sm">
                  • {error}
                </Text>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Conversion Helper */}
        {weight && volume && density && validationErrors.length === 0 && (
          <View className="bg-muted/30 rounded-lg p-3">
            <Text className="text-xs font-medium text-muted-foreground mb-2">Conversões Rápidas:</Text>
            <View className="space-y-1">
              <Text className="text-xs text-muted-foreground">1ml ≈ {parseFloat(density).toFixed(3)}g</Text>
              <Text className="text-xs text-muted-foreground">1g ≈ {(1 / parseFloat(density)).toFixed(3)}ml</Text>
              <Text className="text-xs text-muted-foreground">
                Proporção: {parseFloat(weight).toFixed(1)}g para {parseFloat(volume).toFixed(1)}ml
              </Text>
            </View>
          </View>
        )}

        {/* Reset Button */}
        {!autoCalculateDensity && allowManualDensity && (
          <Button variant="outline" onPress={resetCalculation} className="w-full">
            <Icon name="refresh-cw" size={16} className="mr-2" />
            Resetar para Cálculo Automático
          </Button>
        )}
      </View>
    </Card>
  );
}
