import { Controller, useFormContext } from "react-hook-form";
import { View, StyleSheet } from "react-native";
import { Switch } from "@/components/ui/switch";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { borderRadius, spacing, fontSize } from "@/constants/design-system";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface BorrowableToggleProps {
  disabled?: boolean;
}

// Capability-fields contract: borrow eligibility is item.isBorrowable
// (category.type is UI grouping only — borrowable items may live anywhere).
export function BorrowableToggle({ disabled }: BorrowableToggleProps) {
  const { control } = useFormContext<ItemFormData>();
  const { colors, isDark } = useTheme();

  return (
    <Controller
      control={control}
      name={"isBorrowable" as const}
      render={({ field: { onChange, value } }) => (
        <View
          style={StyleSheet.flatten([
            styles.container,
            {
              backgroundColor: colors.input,
              borderColor: colors.border,
            },
            disabled && styles.disabled,
            disabled && { backgroundColor: isDark ? colors.muted : colors.background },
          ])}
        >
          <View style={styles.content}>
            <ThemedText style={styles.label}>Emprestável</ThemedText>
            <Switch checked={value ?? false} onCheckedChange={onChange} disabled={disabled} />
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: "500",
    flex: 1,
    marginRight: spacing.sm,
  },
});
