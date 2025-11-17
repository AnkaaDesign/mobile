import { useEffect, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { IconTrash, IconPlus } from "@tabler/icons-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Text } from "@/components/ui/text";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { paintFormulaComponentService } from "@/api-client/paint";
import type { Item } from "../../../types";

interface FormulaComponentsEditorProps {
  availableItems?: Item[];
  formulaPaintId?: string;
}

export function FormulaComponentsEditor({ availableItems = [], formulaPaintId }: FormulaComponentsEditorProps) {
  const { colors } = useTheme();
  const { control, setValue, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });

  // Get already selected item IDs to filter them out
  const allComponents = useWatch({ control, name: "components" }) || [];
  const selectedItemIds = useMemo(() => {
    return allComponents.map((comp: { itemId: string }) => comp.itemId).filter(Boolean);
  }, [allComponents]);

  // Filter and sort items by unicode, excluding already selected ones
  const getFilteredItemsForRow = (currentRowIndex: number) => {
    const currentRowItemId = watch(`components.${currentRowIndex}.itemId`);

    return availableItems
      .filter((item) => {
        // Allow current row's selected item
        if (currentRowItemId === item.id) {
          return true;
        }
        // Filter out items selected in other rows
        return !selectedItemIds.includes(item.id);
      })
      .sort((a, b) => {
        // Sort by unicode first, then by name if unicode is not available
        const aUnicode = a.uniCode || "";
        const bUnicode = b.uniCode || "";

        if (aUnicode && bUnicode) {
          return aUnicode.localeCompare(bUnicode);
        }
        if (aUnicode && !bUnicode) return -1;
        if (!aUnicode && bUnicode) return 1;

        // If both don't have unicode, sort by name
        return a.name.localeCompare(b.name);
      });
  };

  // Create combobox options with unicode - name format
  const getComboboxOptionsForRow = (currentRowIndex: number) => {
    const filteredItems = getFilteredItemsForRow(currentRowIndex);
    return filteredItems.map((item) => ({
      value: item.id,
      label: item.uniCode ? `${item.uniCode} - ${item.name}` : item.name,
    }));
  };

  // Add initial empty row if no components exist
  useEffect(() => {
    if (fields.length === 0) {
      append({ itemId: "", weightInGrams: 0, rawInput: "" });
    }
  }, [fields.length, append]);

  const handleAmountChange = (index: number, value: string) => {
    // Allow empty string for clearing
    if (value === "") {
      setValue(`components.${index}.weightInGrams`, 0);
      setValue(`components.${index}.rawInput`, "");
      return;
    }

    // Store the raw input value for display
    setValue(`components.${index}.rawInput`, value);

    // Parse the number (handle comma as decimal separator)
    const numericValue = parseFloat(value.replace(",", "."));
    if (!isNaN(numericValue)) {
      const rounded = Math.round(numericValue * 100) / 100; // 2 decimal places
      setValue(`components.${index}.weightInGrams`, rounded);
    }
  };

  const handleAmountBlur = async (index: number) => {
    const rawInput = watch(`components.${index}.rawInput`);
    const itemId = watch(`components.${index}.itemId`);

    if (rawInput) {
      const numericValue = parseFloat(rawInput.replace(",", "."));
      if (!isNaN(numericValue)) {
        const finalWeight = Math.round(numericValue * 100) / 100;
        setValue(`components.${index}.weightInGrams`, finalWeight);
        // Display with comma as decimal separator
        setValue(`components.${index}.rawInput`, finalWeight.toString().replace(".", ","));

        // Call API to deduct inventory if we have a valid weight and item
        if (finalWeight > 0 && itemId) {
          // Only pass formulaPaintId if it's a real UUID (not temp ID)
          const isRealFormula = formulaPaintId && !formulaPaintId.startsWith('temp-');

          try {
            await paintFormulaComponentService.deductForFormulationTest({
              itemId,
              weight: finalWeight,
              ...(isRealFormula && { formulaPaintId }),
            });
          } catch (error) {
            console.error("Error deducting inventory:", error);
          }
        }
      }
    }
  };

  // Calculate total weight dynamically
  const calculateTotalWeight = (): number => {
    return allComponents.reduce((sum: number, comp: { weightInGrams?: number }) => {
      const weight = comp?.weightInGrams || 0;
      return sum + weight;
    }, 0);
  };

  const calculateRatio = (index: number): string => {
    const weight = watch(`components.${index}.weightInGrams`) || 0;
    const totalWeight = calculateTotalWeight();
    if (totalWeight === 0 || weight === 0) return "0.00";
    const ratio = (weight / totalWeight) * 100;
    return ratio.toFixed(2);
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      {fields.length > 0 && (
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 1 }]}>Componente</Text>
          <Text style={[styles.headerText, { width: 80 }]}>Proporção (%)</Text>
          <Text style={[styles.headerText, { width: 100 }]}>Quantidade (g)</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Component Rows */}
      {fields.length > 0 && (
        <View style={styles.componentsList}>
          {fields.map((field, index) => (
            <View key={field.id} style={styles.componentRow}>
              {/* Component Selector */}
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Combobox
                  options={getComboboxOptionsForRow(index)}
                  value={watch(`components.${index}.itemId`)}
                  onValueChange={(value) => setValue(`components.${index}.itemId`, value || "")}
                  placeholder="Selecione um componente"
                  emptyText="Nenhum item disponível"
                  searchPlaceholder="Buscar componente..."
                />
              </View>

              {/* Ratio Display */}
              <View style={{ width: 80, marginRight: spacing.sm }}>
                <Input
                  value={calculateRatio(index)}
                  editable={false}
                  style={[styles.ratioInput, { color: colors.mutedForeground }]}
                />
              </View>

              {/* Weight Input */}
              <View style={{ width: 100, marginRight: spacing.sm }}>
                <Input
                  value={watch(`components.${index}.rawInput`) || watch(`components.${index}.weightInGrams`)?.toString() || ""}
                  onChangeText={(value) => handleAmountChange(index, value)}
                  onBlur={() => handleAmountBlur(index)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  style={styles.weightInput}
                />
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={() => {
                  if (fields.length > 1) {
                    remove(index);
                  } else {
                    // Clear the inputs for the only row instead of removing it
                    setValue(`components.${index}.itemId`, "");
                    setValue(`components.${index}.weightInGrams`, 0);
                    setValue(`components.${index}.rawInput`, "");
                  }
                }}
                style={styles.deleteButton}
              >
                <IconTrash size={20} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add Component Button */}
      <Button
        variant="outline"
        onPress={() => append({ itemId: "", weightInGrams: 0, rawInput: "" })}
        style={styles.addButton}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconPlus size={16} color={colors.foreground} />
          <Text>Adicionar Componente</Text>
        </View>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  componentsList: {
    gap: spacing.sm,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratioInput: {
    textAlign: 'right',
    fontSize: 14,
  },
  weightInput: {
    textAlign: 'right',
    fontSize: 14,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    marginTop: spacing.sm,
  },
});
