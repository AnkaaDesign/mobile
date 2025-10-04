import React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";

interface SearchableSelectOption {
  id: string;
  label: string;
  subtitle?: string;
  color?: string;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options?: SearchableSelectOption[];
  placeholder?: string;
  emptyText?: string;
  error?: boolean;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle | TextStyle;
}

export function SearchableSelect({
  value,
  onValueChange,
  options = [],
  placeholder,
  emptyText,
  error,
  renderOption,
  children,
  style
}: SearchableSelectProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={StyleSheet.flatten([{ padding: spacing.sm }, style])}>
      {children}
    </View>
  );
}