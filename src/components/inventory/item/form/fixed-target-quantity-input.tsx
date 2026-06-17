import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface FixedTargetQuantityInputProps {
  disabled?: boolean;
}

// Target on-hand quantity for FIXED_TARGET items (engine falls back to 1 when
// empty). Only rendered when "Modelo de Estoque" = Alvo fixo.
export function FixedTargetQuantityInput({ disabled }: FixedTargetQuantityInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"fixedTargetQuantity" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="fixedTargetQuantity" style={{ marginBottom: 4 }}>
            Quantidade Alvo
          </Label>
          <Input
            id="fixedTargetQuantity"
            fieldKey="fixedTargetQuantity"
            type="decimal"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="1"
            disabled={disabled}
            min={0.01}
          />
          {error && <ThemedText variant="destructive" style={{ fontSize: 14, marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
