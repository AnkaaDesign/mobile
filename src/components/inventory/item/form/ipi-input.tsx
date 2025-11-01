
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface IpiInputProps {
  disabled?: boolean;
  required?: boolean;
  priceFieldName?: "price";
}

export function IpiInput({ disabled, required, priceFieldName }: IpiInputProps) {
  const { control, setValue, watch } = useFormContext<ItemFormData>();
  const [ipiIncluded, setIpiIncluded] = useState(false);

  const handleIpiIncludedChange = (checked: boolean, currentPrice: number, ipiRate: number) => {
    setIpiIncluded(checked);

    if (checked && currentPrice && ipiRate && priceFieldName) {
      // Subtract IPI percentage from price: newPrice = price - (price * ipi/100)
      const ipiAmount = currentPrice * (ipiRate / 100);
      const newPrice = currentPrice - ipiAmount;
      setValue(priceFieldName, Math.round(newPrice * 100) / 100, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <Controller
      control={control}
      name={"ipi" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="ipi" style={{ marginBottom: 4 }}>
            IPI {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
          </Label>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                id="ipi"
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
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
            <ThemedText style={{ fontSize: 14, color: "#6b7280" }}>%</ThemedText>
          </View>
          {priceFieldName && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
              <Checkbox
                checked={ipiIncluded}
                onCheckedChange={(checked) => {
                  const currentPrice = watch(priceFieldName) || 0;
                  handleIpiIncludedChange(checked as boolean, currentPrice, value || 0);
                }}
                disabled={disabled}
              />
              <ThemedText style={{ fontSize: 14 }}>Imbutir no preço</ThemedText>
            </View>
          )}
          {error && <ThemedText style={{ fontSize: 14, color: "#ef4444", marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
