import { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useFormContext, useWatch } from "react-hook-form";
import { IconCheck } from "@tabler/icons-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import type { Item } from "../../../types";

interface FormulaSamplerProps {
  availableItems?: Item[];
}

export function FormulaSampler({ availableItems = [] }: FormulaSamplerProps) {
  const { colors } = useTheme();
  const { setValue, control } = useFormContext();
  const [sampleAmount, setSampleAmount] = useState<string>("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Watch all component values using useWatch for proper reactivity
  const components = useWatch({ control, name: "components" }) || [];

  // Calculate current total quantity
  const currentTotal = useMemo(() => {
    if (!components || components.length === 0) return 0;

    const total = components.reduce((total: number, component: { weightInGrams?: number }) => {
      const weight = component.weightInGrams || 0;
      return total + Number(weight) || 0;
    }, 0);

    return total;
  }, [components]);

  // Calculate remaining total after sampling
  const remainingTotal = useMemo(() => {
    const sample = parseFloat(sampleAmount.replace(",", ".")) || 0;
    return Math.max(0, currentTotal - sample);
  }, [currentTotal, sampleAmount]);

  // Calculate scaling factor (what percentage remains)
  const scalingFactor = useMemo(() => {
    if (currentTotal === 0) return 1;
    return remainingTotal / currentTotal;
  }, [currentTotal, remainingTotal]);

  // Preview of new component quantities
  const previewComponents = useMemo(() => {
    return components.map((component: { itemId: string; weightInGrams?: number }) => {
      const originalWeight = component.weightInGrams || 0;
      const newWeight = Math.round(originalWeight * scalingFactor * 100) / 100; // Round to 2 decimal places

      // Find the item details
      const item = availableItems.find((item) => item.id === component.itemId) || {
        name: "Item desconhecido",
        uniCode: null,
      };

      return {
        ...component,
        originalWeight,
        newWeight,
        item,
      };
    });
  }, [components, scalingFactor, availableItems]);

  const handleApplyAdjustment = () => {
    // Update all component quantities
    previewComponents.forEach((component: { newWeight: number }, index: number) => {
      setValue(`components.${index}.weightInGrams`, component.newWeight);
      setValue(`components.${index}.rawInput`, component.newWeight.toString().replace(".", ","));
    });

    // Reset state
    setSampleAmount("");
    setIsAdjusting(false);
  };

  const handleSampleAmountChange = (value: string | number | null) => {
    const stringValue = value !== null && value !== undefined ? String(value) : "";
    setSampleAmount(stringValue);
    setIsAdjusting(stringValue.trim() !== "" && parseFloat(stringValue) > 0);
  };

  // Show the sampler if there are any components with meaningful data
  const hasComponents =
    components.length > 0 &&
    (components.some((c: { itemId?: string }) => c.itemId) || // Has at least one item selected
      components.some((c: { weightInGrams?: number }) => (c.weightInGrams || 0) > 0) || // Has at least one weight > 0
      currentTotal > 0); // Or there's a total (fallback)

  const sampleValue = parseFloat(sampleAmount.replace(",", ".")) || 0;
  const isValidSample = sampleValue > 0 && sampleValue < currentTotal;

  // Don't show anything if no components
  if (!hasComponents && currentTotal === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Separator style={{ marginBottom: spacing.md }} />

      {/* Sampling input */}
      <View style={styles.inputSection}>
        <Label>Quantidade da amostra (g)</Label>
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Input
              value={sampleAmount}
              onChangeText={handleSampleAmountChange}
              keyboardType="decimal-pad"
              placeholder="Ex: 10"
            />
          </View>
          <Button
            onPress={handleApplyAdjustment}
            disabled={!isValidSample}
            style={styles.applyButton}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <IconCheck size={16} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground }}>Aplicar</Text>
            </View>
          </Button>
        </View>
        {!isValidSample && sampleValue > 0 && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            A amostra deve ser menor que o total da fórmula ({currentTotal.toFixed(2)}g)
          </Text>
        )}
      </View>

      {/* Preview of changes */}
      {isAdjusting && isValidSample && (
        <View style={styles.previewSection}>
          <Separator style={{ marginBottom: spacing.md }} />
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Prévia das alterações:</Text>
            <View style={styles.previewStats}>
              <Text style={styles.previewStat}>
                Total restante: <Text style={styles.previewStatBold}>{remainingTotal.toFixed(2)}g</Text>
              </Text>
              <Text style={styles.previewStat}>
                Proporção: <Text style={styles.previewStatBold}>{(scalingFactor * 100).toFixed(1)}%</Text>
              </Text>
            </View>
          </View>

          <View style={styles.previewList}>
            {previewComponents.map((component: { itemId: string; originalWeight: number; newWeight: number; item: { name: string; uniCode?: string } }, index: number) => {
              if (!component.itemId || component.originalWeight <= 0) return null;

              const item = component.item || { name: component.itemId };
              const difference = component.newWeight - component.originalWeight;
              const displayName = item.uniCode ? `${item.uniCode} - ${item.name}` : item.name;

              return (
                <View key={index} style={[styles.previewItem, { backgroundColor: colors.muted + '33' }]}>
                  <Text style={styles.previewItemName} numberOfLines={1}>{displayName}</Text>
                  <View style={styles.previewItemValues}>
                    <Text style={[styles.previewValue, { color: colors.mutedForeground }]}>
                      {component.originalWeight.toFixed(2)}g
                    </Text>
                    <Text style={[styles.previewArrow, { color: colors.mutedForeground }]}>→</Text>
                    <Text style={[styles.previewValue, difference < 0 ? { color: '#ef4444' } : { color: colors.mutedForeground }]}>
                      {component.newWeight.toFixed(2)}g
                    </Text>
                    <Text style={[styles.previewDiff, difference < 0 ? { color: '#ef4444' } : { color: colors.mutedForeground }]}>
                      ({difference >= 0 ? "+" : ""}{difference.toFixed(2)}g)
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  inputSection: {
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  applyButton: {
    height: 42,
    minWidth: 100,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  previewSection: {
    gap: spacing.md,
  },
  previewHeader: {
    gap: spacing.sm,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewStat: {
    fontSize: 12,
    opacity: 0.7,
  },
  previewStatBold: {
    fontWeight: '600',
  },
  previewList: {
    gap: spacing.sm,
    maxHeight: 200,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
  },
  previewItemName: {
    flex: 1,
    fontSize: 12,
    marginRight: spacing.sm,
  },
  previewItemValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewValue: {
    fontSize: 12,
  },
  previewArrow: {
    fontSize: 12,
  },
  previewDiff: {
    fontSize: 11,
  },
});
