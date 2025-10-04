import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

// NOTE: This component is using an incorrect field name 'measureValue'.
// The correct implementation uses a 'measures' array - see MeasuresManager component.
// This component should either be updated to work with the measures array or removed.

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface MeasureValueInputProps {
  disabled?: boolean;
}

export function MeasureValueInput({ disabled }: MeasureValueInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"measureValue" as any} // Type assertion - this field doesn't exist in schema
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="measureValue" style={{ marginBottom: 4 }}>
            Valor de Medida
          </Label>
          <Input
            id="measureValue"
            value={value?.toString() || ""}
            onChangeText={(text) => {
              if (text === "") {
                onChange(null);
              } else {
                const num = parseFloat(text);
                onChange(isNaN(num) ? null : num);
              }
            }}
            onBlur={onBlur}
            placeholder="0"
            editable={!disabled}
            keyboardType="decimal-pad"
          />
          {error && <ThemedText style={{ fontSize: 14, color: "#ef4444", marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
