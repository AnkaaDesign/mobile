import { forwardRef, useCallback, useEffect, useState } from "react";
import { TextInput as RNTextInput, View, Text, StyleSheet, TextInputProps as RNTextInputProps } from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, spacing } from "@/constants/design-system";

interface PhoneInputProps extends Omit<RNTextInputProps, 'value' | 'onChangeText' | 'style' | 'onChange'> {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  containerStyle?: any;
  inputStyle?: any;
}

export const PhoneInput = forwardRef<RNTextInput, PhoneInputProps>(
  ({ value, onChange, onBlur, label, error, helperText, containerStyle, inputStyle, placeholder = "(00) 00000-0000", ...props }, ref) => {
    const { colors } = useTheme();
    const [displayValue, setDisplayValue] = useState(() => formatPhone(value || ""));

    function formatPhone(phone: string): string {
      const numbers = phone.replace(/\D/g, "");

      if (numbers.length === 0) return "";
      if (numbers.length <= 2) return `(${numbers}`;
      if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      if (numbers.length <= 11) {
        const hasNinthDigit = numbers.length === 11;
        if (hasNinthDigit) {
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
        }
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
      }

      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }

    function extractNumbers(str: string): string {
      return str.replace(/\D/g, "");
    }

    const handleChangeText = useCallback(
      (text: string) => {
        const numbers = extractNumbers(text);

        if (numbers.length > 11) return;

        const formatted = formatPhone(numbers);
        setDisplayValue(formatted);
        onChange?.(numbers.length > 0 ? numbers : undefined);
      },
      [onChange]
    );

    useEffect(() => {
      const cleanValue = extractNumbers(value || "");
      const formattedValue = formatPhone(cleanValue);

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
          keyboardType="phone-pad"
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

PhoneInput.displayName = "PhoneInput";

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
