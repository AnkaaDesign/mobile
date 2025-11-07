import React, { useState } from "react";
import { View, TouchableOpacity , StyleSheet} from "react-native";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemedText } from "@/components/ui/themed-text";
import { Combobox } from "@/components/ui/combobox";

import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { MEASURE_UNIT, MEASURE_TYPE, MEASURE_UNIT_LABELS, MEASURE_TYPE_LABELS } from '../../../../constants';
import { getUnitsInCategory, getMeasureUnitCategory, convertValue, canConvertUnits } from '../../../../types/measure';
import { validateMeasures, type MeasureFormData } from "@/utils/measure-utils";
import { IconPlus, IconTrash, IconScale, IconRuler, IconPackage, IconDroplet, IconHash } from "@tabler/icons-react-native";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface MeasuresManagerProps {
  disabled?: boolean;
}

// Remove local interface since we're importing it from utils

export function MeasuresManager({ disabled }: MeasuresManagerProps) {
  const { control } = useFormContext<ItemFormData>();
  const { colors } = useTheme();
  const [expandedMeasure, setExpandedMeasure] = useState<number | null>(null);
  const [_validationResult, _setValidationResult] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "measures",
  });

  // Validate measures whenever they change
  React.useEffect(() => {
    if (fields.length > 0) {
      const measures = fields.map((field) => field as unknown as MeasureFormData);
      const result = validateMeasures(measures);
      _setValidationResult(result);
    } else {
      _setValidationResult(null);
    }
  }, [fields]);

  // Get unit options grouped by category
  const getUnitOptions = (measureType?: MEASURE_TYPE) => {
    if (!measureType) return [];

    // Map measure types to their allowed units
    const MEASURE_TYPE_UNITS: Record<MEASURE_TYPE, MEASURE_UNIT[]> = {
      [MEASURE_TYPE.WEIGHT]: [MEASURE_UNIT.GRAM, MEASURE_UNIT.KILOGRAM],
      [MEASURE_TYPE.VOLUME]: [MEASURE_UNIT.MILLILITER, MEASURE_UNIT.LITER, MEASURE_UNIT.CUBIC_CENTIMETER, MEASURE_UNIT.CUBIC_METER],
      [MEASURE_TYPE.LENGTH]: [MEASURE_UNIT.MILLIMETER, MEASURE_UNIT.CENTIMETER, MEASURE_UNIT.METER, MEASURE_UNIT.INCHES],
      [MEASURE_TYPE.WIDTH]: [MEASURE_UNIT.MILLIMETER, MEASURE_UNIT.CENTIMETER, MEASURE_UNIT.METER, MEASURE_UNIT.INCHES],
      [MEASURE_TYPE.AREA]: [MEASURE_UNIT.SQUARE_CENTIMETER, MEASURE_UNIT.SQUARE_METER],
      [MEASURE_TYPE.COUNT]: [MEASURE_UNIT.UNIT, MEASURE_UNIT.PAIR, MEASURE_UNIT.DOZEN, MEASURE_UNIT.HUNDRED, MEASURE_UNIT.THOUSAND, MEASURE_UNIT.PACKAGE, MEASURE_UNIT.BOX, MEASURE_UNIT.ROLL, MEASURE_UNIT.SHEET, MEASURE_UNIT.SET, MEASURE_UNIT.SACK],
      [MEASURE_TYPE.DIAMETER]: [MEASURE_UNIT.MILLIMETER, MEASURE_UNIT.CENTIMETER, MEASURE_UNIT.METER, MEASURE_UNIT.INCHES],
      [MEASURE_TYPE.THREAD]: [MEASURE_UNIT.THREAD_MM, MEASURE_UNIT.THREAD_TPI],
      [MEASURE_TYPE.ELECTRICAL]: [MEASURE_UNIT.WATT, MEASURE_UNIT.VOLT, MEASURE_UNIT.AMPERE],
      [MEASURE_TYPE.SIZE]: [MEASURE_UNIT.P, MEASURE_UNIT.M, MEASURE_UNIT.G, MEASURE_UNIT.GG, MEASURE_UNIT.XG],
    };

    const allowedUnits = MEASURE_TYPE_UNITS[measureType] || [];

    return allowedUnits.map((unit) => ({
      value: unit,
      label: MEASURE_UNIT_LABELS[unit] || unit,
    }));
  };

  const getMeasureTypeOptions = () => {
    return Object.values(MEASURE_TYPE).map((type) => ({
      value: type,
      label: MEASURE_TYPE_LABELS[type] || type,
    }));
  };

  const addNewMeasure = () => {
    append({
      value: 1,
      unit: MEASURE_UNIT.UNIT,
      measureType: MEASURE_TYPE.COUNT,
    });
    setExpandedMeasure(fields.length);
  };

  const getMeasureTypeIcon = (measureType: MEASURE_TYPE) => {
    const iconProps = { size: 18, color: colors.mutedForeground };

    switch (measureType) {
      case MEASURE_TYPE.WEIGHT:
        return <IconScale {...iconProps} />;
      case MEASURE_TYPE.LENGTH:
        return <IconRuler {...iconProps} />;
      case MEASURE_TYPE.WIDTH:
        return <IconRuler {...iconProps} />;
      case MEASURE_TYPE.VOLUME:
        return <IconDroplet {...iconProps} />;
      case MEASURE_TYPE.COUNT:
        return <IconHash {...iconProps} />;
      default:
        return <IconPackage {...iconProps} />;
    }
  };

  const getConversionPreview = (measure: MeasureFormData, targetUnit: MEASURE_UNIT): string | null => {
    if (!canConvertUnits(measure.unit, targetUnit)) return null;

    const converted = convertValue(measure.value, measure.unit, targetUnit);
    if (converted === null) return null;

    const targetLabel = MEASURE_UNIT_LABELS[targetUnit] || targetUnit;
    return `≈ ${converted.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${targetLabel}`;
  };

  if (!fields.length && disabled) {
    return (
      <Card style={styles.card}>
        <CardContent style={styles.emptyContent}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted }])}>
            <IconRuler size={24} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>Nenhuma medida cadastrada</ThemedText>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <CardHeader>
        <View style={styles.headerRow}>
          <CardTitle style={styles.title}>Medidas do Produto</CardTitle>
          {!disabled && (
            <Button variant="outline" size="sm" onPress={addNewMeasure} style={styles.addButton}>
              <IconPlus size={16} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.addButtonText, { color: colors.primary }])}>Adicionar</ThemedText>
            </Button>
          )}
        </View>
      </CardHeader>
      <CardContent>
        <View style={styles.measuresContainer}>
          {fields.map((field, index) => (
            <Controller
              key={field.id}
              control={control}
              name={`measures.${index}`}
              render={({ field: formField, fieldState: { error } }) => {
                const measure = formField.value as MeasureFormData;
                const isExpanded = expandedMeasure === index;

                return (
                  <View style={styles.measureItem}>
                    {/* Measure Summary Card */}
                    <TouchableOpacity
                      style={StyleSheet.flatten([styles.measureSummary, { backgroundColor: colors.card }, isExpanded && { borderColor: colors.primary, borderWidth: 1 }])}
                      onPress={() => setExpandedMeasure(isExpanded ? null : index)}
                      disabled={disabled}
                    >
                      <View style={styles.measureSummaryContent}>
                        <View style={styles.measureIcon}>{getMeasureTypeIcon(measure.measureType)}</View>
                        <View style={styles.measureInfo}>
                          <ThemedText style={StyleSheet.flatten([styles.measureValue, { color: colors.foreground }])}>
                            {measure.value.toLocaleString("pt-BR")} {MEASURE_UNIT_LABELS[measure.unit]}
                          </ThemedText>
                          <ThemedText style={StyleSheet.flatten([styles.measureType, { color: colors.mutedForeground }])}>{MEASURE_TYPE_LABELS[measure.measureType]}</ThemedText>
                        </View>
                        {!disabled && (
                          <TouchableOpacity style={styles.deleteButton} onPress={() => remove(index)}>
                            <IconTrash size={16} color={colors.destructive} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Form */}
                    {isExpanded && !disabled && (
                      <View style={StyleSheet.flatten([styles.measureForm, { backgroundColor: colors.muted + "20" }])}>
                        <View style={styles.formRow}>
                          <View style={styles.formField}>
                            <Label style={styles.fieldLabel}>Tipo de Medida</Label>
                            <Combobox
                              value={measure.measureType}
                              onValueChange={(value) => {
                                const newMeasure = {
                                  ...measure,
                                  measureType: value as MEASURE_TYPE,
                                  // Reset unit when type changes
                                  unit: getUnitOptions(value as MEASURE_TYPE)[0]?.value || MEASURE_UNIT.UNIT,
                                };
                                formField.onChange(newMeasure);
                              }}
                              options={getMeasureTypeOptions()}
                              placeholder="Tipo"
                              searchable={false}
                            />
                          </View>
                        </View>

                        <View style={styles.formRow}>
                          <View style={styles.formFieldHalf}>
                            <Label style={styles.fieldLabel}>Valor</Label>
                            <Input
                              value={measure.value?.toString() || ""}
                              onChangeText={(text) => {
                                const value = parseFloat(text) || 0;
                                formField.onChange({ ...measure, value });
                              }}
                              placeholder="0"
                              keyboardType="decimal-pad"
                            />
                          </View>
                          <View style={styles.formFieldHalf}>
                            <Label style={styles.fieldLabel}>Unidade</Label>
                            <Combobox
                              value={measure.unit}
                              onValueChange={(value) => {
                                formField.onChange({ ...measure, unit: value as MEASURE_UNIT });
                              }}
                              options={getUnitOptions(measure.measureType)}
                              placeholder="Unidade"
                              searchable={false}
                            />
                          </View>
                        </View>

                        {/* Conversion Preview */}
                        {measure.measureType && (
                          <View style={styles.conversionPreview}>
                            <ThemedText style={StyleSheet.flatten([styles.conversionTitle, { color: colors.mutedForeground }])}>Conversões aproximadas:</ThemedText>
                            <View style={styles.conversionList}>
                              {getUnitsInCategory(getMeasureUnitCategory(measure.unit))
                                .filter((unit) => unit !== measure.unit)
                                .slice(0, 3)
                                .map((unit) => {
                                  const conversion = getConversionPreview(measure, unit);
                                  if (!conversion) return null;

                                  return (
                                    <Badge key={unit} variant="secondary" style={styles.conversionBadge}>
                                      <ThemedText style={StyleSheet.flatten([styles.conversionText, { color: colors.mutedForeground }])}>{conversion}</ThemedText>
                                    </Badge>
                                  );
                                })}
                            </View>
                          </View>
                        )}

                        {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                      </View>
                    )}
                  </View>
                );
              }}
            />
          ))}

          {/* Add Button when no measures */}
          {!fields.length && !disabled && (
            <TouchableOpacity style={StyleSheet.flatten([styles.addMeasurePrompt, { borderColor: colors.border }])} onPress={addNewMeasure}>
              <IconPlus size={32} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.addPromptText, { color: colors.mutedForeground }])}>Adicionar primeira medida</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minWidth: "auto",
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  measuresContainer: {
    gap: spacing.md,
  },
  measureItem: {
    gap: spacing.xs,
  },
  measureSummary: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  measureSummaryContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  measureIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  measureInfo: {
    flex: 1,
  },
  measureValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  measureType: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  measureForm: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  formField: {
    flex: 1,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  conversionPreview: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  conversionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  conversionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  conversionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  conversionText: {
    fontSize: fontSize.xs,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  addMeasurePrompt: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  addPromptText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
