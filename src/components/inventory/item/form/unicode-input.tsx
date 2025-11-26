
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface UnicodeInputProps {
  disabled?: boolean;
}

export function UnicodeInput({ disabled }: UnicodeInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"uniCode" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="uniCode" style={{ marginBottom: 4 }}>
            Código Universal
          </Label>
          <Input
            id="uniCode"
            fieldKey="uniCode"
            value={value || ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Digite o código universal"
            editable={!disabled}
            autoCapitalize="characters"
          />
          {error && <ThemedText style={{ fontSize: 14, color: "#ef4444", marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
