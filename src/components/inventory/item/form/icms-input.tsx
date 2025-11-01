
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface IcmsInputProps {
  disabled?: boolean;
  required?: boolean;
  priceFieldName?: "price";
}

export function IcmsInput({ disabled, required, priceFieldName }: IcmsInputProps) {
  const { control, setValue, watch } = useFormContext<ItemFormData>();
  const [icmsIncluded, setIcmsIncluded] = useState(false);

  const handleIcmsIncludedChange = (checked: boolean, currentPrice: number, icmsRate: number) => {
    setIcmsIncluded(checked);

    if (checked && currentPrice && icmsRate && priceFieldName) {
      // Subtract ICMS percentage from price: newPrice = price - (price * icms/100)
      const icmsAmount = currentPrice * (icmsRate / 100);
      const newPrice = currentPrice - icmsAmount;
      setValue(priceFieldName, Math.round(newPrice * 100) / 100, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <Controller
      control={control}
      name={"icms" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="icms" style={{ marginBottom: 4 }}>
            ICMS {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
          </Label>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                id="icms"
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
                checked={icmsIncluded}
                onCheckedChange={(checked) => {
                  const currentPrice = watch(priceFieldName) || 0;
                  handleIcmsIncludedChange(checked as boolean, currentPrice, value || 0);
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
