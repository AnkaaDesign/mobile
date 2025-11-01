
import { View, StyleSheet} from "react-native";
import { Controller, useFormContext } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { ITEM_CATEGORY_TYPE } from '../../../../../constants';
import type { ItemCategoryCreateFormData, ItemCategoryUpdateFormData } from '../../../../../schemas';

type ItemCategoryFormData = ItemCategoryCreateFormData | ItemCategoryUpdateFormData;

interface PpeToggleProps {
  disabled?: boolean;
}

export function PpeToggle({ disabled }: PpeToggleProps) {
  const { colors, isDark } = useTheme();
  const { control } = useFormContext<ItemCategoryFormData>();

  return (
    <View style={styles.container}>
      <Label style={{ marginBottom: spacing.xs }}>
        <ThemedText style={styles.labelText}>Categoria de EPI</ThemedText>
      </Label>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => {
          const isPpe = value === ITEM_CATEGORY_TYPE.PPE;
          const handleToggle = (checked: boolean) => {
            onChange(checked ? ITEM_CATEGORY_TYPE.PPE : ITEM_CATEGORY_TYPE.REGULAR);
          };

          return (
            <View
              style={StyleSheet.flatten([
                styles.toggleRow,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                },
                disabled && styles.disabled,
                disabled && { backgroundColor: isDark ? colors.muted : colors.background },
              ])}
            >
              <ThemedText style={StyleSheet.flatten([styles.description, { color: colors.mutedForeground }])}>Ative se esta categoria é para Equipamentos de Proteção Individual</ThemedText>
              <Switch checked={isPpe} onCheckedChange={handleToggle} disabled={disabled} />
            </View>
          );
        }}
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
  toggleRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  description: {
    flex: 1,
    fontSize: fontSize.sm,
    marginRight: spacing.md,
  },
});
