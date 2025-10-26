import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { TextInput as RNTextInput, View, Text, StyleSheet, TextInputProps as RNTextInputProps } from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, spacing } from "@/constants/design-system";

interface CpfInputProps extends Omit<RNTextInputProps, 'value' | 'onChangeText' | 'style'> {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  containerStyle?: any;
  inputStyle?: any;
}

export const CpfInput = forwardRef<RNTextInput, CpfInputProps>(
  ({ value, onChange, onBlur, label, error, helperText, containerStyle, inputStyle, placeholder = "000.000.000-00", ...props }, ref) => {
    const { colors } = useTheme();
    const [displayValue, setDisplayValue] = useState(() => formatCpf(value || ""));

    function formatCpf(cpf: string): string {
      const numbers = cpf.replace(/\D/g, "");

      if (numbers.length === 0) return "";
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;

      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }

    function extractNumbers(str: string): string {
      return str.replace(/\D/g, "");
    }

    const handleChangeText = useCallback(
      (text: string) => {
        const numbers = extractNumbers(text);

        if (numbers.length > 11) return;

        const formatted = formatCpf(numbers);
        setDisplayValue(formatted);
        onChange?.(numbers.length > 0 ? numbers : undefined);
      },
      [onChange]
    );

    useEffect(() => {
      const cleanValue = extractNumbers(value || "");
      const formattedValue = formatCpf(cleanValue);

      if (displayValue !== formattedValue) {
        setDisplayValue(formattedValue);
      }
    }, [value]);

    const baseInputStyle = {
      height: 40,
      borderWidth: 1,
      borderColor: error ? colors.destructive : colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      fontSize: fontSize.base,
      color: colors.foreground,
      backgroundColor: colors.background,
    };

    return (
      <View style={StyleSheet.flatten([{ marginBottom: spacing.sm }, containerStyle])}>
        {label && (
          <Text style={StyleSheet.flatten([styles.label, { color: colors.foreground }])}>
            {label}
          </Text>
        )}
        <RNTextInput
          ref={ref}
          value={displayValue}
          onChangeText={handleChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          keyboardType="numeric"
          style={StyleSheet.flatten([baseInputStyle, inputStyle])}
          placeholderTextColor={colors.mutedForeground}
          {...props}
        />
        {helperText && (
          <Text style={StyleSheet.flatten([styles.helperText, { color: error ? colors.destructive : colors.mutedForeground }])}>
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

CpfInput.displayName = "CpfInput";

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
