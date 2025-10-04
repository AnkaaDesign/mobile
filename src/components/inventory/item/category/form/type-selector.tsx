import React from "react";
import { View, StyleSheet} from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import type { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { ThemedText } from "@/components/ui/themed-text";
import { Combobox } from "@/components/ui/combobox";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from '../../../../../constants';
import type { ItemCategoryCreateFormData, ItemCategoryUpdateFormData } from '../../../../../schemas';

type ItemCategoryFormData = ItemCategoryCreateFormData | ItemCategoryUpdateFormData;

interface TypeSelectorProps {
  disabled?: boolean;
}

export function TypeSelector({ disabled }: TypeSelectorProps) {
  const { colors, isDark } = useTheme();
  const { control } = useFormContext<ItemCategoryFormData>();

  const typeOptions = Object.values(ITEM_CATEGORY_TYPE).map((type) => ({
    label: ITEM_CATEGORY_TYPE_LABELS[type],
    value: type,
  }));

  return (
    <View style={styles.container}>
      <Label style={{ marginBottom: spacing.xs }}>
        <ThemedText style={styles.labelText}>Tipo da Categoria</ThemedText>
      </Label>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.fieldWrapper}>
            <Combobox placeholder="Selecione o tipo da categoria" options={typeOptions} value={value} onValueChange={onChange} disabled={disabled} error={error?.message} />
            <ThemedText style={StyleSheet.flatten([styles.description, { color: colors.mutedForeground }])}>
              {value === ITEM_CATEGORY_TYPE.PPE
                ? "Categoria para Equipamentos de Proteção Individual"
                : value === ITEM_CATEGORY_TYPE.TOOL
                  ? "Categoria para ferramentas e equipamentos"
                  : "Categoria para produtos gerais"}
            </ThemedText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  labelText: {
    fontSize: fontSize.base,
  },
  fieldWrapper: {
    gap: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    paddingHorizontal: spacing.xs,
  },
});
