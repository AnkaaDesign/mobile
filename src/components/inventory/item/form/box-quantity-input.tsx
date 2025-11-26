
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface BoxQuantityInputProps {
  disabled?: boolean;
}

export function BoxQuantityInput({ disabled }: BoxQuantityInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"boxQuantity" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="boxQuantity" style={{ marginBottom: 4 }}>
            Quantidade por Caixa
          </Label>
          <Input
            id="boxQuantity"
            fieldKey="boxQuantity"
            type="natural"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="1"
            disabled={disabled}
            min={1}
          />
          {error && <ThemedText variant="destructive" style={{ fontSize: 14, marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
