import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from '@/components/ui/text-input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';
import type { FilterIconComponent } from '@/lib/filter-icon-mapping';

export interface NumericRange {
  min?: number;
  max?: number;
}

export interface NumericRangeFilterProps {
  /** Current range value */
  value?: NumericRange;
  /** Callback when value changes */
  onChange: (range: NumericRange | undefined) => void;
  /** Label for the filter */
  label?: string;
  /** Icon component to display next to label */
  icon?: FilterIconComponent;
  /** Placeholder for min input */
  minPlaceholder?: string;
  /** Placeholder for max input */
  maxPlaceholder?: string;
  /** Step value for number input */
  step?: number;
  /** Prefix to display (e.g., "R$") */
  prefix?: string;
  /** Suffix to display (e.g., "kg") */
  suffix?: string;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Number of decimal places */
  decimalPlaces?: number;
  /** Format type - 'currency' uses natural currency typing */
  format?: 'currency';
}

/**
 * NumericRangeFilter Component
 *
 * A filter for numeric ranges with min/max inputs.
 * Supports prefix/suffix for currency, units, etc.
 *
 * @example
 * ```tsx
 * // Simple numeric range
 * <NumericRangeFilter
 *   label="Preço"
 *   value={filters.price}
 *   onChange={(v) => setFilters({...filters, price: v})}
 *   prefix="R$"
 *   minPlaceholder="Mínimo"
 *   maxPlaceholder="Máximo"
 *   decimalPlaces={2}
 * />
 *
 * // Integer range
 * <NumericRangeFilter
 *   label="Quantidade"
 *   value={filters.quantity}
 *   onChange={(v) => setFilters({...filters, quantity: v})}
 *   suffix="unidades"
 *   step={1}
 * />
 * ```
 */
export function NumericRangeFilter({
  value,
  onChange,
  label,
  icon: Icon,
  minPlaceholder = 'Mínimo',
  maxPlaceholder = 'Máximo',
  step: _step = 1,
  prefix,
  suffix,
  showClearButton = true,
  disabled = false,
  decimalPlaces = 0,
  format,
}: NumericRangeFilterProps) {
  const { colors } = useTheme();

  // For currency format, values are stored as cents
  const isCurrency = format === 'currency';

  const [minText, setMinText] = React.useState(value?.min?.toString() || '');
  const [maxText, setMaxText] = React.useState(value?.max?.toString() || '');

  // Update local state when value prop changes
  React.useEffect(() => {
    setMinText(value?.min?.toString() || '');
    setMaxText(value?.max?.toString() || '');
  }, [value]);

  const parseNumber = (text: string): number | undefined => {
    if (!text || text.trim() === '') return undefined;
    const parsed = parseFloat(text.replace(',', '.'));
    return isNaN(parsed) ? undefined : parsed;
  };

  const handleMinChange = (text: string) => {
    setMinText(text);
    const minValue = parseNumber(text);
    const maxValue = value?.max;

    if (minValue === undefined && maxValue === undefined) {
      onChange(undefined);
    } else {
      onChange({ min: minValue, max: maxValue });
    }
  };

  const handleMaxChange = (text: string) => {
    setMaxText(text);
    const minValue = value?.min;
    const maxValue = parseNumber(text);

    if (minValue === undefined && maxValue === undefined) {
      onChange(undefined);
    } else {
      onChange({ min: minValue, max: maxValue });
    }
  };

  const handleClear = () => {
    setMinText('');
    setMaxText('');
    onChange(undefined);
  };

  const hasValue = value && (value.min !== undefined || value.max !== undefined);

  const formatDisplay = (): string => {
    if (!hasValue) return '';

    const formatValue = (num: number): string => {
      if (isCurrency) {
        // For currency, convert cents to reais
        const reais = num / 100;
        return reais.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }

      const formatted = decimalPlaces > 0
        ? num.toFixed(decimalPlaces)
        : num.toString();
      return `${prefix || ''}${formatted}${suffix || ''}`;
    };

    if (value.min !== undefined && value.max !== undefined) {
      return `${formatValue(value.min)} - ${formatValue(value.max)}`;
    }
    if (value.min !== undefined) {
      return `≥ ${formatValue(value.min)}`;
    }
    if (value.max !== undefined) {
      return `≤ ${formatValue(value.max)}`;
    }
    return '';
  };

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    displayText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    clearButton: {
      padding: 4,
    },
    inputsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    inputContainer: {
      flex: 1,
    },
    separator: {
      fontSize: 16,
      color: colors.mutedForeground,
      alignSelf: 'center',
    },
    inputWithAffix: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.input,
      paddingHorizontal: spacing.sm,
      height: 48,
    },
    affix: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginHorizontal: spacing.xs,
    },
    input: {
      flex: 1,
      borderWidth: 0,
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
    },
  });

  const renderInput = (
    isMin: boolean,
    placeholder: string
  ) => {
    // For currency format, use CurrencyInput
    if (isCurrency) {
      const currencyValue = isMin ? value?.min : value?.max;
      const handleCurrencyChange = (cents: number | undefined) => {
        const minValue = isMin ? cents : value?.min;
        const maxValue = isMin ? value?.max : cents;

        if (minValue === undefined && maxValue === undefined) {
          onChange(undefined);
        } else {
          onChange({ min: minValue, max: maxValue });
        }
      };

      return (
        <CurrencyInput
          value={currencyValue}
          onValueChange={handleCurrencyChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      );
    }

    // For regular numeric inputs
    const text = isMin ? minText : maxText;
    const onChangeText = isMin ? handleMinChange : handleMaxChange;

    if (prefix || suffix) {
      return (
        <View style={styles.inputWithAffix}>
          {prefix && <Text style={styles.affix}>{prefix}</Text>}
          <TextInput
            value={text}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType={decimalPlaces > 0 ? 'decimal-pad' : 'number-pad'}
            editable={!disabled}
            inputStyle={styles.input}
          />
          {suffix && <Text style={styles.affix}>{suffix}</Text>}
        </View>
      );
    }

    return (
      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={decimalPlaces > 0 ? 'decimal-pad' : 'number-pad'}
        editable={!disabled}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {label && (
          <View style={styles.labelRow}>
            {Icon && <Icon size={18} color={colors.foreground} />}
            <Label>{label}</Label>
          </View>
        )}
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

      {hasValue && (
        <Text style={styles.displayText}>{formatDisplay()}</Text>
      )}

      <View style={styles.inputsRow}>
        <View style={styles.inputContainer}>
          {renderInput(true, minPlaceholder)}
        </View>
        <Text style={styles.separator}>-</Text>
        <View style={styles.inputContainer}>
          {renderInput(false, maxPlaceholder)}
        </View>
      </View>
    </View>
  );
}
