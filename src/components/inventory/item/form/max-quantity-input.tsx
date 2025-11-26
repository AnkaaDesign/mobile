
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface MaxQuantityInputProps {
  disabled?: boolean;
}

export function MaxQuantityInput({ disabled }: MaxQuantityInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"maxQuantity" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="maxQuantity" numberOfLines={1} ellipsizeMode="tail" style={{ marginBottom: 4 }}>
            Qtd. Máxima
          </Label>
          <Input
            id="maxQuantity"
            fieldKey="maxQuantity"
            type="natural"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="0"
            disabled={disabled}
            min={0}
          />
          {error && <ThemedText variant="destructive" style={{ fontSize: 14, marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
