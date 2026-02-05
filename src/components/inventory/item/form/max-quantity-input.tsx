
import { Controller, useFormContext } from "react-hook-form";
import { View, StyleSheet } from "react-native";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconRobot, IconUser } from "@tabler/icons-react-native";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface MaxQuantityInputProps {
  disabled?: boolean;
  isManual?: boolean;
}

export function MaxQuantityInput({ disabled, isManual: fallbackIsManual = false }: MaxQuantityInputProps) {
  const { control, setValue, getValues, watch } = useFormContext<ItemFormData>();
  const { colors } = useTheme();
  // Watch the form value directly to stay in sync with form resets and data refetches
  const isManualMode = watch('isManualMaxQuantity' as any) ?? fallbackIsManual;

  const handleModeToggle = (checked: boolean) => {
    setValue('isManualMaxQuantity' as any, checked, { shouldDirty: true });

    // If switching to automatic, clear the manual value
    if (!checked) {
      setValue('maxQuantity', null, { shouldDirty: true });
    }
  };

  return (
    <Controller
      control={control}
      name={"maxQuantity" as const}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <View style={styles.header}>
            <Label nativeID="maxQuantity" numberOfLines={1} ellipsizeMode="tail">
              Qtd. Máxima
            </Label>
            <View style={styles.toggleContainer}>
              <IconRobot
                size={14}
                color={!isManualMode ? colors.primary : colors.mutedForeground}
              />
              <Switch
                checked={isManualMode}
                onCheckedChange={handleModeToggle}
                disabled={disabled}
              />
              <IconUser
                size={14}
                color={isManualMode ? colors.primary : colors.mutedForeground}
              />
            </View>
          </View>

          {!isManualMode ? (
            <View style={[styles.automaticBox, { borderColor: colors.border, backgroundColor: colors.muted + '20' }]}>
              <IconRobot size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.automaticText, { color: colors.mutedForeground }]}>
                Modo Automático
              </ThemedText>
            </View>
          ) : (
            <Input
              id="maxQuantity"
              fieldKey="maxQuantity"
              type="natural"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0"
              disabled={disabled}
              min={0}
            />
          )}

          {error && (
            <ThemedText variant="destructive" style={styles.errorText}>
              {error.message}
            </ThemedText>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  automaticBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
  },
  automaticText: {
    fontSize: fontSize.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
