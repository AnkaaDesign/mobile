import { useEffect, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { DatePicker } from "@/components/ui/date-picker";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReturnDateInputProps {
  value: Date | null | undefined;
  onValueChange: (value: Date | null) => void;
  borrowCreatedAt?: string | Date;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

export function ReturnDateInput({
  value,
  onValueChange,
  borrowCreatedAt,
  disabled,
  error,
  label = "Data de Devolução",
  required = false,
}: ReturnDateInputProps) {
  const { colors } = useTheme();

  // Convert borrowCreatedAt to Date for comparison
  const borrowDate = useMemo(() => {
    return borrowCreatedAt ? new Date(borrowCreatedAt) : null;
  }, [borrowCreatedAt]);

  const today = useMemo(() => new Date(), []);

  // Real-time validation
  const validation = useMemo(() => {
    if (!value) return { isValid: true, errors: [] };

    const errors: string[] = [];
    const returnDate = new Date(value);

    // Validate return date is not in the future
    if (returnDate > today) {
      errors.push("Data de devolução não pode ser no futuro");
    }

    // Validate return date is not before borrow date
    if (borrowDate && returnDate < borrowDate) {
      errors.push("Data de devolução não pode ser anterior à data do empréstimo");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [value, borrowDate, today]);

  // Show validation errors
  useEffect(() => {
    if (!validation.isValid && validation.errors.length > 0) {
      Alert.alert("Data Inválida", validation.errors.join("\n"));
    }
  }, [validation]);

  // Helper text
  const helpText = useMemo(() => {
    const parts: string[] = [];

    parts.push("A data em que o item foi devolvido");

    if (borrowDate) {
      parts.push(`Emprestado em: ${format(borrowDate, "PPP", { locale: ptBR })}`);
    }

    parts.push(`Data máxima: ${format(today, "PPP", { locale: ptBR })} (hoje)`);

    return parts.join("\n");
  }, [borrowDate, today]);

  // Handle date change with validation
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onValueChange(null);
      return;
    }

    const returnDate = new Date(date);

    // Validate immediately
    if (returnDate > today) {
      Alert.alert(
        "Data Inválida",
        "Data de devolução não pode ser no futuro",
        [
          {
            text: "OK",
            onPress: () => onValueChange(today), // Set to today instead
          },
        ]
      );
      return;
    }

    if (borrowDate && returnDate < borrowDate) {
      Alert.alert(
        "Data Inválida",
        "Data de devolução não pode ser anterior à data do empréstimo",
        [
          {
            text: "OK",
            onPress: () => onValueChange(borrowDate), // Set to borrow date instead
          },
        ]
      );
      return;
    }

    onValueChange(date);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Label>
          {label} {required && <ThemedText style={{ color: colors.destructive }}>*</ThemedText>}
        </Label>
      )}
      <DatePicker
        value={value}
        onChange={handleDateChange}
        mode="date"
        disabled={disabled}
        maximumDate={today}
        minimumDate={borrowDate || new Date("1900-01-01")}
        placeholder="Selecione a data de devolução"
      />
      {error && (
        <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </ThemedText>
      )}
      {!validation.isValid && validation.errors.length > 0 && (
        <View style={styles.validationErrors}>
          {validation.errors.map((err, index) => (
            <ThemedText key={index} style={[styles.errorText, { color: colors.destructive }]}>
              • {err}
            </ThemedText>
          ))}
        </View>
      )}
      <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
        {helpText}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  validationErrors: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
