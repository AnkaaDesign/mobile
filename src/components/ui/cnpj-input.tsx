import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { TextInput as RNTextInput, View, Text, StyleSheet, TextInputProps as RNTextInputProps } from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, spacing } from "@/constants/design-system";

interface CnpjInputProps extends Omit<RNTextInputProps, 'value' | 'onChangeText' | 'style'> {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  containerStyle?: any;
  inputStyle?: any;
}

export const CnpjInput = forwardRef<RNTextInput, CnpjInputProps>(
  ({ value, onChange, onBlur, label, error, helperText, containerStyle, inputStyle, placeholder = "00.000.000/0000-00", ...props }, ref) => {
    const { colors } = useTheme();
    const [displayValue, setDisplayValue] = useState(() => formatCnpj(value || ""));

    function formatCnpj(cnpj: string): string {
      const numbers = cnpj.replace(/\D/g, "");

      if (numbers.length === 0) return "";
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;

      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }

    function extractNumbers(str: string): string {
      return str.replace(/\D/g, "");
    }

    const handleChangeText = useCallback(
      (text: string) => {
        const numbers = extractNumbers(text);

        if (numbers.length > 14) return;

        const formatted = formatCnpj(numbers);
        setDisplayValue(formatted);
        onChange?.(numbers.length > 0 ? numbers : undefined);
      },
      [onChange]
    );

    useEffect(() => {
      const cleanValue = extractNumbers(value || "");
      const formattedValue = formatCnpj(cleanValue);

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

CnpjInput.displayName = "CnpjInput";

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
