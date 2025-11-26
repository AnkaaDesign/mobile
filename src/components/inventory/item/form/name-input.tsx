
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface NameInputProps {
  disabled?: boolean;
  required?: boolean;
}

export function NameInput({ disabled, required }: NameInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"name" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="name" style={{ marginBottom: 4 }}>
            Nome do Item {required && <ThemedText variant="destructive">*</ThemedText>}
          </Label>
          <Input id="name" fieldKey="name" value={value} onChangeText={onChange} onBlur={onBlur} placeholder="Digite o nome do item" editable={!disabled} maxLength={255} autoCapitalize="words" />
          {error && <ThemedText variant="destructive" style={{ fontSize: 14, marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
