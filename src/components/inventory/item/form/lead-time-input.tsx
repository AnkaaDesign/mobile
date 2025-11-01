
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface LeadTimeInputProps {
  disabled?: boolean;
}

export function LeadTimeInput({ disabled }: LeadTimeInputProps) {
  const { control } = useFormContext<ItemFormData>();
  return (
    <Controller
      control={control}
      name={"estimatedLeadTime" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="estimatedLeadTime" style={{ marginBottom: 4 }}>
            Prazo de Entrega Estimado
          </Label>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                id="estimatedLeadTime"
                value={value?.toString() || ""}
                onChangeText={(text) => {
                  if (text === "") {
                    onChange(null);
                  } else {
                    const num = parseInt(text, 10);
                    onChange(isNaN(num) ? null : num);
                  }
                }}
                onBlur={onBlur}
                placeholder="30"
                editable={!disabled}
                keyboardType="numeric"
              />
            </View>
            <ThemedText style={{ fontSize: 14, color: "#6b7280" }}>dias</ThemedText>
          </View>
          {error && <ThemedText style={{ fontSize: 14, color: "#ef4444", marginTop: 4 }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
