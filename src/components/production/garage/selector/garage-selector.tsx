import React, { useState } from "react";
import { View, ViewStyle } from "react-native";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";

interface GarageSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GarageSelector({
  value,
  onValueChange,
  placeholder = "Selecione uma opção",
  disabled = false,
  style,
}: GarageSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={style}>
      <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            <ThemedText>{value || placeholder}</ThemedText>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Add select items here */}
          <SelectItem value="option1">
            <ThemedText>Opção 1</ThemedText>
          </SelectItem>
        </SelectContent>
      </Select>
    </View>
  );
}