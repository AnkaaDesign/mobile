import { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { useItem } from "@/hooks";
import { formatNumber } from "@/utils";

interface QuantityInputProps {
  value: number | undefined;
  onValueChange: (value: number) => void;
  selectedItemId?: string;
  currentQuantity?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

export function QuantityInput({
  value,
  onValueChange,
  selectedItemId,
  currentQuantity,
  disabled,
  error,
  label = "Quantidade",
  required = true,
}: QuantityInputProps) {
  const { colors } = useTheme();

  // Fetch the selected item to get available quantity
  const { data: itemResponse, isLoading } = useItem(selectedItemId || "", {
    enabled: !!selectedItemId,
  });

  const item = itemResponse?.data;
  const availableQuantity = useMemo(() => {
    if (!item) return 0;
    return item.quantity + (currentQuantity || 0);
  }, [item, currentQuantity]);

  // Validate and constrain the quantity
  const handleQuantityChange = (text: string) => {
    // Remove non-numeric characters
    const cleanText = text.replace(/[^0-9]/g, "");

    // If empty, set to undefined temporarily
    if (cleanText === "" || cleanText === null) {
      // Don't call onValueChange with invalid value, keep current
      return;
    }

    const numericValue = parseInt(cleanText, 10);

    // Validate input immediately
    if (!isNaN(numericValue) && typeof numericValue === "number") {
      if (numericValue > availableQuantity && availableQuantity > 0) {
        // Cap at available quantity
        onValueChange(availableQuantity);
        return;
      }
      if (numericValue < 1) {
        // Minimum is 1
        onValueChange(1);
        return;
      }
      // Set the valid numeric value
      onValueChange(numericValue);
    }
  };

  // On blur, ensure we have a valid number
  const handleBlur = () => {
    if (!value || value <= 0) {
      // Default to 1 if invalid
      onValueChange(1);
    } else if (availableQuantity > 0 && value > availableQuantity) {
      // Cap at available if exceeds
      onValueChange(availableQuantity);
    }
  };

  // Validation message
  const validationMessage = useMemo(() => {
    if (!selectedItemId) {
      return "Selecione um item primeiro para definir a quantidade";
    }

    if (isLoading) {
      return "Carregando informações do item...";
    }

    if (!item) {
      return "Item não encontrado";
    }

    if (currentQuantity) {
      return `Quantidade atual emprestada: ${formatNumber(currentQuantity)}. Disponível para ajuste: ${formatNumber(availableQuantity)}${item.measureUnit ? ` ${item.measureUnit}` : ""}`;
    }

    return `Máximo disponível: ${formatNumber(item.quantity)}${item.measureUnit ? ` ${item.measureUnit}` : ""}`;
  }, [selectedItemId, isLoading, item, currentQuantity, availableQuantity]);

  // Display validation error if quantity exceeds available
  const quantityError = useMemo(() => {
    if (!value || !item || !availableQuantity) return null;

    if (value > availableQuantity) {
      return `Máximo disponível: ${availableQuantity}`;
    }

    if (value <= 0) {
      return "Quantidade deve ser maior que zero";
    }

    return null;
  }, [value, item, availableQuantity]);

  return (
    <View style={styles.container}>
      {label && (
        <Label>
          {label} {required && <ThemedText style={{ color: colors.destructive }}>*</ThemedText>}
        </Label>
      )}
      <Input
        value={value?.toString() || ""}
        onChangeText={handleQuantityChange}
        onBlur={handleBlur}
        placeholder="1"
        keyboardType="numeric"
        editable={!disabled && !!selectedItemId}
        error={!!error || !!quantityError}
        style={[
          styles.input,
          (!selectedItemId || disabled) && styles.inputDisabled,
        ]}
      />
      {(error || quantityError) && (
        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
          {error || quantityError}
        </ThemedText>
      )}
      <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
        {validationMessage}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  input: {
    fontSize: fontSize.base,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
