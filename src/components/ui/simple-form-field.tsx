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
  return (
    <View style={StyleSheet.flatten([{ marginBottom: 16 }, style])}>
      {label && (
        <Label style={{ marginBottom: 8 }}>
          {label}
          {required && <ThemedText style={{ color: "red" }}> *</ThemedText>}
        </Label>
      )}

      {helperText && !error && (
        <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          {helperText}
        </ThemedText>
      )}

      {children}

      {error && (
        <ThemedText style={{ fontSize: 12, color: "red", marginTop: 4 }}>
          {typeof error === "boolean" ? "Campo obrigatório" : error.message}
        </ThemedText>
      )}
    </View>
  );
}