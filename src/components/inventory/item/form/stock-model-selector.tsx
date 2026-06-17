import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { ThemedText } from "@/components/ui/themed-text";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { STOCK_MODEL } from "@/constants";
import { STOCK_MODEL_LABELS } from "@/constants/enum-labels";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface StockModelSelectorProps {
  disabled?: boolean;
}

// Capability-fields contract: stock math model is item.stockModel —
// CONSUMPTION uses the consumption-driven rp/max bands; FIXED_TARGET holds a
// fixed quantity on the shelf (fixedTargetQuantity, fallback 1).
export function StockModelSelector({ disabled }: StockModelSelectorProps) {
  const form = useFormContext<ItemFormData>();
  const { control, setValue } = form;

  const options: ComboboxOption[] = Object.values(STOCK_MODEL).map((model) => ({
    value: model,
    label: STOCK_MODEL_LABELS[model],
  }));

  return (
    <Controller
      control={control}
      name={"stockModel" as const}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="stockModel" style={{ marginBottom: 4 }}>
            Modelo de Estoque
          </Label>
          <Combobox
            options={options}
            value={value ?? STOCK_MODEL.CONSUMPTION}
            onValueChange={(selected) => {
              onChange(selected);
              // fixedTargetQuantity is only meaningful for FIXED_TARGET —
              // the API rejects it when set with CONSUMPTION.
              if (selected !== STOCK_MODEL.FIXED_TARGET) {
                setValue("fixedTargetQuantity", null, { shouldDirty: true, shouldValidate: true });
              }
            }}
            placeholder="Selecione o modelo de estoque"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
          {error && <ThemedText variant="destructive" style={{ fontSize: 14, marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
