import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { TextInput as RNTextInput, View, Text, StyleSheet, TextInputProps as RNTextInputProps, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, spacing } from "@/constants/design-system";

interface ZipCodeInputProps extends Omit<RNTextInputProps, 'value' | 'onChangeText' | 'style'> {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  onCepChange?: (cepData: {
    cep: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  containerStyle?: any;
  inputStyle?: any;
}

export const ZipCodeInput = forwardRef<RNTextInput, ZipCodeInputProps>(
  ({ value, onChange, onBlur, onCepChange, label, error, helperText, containerStyle, inputStyle, placeholder = "00000-000", ...props }, ref) => {
    const { colors } = useTheme();
    const [displayValue, setDisplayValue] = useState(() => formatZipCode(value || ""));
    const [isLoading, setIsLoading] = useState(false);
    const [previousValue, setPreviousValue] = useState<string>("");

    function formatZipCode(zipCode: string): string {
      const numbers = zipCode.replace(/\D/g, "");

      if (numbers.length === 0) return "";
      if (numbers.length <= 5) return numbers;

      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }

    function extractNumbers(str: string): string {
      return str.replace(/\D/g, "");
    }

    const lookupCep = useCallback(
      async (cep: string) => {
        const cleanCep = cep || "";

        // Only lookup if we have a complete CEP (8 digits) and it's different from previous
        if (cleanCep.length === 8 && cleanCep !== previousValue) {
          setPreviousValue(cleanCep);
          setIsLoading(true);
          try {
            // Try ViaCEP API
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (response.ok) {
              const data = await response.json();
              if (!data.erro) {
                // Call the callback with CEP data
                onCepChange?.({
                  cep: cleanCep,
                  address: data.logradouro || undefined,
                  neighborhood: data.bairro || undefined,
                  city: data.localidade || undefined,
                  state: data.uf || undefined,
                });
              }
            }
          } catch (error) {
            console.error("Error looking up CEP:", error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      [previousValue, onCepChange]
    );

    const handleChangeText = useCallback(
      (text: string) => {
        const numbers = extractNumbers(text);

        if (numbers.length > 8) return;

        const formatted = formatZipCode(numbers);
        setDisplayValue(formatted);
        onChange?.(numbers.length > 0 ? numbers : undefined);

        // Trigger CEP lookup when we have 8 digits
        if (numbers.length === 8) {
          lookupCep(numbers);
        }
      },
      [onChange, lookupCep]
    );

    useEffect(() => {
      const cleanValue = extractNumbers(value || "");
      const formattedValue = formatZipCode(cleanValue);

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
          <View style={styles.labelContainer}>
            <Text style={StyleSheet.flatten([styles.label, { color: colors.foreground }])}>
              {label}
            </Text>
            {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
          </View>
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
          editable={!isLoading}
          {...props}
        />
        {isLoading && (
          <Text style={StyleSheet.flatten([styles.statusText, { color: colors.mutedForeground }])}>
            Buscando endereço...
          </Text>
        )}
        {helperText && (
          <Text style={StyleSheet.flatten([styles.helperText, { color: error ? colors.destructive : colors.mutedForeground }])}>
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

ZipCodeInput.displayName = "ZipCodeInput";

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  loader: {
    marginLeft: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
