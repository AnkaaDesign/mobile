
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface PriceInputProps {
  disabled?: boolean;
}

export function PriceInput({ disabled }: PriceInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"price" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="price" style={{ marginBottom: 4 }}>
            Preço
          </Label>
          <Input
            id="price"
            fieldKey="price"
            type="currency"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="R$ 0,00"
            disabled={disabled}
          />
          {error && <ThemedText variant="destructive" style={{ fontSize: 14, marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
