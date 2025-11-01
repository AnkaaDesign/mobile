
import { View, StyleSheet } from 'react-native';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
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

      <Select
        value={value}
        onValueChange={(newValue) => {
          if (newValue === '__clear__' && allowClear) {
            onChange(undefined);
          } else {
            onChange(newValue as T);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowClear && value && (
            <SelectItem value="__clear__" label="Limpar seleção" />
          )}
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              label={option.label}
              disabled={option.disabled}
            />
          ))}
        </SelectContent>
      </Select>
    </View>
  );
}

export interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
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

  const handleToggle = (optionValue: T) => {
    const isSelected = value.includes(optionValue);
    if (isSelected) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const hasValue = value.length > 0;

  const displayValue = hasValue
    ? `${value.length} selecionado${value.length > 1 ? 's' : ''}`
    : placeholder;

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

      {/* Note: This is a simplified version. For a full multi-select,
          you might want to use MultiCombobox or create a custom modal */}
      <Select
        value={value[0]} // Show first selected item
        onValueChange={(newValue) => handleToggle(newValue as T)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={displayValue} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              label={`${value.includes(option.value as T) ? '✓ ' : ''}${option.label}`}
              disabled={option.disabled}
            />
          ))}
        </SelectContent>
      </Select>
    </View>
  );
}
