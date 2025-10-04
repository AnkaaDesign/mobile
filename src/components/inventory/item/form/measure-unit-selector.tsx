import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { MEASURE_UNIT, MEASURE_UNIT_LABELS } from '../../../../constants';
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

// NOTE: This component is using an incorrect field name 'measureUnit'.
// The correct implementation uses a 'measures' array - see MeasuresManager component.
// This component should either be updated to work with the measures array or removed.

interface MeasureUnitSelectorProps<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData> {
  disabled?: boolean;
}

export function MeasureUnitSelector<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData>({ disabled }: MeasureUnitSelectorProps<TFormData>) {
  const { control } = useFormContext<TFormData>();
  const options = Object.values(MEASURE_UNIT).map((unit) => ({
    value: unit,
    label: MEASURE_UNIT_LABELS[unit] || unit,
  }));

  return (
    <Controller
      control={control}
      name={"measureUnit" as any} // Type assertion - this field doesn't exist in schema
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label style={{ marginBottom: 4 }}>Unidade de Medida</Label>
          <Combobox value={value || undefined} onValueChange={onChange} options={options} placeholder="Selecione uma unidade" disabled={disabled} searchable={false} />
          {error && <ThemedText style={{ fontSize: 12, color: "#ef4444" }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
