
import { View, StyleSheet } from 'react-native';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';
import type { FilterIconComponent } from '@/lib/filter-icon-mapping';

export interface BooleanFilterProps {
  /** Current boolean value */
  value: boolean;
  /** Callback when value changes */
  onChange: (value: boolean) => void;
  /** Label for the switch */
  label?: string;
  /** Icon component to display next to label */
  icon?: FilterIconComponent;
  /** Description text shown below label */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * BooleanFilter Component
 *
 * A simple boolean toggle filter using Switch component.
 * Displays label on left, switch on right.
 *
 * @example
 * ```tsx
 * <BooleanFilter
 *   label="Apenas ativos"
 *   description="Mostrar somente registros ativos"
 *   value={filters.isActive}
 *   onChange={(v) => setFilters({...filters, isActive: v})}
 * />
 * ```
 */
export function BooleanFilter({
  value,
  onChange,
  label,
  icon: Icon,
  description,
  disabled = false,
}: BooleanFilterProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    labelContainer: {
      flex: 1,
      gap: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    description: {
      fontSize: 13,
      color: colors.mutedForeground,
      lineHeight: 18,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        {label && (
          <View style={styles.labelRow}>
            {Icon && <Icon size={18} color={colors.foreground} />}
            <Label>{label}</Label>
          </View>
        )}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </View>
  );
}
