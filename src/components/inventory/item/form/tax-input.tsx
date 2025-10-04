import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface TaxInputProps {
  disabled?: boolean;
  required?: boolean;
}

export function TaxInput({ disabled, required }: TaxInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"tax" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="tax" style={{ marginBottom: 4 }}>
            Taxa {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
          </Label>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                id="tax"
                value={value?.toString() || "0"}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? 0 : num);
                }}
                onBlur={onBlur}
                placeholder="0"
                editable={!disabled}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
            <ThemedText style={{ fontSize: 14, color: "#6b7280" }}>%</ThemedText>
          </View>
          {error && <ThemedText style={{ fontSize: 14, color: "#ef4444", marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
