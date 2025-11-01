
import { View, StyleSheet } from 'react-native';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangeFilterProps {
  /** Current range value */
  value?: DateRange;
  /** Callback when value changes */
  onChange: (range: DateRange | undefined) => void;
  /** Label for the filter */
  label?: string;
  /** Placeholder for from date */
  fromPlaceholder?: string;
  /** Placeholder for to date */
  toPlaceholder?: string;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Whether to show preset buttons */
  showPresets?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * DateRangeFilter Component
 *
 * A filter for date ranges with from/to date pickers.
 * Includes optional preset buttons for common date ranges.
 *
 * @example
 * ```tsx
 * <DateRangeFilter
 *   label="Data de Criação"
 *   value={filters.createdDate}
 *   onChange={(v) => setFilters({...filters, createdDate: v})}
 *   showPresets={true}
 * />
 * ```
 */
export function DateRangeFilter({
  value,
  onChange,
  label,
  fromPlaceholder = 'Data inicial',
  toPlaceholder = 'Data final',
  showClearButton = true,
  showPresets = true,
  disabled = false,
}: DateRangeFilterProps) {
  const { colors } = useTheme();

  const handleFromChange = (date: Date | undefined) => {
    if (date === undefined && value?.to === undefined) {
      onChange(undefined);
    } else {
      onChange({ from: date, to: value?.to });
    }
  };

  const handleToChange = (date: Date | undefined) => {
    if (value?.from === undefined && date === undefined) {
      onChange(undefined);
    } else {
      onChange({ from: value?.from, to: date });
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const handlePreset = (preset: 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let from: Date;
    let to: Date = today;

    switch (preset) {
      case 'today':
        from = today;
        to = today;
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

    onChange({ from, to });
  };

  const formatRange = (): string => {
    if (!value?.from && !value?.to) return '';

    if (value.from && value.to) {
      return `${format(value.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(value.to, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (value.from) {
      return `Desde ${format(value.from, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (value.to) {
      return `Até ${format(value.to, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    return '';
  };

  const hasValue = value && (value.from !== undefined || value.to !== undefined);

  const styles = StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    displayText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    clearButton: {
      padding: 4,
    },
    datePickersRow: {
      gap: spacing.sm,
    },
    separator: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginVertical: spacing.xs,
    },
    presetsContainer: {
      marginTop: spacing.xs,
    },
    presetsLabel: {
      fontSize: 13,
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
          value={value?.from}
          onChange={handleFromChange}
          placeholder={fromPlaceholder}
          disabled={disabled}
          type="date"
        />

        <Text style={styles.separator}>até</Text>

        <DatePicker
          label="Até"
          value={value?.to}
          onChange={handleToChange}
          placeholder={toPlaceholder}
          disabled={disabled}
          type="date"
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
    </View>
  );
}
