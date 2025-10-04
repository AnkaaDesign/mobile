import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemBrandCreateFormData, ItemBrandUpdateFormData } from '../../../../../schemas';

type ItemBrandFormData = ItemBrandCreateFormData | ItemBrandUpdateFormData;

interface NameInputProps {
  disabled?: boolean;
  required?: boolean;
}

export function NameInput({ disabled, required }: NameInputProps) {
  const { control } = useFormContext<ItemBrandFormData>();
  return (
    <Controller
      control={control}
      name={"name" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="name" style={{ marginBottom: 4 }}>
            Nome da Marca {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
          </Label>
          <Input id="name" value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Digite o nome da marca" editable={!disabled} maxLength={255} autoCapitalize="words" />
          {error && <ThemedText style={{ fontSize: 14, color: "#ef4444", marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
