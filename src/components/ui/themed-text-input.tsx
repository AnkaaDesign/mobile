import React, { forwardRef } from "react";
import { TextInput, TextInputProps, View, Text, ViewStyle, TextStyle , StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";

interface ThemedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  withIcon?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  inputContainerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconContainerStyle?: ViewStyle;
  rightIconContainerStyle?: ViewStyle;
}

export const ThemedTextInput = forwardRef<TextInput, ThemedTextInputProps>(
  (
    {
      label,
      error,
      withIcon,
      containerStyle,
      labelStyle,
      inputStyle,
      errorStyle,
      inputContainerStyle,
      leftIcon,
      rightIcon,
      leftIconContainerStyle,
      rightIconContainerStyle,
      style,
      ...props
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();

    const themedStyles = {
      container: {
        marginBottom: 16,
      },
      label: {
        fontSize: 14,
        fontWeight: "500" as const,
        marginBottom: 8,
        color: colors.foreground,
      },
      inputContainer: {
        position: "relative" as const,
      },
      input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingLeft: leftIcon ? 48 : 12, // Add left padding when left icon is present
        paddingRight: withIcon || rightIcon ? 48 : 12, // Add right padding when right icon is present
        fontSize: 16,
        minHeight: 44, // Minimum touch target size
        backgroundColor: colors.input, // Use input color instead of background
        borderColor: error ? colors.destructive : colors.border,
        color: colors.foreground,
        cursorColor: colors.foreground, // Better cursor visibility
      },
      leftIconContainer: {
        position: "absolute" as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: 44,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        zIndex: 1,
      },
      rightIconContainer: {
        position: "absolute" as const,
        right: 0,
        top: 0,
        bottom: 0,
        width: 44,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        zIndex: 1,
      },
      errorText: {
        fontSize: 12,
        marginTop: 4,
        color: colors.destructive,
      },
      placeholderTextColor: colors.mutedForeground,
    };

    return (
      <View style={StyleSheet.flatten([themedStyles.container, containerStyle])}>
        {label && <Text style={StyleSheet.flatten([themedStyles.label, labelStyle])}>{label}</Text>}
        <View style={StyleSheet.flatten([themedStyles.inputContainer, inputContainerStyle])}>
          {leftIcon && <View style={StyleSheet.flatten([themedStyles.leftIconContainer, leftIconContainerStyle])}>{leftIcon}</View>}
          <TextInput ref={ref} style={StyleSheet.flatten([themedStyles.input, inputStyle])} placeholderTextColor={themedStyles.placeholderTextColor} selectionColor={colors.primary} {...props} />
          {rightIcon && <View style={StyleSheet.flatten([themedStyles.rightIconContainer, rightIconContainerStyle])}>{rightIcon}</View>}
        </View>
        {error && <Text style={StyleSheet.flatten([themedStyles.errorText, errorStyle])}>{error}</Text>}
      </View>
    );
  },
);

ThemedTextInput.displayName = "ThemedTextInput";

// Preset variants
export const createThemedTextInputVariants = () => {
  const { colors, isDark } = useTheme();

  return {
    default: {
      inputStyle: {},
    },
    search: {
      inputStyle: {
        paddingLeft: 48, // Increased to match leftIcon padding
      },
      containerStyle: {
        position: "relative" as const,
      },
    },
    multiline: {
      inputStyle: {
        minHeight: 100,
        textAlignVertical: "top" as const,
        paddingTop: 12,
      },
    },
    numeric: {
      inputStyle: {
        textAlign: "right" as const,
      },
    },
  };
};
