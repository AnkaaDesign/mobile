import React from "react";
import { View, ViewStyle , StyleSheet} from "react-native";
import { FieldError } from "react-hook-form";
import { ThemedText } from "./themed-text";
import { Label } from "./label";

interface SimpleFormFieldProps {
  label?: string;
  required?: boolean;
  error?: FieldError | boolean;
  helperText?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SimpleFormField({
  label,
  required,
  error,
  helperText,
  children,
  style,
}: SimpleFormFieldProps) {
  // Use try-catch to safely get theme colors with fallback
  let destructiveColor = "#b91c1c"; // Tailwind red-700 as fallback

  try {
    const { useTheme } = require("@/lib/theme");
    const { colors } = useTheme();
    destructiveColor = colors.destructive;
  } catch {
    // Use fallback color if theme is not available
  }

  return (
    <View style={StyleSheet.flatten([{ marginBottom: 16 }, style])}>
      {label && (
        <Label style={{ marginBottom: 8 }}>
          {label}
          {required && <ThemedText style={{ color: destructiveColor }}> *</ThemedText>}
        </Label>
      )}

      {helperText && !error && (
        <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          {helperText}
        </ThemedText>
      )}

      {children}

      {error && (
        <ThemedText variant="destructive" style={{ fontSize: 12, marginTop: 4 }}>
          {typeof error === "boolean" ? "Campo obrigatório" : error.message}
        </ThemedText>
      )}
    </View>
  );
}