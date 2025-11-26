import { forwardRef } from "react";
import { TextInput as RNTextInput, View, Text, TextInputProps as RNTextInputProps, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, spacing } from "@/constants/design-system";

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: boolean;
  helperText?: string;
  containerStyle?: any;
  inputStyle?: any;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, helperText, containerStyle, inputStyle, ...props }, ref) => {
    const { colors } = useTheme();

    const baseInputStyle = {
      height: 40,
      borderWidth: 1,
      borderColor: error ? colors.destructive : colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 0,
      fontSize: fontSize.base,
      color: colors.foreground,
      backgroundColor: colors.input,
      textAlignVertical: 'center' as const,
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
          style={StyleSheet.flatten([baseInputStyle, inputStyle])}
          placeholderTextColor={colors.mutedForeground}
          {...props}
        />
        {helperText && (
          <Text style={StyleSheet.flatten([styles.helperText, { color: error ? colors.destructive : colors.mutedForeground }])}>
            {helperText}
          </Text>
        )}
        {error && typeof error === 'string' && (
          <Text style={StyleSheet.flatten([styles.errorText, { color: colors.destructive }])}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = "TextInput";

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
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});