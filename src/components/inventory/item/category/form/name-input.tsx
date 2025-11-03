
import { View, StyleSheet } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { spacing, fontSize } from "@/constants/design-system";
import type { ItemCategoryCreateFormData, ItemCategoryUpdateFormData } from '../../../../../schemas';

type ItemCategoryFormData = ItemCategoryCreateFormData | ItemCategoryUpdateFormData;

interface NameInputProps {
  disabled?: boolean;
  required?: boolean;
}

export function NameInput({ disabled, required = false }: NameInputProps) {
  const { control } = useFormContext<ItemCategoryFormData>();
  return (
    <View style={styles.container}>
      <Label nativeID="name" style={{ marginBottom: spacing.xs }}>
        Nome da Categoria {required && <ThemedText variant="destructive">*</ThemedText>}
      </Label>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <>
            <Input
              id="name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: Ferramentas, EPIs, etc."
              autoCapitalize="words"
              editable={!disabled}
              error={!!error}
            />
            {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  errorText: {
    color: "#ef4444",
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
