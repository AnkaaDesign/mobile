import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { DatePicker } from './date-picker';
import { Label } from './label';
import { Text } from './text';
import { Button } from './button';
import { IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangePickerProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when the date range changes */
  onChange: (range: DateRange | undefined) => void;
  /** Label for the component */
  label?: string;
  /** Placeholder for the from date picker */
  fromPlaceholder?: string;
  /** Placeholder for the to date picker */
  toPlaceholder?: string;
  /** Whether to show the clear button */
  showClearButton?: boolean;
  /** Whether to show preset buttons for quick date selection */
  showPresets?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Minimum selectable date */
  minimumDate?: Date;
  /** Maximum selectable date */
  maximumDate?: Date;
  /** Error message to display */
  error?: string;
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * DateRangePicker Component
 *
 * A component for selecting a date range with from/to date pickers.
 * Includes optional preset buttons for common date ranges like "Today",
 * "Last 7 days", "Last 30 days", "This Month", and "Last Month".
 *
 * @example
 * ```tsx
 * const [dateRange, setDateRange] = useState<DateRange>();
 *
 * <DateRangePicker
 *   label="Período"
 *   value={dateRange}
 *   onChange={setDateRange}
 *   showPresets={true}
 *   fromPlaceholder="Data inicial"
 *   toPlaceholder="Data final"
 * />
 * ```
 */
export function DateRangePicker({
  value,
  onChange,
  label,
  fromPlaceholder = 'Data inicial',
  toPlaceholder = 'Data final',
  showClearButton = true,
  showPresets = true,
  disabled = false,
  minimumDate,
  maximumDate,
  error,
  style,
}: DateRangePickerProps) {
  const { colors } = useTheme();
  const [localValue, setLocalValue] = useState<DateRange | undefined>(value);

  const handleFromChange = (date: Date | undefined) => {
    const newRange = {
      from: date,
      to: localValue?.to,
    };

    // If both dates are undefined, set the entire range to undefined
    if (!newRange.from && !newRange.to) {
      setLocalValue(undefined);
      onChange(undefined);
    } else {
      setLocalValue(newRange);
      onChange(newRange);
    }
  };

  const handleToChange = (date: Date | undefined) => {
    const newRange = {
      from: localValue?.from,
      to: date,
    };

    // If both dates are undefined, set the entire range to undefined
    if (!newRange.from && !newRange.to) {
      setLocalValue(undefined);
      onChange(undefined);
    } else {
      setLocalValue(newRange);
      onChange(newRange);
    }
  };

  const handleClear = () => {
    setLocalValue(undefined);
    onChange(undefined);
  };

  const handlePreset = (preset: 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let from: Date;
    let to: Date = new Date(today);

    switch (preset) {
      case 'today':
        from = new Date(today);
        to = new Date(today);
        break;
      case 'last7days':
        from = new Date(today);
        from.setDate(from.getDate() - 7);
        break;
      case 'last30days':
        from = new Date(today);
        from.setDate(from.getDate() - 30);
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    const newRange = { from, to };
    setLocalValue(newRange);
    onChange(newRange);
  };

  const formatRange = (): string => {
    const range = value || localValue;
    if (!range?.from && !range?.to) return '';

    if (range.from && range.to) {
      return `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (range.from) {
      return `Desde ${format(range.from, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (range.to) {
      return `Até ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    return '';
  };

  const hasValue = (value?.from !== undefined || value?.to !== undefined) ||
                   (localValue?.from !== undefined || localValue?.to !== undefined);

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
      ...style,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    displayText: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      fontWeight: '500',
      marginTop: spacing.xs,
    },
    clearButton: {
      padding: 4,
    },
    datePickersRow: {
      gap: spacing.md,
    },
    separator: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginVertical: spacing.xs,
    },
    presetsContainer: {
      marginTop: spacing.sm,
    },
    presetsLabel: {
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    presets: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    presetButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    errorText: {
      fontSize: fontSize.xs,
      color: colors.destructive,
      marginTop: spacing.xs,
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

      {hasValue && (
        <Text style={styles.displayText}>{formatRange()}</Text>
      )}

      <View style={styles.datePickersRow}>
        <DatePicker
          label="De"
          value={value?.from || localValue?.from}
          onChange={handleFromChange}
          placeholder={fromPlaceholder}
          disabled={disabled}
          type="date"
          minimumDate={minimumDate}
          maximumDate={value?.to || localValue?.to || maximumDate}
        />

        <Text style={styles.separator}>até</Text>

        <DatePicker
          label="Até"
          value={value?.to || localValue?.to}
          onChange={handleToChange}
          placeholder={toPlaceholder}
          disabled={disabled}
          type="date"
          minimumDate={value?.from || localValue?.from || minimumDate}
          maximumDate={maximumDate}
        />
      </View>

      {showPresets && !disabled && (
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsLabel}>Atalhos:</Text>
          <View style={styles.presets}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handlePreset('today')}
              style={styles.presetButton}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handlePreset('last7days')}
              style={styles.presetButton}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handlePreset('last30days')}
              style={styles.presetButton}
            >
              Últimos 30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handlePreset('thisMonth')}
              style={styles.presetButton}
            >
              Este mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handlePreset('lastMonth')}
              style={styles.presetButton}
            >
              Mês passado
            </Button>
          </View>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}
