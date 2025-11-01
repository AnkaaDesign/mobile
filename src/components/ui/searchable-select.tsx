import React from "react";
import { View, ViewStyle, TextStyle } from "react-native";
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
  // value removed
  // onValueChange removed
  options: _options = [],
  // placeholder removed
  // emptyText removed
  // error removed
  // renderOption removed
  children,
  style
}: SearchableSelectProps) {
  const { spacing } = useTheme();

  return (
    <View style={[{ padding: spacing.sm }, style as ViewStyle]}>
      {children}
    </View>
  );
}