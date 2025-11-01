import { useState } from "react";
import { useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { View, TouchableOpacity, StyleSheet} from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import { IconPlus, IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface BarcodeManagerProps {
  disabled?: boolean;
}

export function BarcodeManager({ disabled }: BarcodeManagerProps) {
  const { control } = useFormContext<ItemFormData>();
  const { colors } = useTheme();
  const [newBarcode, setNewBarcode] = useState("");

  // Watch the barcodes array directly
  const barcodes =
    useWatch({
      control: control as any,
      name: "barcodes",
    }) ?? [];

  const { append, remove } = useFieldArray({
    control: control as any,
    name: "barcodes",
  });

  const handleAddBarcode = () => {
    if (newBarcode.trim() && !barcodes.includes(newBarcode.trim())) {
      append(newBarcode.trim());
      setNewBarcode("");
    }
  };

  return (
    <View style={styles.container}>
      <Label style={styles.label}>Códigos de Barras</Label>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <Input
            value={newBarcode}
            onChangeText={setNewBarcode}
            placeholder="Digite o código de barras"
            editable={!disabled}
            onSubmitEditing={handleAddBarcode}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity
          onPress={handleAddBarcode}
          disabled={disabled || !newBarcode.trim()}
          style={StyleSheet.flatten([styles.addButton, { backgroundColor: colors.primary }, (disabled || !newBarcode.trim()) && styles.disabledButton])}
        >
          <IconPlus size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {barcodes.length > 0 && (
        <View style={styles.barcodeList}>
          {barcodes.map((barcode: any /* TODO: Add proper type */, index: any /* TODO: Add proper type */) => (
            <View key={`barcode-${index}`} style={StyleSheet.flatten([styles.barcodeItem, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={styles.barcodeText}>{barcode}</ThemedText>
              <TouchableOpacity
                onPress={() => remove(index)}
                disabled={disabled}
                style={StyleSheet.flatten([styles.removeButton, disabled && styles.disabledButton])}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconX size={20} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
  },
  addButton: {
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  barcodeList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  barcodeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  barcodeText: {
    fontFamily: "monospace",
    fontSize: fontSize.sm,
    flex: 1,
  },
  removeButton: {
    padding: spacing.xs,
  },
});
