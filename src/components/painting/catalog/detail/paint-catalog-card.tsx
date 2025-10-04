import React from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { measureUtils } from '../../../../utils';
import { MEASURE_UNIT, PAINT_FINISH_LABELS, PAINT_BRAND_LABELS, COLOR_PALETTE_LABELS } from '../../../../constants';
import type { Paint, PaintFormulaComponent } from '../../../../types';

interface PaintCatalogCardProps {
  paint: Paint;
  showFormulas?: boolean;
}

export function PaintCatalogCard({ paint, showFormulas = true }: PaintCatalogCardProps) {
  const calculateFormulaMetrics = (components: PaintFormulaComponent[]) => {
    let totalWeight = 0;
    let totalVolume = 0;
    let hasWeightData = false;
    let hasVolumeData = false;

    components.forEach((component) => {
      if (component.ratio) {
        totalWeight += component.ratio;
        hasWeightData = true;
        // Assuming volume is also based on ratio for now
        totalVolume += component.ratio;
        hasVolumeData = true;
      }
    });

    return {
      totalWeight: hasWeightData ? totalWeight : null,
      totalVolume: hasVolumeData ? totalVolume : null,
      density: hasWeightData && hasVolumeData && totalVolume > 0 ? totalWeight / totalVolume : null,
      componentCount: components.length,
    };
  };

  return (
    <Card className="p-4">
      {/* Paint Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground mb-1">{paint.name}</Text>
          <View className="flex-row items-center gap-2 mb-2">
            {paint.paintBrand && <Badge variant="secondary">{paint.paintBrand.name}</Badge>}
            <Badge variant="outline">{PAINT_FINISH_LABELS[paint.finish] || paint.finish}</Badge>
          </View>
        </View>

        {/* Color Preview */}
        <View className="ml-3">
          <View className="w-12 h-12 rounded-lg border border-border" style={{ backgroundColor: paint.hex }} />
          <Text className="text-xs text-muted-foreground text-center mt-1">{paint.hex}</Text>
        </View>
      </View>

      {/* Paint Details */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1">
          <Icon name="palette" size={14} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">{COLOR_PALETTE_LABELS[paint.palette] || paint.palette}</Text>
        </View>

        {paint.manufacturer && (
          <View className="flex-row items-center gap-1">
            <Icon name="factory" size={14} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">{paint.manufacturer}</Text>
          </View>
        )}
      </View>

      {/* Tags */}
      {paint.tags && paint.tags.length > 0 && (
        <View className="mb-3">
          <Text className="text-sm text-muted-foreground mb-2">Tags:</Text>
          <View className="flex-row flex-wrap gap-1">
            {paint.tags.map((tag, index) => (
              <Badge key={index} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </View>
        </View>
      )}

      {/* Formula Information */}
      {showFormulas && paint.formulas && paint.formulas.length > 0 && (
        <>
          <Separator className="my-3" />
          <View>
            <View className="flex-row items-center gap-2 mb-3">
              <Icon name="flask" size={16} className="text-primary" />
              <Text className="text-sm font-medium text-foreground">Fórmulas ({paint.formulas.length})</Text>
            </View>

            {paint.formulas.map((formula, index) => {
              const metrics = calculateFormulaMetrics(formula.components || []);

              return (
                <View key={formula.id} className="mb-3 last:mb-0">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-foreground">{formula.description || `Fórmula ${index + 1}`}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {metrics.componentCount} componente{metrics.componentCount !== 1 ? "s" : ""}
                    </Text>
                  </View>

                  {/* Formula Metrics */}
                  <View className="bg-muted/50 rounded-lg p-3">
                    <View className="grid grid-cols-2 gap-3">
                      {/* Density */}
                      <View className="flex-row items-center gap-2">
                        <Icon name="gauge" size={14} className="text-muted-foreground" />
                        <View>
                          <Text className="text-xs text-muted-foreground">Densidade</Text>
                          <Text className="text-sm font-medium">
                            {formula.density ? `${formula.density.toFixed(4)} g/ml` : metrics.density ? `${metrics.density.toFixed(4)} g/ml` : "N/A"}
                          </Text>
                        </View>
                      </View>

                      {/* Price per Liter */}
                      <View className="flex-row items-center gap-2">
                        <Icon name="currency-real" size={14} className="text-muted-foreground" />
                        <View>
                          <Text className="text-xs text-muted-foreground">Preço/Litro</Text>
                          <Text className="text-sm font-medium">{formula.pricePerLiter ? `R$ ${formula.pricePerLiter.toFixed(2)}` : "N/A"}</Text>
                        </View>
                      </View>

                      {/* Total Weight */}
                      {metrics.totalWeight && (
                        <View className="flex-row items-center gap-2">
                          <Icon name="scale" size={14} className="text-muted-foreground" />
                          <View>
                            <Text className="text-xs text-muted-foreground">Peso Total</Text>
                            <Text className="text-sm font-medium">
                              {measureUtils.formatMeasure({
                                value: metrics.totalWeight,
                                unit: MEASURE_UNIT.GRAM,
                              })}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Total Volume */}
                      {metrics.totalVolume && (
                        <View className="flex-row items-center gap-2">
                          <Icon name="droplet" size={14} className="text-muted-foreground" />
                          <View>
                            <Text className="text-xs text-muted-foreground">Volume Total</Text>
                            <Text className="text-sm font-medium">
                              {measureUtils.formatMeasure({
                                value: metrics.totalVolume,
                                unit: MEASURE_UNIT.MILLILITER,
                              })}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Card>
  );
}
