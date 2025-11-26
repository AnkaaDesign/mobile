import { View, StyleSheet } from 'react-native';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';
import type { FilterIconComponent } from '@/lib/filter-icon-mapping';

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
  options?: SelectOption<T>[];
  /** Label for the select */
  label?: string;
  /** Icon component to display next to label */
  icon?: FilterIconComponent;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow clearing selection */
  allowClear?: boolean;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom render function for options */
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => React.ReactNode;
  /** Async mode */
  async?: boolean;
  /** Query key for async mode */
  queryKey?: unknown[];
  /** Query function for async mode */
  queryFn?: (searchTerm: string, page?: number) => Promise<{ data: SelectOption<T>[]; hasMore?: boolean }>;
  /** Callback when combobox opens - for scroll handling */
  onOpen?: (measurements: { inputY: number; inputHeight: number; requiredHeight: number }) => boolean | void;
  /** Callback when combobox closes */
  onClose?: () => void;
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
  options = [],
  label,
  icon: Icon,
  placeholder = 'Selecione...',
  allowClear = true,
  showClearButton = true,
  disabled = false,
  renderOption,
  async = false,
  queryKey,
  queryFn,
  onOpen,
  onClose,
}: SelectFilterProps<T>) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          {Icon && <Icon size={18} color={colors.foreground} />}
          <Label>{label}</Label>
        </View>
      )}

      <Combobox
        value={value as string || ""}
        onValueChange={(newValue) => onChange(newValue as T | undefined)}
        options={options as any[]}
        placeholder={placeholder}
        disabled={disabled}
        searchable={true}
        clearable={allowClear}
        async={async}
        queryKey={queryKey}
        queryFn={queryFn as any}
        minSearchLength={async ? 0 : 1}
        getOptionValue={(option: SelectOption<T>) => String(option.value)}
        getOptionLabel={(option: SelectOption<T>) => option.label}
        getOptionDescription={(option: SelectOption<T>) => option.description}
        isOptionDisabled={(option: SelectOption<T>) => option.disabled || false}
        renderOption={renderOption}
        onOpen={onOpen}
        onClose={onClose}
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
  options?: MultiSelectOption<T>[];
  /** Custom render function for options */
  renderOption?: (option: MultiSelectOption<T>, isSelected: boolean) => React.ReactNode;
  /** Async mode */
  async?: boolean;
  /** Query key for async mode */
  queryKey?: unknown[];
  /** Query function for async mode */
  queryFn?: (searchTerm: string, page?: number) => Promise<{ data: MultiSelectOption<T>[]; hasMore?: boolean }>;

  /** Label for the select */
  label?: string;
  /** Icon component to display next to label */
  icon?: FilterIconComponent;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Callback when combobox opens - for scroll handling */
  onOpen?: (measurements: { inputY: number; inputHeight: number; requiredHeight: number }) => boolean | void;
  /** Callback when combobox closes */
  onClose?: () => void;
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
  options = [],
  label,
  icon: Icon,
  placeholder = 'Selecione...',
  showClearButton = true,
  disabled = false,
  renderOption,
  async = false,
  queryKey,
  queryFn,
  onOpen,
  onClose,
}: MultiSelectFilterProps<T>) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          {Icon && <Icon size={18} color={colors.foreground} />}
          <Label>{label}</Label>
        </View>
      )}

      <Combobox
        mode="multiple"
        value={value as string[]}
        onValueChange={(newValues) => onChange((newValues as string[]) as T[])}
        options={options as any[]}
        placeholder={placeholder}
        disabled={disabled}
        searchable={true}
        clearable={true}
        showCount={true}
        async={async}
        queryKey={queryKey}
        queryFn={queryFn as any}
        minSearchLength={async ? 0 : 1}
        getOptionValue={(option: MultiSelectOption<T>) => String(option.value)}
        getOptionLabel={(option: MultiSelectOption<T>) => option.label}
        getOptionDescription={(option: MultiSelectOption<T>) => option.description}
        isOptionDisabled={(option: MultiSelectOption<T>) => option.disabled || false}
        renderOption={renderOption}
        onOpen={onOpen}
        onClose={onClose}
      />
    </View>
  );
}
