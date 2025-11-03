import { View, StyleSheet } from 'react-native';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface SelectFilterProps<T = string> {
  /** Current selected value */
  value: T | undefined;
  /** Callback when value changes */
  onChange: (value: T | undefined) => void;
  /** Available options */
  options: SelectOption<T>[];
  /** Label for the select */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow clearing selection */
  allowClear?: boolean;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * SelectFilter Component
 *
 * A single-select filter dropdown.
 * For multi-select, use MultiSelectFilter instead.
 *
 * @example
 * ```tsx
 * <SelectFilter
 *   label="Status"
 *   value={filters.status}
 *   onChange={(v) => setFilters({...filters, status: v})}
 *   options={[
 *     { value: 'active', label: 'Ativo' },
 *     { value: 'inactive', label: 'Inativo' },
 *     { value: 'pending', label: 'Pendente' },
 *   ]}
 *   placeholder="Selecione o status"
 *   allowClear={true}
 * />
 * ```
 */
export function SelectFilter<T extends string = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Selecione...',
  allowClear = true,
  showClearButton = true,
  disabled = false,
}: SelectFilterProps<T>) {
  const { colors } = useTheme();

  const handleClear = () => {
    onChange(undefined);
  };

  const hasValue = value !== undefined;

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    clearButton: {
      padding: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {label && <Label>{label}</Label>}
        {showClearButton && hasValue && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onPress={handleClear}
            style={styles.clearButton}
          >
            <IconX size={16} color={colors.mutedForeground} />
          </Button>
        )}
      </View>

      <Combobox
        value={value as string || ""}
        onValueChange={(newValue) => onChange(newValue as T | undefined)}
        options={options as any[]}
        placeholder={placeholder}
        disabled={disabled}
        searchable={false}
        clearable={allowClear}
        getOptionValue={(option: SelectOption<T>) => String(option.value)}
        getOptionLabel={(option: SelectOption<T>) => option.label}
        getOptionDescription={(option: SelectOption<T>) => option.description}
        isOptionDisabled={(option: SelectOption<T>) => option.disabled || false}
        preferFullScreen={true}
      />
    </View>
  );
}

export interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface MultiSelectFilterProps<T = string> {
  /** Current selected values */
  value: T[];
  /** Callback when value changes */
  onChange: (values: T[]) => void;
  /** Available options */
  options: MultiSelectOption<T>[];
  /** Label for the select */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * MultiSelectFilter Component
 *
 * A multi-select filter dropdown.
 * Allows selecting multiple options at once.
 *
 * @example
 * ```tsx
 * <MultiSelectFilter
 *   label="Categorias"
 *   value={filters.categories}
 *   onChange={(v) => setFilters({...filters, categories: v})}
 *   options={[
 *     { value: 'electronics', label: 'Eletrônicos' },
 *     { value: 'clothing', label: 'Roupas' },
 *     { value: 'food', label: 'Alimentos' },
 *   ]}
 *   placeholder="Selecione as categorias"
 * />
 * ```
 */
export function MultiSelectFilter<T extends string = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Selecione...',
  showClearButton = true,
  disabled = false,
}: MultiSelectFilterProps<T>) {
  const { colors } = useTheme();

  const handleClear = () => {
    onChange([]);
  };

  const hasValue = value.length > 0;

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    clearButton: {
      padding: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {label && <Label>{label}</Label>}
        {showClearButton && hasValue && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onPress={handleClear}
            style={styles.clearButton}
          >
            <IconX size={16} color={colors.mutedForeground} />
          </Button>
        )}
      </View>

      <Combobox
        mode="multiple"
        value={value as string[]}
        onValueChange={(newValues) => onChange((newValues as string[]) as T[])}
        options={options as any[]}
        placeholder={placeholder}
        disabled={disabled}
        searchable={false}
        clearable={true}
        showCount={true}
        getOptionValue={(option: MultiSelectOption<T>) => String(option.value)}
        getOptionLabel={(option: MultiSelectOption<T>) => option.label}
        getOptionDescription={(option: MultiSelectOption<T>) => option.description}
        isOptionDisabled={(option: MultiSelectOption<T>) => option.disabled || false}
        preferFullScreen={true}
      />
    </View>
  );
}
