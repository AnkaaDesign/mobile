
import { View } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PPE_SIZE, PPE_SIZE_LABELS, PPE_TYPE } from '../../../../constants';
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import { StyleSheet } from "react-native";

interface PpeSizeSelectorProps<_TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData> {
  ppeType?: PPE_TYPE;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

// Map PPE types to their corresponding sizes - matching web implementation
const PPE_TYPE_SIZE_MAP: Record<PPE_TYPE, PPE_SIZE[]> = {
  [PPE_TYPE.SHIRT]: [PPE_SIZE.P, PPE_SIZE.M, PPE_SIZE.G, PPE_SIZE.GG, PPE_SIZE.XG],
  [PPE_TYPE.PANTS]: [PPE_SIZE.SIZE_36, PPE_SIZE.SIZE_38, PPE_SIZE.SIZE_40, PPE_SIZE.SIZE_42, PPE_SIZE.SIZE_44, PPE_SIZE.SIZE_46, PPE_SIZE.SIZE_48],
  [PPE_TYPE.BOOTS]: [PPE_SIZE.SIZE_35, PPE_SIZE.SIZE_36, PPE_SIZE.SIZE_37, PPE_SIZE.SIZE_38, PPE_SIZE.SIZE_39, PPE_SIZE.SIZE_40, PPE_SIZE.SIZE_41, PPE_SIZE.SIZE_42, PPE_SIZE.SIZE_43, PPE_SIZE.SIZE_44, PPE_SIZE.SIZE_45, PPE_SIZE.SIZE_46, PPE_SIZE.SIZE_47, PPE_SIZE.SIZE_48],
  [PPE_TYPE.SLEEVES]: [PPE_SIZE.P, PPE_SIZE.M, PPE_SIZE.G, PPE_SIZE.GG, PPE_SIZE.XG],
  [PPE_TYPE.MASK]: [PPE_SIZE.P, PPE_SIZE.M],
  [PPE_TYPE.GLOVES]: [PPE_SIZE.P, PPE_SIZE.M, PPE_SIZE.G],
  [PPE_TYPE.RAIN_BOOTS]: [PPE_SIZE.SIZE_35, PPE_SIZE.SIZE_36, PPE_SIZE.SIZE_37, PPE_SIZE.SIZE_38, PPE_SIZE.SIZE_39, PPE_SIZE.SIZE_40, PPE_SIZE.SIZE_41, PPE_SIZE.SIZE_42, PPE_SIZE.SIZE_43, PPE_SIZE.SIZE_44, PPE_SIZE.SIZE_45, PPE_SIZE.SIZE_46, PPE_SIZE.SIZE_47, PPE_SIZE.SIZE_48],
};

export function PpeSizeSelector<TFormData extends ItemCreateFormData | ItemUpdateFormData = ItemCreateFormData | ItemUpdateFormData>({ ppeType, disabled, required, name = "ppeSize" }: PpeSizeSelectorProps<TFormData>) {
  const { control } = useFormContext<TFormData>();
  // Get available sizes based on PPE type or all sizes
  const availableSizes = ppeType ? PPE_TYPE_SIZE_MAP[ppeType] : Object.values(PPE_SIZE);

  return (
    <Controller
      control={control}
      name={name as any}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const sizeOptions: ComboboxOption[] = availableSizes.map((size) => ({
          value: size,
          label: PPE_SIZE_LABELS[size],
        }));

        return (
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Tamanho
              {required && <ThemedText variant="destructive"> *</ThemedText>}
            </ThemedText>
            <Combobox
              options={sizeOptions}
              value={value || ""}
              onValueChange={onChange}
              placeholder={ppeType ? "Selecione o tamanho" : "Selecione o tipo de EPI primeiro"}
              disabled={disabled}
              searchable={false}
              clearable={!required}
            />
            {error && <ThemedText variant="destructive" style={{ fontSize: 12, marginTop: 4 }}>{error.message}</ThemedText>}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  required: {
    color: "#dc2626",
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 4,
  },
});
