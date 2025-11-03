
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface QuantityInputProps {
  disabled?: boolean;
  required?: boolean;
}

export function QuantityInput({ disabled, required }: QuantityInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"quantity" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="quantity" style={{ marginBottom: 4 }}>
            Quantidade em Estoque {required && <ThemedText variant="destructive">*</ThemedText>}
          </Label>
          <Input
            id="quantity"
            value={value?.toString() || "0"}
            onChangeText={(text) => {
              const num = parseInt(text, 10);
              onChange(isNaN(num) ? 0 : num);
            }}
            onBlur={onBlur}
            placeholder="0"
            editable={!disabled}
            keyboardType="numeric"
          />
          {error && <ThemedText variant="destructive" style={{ fontSize: 14, marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
